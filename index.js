require('dotenv').config();
const path = require('path');
const cors = require("cors");
const express = require('express');
const http = require('http');
const initBot = require('./server/telegram');
const fs = require('fs');


const app = express();
const bot = initBot(process.env.TELEGRAM);
const server = http.createServer(app);
//app.use(cors({origin:"http://localhost:3001"}));
app.use(express.urlencoded({limit: '100mb'}));
app.use(express.json({limit: '1mb'}));
const cache = [];


process.emit('bot', (txt)=> cache.push(txt));
app.get("/", (req, res)=> {
    res.sendFile(__dirname + '/dist/index.html');
});
app.post('/chek', (req, res)=> {
    fs.readFile('./console.log', {encoding: 'utf-8'}, (err, data)=> {
        if(!err) res.send({
            msg: cache,
            sys: data
        });
    });
});



app.use('/', express.static(path.join(__dirname, '/src')));
app.use('/', express.static(path.join(__dirname, '/dist')));
server.listen(3000, ()=> {
    console.log("start 3000");
});