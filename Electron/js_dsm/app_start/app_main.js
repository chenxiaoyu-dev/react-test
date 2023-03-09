const electron = require("electron");
// Module to control application life.
const app = electron.app;
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;

const path = require("path");
const url = require("url");

const ipcMain = electron.ipcMain;
const dialog = electron.dialog;
const SplashWindow = require("../controllers/splash/splash");
const MainWindow = require("../controllers/home/mainWindow");
const LoginWindow = require("../controllers/login/login");

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.

class DSMer {
  constructor() {
    this.splashWindow = null;
    this.mainWindow = null;
    this.loginWindow = null;
  }

  init() {
    this.initApp();

    this.initIPC();
  }

  initApp() {
    app.on("ready", () => {
      // this.createSplashWindow();
      this.createMainWindow();
      this.createLoginWindow();
    });
  }

  initIPC() {
    console.log("是否执行了");
    ipcMain.on("loginWindow-load-complete", (event, param) => {
      // this.splashWindow.hide();
      this.loginWindow.show();
      this.mainWindow.hide();
    });

    ipcMain.on("login-success", (event, param) => {
      this.loginWindow.hide();
      //this.splashWindow.show();
      this.mainWindow.show();
    });

    ipcMain.on("open-a2l", (event, param) => {
      console.log(event);
      dialog.showOpenDialog(
        {
          properties: ["openFile"],
          filters: [{ name: "A2L", extensions: ["a2l"] }],
        },
        function (files) {
          if (files) event.sender.send("selected-a2l", files);
        }
      );
    });

    ipcMain.on("select-save-dir", (event, param) => {
      dialog.showSaveDialog(
        {
          filters: param ? param.filters : [],
        },
        function (files) {
          if (files) event.sender.send("selected-dir-to-save", files);
        }
      );
    });

    ipcMain.on("open-hex", (event, param) => {
      dialog.showOpenDialog(
        {
          properties: ["openFile"],
          filters: [{ name: "HEX", extensions: ["hex"] }],
        },
        (files) => {
          if (files) event.sender.send("selected-hex", files);
          else event.sender.send("cancel");
        }
      );
    });

    ipcMain.on("open-files", (event, param) => {
      dialog.showOpenDialog(
        {
          properties: [
            "openFiles",
            param.multiSelections ? "multiSelections" : "",
          ],
          filters: param ? param.filters : [],
        },
        (files) => {
          if (files) event.sender.send("open-files-selected", files);
        }
      );
    });

    ipcMain.on("reqaction", (event, arg) => {
      switch (arg) {
        case "exit":
          //this.mainWindow.close();
          app.exit();
          app.exit();
          break;
        case "notexit":
          //this.mainWindow.focus();
          break;
      }
    });
  }

  createSplashWindow() {
    this.splashWindow = new SplashWindow();
    console.log("success splashWindow");
  }

  createMainWindow() {
    this.mainWindow = new MainWindow();
    console.log("success mainWindow");
  }

  createLoginWindow() {
    this.loginWindow = new LoginWindow();
    console.log("success mainWindow");
  }
}

new DSMer().init();
