const width = window.innerWidth;
const height = window.innerHeight;

const svg = d3
	.select("#map")
	.append("svg")
	.attr("width", width)
	.attr("height", height);

// Append group for zooming & panning
const mapGroup = svg.append("g");

// Set up zoom
const zoom = d3
	.zoom()
	.scaleExtent([1, 8])
	.on("zoom", (event) => {
		mapGroup.attr("transform", event.transform);
	});

svg.call(zoom);

const projection = d3.geoMercator().translate([width / 2, height / 2]);

// Load UK map
d3.json("../data/uk.json")
	.then((data) => {
		const geojson = topojson.feature(data, data.objects.subunits);
		console.log("Converted GeoJSON:", geojson);

		projection.fitSize([width, height], geojson);
		const path = d3.geoPath().projection(projection);
		// getUserLocation();
		mapGroup
			.append("g")
			.attr("class", "map-layer")
			.selectAll("path")
			.data(geojson.features)
			.enter()
			.append("path")
			.attr("d", path)
			.attr("fill", "#ccc")
			.attr("stroke", "#333");

		// load ghosts sights
		d3.json("../data/ghost-data.json")
			.then((sightings) => {
				console.log("Ghost Sightings Data:", sightings);
				plotPoints(sightings);
                getUserLocation(sightings);

			})
			.catch((error) => console.error("Error loading ghost sightings:", error));
	})
	.catch((error) => console.error("Error loading UK TopoJSON:", error));

    function plotPoints(sightings) {
        const pointsGroup = mapGroup.append("g").attr("class", "points-layer");
    
        // Initialize the simulation
        const simulation = d3.forceSimulation(sightings)
            .force("x", d3.forceX(d => projection([d.longitude, d.latitude])[0]).strength(1))
            .force("y", d3.forceY(d => projection([d.longitude, d.latitude])[1]).strength(1))
            .force("collide", d3.forceCollide(2)) // Prevents overlap
            .stop();
    
        for (let i = 0; i < 100; i++) simulation.tick(); // Run the simulation
    
        // Append circles using updated x and y positions
        pointsGroup
            .selectAll("circle")
            .data(sightings)
            .enter()
            .append("circle")
            .attr("cx", d => d.x)  // Use force simulation results
            .attr("cy", d => d.y)  // Use force simulation results
            .attr("r", 0.5)
            .attr("class", "ghost-points")
            .on("mouseover", (event, d) => {
                d3.select("#tooltip")
                    .style("visibility", "visible")
                    .html(
                        `<strong>${d.title}</strong><br>${d.info}<br>${d.date}<br>${d.id}<br>${d.region ? d.region : ""}`
                    )
                    .style("left", event.pageX + 10 + "px")
                    .style("top", event.pageY + 10 + "px");
            })
            .on("mouseout", () => {
                d3.select("#tooltip").style("visibility", "hidden");
            })
            .on("click", (event, d) => {
                console.log(d);
            });
    }
    

function getUserLocation(sightings) {
	navigator.geolocation.getCurrentPosition(
		(position) => {
			const userLat = position.coords.latitude;
			const userLng = position.coords.longitude;
			console.log("User Location:", userLat, userLng);

			plotUserLocation(userLat, userLng);

			const nearby = checkNearbyGhosts(userLat, userLng, sightings);

			highlightNearbyGhosts(nearby);
		},
		(error) => {
			console.error("Error getting location:", error);
			alert("Location unavailable. Try disabling your VPN or using High Accuracy mode.");
		},
		{ enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
	);
}


function plotUserLocation(lat, lng) {
	mapGroup
		.append("circle")
		.attr("class", "user-location")
		.attr("cx", projection([lng, lat])[0])
		.attr("cy", projection([lng, lat])[1])
		.attr("r", 8)
		.attr("class", "user-location");
}

function getDistance(lat1, lon1, lat2, lon2) {
    // Haversine formula to calculate the distance between two latitude/longitude points.
    const R = 6371; // Radius of the Earth in km
    const toRad = (deg) => deg * (Math.PI / 180);

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
}

function checkNearbyGhosts(userLat, userLng, sightings, range = 10) {
    let nearbyGhosts = [];

    sightings.forEach(ghost => {
        const distance = getDistance(userLat, userLng, ghost.latitude, ghost.longitude);
        if (distance <= range) {
            nearbyGhosts.push(ghost);
        }
    });

    console.log("Nearby Ghosts:", nearbyGhosts);
    return nearbyGhosts;
}

function highlightNearbyGhosts(nearbyGhosts) {
    d3.selectAll(".ghost-points") // Select all ghost circles
        .each(function(d) {
            if (nearbyGhosts.some(ghost => ghost.id === d.id)) {
                d3.select(this).classed("nearby-ghost", true); // Add class
            } else {
                d3.select(this).classed("nearby-ghost", false); // Remove if not nearby
            }
        });
}


