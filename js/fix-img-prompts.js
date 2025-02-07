const fs = require("fs");

// Load JSON data
let rawData = fs.readFileSync("data/ghost-data-mini.json");
let jsonData = JSON.parse(rawData);

const eerieStyles = [
    "A misty countryside with an eerie silence, where the wind whispers through forgotten ruins.",
    "A lonely village in the middle of rolling fog, abandoned yet filled with unseen presences.",
    "A desolate moorland under a ghostly full moon, shadows moving among twisted trees.",
    "A haunted path through the woods, where footsteps echo despite the stillness.",
    "A forgotten place lost in time, where spectral figures drift between crumbling stones."
];

const photoStyles = [
    "realistic. black and white, grainy texture, vintage film effect.",
    "realistic. sepia tone, aged and distressed, captured on an old camera.",
    "realistic. high contrast, dim lighting, reminiscent of classic horror photography.",
    "realistic. scratched film, overexposed highlights, like an old paranormal photo.",
    "realistic. low resolution, eerie vignette, polaroid style from a haunted past."
];

// Function to generate an image prompt
function generatePrompt(info) {
    const eerieStart = eerieStyles[Math.floor(Math.random() * eerieStyles.length)];
    const photoStyle = photoStyles[Math.floor(Math.random() * photoStyles.length)];
    return `${eerieStart} ${info} ${photoStyle}`;
}

jsonData.forEach((record) => {
    record.imgprompt = generatePrompt(record.info);
});

fs.writeFileSync("data/ghost-data-mini.json", JSON.stringify(jsonData, null, 2));
console.log("Image prompts added successfully!");
