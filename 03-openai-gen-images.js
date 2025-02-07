require("dotenv").config();
const axios = require("axios");
const fs = require("fs");
const path = require("path");

const imgFolder = "img";
if (!fs.existsSync(imgFolder)) {
	fs.mkdirSync(imgFolder);
}

let rawData = fs.readFileSync("ghost-data-mini.json");
let jsonData = JSON.parse(rawData);

processImages();

// Function to download and save the image locally
async function downloadImage(imageUrl, imagePath) {
	try {
		const response = await axios({
			url: imageUrl,
			responseType: "stream",
		});

		return new Promise((resolve, reject) => {
			const writer = fs.createWriteStream(imagePath);
			response.data.pipe(writer);
			writer.on("finish", resolve);
			writer.on("error", reject);
		});
	} catch (error) {
		console.error(`Error downloading image: ${error.message}`);
	}
}

// Function to generate an image using DALL·E
async function generateImage(record) {
	const prompt = `A haunting realistic old black and white portrait style photograph of ${record.title}, set in the countryside. The atmosphere is eerie, dark, and cinematic.`;

	try {
		const response = await axios.post(
			"https://api.openai.com/v1/images/generations",
			{
				model: "dall-e-2",
				prompt: prompt,
				n: 1,
				size: "512x512",
			},
			{
				headers: {
					Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
					"Content-Type": "application/json",
				},
			}
		);

		const imageUrl = response.data.data[0].url;
		console.log(
			`Generating image ${jsonData.indexOf(record) + 1} of ${jsonData.length}`
		);

		// Generate ID and set local image path
		record.id = Math.floor(1000000000 + Math.random() * 9000000000);
		const localImagePath = path.join(imgFolder, `${record.id}.png`);
		record.img = localImagePath;

		// Download and save the image locally
		await downloadImage(imageUrl, localImagePath);

		return localImagePath;
	} catch (error) {
		console.error(`Error generating image for ${record.title}:`, error.message);
		record.img = null; // Save as null if generation fails
		return null;
	}
}

// Function to process all records and generate images
async function processImages() {
	for (let record of jsonData) {
		if (!record.img) {
			// Only generate if there's no local image yet
			await generateImage(record);
		}
	}

	fs.writeFileSync("ghost-data-mini.json", JSON.stringify(jsonData, null, 2));
	console.log("Updated JSON file with image local paths!");
}
