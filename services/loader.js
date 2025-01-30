require('dotenv').config();
const puppeteer = require('puppeteer');
const { miror } = require('./video-act');
const { downloadFile } = require('./function');
const fs = require('fs');
const path = require('path');


const LOGIN = process.env.tk_login;
const PASS = process.env.tk_password;
const COOCKIE_PATH = path.join(__dirname, '/temp/cookies.json');
const TEMP_PATH = path.join(__dirname, '/temp/1.mp4');


/**
 * 
 * @param {puppeteer.Page} page 
 * @param {puppeteer.Browser} browser 
 * @returns 
 */
async function parseCockie(page, browser) {
    await page.goto('https://www.tiktok.com/login/phone-or-email/email', { waitUntil: 'networkidle2' });

    // Вводим учетные данные
    await page.type('input[name="username"]', LOGIN, { delay: 100 });
    await page.type('input[type="password"]', PASS, { delay: 100 });

    // Нажимаем кнопку входа
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });

    // Получаем и сохраняем куки
    const cookies = await browser.cookies();
    fs.writeFileSync(COOCKIE_PATH, JSON.stringify(cookies));

    console.log('COCKIES: ', cookies)
    return cookies;
}
async function test() {
    const browser = await puppeteer.launch({
        headless: false,  // Включаем видимый режим для дебага
        args: [
            '--no-sandbox',  // Для избежания ошибок при запуске в некоторых средах
            '--disable-setuid-sandbox',
            '--disable-blink-features=AutomationControlled'  // Избегаем автоматизации для предотвращения блокировки
        ]
    });

    // Создаем новый контекст и страницу
    const [page] = await browser.pages();

    // Загрузка куки
    const cookies = JSON.parse(fs.readFileSync(COOCKIE_PATH, 'utf-8'));
    await page.setCookie(...cookies);

    // Устанавливаем User-Agent и другие параметры
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    await page.setViewport({ width: 1280, height: 720 });
    await page.setGeolocation({ latitude: 54.0063, longitude: 13.0112 });

    // Открываем страницу загрузки видео на TikTok
    await page.goto('https://www.tiktok.com/upload');

    // Ожидаем загрузки и появления элемента для загрузки файла
    const fileInput = await page.$('input[type="file"]');
    await fileInput.uploadFile(TEMP_PATH);

    // Ждем появления поля для ввода описания
    await page.waitForSelector('div[contenteditable="true"]');
    const descriptionField = await page.$('div[contenteditable="true"]');
    await descriptionField.type('teststsst', { delay: 100 });  // Типируем текст с задержкой, имитируя поведение человека

    // Ждем появления кнопки "Опубликовать"
    await page.waitForSelector('button[data-e2e="publish-button"]:visible');

    // Нажимаем на кнопку "Опубликовать"
    await page.click('button[data-e2e="publish-button"]');

    // Подождем некоторое время, чтобы увидеть результат
    await page.waitForTimeout(30000);  // Примерная задержка, чтобы увидеть результат публикации

    // Закрываем браузер после выполнения
    await browser.close();
}


module.exports = async function postOnTikTok(videoPath, label, textGpt, caller) {
    const browser = await puppeteer.launch({
        headless: false,  // Включаем видимый режим для дебага
        args: [
            '--no-sandbox',  // Для избежания ошибок при запуске в некоторых средах
            '--disable-setuid-sandbox',
            '--disable-blink-features=AutomationControlled'  // Избегаем автоматизации для предотвращения блокировки
        ]
    });
    let cookies = JSON.parse(fs.readFileSync(COOCKIE_PATH, 'utf-8'));

    if(!cookies || cookies.length === 0) {
        const page = await browser.newPage();
        cookies = await parseCockie(page, browser);
    }


    if(cookies && cookies.length > 0) {
        try {
            await browser.setCookie(...cookies);
            const page = await browser.newPage();

            // Переходим на страницу загрузки видео
            await page.goto('https://www.tiktok.com/upload');
            await page.waitForSelector('input[type="file"]');

            // Загружаем файл и обрабатываем
            const resultDownload = await downloadFile(videoPath);       // Загрузка файла на локалку
            const resultMirror = await miror(label);                    // Обработка

            if(typeof resultMirror === 'string') {
                // Загрузить видео
                const fileInput = await page.$('input[type="file"]');
                await fileInput.uploadFile(resultMirror);

                // Ждем появления поля для ввода описания
                await page.waitForSelector('div[contenteditable="true"]', { visible: true });   //?

                // Вводим описание
                await page.evaluate((text)=> {
                    const descriptionField = document.querySelector('div[contenteditable="true"]');
                    if (descriptionField) {
                        descriptionField.innerHTML = text;
                        descriptionField.dispatchEvent(new Event('input', { bubbles: true }));
                    }
                }, textGpt);

                // Ожидаем прогресса загрузки
                await page.waitForSelector('.info-progress.success', { visible: true });

                // Ожидаем кнопку для публикации
                await page.waitForSelector('[data-e2e="post_video_button"]');
                const postButton = await page.$('[data-e2e="post_video_button"]');

                // Нажимаем кнопку публикации
                await postButton.click();

                // ? нужна логика для закрытия puppeter
                //* временное решение 5 min держим
                setTimeout(()=> browser.close(), 5 * (60*1000))
            } 
            else {
                // Обработка ошибок, если не удалось загрузить или обработать файл
                if(resultDownload.error) {
                    caller({
                        label: 'error load or mirror',
                        ...resultDownload.error
                    });
                }
                if(resultMirror.error) {
                    caller({
                        label: 'error load or mirror',
                        ...resultMirror.error
                    });
                }

                await browser.close();
            }
        } 
        catch (error) {
            console.error('Error posting video:', error);
            caller({
                label: 'Error',
                text: 'Произошла ошибка при загрузке видео.',
                error: error.message
            });
            await browser.close();
        } 
    } 
    else {
        // Ошибка с куки
        caller({
            label: 'Coockie error',
            text: 'Куки повреждены либо не актуальны'
        });
        await browser.close();
    }
};