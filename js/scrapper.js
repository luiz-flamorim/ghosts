const puppeteer = require("puppeteer");
const fs = require("fs");
const baseUrl = "https://www.paranormaldatabase.com/";

(async () => {
	const finalLinks = await scrapeLinks();
	const scrapedData = [];
	const browser = await puppeteer.launch({
		headless: "new",
		args: ["--no-sandbox", "--disable-setuid-sandbox"],
	});
	const page = await browser.newPage();

	for (let i = 0; i < finalLinks.length; i++) {
		try {
			let currentPage = finalLinks[i];
			while (currentPage) {
				await page.goto(currentPage, { waitUntil: "domcontentloaded" });
				console.log(`Scraping ${i + 1} of ${finalLinks.length}`);

				const { country, region } = await page.evaluate(() => {
					let country = "Unknown";
					let region = "Unknown";
					const panels = document.querySelectorAll(
						".w3-panel.w3-border-left.w3-border-top"
					);
					if (panels.length > 0) {
						const h4 = panels[0].querySelector("h4");
						if (h4) {
							const links = h4.querySelectorAll("a");
							if (links.length > 1) {
								country = links[1].textContent.trim();
							}
						}
					}
					if (panels.length > 1) {
						const h3 = panels[1].querySelector("h3");
						if (h3) {
							region = h3.textContent
								.replace("Ghosts, Folklore and Forteana", "")
								.trim();
						}
					}
					return { country, region };
				});

				const events = await page.evaluate(() => {
					let results = [];
					const containers = document.querySelectorAll(
						".w3-half .w3-border-left.w3-border-top.w3-left-align"
					);
					containers.forEach((container) => {
						let title = "";
						let location = "";
						let date = "";
						let info = "";

						const titleSpan = container.querySelector(
							"h4 span.w3-border-bottom"
						);
						if (titleSpan) {
							title = titleSpan.textContent.trim();
						}
						const spans = container.querySelectorAll("p span.w3-border-bottom");
						spans.forEach((span) => {
							const text = span.textContent.trim();
							const value = span.nextSibling
								? span.nextSibling.textContent.trim()
								: "";

							if (text.startsWith("Location:")) location = value;
							if (text.startsWith("Date / Time:")) date = value;
							if (text.startsWith("Further Comments:")) info = value;
						});
						results.push({
							title,
							location,
							date,
							info,
						});
					});
					return results;
				});

				events.forEach((event) => {
					scrapedData.push({
						url: currentPage,
						country,
						region,
						title: event.title,
						location: event.location,
						date: event.date,
						info: event.info,
					});
				});

				const nextPage = await page.evaluate(() => {
					const nextButton = document.querySelector(
						".w3-quarter.w3-container h5 a"
					);
					return nextButton &&
						nextButton.textContent.trim().toLowerCase() === "next"
						? nextButton.getAttribute("href")
						: null;
				});

				if (nextPage) {
					currentPage = new URL(nextPage, page.url()).href;
					console.log(`Found next page: ${currentPage}`);
				} else {
					currentPage = null;
				}
			}
		} catch (error) {
			console.error(`Error on page ${i + 1}: ${error.message}`);
		}
	}
	await browser.close();
	saveDataToFile(scrapedData);
})();

async function scrapeLinks() {
	const regionLinks = await findLinks(baseUrl, "/regions/");
	let finalLinks = [];

	for (let i = 0; i < regionLinks.length; i++) {
		const subLinks = await findLinks(regionLinks[i], ".php");
		finalLinks = finalLinks.concat(subLinks);
		await new Promise((resolve) => setTimeout(resolve, 3000));
	}
	return finalLinks;
}

async function findLinks(_url, _filterTag) {
	let attempts = 0;
	let maxAttempts = 3;
	let allLinks = [];

	while (attempts < maxAttempts) {
		try {
			const browser = await puppeteer.launch({
				headless: "new",
				args: ["--no-sandbox", "--disable-setuid-sandbox"],
			});

			const page = await browser.newPage();
			await page.goto(_url, { waitUntil: "domcontentloaded", timeout: 60000 });

			const linksArray = await page.evaluate((filter) => {
				return Array.from(document.querySelectorAll("a"))
					.map((e) => e.href.trim())
					.filter((href) => href.includes(filter));
			}, _filterTag);

			allLinks = allLinks.concat(linksArray);
			await browser.close();
			return allLinks;
		} catch (error) {
			attempts++;
			console.error(
				`Attempt ${attempts}: Failed to load ${_url} - ${error.message}`
			);

			if (attempts >= maxAttempts) {
				console.error(`Skipping ${_url} after ${maxAttempts} failed attempts.`);
				return allLinks;
			}
		}
	}
}

function cleanData(data) {
	let filteredData = data.filter(
		(event) => event.title || event.location || event.date || event.info
	);

	const uniqueEvents = new Map();
	filteredData.forEach((event) => {
		const key = `${event.title}|${event.location}|${event.date}`;
		if (!uniqueEvents.has(key)) {
			uniqueEvents.set(key, event);
		}
	});
	return Array.from(uniqueEvents.values());
}

function saveDataToFile(scrapedData) {
	const cleanedData = cleanData(scrapedData);
	console.log(`Saving ${cleanedData.length} records to file...`);
	let jsonData = JSON.stringify(cleanedData, null, 2);
	fs.writeFileSync("data/ghost-data.json", jsonData);
	console.log("Data successfully saved to ghost-data.json");
}
