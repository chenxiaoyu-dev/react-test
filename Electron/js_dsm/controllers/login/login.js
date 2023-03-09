const path = require('path');
//const { app, shell, BrowserWindow, Menu } = require('electron');
const {BrowserWindow} = require('electron');
const Common = require('../common/common');
//const UpdateHandler = require('../common/autoUpdate');

class LoginWindow {

    constructor () {
        
        this.isShown = false;
        this.createWindow();
    }

    createWindow () {
        
        this.loginWindow = new BrowserWindow ({

            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false,
              },

            title: 'DSMGenius_Login',
            width: Common.PRELOADING_WINDOW_SIZE.width,
            height: Common.PRELOADING_WINDOW_SIZE.height,
            resizeable: false,
            center: true,
            show: true,
            frame: true,
            transparent: false,
            // autoHideMenuBar: true,
            autoHideMenuBar: false,
            alwaysOnTop: false,
            // titleBarStyle: 'hidden',
            
        });

        this.loginWindow.webContents.openDevTools({mode:'undocked'})

        this.loginWindow.loadURL(`file://${path.join(__dirname, '/../../views/login_window.html')}`);
        
        
        //this.isShown = false;
    }

    show() {
        this.loginWindow.show();
        this.isShown = true;
    }
    
    hide() {
        this.loginWindow.hide();
        this.isShown = false;
    }

    close() {
        this.loginWindow.close();
    }
}

module.exports = LoginWindow;
