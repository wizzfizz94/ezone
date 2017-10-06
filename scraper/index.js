const puppeteer = require('puppeteer');
const fs = require('fs');
const mime = require('mime');
const URL = require('url').URL;
const fetch = require('node-fetch');
const progressStream = require('progress-stream');

(async() => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.goto(
    'http://www.ecu.edu.au/about-ecu/our-campuses/campus-maps',
    {waitUntil : "networkidle"});
  await page.click(
    '#new_content_container_663331 > ul > li:nth-child(4) > a')
  await page.waitForNavigation({waitUntil: 'load'})

  await page.goto(
    'https://ecusis.ecu.edu.au/mapenquiry/getItemData.aspx'+
    '?selected_map=JOsite&z=1505995889844',
    {waitUntil : "networkidle"});

  //log xml outer data
  // console.log(await page.plainText())

  let item_count = await page.$eval(
    '#webkit-xml-viewer-source-xml > itemdata',
    el=>el.childElementCount)
  item_count--; //removes legend from scrape

  const page2 = await browser.newPage();
  let loc_code;
  for (i = 1; i <= item_count; i++) {
    loc_code = await page.$eval(
      `#webkit-xml-viewer-source-xml > itemdata > item:nth-child(${i})`,
      (elm) => elm.getAttribute("loc_code")
    )
    console.log(loc_code);
    await page2.goto(
      `https://ecusis.ecu.edu.au/mapenquiry/getItemData.aspx?selected_map=${loc_code}1`,
      {waitUntil : "networkidle"})
    // console.log(await page2.plainText());

    await page2.goto(
      `https://ecusis.ecu.edu.au/SiSfm-data/Mapdata/${loc_code}1/${loc_code}1_2.swf`,
      {waitUntil : "networkidle"})
    let cookies = await page2.cookies();
    let cookiesString = cookies.map(cookie =>{
      return `${cookie.name}=${cookie.value}`
    }).join('; ');
    console.log(cookiesString);


    const res = await fetch(
      `https://ecusis.ecu.edu.au/SiSfm-data/Mapdata/${loc_code}1/${loc_code}1_2.swf`,
      {
      headers: {
        Cookie: cookiesString
      }
    })
    const buffer = await res.buffer();
    fs.writeFileSync(`${loc_code}1.swf`, buffer);
  }
  //
  // console.log(itemdata);
  await browser.close()
})();
