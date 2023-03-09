const path = require('path');
const { app, shell, BrowserWindow, Menu } = require('electron');
const Common = require('../common/common');
const UpdateHandler = require('../common/autoUpdate');

class MainWindow {
    constructor () {
        this.isShown = false;
        this.createWindow();
    }

    createWindow () {
        this.mainWindow = new BrowserWindow({
            title: Common.ELECTRONIC_WECHAT,
            resizable: true,
            center: true,
            show: false,
            frame: true,
            transparent: false,
            autoHideMenuBar: false,
            icon: path.join(__dirname, '../../../assets/icon.png'),
            titleBarStyle: 'hidden-inset',
            webPreferences: {
              javascript: true,
              plugins: true,
              nodeIntegration: true,
              webSecurity: false,
              //preload: path.join(__dirname, '../../inject/preload.js'),
            },
        });

        this.mainWindow.loadURL(`file://${path.join(__dirname, '/../../views/mainWindow.html')}`);

        const template = [
          {
            label: 'Edit',
            submenu: [
              {role: 'undo'},
              {role: 'redo'},
              {type: 'separator'},
              {role: 'cut'},
              {role: 'copy'},
              {role: 'paste'},
              {role: 'pasteandmatchstyle'},
              {role: 'delete'},
              {role: 'selectall'}
            ]
          },
          {
            label: 'View',
            submenu: [
              {role: 'reload'},
              {role: 'toggledevtools'},
              {type: 'separator'},
              {role: 'resetzoom'},
              {role: 'zoomin'},
              {role: 'zoomout'},
              {type: 'separator'},
              {role: 'togglefullscreen'}
            ]
          },
          {
            role: 'window',
            submenu: [
              {role: 'minimize'},
              {role: 'close'}
            ]
          },
          {
            role: 'help',
            submenu: [
              {
                label: 'Learn More',
                click () { require('electron').shell.openExternal('https://sususususuke.github.io') }
              }
            ]
          }
        ]

        const menu = Menu.buildFromTemplate(template);
        Menu.setApplicationMenu(menu);

        
        this.mainWindow.on('close', (e) => {
            e.preventDefault();
            this.mainWindow.webContents.send('action','exiting');
        });
        
    }

    show() {
        this.mainWindow.show();
        this.isShown = true;
    }
    
    hide() {
        this.mainWindow.hide();
        this.isShown = false;
    }
}

module.exports = MainWindow;

