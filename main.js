const { app, BrowserWindow } = require('electron');
const path = require('path');


function createWindow() {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true  // Позволяет использовать Node.js в рендерерном процессе
        }
    });

    win.loadFile(path.join(__dirname, 'src', 'index.html'));  // Загружаем HTML
    win.webContents.openDevTools();
}




app.whenReady().then(()=> {
    createWindow();

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