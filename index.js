const puppeteer = require('puppeteer');
const moment = require('moment');

(async () => {
    const browser = await puppeteer.launch({headless: false});
    const page = await browser.newPage();
    await page.goto('https://app.getvero.com', {waitUntil: 'networkidle2'});
    await page.click('#login > ul > li:nth-child(2) > a');
    await page.waitForNavigation();
    await page.click('#identifierId');
    await page.keyboard.type(process.env.GOOGLE_USERNAME);
    await page.click('#identifierNext');
    await page.waitForNavigation({waitUntil: 'networkidle2'});
    await page.waitFor(500);
    await page.click('#password');
    await page.keyboard.type(process.env.GOOGLE_PASSWORD);
    await page.click('#passwordNext');
    await page.waitForNavigation();
    console.log('Password entered. Waiting for 2FA.');
    while (!(await page.url()).match(/^https?:\/\/app\.getvero\.com/)) {
        await page.waitForNavigation({timeout: 0});
    }
    console.log('2FA complete');

    const deploymentDate = moment('02 Aug 2018', 'DD MMM YYYY');
    let hasFinished = false;
    let pageNumber = 1;
    let customersToContact = [];

    while (!hasFinished) {
        await page.goto(`https://app.getvero.com/logs?utf8=%E2%9C%93&customer=&event=&filter-campaign=on&campaign=188436&type=&commit=Filter&page=${pageNumber}`, {waitUntil: 'networkidle2'});
        const rows = await page.$$('#logs tr.co');
        const customerIds = await Promise.all(rows.map(async row => await row.$eval('td.person', el => el.innerText)));
        const dates = (await Promise.all(rows.map(async row => await row.$eval('td.date', el => el.innerText))))
            .map(date => moment(date.replace(/,.+/, ''), 'DD MMM YYYY'));

        customerIds.forEach((id, index) => {
            if (dates[index].isSameOrAfter(deploymentDate)) {
                customersToContact.push(id);
            } else {
                hasFinished = true;
            }
        });

        pageNumber++;
    }
    console.log([...new Set(customersToContact)].join('\n'));
})();


