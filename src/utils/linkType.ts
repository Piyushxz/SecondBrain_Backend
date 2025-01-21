import puppeteer from "puppeteer";
export const getYouTubeTranscript = async (url:string) => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url);

    try {
        // Extract transcript text
        const transcript = await page.evaluate(() => {
            // Cast elements to HTMLElement to access innerText
            const transcriptElements = document.querySelectorAll(".your-selector"); // Replace with the actual selector
            return Array.from(transcriptElements)
                .map(el => (el as HTMLElement).innerText) // Cast Element to HTMLElement
                .join(" ");
        });

        await browser.close();
        console.log(transcript)
        return transcript;
    } catch (err) {
        console.error("Error fetching transcript:");
        await browser.close();
        throw err;
    }
};
