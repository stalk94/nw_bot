require('dotenv').config();
const path = require('path');
const cors = require("cors");
const express = require('express');
const http = require('http');


const app = express();
const server = http.createServer(app);
app.use(cors({origin:"http://localhost:3001"}));
app.use(express.urlencoded({limit: '100mb'}));
app.use(express.json({limit: '1mb'}));


app.get("/", (req, res)=> {
    res.sendFile(__dirname+'/dist/index.html');
});





app.use('/', express.static(path.join(__dirname, '/src')));
app.use('/', express.static(path.join(__dirname, '/dist')));
server.listen(3000, ()=> {
    console.log("start 3000");
});