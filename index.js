
// const puppeteer = require('puppeteer');
const puppeteer = require('puppeteer');
const readline = require('readline');

async function benzinga(page, url) {
    // await page.goto(url, { waitUntil: 'networkidle2' });
    await page.goto(url);

    xpath = '//*[@id="__next"]/div/div[2]/div/div/div/div[2]/div[1]/div[1]/div[2]';
    const [el] = await page.$x(xpath);
    const NewsH = await el.getProperty('innerHTML');
    const newsT = await el.getProperty('innerText');
    const newsText = await newsT.jsonValue();
    const newsHTML = await NewsH.jsonValue();

    const dataset = { newsText: newsText, news: newsHTML };
    return dataset;
}

async function finviz(page, url) {
    // await page.goto(url, { waitUntil: 'networkidle2' });
    await page.goto(url);

    try {
        const xpath1 = '//*[@id="news-table"]';
        const [el] = await page.$x(xpath1);
        const NewsH = await el.getProperty('innerHTML');
        const newsT = await el.getProperty('innerText');
        const newsText = await newsT.jsonValue();
        const newsHtml = await NewsH.jsonValue();

        const xpath2 = '/html/body/div[4]/div/table[2]';
        const [stat] = await page.$x(xpath2);
        const dataH = await stat.getProperty('innerHTML');
        const dataHtml = await dataH.jsonValue();
        const dataT = await stat.getProperty('innerText');
        const dataText = await dataT.jsonValue();

        const dataset = { newsText: newsText, news: newsHtml, dataText, data: dataHtml };
        return dataset;
    }
    catch (e) {
        console.log(e);
    }
}

function printFinvizData(text) {
    const data = text.split('\n');
    console.log(data[1]);
    console.log(data[2]);
}

function printTextNews(text, maxSize) {
    const news = text.split('\n');
    for (x = 0; x < (news.length > maxSize ? maxSize : news.length); ++x) {
        console.log(news[x]);
    }
}

async function main(symbols) {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    console.log(symbols);
    for (ix = 2; ix < symbols.length; ++ix) {
        const symbol = symbols[ix];
        console.log('');
        console.log('');
        console.log(symbol);
        console.log('');
        const url1 = `https://finviz.com/quote.ashx?t=${symbol}`;
        const url2 = `https://www.benzinga.com/quote/${symbol}`;
        const result1 = await finviz(page, url1);
        const result2 = await benzinga(page, url2);
        printFinvizData(result1.dataText);
        console.log('');
        printTextNews(result1.newsText, 12);
        console.log('');
        printTextNews(result2.newsText, 8);
        console.log(result2.newsText);
    }
    browser.close();
}

// const symbolToSearch = 'CELC,REPX,BTX,AFMD';
const symbols = process.argv;
main(symbols)
    .then(response => {
        console.log('done');
    })
    .catch(console.error);
