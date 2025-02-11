const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");

let ukData = fs.readFileSync("../data/open-plaques-United-Kingdom-2023-11-10.json");
let jsonData = JSON.parse(ukData);

const imgDir = path.resolve(__dirname, "../img");

// Ensure the directory exists
if (!fs.existsSync(imgDir)) {
    fs.mkdirSync(imgDir, { recursive: true });
}

// Count only images that need downloading
const imagesToDownload = jsonData.filter((record) => record.thumbnail_url && !fs.existsSync(path.join(imgDir, `${record.id}${getFileExtension(record.thumbnail_url)}`)));
const totalImages = imagesToDownload.length;

let downloadedCount = 0; // Counter for actual downloads

getBluePlaques(jsonData);

async function getBluePlaques(data) {
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();

    for (let index = 0; index < data.length; index++) {
        const record = data[index];
        if (record.thumbnail_url) {
            const fileExtension = getFileExtension(record.thumbnail_url);
            const filename = `${record.id}${fileExtension}`;
            const filePath = path.join(imgDir, filename);
            
            // **Check if file already exists before downloading**
            if (fs.existsSync(filePath)) {
                console.log(`Skipping file: ${filename} (Already Exists)`);
                continue; // Skip this iteration
            }

            try {
                await downloadImage(page, record.thumbnail_url, filePath);
                console.log(`Saving file ${++downloadedCount} of ${totalImages}: ${filename}`);
            } catch (error) {
                console.error(`Error saving ${filename}: ${error.message}`);
            }
        }
    }

    await browser.close();
}

function getFileExtension(imageUrl) {
    const ext = path.extname(new URL(imageUrl).pathname);
    return ext || ".jpg";
}

async function downloadImage(page, imageUrl, filePath) {
    await page.goto(imageUrl, { waitUntil: "networkidle2" });
    const imageBuffer = await page.screenshot();
    fs.writeFileSync(filePath, imageBuffer);
}
