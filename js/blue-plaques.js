const fs = require("fs");
let rawData = fs.readFileSync("../data/open-plaques-london-2023-11-10.json");
let jsonData = JSON.parse(rawData);

let countIds = 0;
let countImg = 0;

jsonData.forEach((record) => {
	if (record.thumbnail_url) {
		countImg++;
	}
	if (record.id) {
		countIds++;
	}
});
console.log(`IDs: ${countIds}, Images: ${countImg}`);
