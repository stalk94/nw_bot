require('../services/function');
const fs = require('fs');
const { scrapeVideo } = require('../services/scraper');
const { botLoader, parseCockie } = require('../services/bot-loader');
const { getChatGPTResponse } = require('../services/gpt');
const { isValidUrl } = require('../services/function');
const TelegramBot = require('node-telegram-bot-api');
const cfg = JSON.parse(fs.readFileSync('./config/tik-tok.json', {encoding:"utf-8"}));


/////////////////////////////////////////////////////////////////////////
globalThis.CONFIG = { 
    tk_login: cfg.tk_login ?? process.env.tk_login,
    tk_password: cfg.tk_password ?? process.env.tk_password,
    textPrompt: cfg.textPrompt, 
    textCooper: cfg.textCooper,
    flickCooper: cfg.flickCooper
}
/////////////////////////////////////////////////////////////////////////


/**
 * Создать бот слушателей и вернуть обькт бота
 * @param {string} token 
 * @returns {TelegramBot}
 */
module.exports =(token)=> {
    const bot = new TelegramBot(token, {polling: true});
    console.log('🤖 bot create!');

    // Обработчик новых сообщений
    bot.on('message', async(msg)=> {
        const chatId = msg.chat.id;
        const text = msg.text;
        console.log(`📩 Новое сообщение от ${chatId}: ${text}`);

        if(isValidUrl(text)) {
            bot.sendMessage(chatId, `Принято в работу`);
            const resultScrape = await scrapeVideo(text);           // текст от бота

            if(resultScrape !== 'TypeError' && resultScrape.url) {
                bot.sendMessage(chatId, `🎥 Видео извлечено. Передано боту`);
                const responcesGptText = await getChatGPTResponse(CONFIG.textPrompt);
                
                if(typeof(responcesGptText)==='string') {
                    await botLoader(resultScrape.url, CONFIG.textCooper, responcesGptText, (txt, error)=> {
                        if(error) console.error(error);
                        if(txt) bot.sendMessage(chatId, txt);
                    });
                }
            }
            else console.error('Ошибка скрапера');
        }
        else {
            console.error('Не верно указана ссылка');
            bot.sendMessage(chatId, `Не верно указана ссылка`);
        }
    });


    bot.onText(/\/start/, (msg) => {
        const chatId = msg.chat.id;
        bot.sendMessage(chatId, 'Жду ссылку!');
    });

    return bot;
}