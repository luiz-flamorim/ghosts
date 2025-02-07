require("dotenv").config();
const fs = require("fs");

// RunPod API Key
const RUNPOD_API_KEY = process.env.RUNPOD_API_KEY;
const API_BASE_URL = "https://api.runpod.ai/v2/q2a5ql2zvnqc8t";

// Prompt for the image
let myPrompt =
	"A lonely village in the middle of rolling fog, abandoned yet filled with unseen presences. A local story says the church tower is haunted by a grey lady who leapt from the top after being spurned. realistic. scratched film, overexposed highlights, like an old paranormal photo.";

// **1️⃣ Submit a Job to RunPod**
async function submitJob() {
	const url = `${API_BASE_URL}/run`;

	const requestConfig = {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${RUNPOD_API_KEY}`,
		},
		body: JSON.stringify({ input: { prompt: myPrompt } }),
	};

	try {
		const response = await fetch(url, requestConfig);
		const data = await response.json();
		console.log("✅ Job Submitted! Job ID:", data.id);
		return data.id;
	} catch (error) {
		console.error("❌ Error submitting job:", error);
		throw error;
	}
}

// **2️⃣ Check Job Status Until Completed**
async function checkJobStatus(jobId) {
	const url = `${API_BASE_URL}/status/${jobId}`;

	while (true) {
		const response = await fetch(url, {
			method: "GET",
			headers: { Authorization: `Bearer ${RUNPOD_API_KEY}` },
		});
		const data = await response.json();

		console.log(`⏳ Job Status: ${data.status}`);

		if (data.status === "COMPLETED") {
			console.log("✅ Job Completed! Full Response:", JSON.stringify(data, null, 2));
			return data.output?.image || null;
		} else if (data.status === "FAILED") {
			console.error("❌ Job failed! Full response:", JSON.stringify(data, null, 2));
			throw new Error("Job failed!");
		}

		// Wait 5 seconds before checking again
		await new Promise((resolve) => setTimeout(resolve, 5000));
	}
}

// **3️⃣ Save Image Locally**
function saveImage(base64Image) {
	if (!base64Image) {
		console.error("❌ No image found in response.");
		return;
	}

	const imageBuffer = Buffer.from(base64Image, "base64");

	// Ensure "img" directory exists
	if (!fs.existsSync("img")) {
		fs.mkdirSync("img");
	}

	// Save image with unique filename
	const filePath = `img/generated_image_${Date.now()}.png`;
	fs.writeFileSync(filePath, imageBuffer);

	console.log(`✅ Image saved successfully at: ${filePath}`);
}

// **4️⃣ Run the Full Process**
async function main() {
	try {
		const jobId = await submitJob();
		const image = await checkJobStatus(jobId);
		saveImage(image);
	} catch (error) {
		console.error("❌ Error:", error);
	}
}

main();
