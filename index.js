const { default: puppeteer } = require("puppeteer");
const fs = require("fs");

let ligths = [];
let scrapeLigths = async () => {
    let url = `https://www.ikea.com/es/es/`;

    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args: ['--start-maximized']
    });

    const page = await browser.newPage();

    await page.goto(url);

    try {
        await page.waitForSelector('#onetrust-accept-btn-handler', { visible: true, timeout: 5000 });
        await page.$eval(`#onetrust-accept-btn-handler`, element => element.click());
        console.log(`Cookies aceptadas`);   
    } catch (error) {
        console.log("Sin cuadro de cookies, continuamos");       
    }

    await page.$eval(`.hnf-utilities__value`, element => element.click());
    await page.type(`.hnf-input-field__wrapper > input`, `19000`);
    await page.click(`.hnf-modal-footer > button`);
   
    await page.type(`#ikea-search-input`, `iluminacion`);
    await page.waitForSelector(`#search-box__searchbutton`);
    await page.click(`#search-box__searchbutton`);

    await page.waitForNavigation();

    while (true) {
        let next = await page.$(`.plp-catalog-bottom-container > a`,{ timeout: 3000 }).catch(() => null);   
        if (!next) {
            console.log("no hay más páginas"); 
            console.log("Se recogen los datos");
            break;  
        }
        await next.click();
        console.log("avance de página");
        await page.waitForNavigation({ waitUntil: 'domcontentloaded' });  
    }
       
    let image = await page.$$eval('.plp-image', (elements) =>
        elements.map(el => el.src)
    );
    
    let originalTitle = await page.$$eval('.plp-price-module__product-name', (elements) =>
    elements.map(el => el.textContent)
    ); 

    let translatedTitle = await page.$$eval('.plp-price-module__description', (elements) =>
        elements.map(el => el.textContent.split(`,`)[0])
    );

    let arrayPrice = await page.$$eval('.plp-price__sr-text', (elements) =>
        elements.map(el => el.textContent.split(` `)[1].split(`€`)[0])
        .filter(array => array !== `anterior`)
    );
    let price = [];
    for (let index = 0; index < arrayPrice.length; index++) {
        let textPrice = parseFloat(arrayPrice[index].replace(`,`,`.`));
        price.push(textPrice);
    };

    for (let index = 0; index < image.length; index++) {
    let addingLigths = {
            image: image[index],
            name: originalTitle[index],
            description: translatedTitle[index],
            price: price[index],
        };       
        ligths.push({...addingLigths});
    };
 
    await browser.close();

    fs.writeFile("products.json", JSON.stringify(ligths), () => {
    console.log("Texto .json generado");   
    })
};

scrapeLigths();
