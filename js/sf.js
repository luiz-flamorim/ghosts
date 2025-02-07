const fs = require("fs");
let endPoint = "https://e851-34-125-21-12.ngrok-free.app";

generateImage("a realistic ghost in a old portrait photo style, eerie countryside background, night time");

async function generateImage(prompt) {
	const fetch = (await import("node-fetch")).default;

	const response = await fetch(`${endPoint}/generate`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			prompt: prompt,
			width: 768,
			height: 768,
			steps: 150,
			cfg_scale: 7.5,
			sampler: "dpm2", // Different sampling methods: k_euler, ddim, dpm2,k_euler_a etc.
			seed: 42,
		}),
	});

	const data = await response.json();
	const imgBuffer = Buffer.from(data.image, "base64");

	fs.writeFileSync("../img/generated.png", imgBuffer);
	console.log("Image saved as generated.png");
}
