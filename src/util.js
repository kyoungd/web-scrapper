const himalaya = require('himalaya');

module.exports.callme = function () {
    console.log('call me');
}

module.exports.removeElementByClass = async function (className) {
    let div_selector_to_remove = className;
    await page.evaluate((sel) => {
        var elements = document.querySelectorAll(sel);
        for (var i = 0; i < elements.length; i++) {
            elements[i].parentNode.removeChild(elements[i]);
        }
    }, div_selector_to_remove)
}

module.exports.clickButton = async function clickButton(page, xpath) {
    try {
        // xpath = "/html/body/div[11]/div[2]/div[2]";
        // xpthh = "/html/body/div[10]/div[2]/div[2]";
        const searchBtn = await page.$x(xpath);
        searchBtn[0].click();
    }
    catch { }
}

module.exports.cleanHtml = function (data) {
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

function replaceNbsps(str) {
    var re = new RegExp(String.fromCharCode(160), "g");
    return str.replace(re, " ");
}

module.exports.xml2Object = function (data) {
    const htmlData = replaceNbsps(data);
    const obj = himalaya.parse(htmlData);
    return obj;
}
