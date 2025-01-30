require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const https = require('https');

const logStream = fs.createWriteStream('console.log', { flags: 'a' });
const TEMP_PATH = path.join(__dirname, '/temp/1.mp4');

/**
 * 
 * @param {number} timestamp 
 * @param {'TD'|'T'|'D'} format 
 * @returns 
 */
exports.convertTime =(timestamp, format)=> {
    const date = new Date(timestamp);

    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear(); 

    const formattedTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    const formattedDate = `${String(day).padStart(2, '0')}-${String(month).padStart(2, '0')}-${year}`;

    if(!format || format==='TD') return {time:formattedTime, date:formattedDate};
    else if(format==='T') return formattedTime;
    else return formattedDate;
}
// лог в файл
console.log = function(...messages) {
    function formatMessage(message) {
        if (typeof message === 'object') {
            try {
                return JSON.stringify(message, null, 2); // Красивый JSON
            } catch (err) {
                return '[Circular]'; // Обработка циклических ссылок
            }
        }
        return String(message);
    }

    const time = exports.convertTime(Date.now(), 'TD');
    const formatTime = `${time.date} [${time.time}]`;
    const formattedMessages = messages.map(formatMessage).join(' ');
    const format = `${formatTime} : ${formattedMessages}\n`

    logStream.write(format);
    process.stdout.write(format);
}



exports.downloadFile =async(url)=> {
    async function checkRedirect() {
        try {
            const response = await axios.get(url, {
                maxRedirects: 0, // Запрещаем следование за редиректами
                validateStatus: (status)=> status >= 200 && status < 400,
            });
    
            // Если код 3xx и есть заголовок Location, значит редирект есть
            if (response.status >= 300 && response.status < 400 && response.headers.location) {
                //console.log(`Redirect found: ${response.headers.location}`);
                return response.headers.location;
            } 
        } 
        catch(error) {
            console.error('Error checking redirect:', error.message);
            return 'error';
        }
    }

    const isRedirect = await checkRedirect();

    if(isRedirect !== 'error') return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(TEMP_PATH);

        https.get(isRedirect ? isRedirect : url, (res)=> {
            res.pipe(file);
            file.on('finish', ()=> file.close(resolve));
        })
        .on('error', (error) => {
            fs.unlink(TEMP_PATH, ()=> {});
            reject({error: error})
        });
    });
}