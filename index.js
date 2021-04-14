
// const puppeteer = require('puppeteer');
const puppeteer = require('puppeteer');
const readline = require('readline');
const dotenv = require("dotenv")
const axios = require("axios");
const himalaya = require('himalaya');
const { exception } = require('console');

dotenv.config()

async function removeElementByClass(className) {
    let div_selector_to_remove = className;
    await page.evaluate((sel) => {
        var elements = document.querySelectorAll(sel);
        for (var i = 0; i < elements.length; i++) {
            elements[i].parentNode.removeChild(elements[i]);
        }
    }, div_selector_to_remove)
}

async function clickButton(page, xpath) {
    try {
        // xpath = "/html/body/div[11]/div[2]/div[2]";
        // xpthh = "/html/body/div[10]/div[2]/div[2]";
        const searchBtn = await page.$x(xpath);
        searchBtn[0].click();
    }
    catch { }
}

function cleanHtml(data) {
    return data
        .replace(/\n/g, "")
        .replace(/(&)nbsp;/g, "")
        .replace(/<tr\s.*?>/g, '<tr>')
        .replace(/<td\s.*?>/g, '<td>')
        .replace(/<div\s.*?>/g, '<div>')
        .replace(/<a\s.*?>/g, '<a>')
        .replace(/<span\s.*?>/g, '<span>')
        .replace(/<br.*?>/g, '<br />');
}

function getFinvizData(name, data) {
    switch (name) {
        case "share-float":
            return data[0].children[1].children[9].children[0].children[0].content;
        case "short-float":
            return data[0].children[2].children[9].children[0].children[0].content;
        default:
            return "Unknown name on getFinvizData()";
    }
}

function getFinvizNews(name, data) {
    switch (name) {
        case "date":
            return data.children[0].children[0].content;
        case "title":
            return data.children[1].children[0].children[0].children[0].children[0].content;
        case "source":
            return data.children[1].children[0].children[1].children[0].children[0].content;
        case "quality":
            try {
                return data.children[1].children[0].children[1].children[2].children[0].content;
            } catch (e) {
                return "";
            }
        default:
            return "unknown name in getFinvizNews()";
    }
}

function replaceNbsps(str) {
    var re = new RegExp(String.fromCharCode(160), "g");
    return str.replace(re, " ");
}

function xml2Object(data) {
    const htmlData = replaceNbsps(data);
    const obj = himalaya.parse(htmlData);
    return obj;
}

function isFinvizNewsStillRelevent(dateStr, isLastNewsRelevant) {
    const nowDate = new Date();
    const newsDate = new Date(dateStr.split(" ")[0]);
    if (newsDate == "Invalid Date")
        return isLastNewsRelevant;
    return (newsDate > nowDate.setDate(nowDate.getDate() - 7));
}

function isBenzingaNewsStillRelevent(dateStr, isLastNewsRelevant) {
    const nowDate = new Date();
    const newsDate = new Date(dateStr);
    return (newsDate > nowDate.setDate(nowDate.getDate() - 7));
}

function isNewsStillRelevant(parseType, dateStr, isLastNewsRelevant) {
    const isRelevant = (parseType == "finviz" ?
        isFinvizNewsStillRelevent(dateStr, isLastNewsRelevant) :
        isBenzingaNewsStillRelevent(dateStr, isLastNewsRelevant));
    return isRelevant;
}

let pageLoadCount = 0;

async function finviz(page, url) {
    // await page.goto(url, { waitUntil: 'networkidle2' });

    try {
        // await page.goto(url);
        await page.goto(url, { waitUntil: 'networkidle2' });

        // clickButton(page, "/html/body/div[10]/div[2]/div[2]");
        // clickButton(page, "/html/body/div[11]/div[2]/div[2]");
        // await removeElementByClass("ic_dimm1519 ic_fade-in1519");
        const xpath1 = '//*[@id="news-table"]';
        const [el] = await page.$x(xpath1);
        const NewsH = await el.getProperty('innerHTML');
        // const newsT = await el.getProperty('innerText');
        // const newsText = await newsT.jsonValue();
        const newsHt = await NewsH.jsonValue();
        const newsHtml = cleanHtml(newsHt);
        const newsJson = xml2Object(newsHtml);

        const xpath2 = '/html/body/div[4]/div/table[2]';
        const [stat] = await page.$x(xpath2);
        const dataH = await stat.getProperty('innerHTML');
        const dataHt = await dataH.jsonValue();
        const dataHtml = cleanHtml(dataHt);
        const finvizData = await xml2Object(dataHtml);

        const dataText = "share-float: "
            + getFinvizData("share-float", finvizData)
            + "  |  short-float: "
            + getFinvizData("short-float", finvizData);
        console.log(dataText);

        let newsText = [];
        let lineCount = 0;
        const newsArray = newsJson[0].children;
        let isLastNewsRelevant = false;
        for (let ix = 0; ix < newsArray.length; ix++) {
            const data = newsArray[ix];
            if (data.children.length > 0) {
                const newsDate = getFinvizNews("date", data);
                if (isNewsStillRelevant("finviz", newsDate, isLastNewsRelevant)) {
                    isLastNewsRelevant = true;
                    const oneNews = newsDate
                        + ": " + getFinvizNews("title", data)
                        + " (" + getFinvizNews("source", data) + ") "
                        + getFinvizNews("quality", data)
                    newsText.push(oneNews);
                    console.log(oneNews);
                    ++lineCount;
                }
                else
                    isLastNewsRelevant = false;
            }
            if (lineCount > 6)
                break;
        }
        const dataset = { newsText, dataText, news: newsHtml, data: dataHtml };
        return dataset;
    }
    catch (e) {
        console.log('ERROR: ' + e);
        if (e.message.indexOf("timeout") > 0 && pageLoadCount < 5) {
            ++pageLoadCount;
            return (await finviz(page, url));
        }
        else
            throw exception(e);
    }
}

function getBenzingaNews(name, data) {
    switch (name) {
        case "date":
            return data.children[1].children[1].children[0].content;
        case "title":
            return data.children[0].children[0].children[0].content;
        case "source":
            return data.children[1].children[0].content;
        default:
            return "unknown name on getBenzingaNews()";
    }
}

async function benzinga(page, url) {
    // await page.goto(url, { waitUntil: 'networkidle2' });
    await page.goto(url);

    xpath = '//*[@id="__next"]/div/div[2]/div/div/div/div[2]/div[1]/div[1]/div[2]';
    const [el] = await page.$x(xpath);
    const NewsH = await el.getProperty('innerHTML');
    const newsHt = await NewsH.jsonValue();
    const newsHtm = cleanHtml(newsHt);
    const newsHtml = await xml2Object(newsHtm);

    const newsArray = newsHtml[0].children;
    let isLastNewsRelevant = false;
    let newsText = [];
    for (let ix = 0; ix < newsArray.length; ix++) {
        try {
            const data = newsArray[ix];
            const newsDate = getBenzingaNews("date", data);
            if (isNewsStillRelevant("benzinga", newsDate, isLastNewsRelevant)) {
                isLastNewsRelevant = true;
                const oneNews = newsDate
                    + ": " + getBenzingaNews("title", data)
                    + " (" + getBenzingaNews("source", data) + ")";
                newsText.push(oneNews);
                console.log(oneNews);
            }
            else
                isLastNewsRelevant = false;
        }
        catch (e) {
            console.log("benzinga: " + e);
        }
    }

    // const newsT = await el.getProperty('innerText');
    // const newsText = await newsT.jsonValue();

    const dataset = { newsText: newsText, news: newsHtml };
    return dataset;
}

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
