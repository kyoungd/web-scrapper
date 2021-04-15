const { exception } = require('console');
const util = require('./util');

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

module.exports.benzinga = async function (page, url) {
    // await page.goto(url, { waitUntil: 'networkidle2' });
    await page.goto(url);

    xpath = '//*[@id="__next"]/div/div[2]/div/div/div/div[2]/div[1]/div[1]/div[2]';
    const [el] = await page.$x(xpath);
    const NewsH = await el.getProperty('innerHTML');
    const newsHt = await NewsH.jsonValue();
    const newsHtm = util.cleanHtml(newsHt);
    const newsHtml = util.xml2Object(newsHtm);

    const newsArray = newsHtml[0].children;
    let isLastNewsRelevant = false;
    let newsText = [];
    for (let ix = 0; ix < newsArray.length; ix++) {
        try {
            const data = newsArray[ix];
            const newsDate = getBenzingaNews("date", data);
            if (util.isBenzingaNewsStillRelevent(newsDate, isLastNewsRelevant)) {
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
