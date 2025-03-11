// ---------------- Map Initialization ---------------- //
const map = L.map("map").setView([54.5, -3.5], 6); // Centered over UK
L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
	attribution: `&copy; <a href='https://carto.com/'>CARTO</a>`,
}).addTo(map);

const svgLayer = d3.select(map.getPanes().overlayPane).append("svg");
const mapGroup = svgLayer.append("g").attr("class", "leaflet-overlay");
let currentRadius;
let userPoint;
let ghostData = null; // store ghost sightings globally

// ---------------- Data Loading & Geolocation ---------------- //
d3.json("../data/ghost-data.json")
	.then((sightings) => {
		console.log("Ghost Sightings Data:", sightings);
		ghostData = sightings; // store globally for later use
		getUserLocation(sightings);
		plotPoints(sightings);
	})
	.catch((error) => console.error("Error loading ghost sightings:", error));

function getUserLocation(sightings) {
	navigator.geolocation.getCurrentPosition(
		(position) => {
			const userLat = position.coords.latitude;
			const userLng = position.coords.longitude;
			updateUserLocationAndHighlights(userLat, userLng, sightings);
		},
		(error) => {
			console.error("Error getting location:", error);
			alert(
				"Could not get your location. Please enter your postcode and city manually."
			);
			// Plot ghosts without any user location highlighting.
			updateGhostList(ghostData);
			highlightNearbyGhosts([]); // clear any highlights
		},
		{ enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
	);
}

// ---------------- Tooltip Functions ---------------- //
function showTooltip(ghost) {
	const imgPath = `../img/${ghost.id}.png`;
	const contentHTML = `
    <div id="tooltip-content" onclick="event.stopPropagation()">
      <h2 class="ghost-title-2">${ghost.title}</h2>
      <img src="${imgPath}" alt="${ghost.title}" class="ghost-img">
      <div class="date-location-container">
        <p class="ghost-date"><strong>Date:</strong> ${ghost.date}</p>
        <p class="ghost-location"><strong>Location:</strong> ${ghost.location}</p>
      </div>
      <p class="ghost-info">${ghost.info}</p>
    </div>
  `;
	d3.select("#tooltip")
		.html(contentHTML)
		.style("display", "block")
		.style("visibility", "visible");
}

function hideTooltip() {
	d3.select("#tooltip")
		.style("display", "none")
		.style("visibility", "hidden")
		.html("");
}

// Close tooltip when clicking on the overlay or document.
d3.select("#tooltip").on("click", hideTooltip);
document.addEventListener("click", hideTooltip);

// ---------------- Helper Functions ---------------- //

// Convert (lon, lat) into pixel coordinates relative to the map.
function projectPoint(lon, lat) {
	const point = map.latLngToLayerPoint(new L.LatLng(lat, lon));
	return [point.x, point.y];
}

// Create or update the user point on the map.
function plotUserLocation(lat, lng) {
	const coords = projectPoint(lng, lat);
	if (!userPoint) {
		userPoint = mapGroup.append("circle").attr("class", "user-location");
	}
	userPoint.attr("cx", coords[0]).attr("cy", coords[1]);
}

// Updates the user location, centers the map, and refreshes ghost highlights and list.
function updateUserLocationAndHighlights(userLat, userLng, sightings) {
	// First update the map view.
	map.setView([userLat, userLng], 13);
	// When the move is complete, update the user point and refresh ghost highlights.
	map.once("moveend", function () {
		plotUserLocation(userLat, userLng);
		d3.selectAll(".ghost-points").classed("nearby-ghost", false);
		const nearby = checkNearbyGhosts(userLat, userLng, sightings);
		highlightNearbyGhosts(nearby);
		updateGhostList(nearby);
	});
}

// ---------------- Plot Ghost Points ---------------- //
function plotPoints(sightings) {
	// Group sightings by identical lat/long (to detect overlapping points)
	const groups = {};
	sightings.forEach((d) => {
		const key = `${d.latitude},${d.longitude}`;
		if (!groups[key]) groups[key] = [];
		groups[key].push(d);
	});

	// Calculate a "sunflower" offset for overlapping points.
	const goldenAngle = Math.PI * (3 - Math.sqrt(5));
	const baseOffset = 5;
	Object.values(groups).forEach((group) => {
		if (group.length === 1) {
			group[0].offsetX = 0;
			group[0].offsetY = 0;
		} else {
			group.forEach((d, i) => {
				const r = baseOffset * Math.sqrt(i + 1);
				const theta = i * goldenAngle;
				d.offsetX = r * Math.cos(theta);
				d.offsetY = r * Math.sin(theta);
			});
		}
	});

	// Initialize each ghost point with its projected coordinates.
	sightings.forEach((d) => {
		const [px, py] = projectPoint(d.longitude, d.latitude);
		d.x0 = px;
		d.y0 = py;
	});

	const points = mapGroup
		.selectAll("circle.ghost-points")
		.data(sightings)
		.enter()
		.append("circle")
		.attr("class", "ghost-points")
		.attr("id", (d) => `ghost-${d.id}`)
		.attr("fill", "red")
		.attr("opacity", 0.2)
		.on("mouseover", function (event, d) {
			d3.select(this)
				.transition()
				.duration(200)
				.attr("r", currentRadius + 3)
				.attr("opacity", 1);
			d3.select(`#ghost-row-${d.id}`)
				.raise()
				.style("background-color", "rgba(255, 255, 255, 0.2)");
			const ghostRow = document.getElementById(`ghost-row-${d.id}`);
			if (ghostRow) {
				ghostRow.scrollIntoView({ behavior: "smooth", block: "start" });
			}
		})
		.on("mouseout", function (event, d) {
			d3.select(this)
				.transition()
				.duration(200)
				.attr("r", currentRadius)
				.attr("opacity", 0.2);
			d3.select(`#ghost-row-${d.id}`).style("background-color", null);
		})
		.on("click", function (event, d) {
			event.stopPropagation();
			showTooltip(d);
		});

	currentRadius = computeRadius(map.getZoom());
	function computeRadius(zoom) {
		return 1 * Math.pow(1.2, zoom - 6);
	}

	function updatePoints() {
		sightings.forEach((d) => {
			const [px, py] = projectPoint(d.longitude, d.latitude);
			d.x0 = px;
			d.y0 = py;
		});
		points
			.attr("cx", (d) => d.x0 + d.offsetX)
			.attr("cy", (d) => d.y0 + d.offsetY)
			.attr("r", currentRadius);
	}

	reset();
	updatePoints();

	map.on("zoom moveend", () => {
		reset();
		currentRadius = computeRadius(map.getZoom());
		updatePoints();
	});
}

function reset() {
	const bounds = map.getBounds();
	const topLeft = map.latLngToLayerPoint(bounds.getNorthWest());
	const bottomRight = map.latLngToLayerPoint(bounds.getSouthEast());

	svgLayer
		.attr("width", bottomRight.x - topLeft.x)
		.attr("height", bottomRight.y - topLeft.y)
		.style("left", `${topLeft.x}px`)
		.style("top", `${topLeft.y}px`);

	mapGroup.attr("transform", `translate(${-topLeft.x}, ${-topLeft.y})`);
}

// ---------------- Distance Calculation & Highlighting ---------------- //
function getDistance(lat1, lon1, lat2, lon2) {
	const R = 6371;
	const toRad = (deg) => deg * (Math.PI / 180);
	const dLat = toRad(lat2 - lat1);
	const dLon = toRad(lon2 - lon1);
	const a =
		Math.sin(dLat / 2) ** 2 +
		Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	return R * c;
}

function checkNearbyGhosts(userLat, userLng, sightings, range = 3) {
	return sightings.filter((ghost) => {
		return (
			getDistance(userLat, userLng, ghost.latitude, ghost.longitude) <= range
		);
	});
}

function highlightNearbyGhosts(nearbyGhosts) {
	d3.selectAll(".ghost-points").each(function (d) {
		d3.select(this).classed(
			"nearby-ghost",
			nearbyGhosts.some((ghost) => ghost.id === d.id)
		);
	});
}

function updateGhostList(ghosts) {
	const ghostList = d3.select("#ghost-list");
	ghostList.html("");
	ghosts.forEach((ghost) => {
		const row = ghostList
			.append("div")
			.attr("class", "ghost-row")
			.attr("id", `ghost-row-${ghost.id}`);
		row.append("div").attr("class", "ghost-title").text(ghost.title);
		row.on("click", function (event) {
			event.stopPropagation();
			showTooltip(ghost);
		});
	});
}

// ---------------- Geocoding (Confirm Button) ---------------- //
document.getElementById("confirm-btn").addEventListener("click", function () {
	const inputValue = document.getElementById("location-input").value;
	if (!inputValue) {
		alert("Please enter your postcode and city (e.g. SW1A 1AA, London).");
		return;
	}
	let address = inputValue;
	if (!/uk|united kingdom/i.test(inputValue)) {
		address += ", UK";
	}
	const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
		address
	)}&format=json&limit=1`;

	fetch(url, {
		headers: {
			"User-Agent": "MyGhostMapApp/1.0",
			"Accept-Language": "en",
		},
	})
		.then((response) => response.json())
		.then((data) => {
			if (data && data.length > 0) {
				const lat = parseFloat(data[0].lat);
				const lon = parseFloat(data[0].lon);
				updateUserLocationAndHighlights(lat, lon, ghostData);
			} else {
				alert("Location not found. Please check your postcode and city.");
			}
		})
		.catch((err) => {
			console.error("Error fetching geocode data:", err);
			alert("Error fetching geocode data. Please try again later.");
		});
});
