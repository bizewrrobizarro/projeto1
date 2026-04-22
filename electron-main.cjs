const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1300, height: 850,
    backgroundColor: '#050505',
    webPreferences: { nodeIntegration: true, contextIsolation: false }
  });

  Menu.setApplicationMenu(null); // Esconde a barra de menu padrão

  // Aguarda o servidor estar pronto antes de carregar
  const checkServer = () => {
    const http = require('http');
    http.get('http://localhost:3000', (res) => {
      mainWindow.loadURL('http://localhost:3000');
    }).on('error', () => {
      setTimeout(checkServer, 500);
    });
  };

  checkServer();
}

app.whenReady().then(createWindow);