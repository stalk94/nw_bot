const ffmpeg = require('fluent-ffmpeg');
const path = require('path');


/**
 * 
 * @param {string} videoPath 
 * @returns {Promise<ffmpeg.FfprobeFormat>}
 */
async function getMeta(videoPath) {
    return await new Promise((resolve, reject)=> {
        ffmpeg.ffprobe(videoPath, (err, metadata)=> {
            if(err) {
                console.error('Ошибка при анализе видео:', err);
                reject();
            }
            else {
                const duration = metadata.format.duration;
                resolve(metadata.format);
            }
        });
    });
}
/**
 * Обрезчик видео
 * @param {string} path путь к видео
 * @param {number} startTime в секундах время начала
 * @param {number} duration в секундах длительность
 * @param {string} otput куда сохранять, если нет то в path
 * @returns {Promise<string>}
 */
async function trimVideo(path, startTime, duration, otput) {
    const metaFormatData = await getMeta(path);

    return await new Promise((resolve, reject)=> {
        if(!metaFormatData) reject(new Error('video not meta data'));
        else ffmpeg(path)
            .setStartTime(startTime)
            .duration(duration)
            .output(otput ?? path)
            .on('end', ()=> {
                console.log('Обрезка завершена.');
                resolve(otput ?? path);
            })
            .on('error', (err)=> {
                console.error('Ошибка при обрезке видео:', err);
                reject(err);
            })
            .run();
    });
}


/**
 * 
 * @param {string} copyrightText 
 * @returns 
 */
async function miror(copyrightText) {
    const videoTemp = path.join(__dirname, '/temp/1.mp4');
    const pathOut = path.join(__dirname, '/temp/2.mp4');
    const metaFormatData = await getMeta(videoTemp);


    return await new Promise((resolve, reject)=> {
        if(!metaFormatData) reject(new Error('video not meta data'));
        else ffmpeg(videoTemp)
            .videoFilters([
                'hflip',  // Отзеркалить видео по горизонтали
                {
                    filter: 'drawtext',
                    options: {
                        text: copyrightText,
                        fontsize: 40,
                        fontcolor: 'red',
                        x: '(w-text_w)/2',  // По центру по горизонтали
                        y: 20  // Расположить текст вверху
                    }
                }
            ])
            .output(pathOut)
            .on('end', ()=> {
                console.log('Процесс обработки завершен');
                resolve(pathOut);
            })
            .on('error', (err)=> {
                console.error('Ошибка при обработке видео miror:', err);
                reject({error: err});
            })
            .run();
        });
}


module.exports = {
    trimVideo: trimVideo,
    miror: miror
}