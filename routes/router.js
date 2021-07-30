const express = require('express');
const router = express.Router();
const browser = require('../services/BrowserService');
const { dateFormat, dateValidation } = require('../functions');

router.get('/', (req, res) => {
    res.send('Hello Asksuite World!');
});

router.post('/search', async (req, res) => {

    let { checkin, checkout } = req.body;
    if (!checkin || !checkout) return res.status(400).send({ error: "Informações pendentes. Informe os campos checkin e checkout." });

    //Validando as datas recebidas, se a de entrada é menor que a de saída
    let validDates = dateValidation({ checkin, checkout });

    if(!validDates) return res.status(400).send({error: "A data de entrada é maior que a de saída ou as datas inseridas não são válidas."});

    //Formatando as datas recebidas
    checkin = dateFormat(checkin);
    checkout = dateFormat(checkout);
    const bot = async ({ checkin, checkout }) => {

        //Montando a URL para requisição com as datas passadas como parâmetro
        let URL = 'https://book.omnibees.com/hotelresults?CheckIn=' + checkin + '&CheckOut=' + checkout + '&Code=AMIGODODANIEL&NRooms=1&_askSI=d34b1c89-78d2-45f3-81ac-4af2c3edb220&ad=2&ag=-&c=2983&ch=0&diff=false&group_code=&lang=pt-BR&loyality_card=&utm_source=asksuite&q=5462#show-more-hotel-button';

        //Inicializando um navegador e abrindo uma nova aba
        const page = await (await browser.getBrowser()).newPage();

        //Movendo para a URL anteriormente montada
        await page.goto(URL);

        //Buscando as cotações disponíveis
        const availableQuotations = await page.evaluate(() => {

            const verifyInfo = (info) => {
                return {
                    name: info.name?.replace(/\n/g, "") || "Informação indisponível",
                    description: info.description?.replace(/\n/g, "") || "Informação indisponível",
                    image: info.image?.replace(/\n/g, "") || "Informação indisponível",
                    price: info.price?.replace(/\n/g, "") || "Informação indisponível",
                }
            }

            const elements = document.querySelector("#hotels_grid");
            const nodes = Array.from(elements.childNodes);
            let validNodes = [];
            let results = [];

            for (let i = 0; i < nodes.length; i++) {
                if (nodes[i].nodeName == "DIV") {
                    validNodes.push(nodes[i].childNodes)
                }
            }
            for (let i = 0; i < validNodes.length; i++) {
                let info = { name: "", image: "", description: "", price: "" }

                info.name = document.querySelector("#hotels_grid > div:nth-child(" + parseInt(i + 1) + ") > div.flex-view-step2 > div.desciption.position-relative > span > p")?.textContent;
                info.image = document.querySelector("#hotels_grid > div:nth-child(" + parseInt(i + 1) + ") > div.flex-view-step2 > div.t-tip__next > div > img.image-step2")?.getAttribute("src");
                info.description = document.querySelector("#hotels_grid > div:nth-child(" + parseInt(i + 1) + ") > div.flex-view-step2 > div.desciption.position-relative > p.description.hotel-description")?.textContent;
                info.price = document.querySelector("#hotels_grid > div:nth-child(" + parseInt(i + 1) + ") > div:nth-child(4) > div.right-part-of-rate > div > div.price-step2.t-tip__next > p.price-total")?.textContent;

                info = verifyInfo(info);

                results.push(info);
            }

            return results;
        })
            .catch((error) => console.log({ error }))

        page.close();
        return availableQuotations;
    }

    let quotations = await bot({ checkin, checkout });

    console.log({ quotations })
    res.send({ quotations });
});


module.exports = router;
