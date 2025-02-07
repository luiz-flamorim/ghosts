const axios = require("axios");
const fs = require("fs");
const apiKey = process.env.GOOGLE_API_KEY;
let rawData = fs.readFileSync("ghost-data.json");
let jsonData = JSON.parse(rawData);

processGeolocation();

async function getCoordinates(addr) {
	const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
		addr
	)}&key=${apiKey}`;

	try {
		const response = await axios.get(url);

		// Check if the request was successful
		if (response.data.status === "OK") {
			const { lat, lng } = response.data.results[0].geometry.location;
			return { latitude: lat, longitude: lng };
		} else {
			console.error(`Geocoding error for '${addr}':`, response.data.status);
			return { latitude: null, longitude: null };
		}
	} catch (error) {
		console.error(`Error fetching geolocation for '${addr}':`, error.message);
		return { latitude: null, longitude: null };
	}
}

function delay(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

// Clean and process addresses before sending them to Google API
function cleanAddress(location, region, country) {
	if (
		!country ||
		country === "Unknown" ||
		country.toLowerCase() === "other regions"
	) {
		country = "UK";
	}

	// Extract meaningful part of location
	if (location) {
		location = location.split("-")[0].trim(); // Get first part before '-'
		location = location.replace(/\(.*?\)/g, "").trim(); // Remove text inside ()
	}

	// Remove generic road descriptions
	location = location
		.replace(/(Road|Unnamed road|Highway|A\d+|B\d+).*?(?:,|$)/, "")
		.trim();

	// Construct cleaned address
	let addressParts = [];
	if (location && location !== "Unknown") {
		addressParts.push(location);
	}
	if (
		region &&
		region !== "Unknown" &&
		region.toLowerCase() !== "other regions"
	) {
		addressParts.push(region);
	}
	addressParts.push(country);

	let finalAddress = addressParts.join(", ");
	return finalAddress;
}

// Process each record with throttling (to avoid rate limits)
async function processGeolocation() {
	for (let record of jsonData) {
		let cleanedAddress = cleanAddress(
			record.location,
			record.region,
			record.country
		);

		// Skip if cleaned address is too short
		if (!cleanedAddress || cleanedAddress.split(",").length < 2) {
			console.warn(`Skipping address: ${cleanedAddress}`);
			continue;
		}

		console.log(`Fetching coordinates for: ${cleanedAddress}`);

		// Fetch coordinates with delay to prevent rate limiting
		const coord = await getCoordinates(cleanedAddress);
		record.latitude = coord.latitude;
		record.longitude = coord.longitude;

		// Add a 1-second delay between API requests (adjust as needed)
		await delay(300);
	}

	// Save updated JSON data
	fs.writeFileSync("ghost-data.json", JSON.stringify(jsonData, null, 2));
	console.log("JSON file updated successfully!");
}
