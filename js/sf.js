const fs = require("fs");
let endPoint = "https://ghost.ngrok-free.app";
let dataFile = "../data/ghost-data.json"

// Read JSON Data
let rawData = fs.readFileSync(dataFile);
let jsonData = JSON.parse(rawData);

processImages();

async function processImages() {
	for (let i = 0; i < jsonData.length; i++) {
		let element = jsonData[i];
		let imgPath = `../img/${element.id}.png`;

		// Check if image already exists
		if (fs.existsSync(imgPath)) {
			console.log(
				`Image ${i + 1} of ${jsonData.length} (${
					element.id
				}) already exists, skipping...`
			);
			continue;
		}

		console.log(
			`Generating image ${i + 1} of ${jsonData.length} (${element.id})`
		);
		await generateImage(element.imgprompt, element.id);
	}
}

async function generateImage(prompt, id) {
	const fetch = (await import("node-fetch")).default;

	try {
		const response = await fetch(`${endPoint}/generate`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				prompt: prompt,
				width: 500,
				height: 500,
				steps: 175,
				cfg_scale: 7.5,
				sampler: "dpm2", // Different sampling methods: k_euler, ddim, dpm2, k_euler_a etc.
				seed: 42,
			}),
		});

		const contentType = response.headers.get("content-type");

		if (!contentType || !contentType.includes("application/json")) {
			const errorText = await response.text();
			throw new Error(`API did not return JSON. Response: ${errorText}`);
		}

		const data = await response.json();

		if (!data.image) {
			throw new Error(
				`API response does not contain an image. Full response: ${JSON.stringify(
					data,
					null,
					2
				)}`
			);
		}

		const imgBuffer = Buffer.from(data.image, "base64");
		let imgPath = `../img/${id}.png`;
		fs.writeFileSync(imgPath, imgBuffer);
		console.log(`Image saved: ${imgPath}`);
	} catch (error) {
		console.error(`Error generating image ${id}:`, error.message);
	}
}
