const path = require('path');
const {BrowserWindow} = require('electron');
const Common = require('../common/common');

class SplashWindow {
    constructor () {
        this.splashWindow = new BrowserWindow ({
            width: Common.PRELOADING_WINDOW_SIZE.width,
            height: Common.PRELOADING_WINDOW_SIZE.height,
            resizeable: false,
            center: true,
            show: true,
            frame: false,
            transparent: true,
            autoHideMenuBar: true,
            alwaysOnTop: true,
            titleBarStyle: 'hidden',
        });

        this.splashWindow.loadURL(`file://${path.join(__dirname, '/../../views/splash.html')}`);
        this.isShown = false;
    }

    show() {
        this.splashWindow.show();
        this.isShown = true;
    }
    
    hide() {
        this.splashWindow.hide();
        this.isShown = false;
    }

    close() {
        this.splashWindow.close();
    }
}

module.exports = SplashWindow;