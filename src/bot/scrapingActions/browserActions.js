const puppeteer = require('puppeteer');

function sleep(s) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve(true);
        }, 1000 * s)
    });
}

async function takeScreenshotAndGetCounter(userTwitch,takeScreen) {
    return new Promise(async(resolve, reject) => {
        let actualDate = new Date().getTime();
        const browser = await puppeteer.launch({ 'headless': true });
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.135 Safari/537.36 Edge/12.246');
        await page.goto(`http://twitch.tv/${userTwitch}`);
        await page.setViewport({ 'width': 1024, 'height': 800 });
        await sleep(15)
        if(takeScreen){
            await page.screenshot({ 'path': `./data/screenshot_${userTwitch}_${actualDate}.jpg`, 'fullPage': true });
        }
        page.on('console', consoleObj => console.log(consoleObj.text()));
        let viewerData = await page.evaluate(async () => {
            let element = document.querySelector('.tw-animated-number--monospaced')
            return element.innerText
        });
        //console.log(viewerData)
        resolve(viewerData)
        await browser.close();
    })
}


module.exports = { takeScreenshotAndGetCounter }