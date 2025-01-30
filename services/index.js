require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const { scrapeVideo } = require('./bot-scraper');
const loader = require('./loader');
const { getChatGPTResponse } = require('./gpt');

/////////////////////////////////////////////////////////////////////////
const TELEGRAM_KEY = process.env.TELEGRAM;
const textPrompt = `
    Напиши описание для видео, которое будет опубликовано в соцсетях.   
    2️⃣ Для Tik-tok – описание с хештегами. Так же можно эмоджи 
    Видео связано с темой: Видео чат рулетка для взрослых
`;
const textCooper = `link in profile header`;
/////////////////////////////////////////////////////////////////////////
const bot = new TelegramBot(TELEGRAM_KEY, { polling: true });
console.log('🤖 Бот запущен...');
function isValidUrl(str) {
    const pattern = /^(https?:\/\/)?([\w\d-]+\.)+[a-z]{2,}(:\d+)?(\/[^\s]*)?$/i;
    return pattern.test(str);
}


// Обработчик новых сообщений
bot.on('message', async(msg)=> {
    const chatId = msg.chat.id;
    const text = msg.text;
    console.log(`📩 Новое сообщение от ${chatId}: ${text}`);

    if(isValidUrl(text)) {
        bot.sendMessage(chatId, `Принято в работу`);
        const resultScrape = await scrapeVideo(text);           // текст от бота

        if(resultScrape !== 'TypeError' && resultScrape.url) {
            bot.sendMessage(chatId, `Видео извлечено`);
            const responcesGptText = await getChatGPTResponse(textPrompt);
            
            if(typeof(responcesGptText)==='string') {
                await loader(resultScrape.url, textCooper, responcesGptText, console.log);
            }
        }
        else console.error('Ошибка скрапера');
    }
    else bot.sendMessage(chatId, `Не верно указана ссылка`);
});


bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 'Жду ссылку!');
});