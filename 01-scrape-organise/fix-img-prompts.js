const fs = require("fs");

// Load JSON data
let rawData = fs.readFileSync("../data/ghost-data.json");
let jsonData = JSON.parse(rawData);

const photoStyles = [
	"realistic, eerie countryside atmosphere, black and white, grainy texture, vintage film effect.",
	"realistic, eerie countryside atmosphere, sepia tone, aged and distressed, captured on an old camera.",
	"realistic, eerie countryside atmosphere, black and white, dim lighting, reminiscent of classic horror photography.",
	"realistic, eerie countryside atmosphere, scratched black and white film, overexposed highlights, like an old paranormal photo.",
	"realistic, eerie countryside atmosphere, sepia tone, aged vignette, polaroid style.",
];

// Function to generate an image prompt
function generatePrompt(info) {
	const photoStyle =
		photoStyles[Math.floor(Math.random() * photoStyles.length)];
	return `${info} ${photoStyle}`;
}

jsonData.forEach((record) => {
	record.imgprompt = generatePrompt(record.info);
	record.id = Math.floor(1000000000 + Math.random() * 9000000000);
});

fs.writeFileSync("../data/ghost-data.json", JSON.stringify(jsonData, null, 2));
console.log("Image prompts added successfully!");
