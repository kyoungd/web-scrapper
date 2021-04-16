const { exception } = require('console');
const util = require('./util');

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

async function getFinviz(page, url) {
    // await page.goto(url, { waitUntil: 'networkidle2' });

    // await page.goto(url);
    await page.goto(url, { waitUntil: 'networkidle2' });

    // util.clickButton(page, "/html/body/div[10]/div[2]/div[2]");
    // util.clickButton(page, "/html/body/div[11]/div[2]/div[2]");
    // await util.removeElementByClass("ic_dimm1519 ic_fade-in1519");
    const xpath1 = '//*[@id="news-table"]';
    const [el] = await page.$x(xpath1);
    const NewsH = await el.getProperty('innerHTML');
    // const newsT = await el.getProperty('innerText');
    // const newsText = await newsT.jsonValue();
    const newsHt = await NewsH.jsonValue();
    const newsHtml = util.cleanHtml(newsHt);
    const newsJson = util.xml2Object(newsHtml);

    const xpath2 = '/html/body/div[4]/div/table[2]';
    const [stat] = await page.$x(xpath2);
    const dataH = await stat.getProperty('innerHTML');
    const dataHt = await dataH.jsonValue();
    const dataHtml = util.cleanHtml(dataHt);
    const finvizData = util.xml2Object(dataHtml);

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
            if (util.isFinvizNewsStillRelevent(newsDate, isLastNewsRelevant)) {
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

module.exports.finviz = async function (page, url) {
    let pageLoadCount = 0;
    try {
        return (await getFinviz(page, url));
    }
    catch (e) {
        console.log('ERROR: ' + e);
        if (e.message.indexOf("timeout") > 0 && pageLoadCount < 5) {
            ++pageLoadCount;
            return (await getFinviz(page, url));
        }
        else
            throw exception(e);
    }
}
