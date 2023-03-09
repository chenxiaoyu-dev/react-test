$(document).ready(() => {
    const {ipcRenderer} = require('electron');   
    ipcRenderer.send('loginWindow-load-complete');
    console.log('aaa')
    /*const ribbon = require('./parts/ribbon');
    (new ribbon('ribbon-menubar')).init();

    window.spread = new GC.Spread.Sheets.Workbook(document.getElementById("ss"));
    window.spreadNS = GC.Spread.Sheets;
    window.excelIo = new GC.Spread.Excel.IO();

    const {initWhenDocumentReady} = require('./render/mainWindow');
    initWhenDocumentReady();*/
});