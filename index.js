
// const puppeteer = require('puppeteer');
const puppeteer = require('puppeteer');
const dotenv = require("dotenv")
const axios = require("axios");
const { finviz } = require('./src/finviz');
const { benzinga } = require('./src/benzinga');

dotenv.config();

// function printFinvizData(text) {
//     const data = text.split('\n');
//     console.log(data[1]);
//     console.log(data[2]);
// }

// function printTextNews(text, maxSize) {
//     const news = text.split('\n');
//     for (x = 0; x < (news.length > maxSize ? maxSize : news.length); ++x) {
//         console.log(news[x]);
//     }
// }

async function save(url, name, parseType, dataset, email) {
    try {
        const dataset1 = {
            url,
            name,
            parseType,
            dataset,
            email,
        }
        console.log(JSON.stringify(dataset1, null, 4));
        await axios.post(process.env.URL, dataset1);
    }
    catch { }
}

async function main(symbols) {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    console.log(symbols);
    let finvizData = [];
    let benzingaData = [];
    for (let ix = 2; ix < symbols.length; ++ix) {
        const symbol = symbols[ix];
        console.log('');
        console.log('');
        console.log(symbol);
        console.log('');
        const url1 = `https://finviz.com/quote.ashx?t=${symbol}`;
        const url2 = `https://www.benzinga.com/quote/${symbol}`;
        try {
            pageLoadCount = 0;
            const result1 = await finviz(page, url1);
            //        await save(url1, "finviz", "finviz", result1, process.env.EMAIL);
            finvizData.push(result1);
        }
        catch (e) {
            console.log("main-finviz: " + e);
        }

        try {
            const result2 = await benzinga(page, url2);
            //        await save(url2, "benzinga", "benzinga", result2, process.env.EMAIL);
            benzingaData.push(result2);
        }
        catch (e) {
            console.log("main-benzinga: " + e);
        }
    }
    browser.close();
    console.log(' -------------------------------------------- ');
    for (let ix = 0; ix < finvizData.length; ++ix) {
        const symbol = symbols[ix + 2];
        const data = finvizData[ix];
        console.log(symbol + " - " + data.dataText + ", ");
    }
}

// const symbolToSearch = 'CELC,REPX,BTX,AFMD';
const symbols = process.argv;
main(symbols)
    .then(response => {
        console.log('done');
    })
    .catch(console.error);
