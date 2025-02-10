# Ghosts 👻
This is an experiment for **educational purposes**. The code scrapes the data from [The Paranormal Database](https://www.paranormaldatabase.com/), and then adds trats the locations to add geolocation using the Google Geodata API.

### Disclaimer - Legal Stuff
Accordingly to [The Paranormal Database Legal Stuff](https://www.paranormaldatabase.com/legal/index.html) page, *"You shall not copy, reproduce, republish, decompile, reverse engineer, scrape, download, post, broadcast, transmit, make available to the public, or otherwise use the content of this website in any form in any medium except for your own personal, non-commercial use. You shall not adapt, alter or generate a derivative work from any part of this website except for your own personal, non-commercial use."*

This project is open for educational use only.

## How it works
the JS should run in sequence using node.js
- 01 - scrapper.js - Scrapes paranormal location data and saves it as a JSON file.
- 02 - lat-lng.js - Processes the JSON file and retrieves latitude & longitude for each location using the Google Geodata API.
- 03 - fix-img prompts - Adds a unique ID and generates AI-friendly prompts for image generation.
- 04a - gen-openai.js - Uses OpenAI's DALL·E API to generate images. *Warning*: OpenAI API is not free. Check their pricing before usage - [OpenAI billing page](https://openai.com/api/pricing/). Images are saved locally after generation.
- 04b - sf.js - ses Stable Diffusion (via Google Colab) to generate images. This requires:
    - Ngrok – To create a public API endpoint for the Stable Diffusion server.
    - Google Colab – To run Stable Diffusion on a GPU (free Colab no longer provides GPUs). Steps to use:
        - Run the Colab notebook (in the Py/ folder).
        - Get the API address from the last cell of the notebook.
        - Update sf.js with the new API address and run it.

## APIs
You will need your own API keys to run this project.
- Google Geodata API – Used for geolocation data (lat-lng.js).
- OpenAI API – Needed to generate images using OpenAI (gen-openai.js).
- Ngrok API – Required to expose the Stable Diffusion API (sf.js).
Store your API keys securely and never commit them to public repositories.

## Notes & Considerations
- This project is for experimentation and learning purposes only.
- Ensure you have API billing set up before running OpenAI or Google services.
- Use a queueing mechanism if generating a large number of images, to avoid exceeding rate limits.

## Blue Plaques dataset
Blue plaques across the UK are commemorative signs installed on buildings to mark locations associated with historically significant people or events. Established in 1866 by the Royal Society of Arts and now managed by organisations like English Heritage, these plaques highlight sites where notable individuals lived, worked, or made significant contributions to society. The scheme primarily operates in London, but similar initiatives exist in other cities, celebrating figures from diverse fields such as literature, science, politics, and the arts. The [Open Blue Plaques] (https://openplaques.org/pages/data) compiled a free dataset ot them, free to use.