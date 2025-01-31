const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { exec } = require('child_process');


function createWindow() {
    const win = new BrowserWindow({
        width: 1280,
        height: 720,
        webPreferences: {
            nodeIntegration: true  // Позволяет использовать Node.js в рендерерном процессе
        }
    });

    win.loadFile(path.join(__dirname, 'src', 'index.html'));  // Загружаем HTML
    //win.webContents.openDevTools();
    win.loadFile('src/index.html');
}
function startServer() {
    exec(`node server/index.js`, (error, stdout, stderr)=> {
        console.log(stdout)
        if(error) {
            console.error(`Ошибка при запуске сервера: ${error.message}`);
            return;
        }
        if(stderr) {
            console.error(`stderr: ${stderr}`);
            return;
        }
        console.log(`stdout: ${stdout}`);
    });
}




app.whenReady().then(()=> {
    createWindow();
    startServer();

    app.on('activate', ()=> {
        if(BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});
app.on('window-all-closed', () => {
    if(process.platform !== 'darwin') {
        app.quit();
    }
});