# Ghosts 👻
This project explores networked experiences and data collection by scraping and processing data from The Paranormal Database, a publicly available repository of haunted locations in the UK. Additionally, it incorporates the Blue Plaques dataset, which marks locations associated with historically significant individuals. By juxtaposing these datasets, the project creates an artistic commentary on delusion vs. reality—contrasting folklore-driven paranormal locations with documented historical landmarks.

### Disclaimer - Legal Stuff
Accordingly to [The Paranormal Database Legal Stuff](https://www.paranormaldatabase.com/legal/index.html) page, *"You shall not copy, reproduce, republish, decompile, reverse engineer, scrape, download, post, broadcast, transmit, make available to the public, or otherwise use the content of this website in any form in any medium except for your own personal, non-commercial use. You shall not adapt, alter or generate a derivative work from any part of this website except for your own personal, non-commercial use."*

I reiterate that this current project has educational purposes only.

## The Paranormal Database
[The Paranormal Database](https://www.paranormaldatabase.com) is an extensive and ongoing project that documents locations in the UK, Ireland, and the Channel Islands with connections to folklore, paranormal activity, and cryptozoology. It serves as an informational resource, compiling historical accounts, bibliographic references, and local stories to create a comprehensive repository of supernatural occurrences. The database acts as a contribution hub where users can explore narratives spanning centuries, offering insight into cultural mythologies and regional folklore.

## Blue Plaques dataset
Blue plaques across the UK are commemorative signs installed on buildings to mark locations associated with historically significant people or events. Established in 1866 by the Royal Society of Arts and now managed by organisations like English Heritage, these plaques highlight sites where notable individuals lived, worked, or made significant contributions to society. The scheme primarily operates in London, but similar initiatives exist in other cities, celebrating figures from diverse fields such as literature, science, politics, and the arts. The (Open Blue Plaques) [https://openplaques.org/pages/data] compiled a free dataset ot them, free to use.

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
- 05 - blue-plaques.js - Using the [Open Plaques](https://openplaques.org) dataset, this app downloads a local copy of the images which are linked in the dataset

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