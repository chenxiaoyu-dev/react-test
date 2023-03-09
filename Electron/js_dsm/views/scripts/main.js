/*jshint -W030 */ // Expected an assignment or function call and instead saw an expression (a && a.fun1())
/*jshint -W004 */ // {a} is already defined (can use let instead of var in es6)
var spreadNS = GC.Spread.Sheets;
var DataValidation = spreadNS.DataValidation;
var ConditionalFormatting = spreadNS.ConditionalFormatting;
var ComparisonOperators = ConditionalFormatting.ComparisonOperators;
var Calc = GC.Spread.CalcEngine;
var ExpressionType = Calc.ExpressionType;
var SheetsCalc = spreadNS.CalcEngine;
var Sparklines = spreadNS.Sparklines;
var isSafari = (function () {
  var tem,
    M =
      navigator.userAgent.match(
        /(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i
      ) || [];
  if (!/trident/i.test(M[1]) && M[1] !== "Chrome") {
    M = M[2] ? [M[1], M[2]] : [navigator.appName, navigator.appVersion, "-?"];
    if ((tem = navigator.userAgent.match(/version\/(\d+)/i)) != null)
      M.splice(1, 1, tem[1]);
    return M[0].toLowerCase() === "safari";
  }
  return false;
})();
var isIE =
  navigator.userAgent.toLowerCase().indexOf("compatible") < 0 &&
  /(trident)(?:.*? rv ([\w.]+)|)/.exec(navigator.userAgent.toLowerCase()) !==
    null;
var DOWNLOAD_DIALOG_WIDTH = 300;

(window.spread = {}), (window.excelIO = {});
var tableIndex = 1,
  pictureIndex = 1;
var fbx,
  isShiftKey = false;
var resourceMap = {},
  conditionalFormatTexts = {};
var { ipcRenderer, shell, remote } = require("electron");
var { Menu, MenuItem, dialog } = remote;
var fs = require("fs"),
  path = require("path"),
  os = require("os"),
  DSM = require("./scripts/Main_require/dsm"),
  //chunk = require('./scripts/Main_require/chunk'),
  { A2L, HEX, DCM, XML } = require("./scripts/Main_require/ASAM");

window.AppNS = {};
AppNS.datasets = {
  dock: [],
  search: function (_id) {
    for (const dataset of this.dock) {
      if (dataset.id === _id) return dataset;
    }
    return null;
  },
};
AppNS.sourceDataset = {};
AppNS.destinationDataset = [];
AppNS.handoverDataset = [];

//ribbon menubar events handlers (start)
let a2l, hex, a2lFilePath, hexFilePath, datasetId;
ipcRenderer.on("selected-a2l", function (event, _path) {
  $("#topLoadingBox").show();
  try {
    a2lFilePath = _path[0];
    a2l = new A2L(a2lFilePath);
    a2l.load();
    if (a2l) ipcRenderer.send("open-hex", "single");
  } catch (e) {
    console.log(e);
  }
});

ipcRenderer.on("selected-hex", function (event, _path) {
  try {
    hexFilePath = _path[0];
    hex = new HEX(hexFilePath);
    if (hex) {
      a2l.hexData = hex;
      if (a2l.readCHAR()) {
        datasetId =
          "dataset-" + performance.now().toString(16).replace(".", "z");
        (a2lFileName = path.basename(a2lFilePath)),
          (hexFileName = path.basename(hexFilePath));
        $("#tab-datasets").click();

        if ($("#datasets-panel-a2l-hex-list:visible").length === 0)
          $(
            "#datasets-panel div[data-panel=a2lhex] .insp-group-title span:first"
          ).click();
        addToDatasetsPanel(
          $("#datasets-panel-a2l-hex-list"),
          datasetId,
          a2lFileName,
          hexFileName
        );
        console.time("123");
        getDefFuncforLabels(a2l);
        console.timeEnd("123");
        addDataset(datasetId, "A2LHEX", [a2lFileName, hexFileName], a2l);
      }
    }
  } catch (e) {
    console.log(e);
  } finally {
    $("#topLoadingBox").hide();
  }
});

ipcRenderer.on("cancel", () => {
  $("#topLoadingBox").hide();
});

ipcRenderer.on("create-new-excel-window-success", function (event, param) {
  console.log(event, param);
});

ipcRenderer.on("selected-dir-to-save", function (event, param) {
  if (AppNS.readyToWrite) {
    console.log(param);
    fs.writeFileSync(param, AppNS.readyToWrite, {
      encoding: "UTF-8",
    });
    AppNS.readyToWrite = "";
  }
});

ipcRenderer.on("open-files-selected", function (event, param) {
  for (const filepath of param) {
    setTimeout(() => {
      const id = "dataset-" + performance.now().toString(16).replace(".", "z");
      const filename = path.basename(filepath);
      const extname = path.extname(filename).toUpperCase();
      if (extname === ".DCM") {
        const dcm = new DCM(filepath);
        addToDatasetsPanel(
          $("#datasets-panel-dcm-list"),
          id,
          filename,
          "",
          "white-space:normal;"
        );
        addDataset(id, "DCM", filename, dcm);
      } else if (extname === ".XML") {
        const xml = XML(filepath);
        addToDatasetsPanel(
          $("#datasets-panel-xml-list"),
          id,
          filename,
          "",
          "white-space:normal;"
        );
        addDataset(id, "XML", filename, xml);
      }
    });
  }
});

ipcRenderer.on("action", (event, arg) => {
  switch (arg) {
    case "exiting":
      let exitOrNot = askSaveIfNeed();
      console.log(exitOrNot);
      ipcRenderer.send("reqaction", exitOrNot);
      break;
  }
});

// ``符号定义了一个多行字符串，该字符串内可以使用换行符等，也可以使用变量；
var cardHtmlTemplate = `<div class="insp-row" data-DID="@ID@" draggable="true" ondragstart="event.dataTransfer.setData('DID', '@ID@')">                                         
        <div class="chrome-download-item" onclick="$(event.target).toggleClass('selected')">
            <div class="chrome-download-item-content">
                <span title="@N1@" style="@STYLE@">@N1@</span>
                <span title="@N2@">@N2@</span>
            </div>
            <div class="chrome-download-item-btn">
                <button class="chrome-download-item-close-btn">&#10005</button>
            </div>
        </div>
    </div>`;

function addToDatasetsPanel(container, _id, _a, _h, _style = "") {
  let htmlTemplate = cardHtmlTemplate
    .replace(/@N1@/g, _a)
    .replace(/@N2@/g, _h)
    .replace(/@ID@/g, _id)
    .replace(/@STYLE@/, _style);
  container.prepend(htmlTemplate);
  container.find(".chrome-download-item-close-btn:first").click(function () {
    $(this.parentElement.parentElement.parentElement).remove();
    removeDataset(_id, "datasets");
  });

  /*$('#'+_id+' button').click((e) => {
        $('#'+_id+ ' .chrome-download-item').css('opacity', 0);
        setTimeout(()=>{$('#'+_id).remove();}, 600);
        
    });*/
  setTimeout(() => {
    container.find(".chrome-download-item").css("opacity", 1);
  }, 100);
}

function addDataset(_id, _type, _name, _data) {
  if (AppNS.datasets) {
    AppNS.datasets.dock.push({
      id: _id,
      type: _type,
      name: _name,
      data: _data,
    });
  }
}

function removeDataset(_id, panelIs) {
  if (panelIs === "src") {
    AppNS.sourceDataset = null;
  } else if (panelIs === "des") {
    /*
        for (const [i, dataset] of AppNS.destinationDataset.entries()) {
            if (dataset.id === _id) {
                AppNS.destinationDataset.remove(i);
                break;
            }
        }
        */
    AppNS.destinationDataset = null;
  } else if (panelIs === "handover") {
    /*
        for (const [i, dataset] of AppNS.handoverDataset.entries()) {
            if (dataset.id === _id) {
                AppNS.handoverDataset.remove(i);
                break;
            }
        }
        */
    AppNS.handoverDataset = null;
  }

  if (panelIs === "datasets") {
    for (const [i, dataset] of AppNS.datasets.dock.entries()) {
      if (dataset.id === _id) {
        AppNS.datasets.dock.remove(i);
        break;
      }
    }

    if (AppNS.sourceDataset && AppNS.sourceDataset.id === _id) {
      AppNS.sourceDataset = null;
    }
  }
}

function toggleInspector() {
  if ($(".insp-container:visible").length > 0) {
    $(".insp-container").hide();
    if (!_floatInspector) {
      $("#inner-content-container").css({
        right: 0,
      });
    } else {
      $("#inner-content-container").css({
        right: 0,
      });
    }

    $(this).attr("title", uiResource.toolBar.showInspector);
    $(this).removeClass("active");
  } else {
    $(".insp-container").show();
    if (!_floatInspector) {
      $("#inner-content-container").css({
        right: "251px",
      });
    } else {
      $("#inner-content-container").css({
        right: 0,
      });
    }

    $(this).attr("title", uiResource.toolBar.hideInspector);
    $(this).addClass("active");
  }
  spread.refresh();
}

function toggleDatasetsPanel() {
  const resPanel = $("#resource-container");
  const isShown = resPanel.css("display");
  const w = $("#inner-content-container");

  if (isShown != "none") {
    resPanel.hide();
    w.css({
      left: 0,
    });
    $(this).removeClass("active");
  } else {
    resPanel.show();
    w.css({
      left: "251px",
    });
    $(this).addClass("active");
  }

  spread.refresh();
}

function dragoverSrcDesDropPanel(event) {
  event.preventDefault();
}

function dropSrcDesDropPanel(event) {
  const srcPanel = $("#src-dataset-drop-panel")[0];
  const desPanel = $("#des-dataset-drop-panel")[0];
  const handoverPanel = $("#handover-dataset-drop-panel")[0];

  let target, panelIs;

  if (srcPanel.contains(event.target)) {
    target = srcPanel;
    panelIs = "src";
  } else if (desPanel.contains(event.target)) {
    target = desPanel;
    panelIs = "des";
  } else if (handoverPanel.contains(event.target)) {
    target = handoverPanel;
    panelIs = "handover";
  } else return false;

  const id = event.dataTransfer.getData("DID");
  const dataset = AppNS.datasets.search(id);
  let htmlTemplate = cardHtmlTemplate.replace(/@ID@/g, dataset.id);
  if (dataset.type === "A2LHEX") {
    htmlTemplate = htmlTemplate
      .replace(/@N1@/g, dataset.name[0])
      .replace(/@N2@/g, dataset.name[1]);
  } else if (
    dataset.type === "EXCEL" ||
    dataset.type === "DCM" ||
    dataset.type === "XML"
  ) {
    htmlTemplate = htmlTemplate
      .replace(/@N1@/g, dataset.name)
      .replace(/@N2@/g, "")
      .replace(/@STYLE@/, "white-space:normal;");
  }

  if (panelIs === "src") {
    $(target).find(".drop-panel-content").html(htmlTemplate);
    AppNS.sourceDataset = dataset;
    //AppNS.sourceDataset.A2lName= ...;
    updateLabelCheckIconState();
  } else if (panelIs === "des") {
    $(target).find(".drop-panel-content").html(htmlTemplate);
    //let dataset_Des = $.extend(true,{},dataset); //深拷贝，后续对Lib库的操作不会影响原库；
    AppNS.destinationDataset = dataset;
    //console.log(dataset);
    if (dataset.type === "EXCEL" && dataset.name.match(/DSM Lib/)) {
      //每次导入DSM库时自动执行生成正确的DTCLib函数;
      $("#ribbon-btn-config-lib").click();
    } else {
      AppNS.destinationDataset.data.correctLib = dataset.data[0];
    }
  } else {
    $(target).find(".drop-panel-content").html(htmlTemplate);
    AppNS.handoverDataset = dataset;
  }

  $(target)
    .find(".drop-panel-content .chrome-download-item")
    .addClass("selected");

  $(target)
    .find(".chrome-download-item-close-btn")
    .click(function () {
      $(this.parentElement.parentElement.parentElement).remove();
      removeDataset(id, panelIs);
    });
}

function listDFCsheet() {
  const srcDataset = AppNS.sourceDataset;
  console.log(srcDataset);
  if (srcDataset && srcDataset.type === "A2LHEX") {
    let title_DFC = [
      {
        head: "Fault Path",
        prop: "name",
        width: 150,
        align: 0,
      },
      {
        head: "Class",
        prop: "DFESCls",
        width: 80,
        align: 1,
      },
      {
        head: "Pcode",
        prop: "DTCO",
        width: 100,
        align: 1,
      },
      {
        head: "FTB",
        prop: "FaultTyp",
        width: 80,
        align: 1,
      },
      {
        head: "CtlMsk",
        prop: "CtlMsk",
        width: 100,
        align: 1,
      },
      {
        head: "DisblMsk",
        prop: "DisblMsk",
        width: 120,
        align: 1,
      },
      {
        head: "EnvRef",
        prop: "EnvRef",
        width: 120,
        align: 1,
      },
      {
        head: "DTCM",
        prop: "DTCM",
        width: 120,
        align: 1,
      },
      {
        head: "ISO Description",
        prop: "descriptionEn",
        width: 220,
        align: 0,
      },
      {
        head: "UAES说明",
        prop: "descriptionCn",
        width: 220,
        align: 0,
      },
      {
        head: "负责部门",
        prop: "responsible",
        width: 100,
        align: 1,
      },
      {
        head: "Compare",
        prop: "Comp_res",
        width: 80,
        align: 1,
      },
      {
        head: "Handover",
        prop: "Handover",
        width: 80,
        align: 1,
      },
      {
        head: "备注",
        prop: "remark",
        width: 180,
        align: 0,
      },
    ];
    console.log(title_DFC);
    if (!$("#ribbon-btn-config-envref").hasClass("active")) {
      console.log("这里是否执行了");
      // title_DFC.splice(6, 1); //未选中EnvRef，则删除环境变量列；

      let newTitle = JSON.parse(JSON.stringify(title_DFC));
      let titleList = newTitle.filter((item, index) => {
        return item.head != "EnvRef";
      });
      title_DFC = titleList;
    }
    if (!$("#ribbon-btn-output-DTCM").hasClass("active")) {
      let newTitle = JSON.parse(JSON.stringify(title_DFC));
      let titleList = newTitle.filter((item, index) => {
        return item.head != "DTCM";
      });
      title_DFC = titleList;
    }
    if ($("#ribbon-btn-config-ctldis").hasClass("active")) {
      title_DFC.splice(4, 2); //选中CtlDis，则删除CtlMsk/DisblMsk两列；
    }
    //let [uniformedDFC,prop] = DSM.getDFCTable(srcDataset.data);
    let testOut = DSM.getDFCTable(srcDataset.data);
    console.log(testOut);
    // head_title用于定义与数据无关的表头行，如DTC List的第一行表头；
    let head_title = [];

    const newListsheet = listDataToNewSheet(
      "DSM_" + srcDataset.name[0],
      testOut,
      title_DFC,
      "DFC List"
    );
    //srcDataset.uniformedDFC = uniformedDFC;
    //srcDataset.DTCListSheet = sheet;

    if (!spread.getActiveSheet().bindCompareHandler) {
      let sheet = newListsheet;
      sheet.bind(spreadNS.Events.EditEnded, function (e, info) {
        info.startRow = info.row;
        info.endRow = info.row;
        //console.log(info);
        compare(info); //表格上修改完成，则自动对该行进行对比；
        //console.log(info);
      });
    }
  } else {
    alert("Source Dataset中无a2l hex数据!");
  }
}

function getFieldnameByColumnIndex(fieldDef, int) {
  for (const fieldname in fieldDef) {
    if (int == fieldDef[fieldname]) return fieldname;
  }
}

function compare(info) {
  const sheet = spread.getActiveSheet();
  if (sheet && sheet.name().match(/[DFC_List|scantool|IUPR|pwrstg|DINH]/)) {
    console.log(sheet.name());
    console.log("compare function run...");
    //console.log(info);
    $("#des-dataset-drop-panel")
      .find(".chrome-download-item")
      .each(function () {
        if ($(this).hasClass("selected")) {
          const datasetId = this.parentElement.getAttribute("data-did");
          const dataset = AppNS.datasets.search(datasetId); //dataset是DESTINATION中选中的目标数据；
          //const sheet = spread.getActiveSheet();

          let dd,
            layout,
            recordname = "",
            recordInDD,
            cell,
            cellVal,
            rawValInDD,
            phyValInDD;
          layout = sheet.sheetLayout; //layout定义依据Sourcesheet；

          const CompLayout = {
            c1: 2,
            cCount: 7,
            keyColumnIndex: 3,
            keyFromRow: 3,
            keyToRow: sheet.getRowCount() - 3,
            fieldColumnIndex: {
              DTCO: 4,
              FaultTyp: 5,
              DFESCls: 6,
              CtlMsk: 7,
              DisblMsk: 8,
              descriptionEn: 9,
              descriptionCn: 10,
              responsible: 11,
              Comp_res: 12,
              remark: 13,
              EnvRef: 14, //此处定义compare动作需要操作的表格列；
            },
          };

          for (const field in CompLayout.fieldColumnIndex) {
            CompLayout.fieldColumnIndex[field] =
              layout.fieldColumnIndex[field] || -1;
          } //将对比过程需要操作的列的序号与表格的实际列序号对应。

          if (dataset.type === "A2LHEX") {
            dd = DSM.getDFCTable(dataset.data).output;
          } else if (dataset.type === "EXCEL") {
            dd = dataset.data.correctLib;
          } else if (dataset.type === "DCM") {
            dd = dataset.data.FESTWERT;
          }

          if (sheet) {
            spread.suspendPaint();
            let checkStartRow, checkEndRow, checkColRange, j;

            if (info) {
              checkStartRow = info.startRow;
              checkEndRow = info.endRow;
              //  checkColRange = [info.col];
            } else {
              checkStartRow = layout.keyFromRow;
              checkEndRow = layout.keyToRow;
              //  checkColRange = Object.keys(CompLayout.fieldColumnIndex).map((field) => {return layout.fieldColumnIndex[field]});
              sheet.comments.clear();
            }

            for (let i = checkStartRow; i <= checkEndRow; i++) {
              if (dataset.type === "DCM") {
                for (const field in layout.fieldColumnIndex) {
                  j = layout.fieldColumnIndex[field];
                  cell = sheet.getCell(i, j);
                  cellVal = cell.text();
                  recordname = cell.tag();

                  if (dd[recordname]) {
                    rawValInDD = dd[recordname].WERT;
                    if (recordname.match(/DTCO/)) {
                      phyValInDD = DSM.calcDTCO(parseInt(rawValInDD));
                    } else if (recordname.match(/FaultTyp/)) {
                      phyValInDD = DSM.calcFaultTyp(parseInt(rawValInDD));
                    } else {
                      phyValInDD = "" + parseInt(rawValInDD);
                    }
                    if (cellVal != phyValInDD) {
                      sheet.comments.add(
                        i,
                        j,
                        dataset.name + "\n" + phyValInDD
                      );
                      cell.foreColor("red");
                      cell.backColor("#ffcbc7");
                    } else {
                      cell.foreColor("green");
                      cell.backColor("#e3efda");
                      sheet.comments.remove(i, j);
                    }
                  } else {
                    ("Not Found in Desination Dataset");
                    sheet
                      .getRange(i, layout.c1, 1, layout.cCount)
                      .backColor("#eeeeee");
                  }
                }
              } else if (
                dataset.type === "EXCEL" ||
                dataset.type === "A2LHEX"
              ) {
                recordname = sheet.getText(i, layout.keyColumnIndex); //KeyColumnIndex是DFC名称列，是工具输出sheet的第i行的DFC名称
                if (dataset.type === "EXCEL")
                  recordname = recordname.toUpperCase(); //如果是和库对比，则统一为大写；
                recordInDD = dd[recordname]; //dd是用于对比的excel或a2lhex中解析的数据，在此处实现sheet与对比数据的DFC的对应。
                let IsEqual;
                //console.log(recordname);
                if (recordInDD) {
                  //IsEqual = 'null';
                  for (const field in CompLayout.fieldColumnIndex) {
                    //只对CompLayout里定义的列进行操作
                    if (
                      field != "Comp_res" &&
                      field != "Handover" &&
                      CompLayout.fieldColumnIndex[field] != -1
                    ) {
                      j = CompLayout.fieldColumnIndex[field];
                      cell = sheet.getCell(i, j);
                      cellVal = cell.text(); //cellVal是从Source中读出的数据；

                      if (
                        field === "descriptionCn" ||
                        field === "responsible" ||
                        field === "descriptionEn" ||
                        field === "remark"
                      ) {
                        cell.text(recordInDD[field]);
                      } else {
                        if (cellVal != "" + recordInDD[field]) {
                          //''+变量用于将其强制转换为字符串；
                          sheet.comments.add(
                            i,
                            layout.fieldColumnIndex[field],
                            field +
                              "\n" +
                              dataset.name +
                              "\n" +
                              recordInDD[field]
                          );
                          cell.foreColor("red");
                          cell.backColor("#ffcbc7");
                          IsEqual = "Not Equal";
                        } else {
                          cell.foreColor("green");
                          cell.backColor("#e3efda");
                          sheet.comments.remove(i, j);
                        }
                      }
                    }
                    if (!IsEqual) {
                      IsEqual = "Equal";
                    }
                    cell = sheet.getCell(
                      i,
                      layout.fieldColumnIndex["Comp_res"]
                    );
                    cell.text(IsEqual);
                    let [foreColor, backColor] =
                      IsEqual === "Not Equal"
                        ? ["red", "#ffcbc7"]
                        : ["green", "#e3efda"];
                    cell.foreColor(foreColor);
                    cell.backColor(backColor);
                    //IsEqual = '';
                  }
                } else {
                  IsEqual = "Not Found";
                  ("Not Found in Desination Dataset");
                  sheet
                    .getRange(i, layout.c1, 1, layout.cCount)
                    .backColor("#eeeeee");
                  sheet
                    .getCell(i, layout.fieldColumnIndex["Comp_res"])
                    .text(IsEqual);
                  //IsEqual = '';
                }
              }
            }

            spread.resumePaint();
          }
        }
      });

    if (!sheet.bindCompareHandler) {
      sheet.bindCompareHandler = true;
    }
  } else alert("no correct sheet selected!");
}

function copyData(info) {
  const sheet = spread.getActiveSheet();
  const selections = info || sheet.getSelections();
  let cell,
    layout = sheet.sheetLayout,
    recordname,
    fieldname,
    recordInDD,
    rawValInDD,
    phyValInDD;
  //const selections = sheet.getSelections(); //获取当前选中的copy区域；

  spread.suspendPaint();

  $("#des-dataset-drop-panel")
    .find(".chrome-download-item:first")
    .each(function () {
      if ($(this).hasClass("selected")) {
        const datasetId = this.parentElement.getAttribute("data-did");
        const dataset = AppNS.datasets.search(datasetId); //读取对比文件数据；

        if (dataset.type === "DCM") {
          dd = dataset.data.FESTWERT;

          for (const selection of selections) {
            for (let i = 0; i < selection.rowCount; i++) {
              for (let j = 0; j < selection.colCount; j++) {
                cell = sheet.getCell(selection.row + i, selection.col + j);
                if (sheet.comments.get(selection.row + i, selection.col + j)) {
                  recordname = cell.tag();
                  recordInDD = dd[recordname];
                  if (recordInDD) {
                    rawValInDD = recordInDD.WERT;
                    if (recordname.match(/DTCO/)) {
                      phyValInDD = DSM.calcDTCO(parseInt(rawValInDD));
                    } else if (recordname.match(/FaultTyp/)) {
                      phyValInDD = DSM.calcFaultTyp(parseInt(rawValInDD));
                    } else {
                      phyValInDD = parseInt(rawValInDD);
                    }

                    cell.value(phyValInDD);
                    cell.foreColor("green");
                    cell.backColor("#e3efda");
                    sheet.comments.remove(selection.row + i, selection.col + j);
                  }
                }
              }
            }
          }
        } else if (dataset.type === "EXCEL" || "A2LHEX") {
          //对比文件为库or其他项目数据；
          dd = dataset.data.correctLib || DSM.getDFCTable(dataset.data).output; //dd为由库或基础项目数据获得的对比数据；

          if (dd) {
            let info = {};
            for (const selection of selections) {
              info.startRow = selection.row;
              info.endRow = selection.row + selection.rowCount - 1; //copy操作的起始行与结束行；
              for (let i = 0; i < selection.rowCount; i++) {
                if (sheet.getRowVisible(selection.row + i)) {
                  //复选区域，对其中的隐藏区域不进行复制操作；
                  for (let j = 0; j < selection.colCount; j++) {
                    cell = sheet.getCell(selection.row + i, selection.col + j); //当前cell的行列号为selection.row+i,selection.clo+j；
                    if (
                      sheet.comments.get(selection.row + i, selection.col + j)
                    ) {
                      recordname = sheet
                        .getCell(selection.row + i, layout.keyColumnIndex)
                        .text(); //读取单元格所在行的故障路径；
                      if (dataset.type === "EXCEL")
                        recordname = recordname.toUpperCase(); //如果是和库对比，则统一为大写以不区分大小写；
                      fieldname = getFieldnameByColumnIndex(
                        layout.fieldColumnIndex,
                        selection.col + j
                      ); //读取所在列的属性名称；
                      if (
                        dd[recordname] &&
                        !(dd[recordname][fieldname] === "")
                      ) {
                        //库中有此故障路径，且此条故障路径下对应项不为空；
                        let checkVal = undefined;

                        //console.log(dd[recordname][fieldname]);
                        if (fieldname == "DTCO") {
                          checkVal = /^[PBCU][0123][A-F\d]{3}$/;
                        } //DTCO的标准格式；
                        if (fieldname == "FaultTyp") {
                          checkVal = /^[A-F\d]{2}$/;
                        } //FaultTyp的标准格式；
                        if (checkVal != undefined) {
                          if (!checkVal.test(dd[recordname][fieldname])) {
                            console.log(
                              recordname,
                              ".",
                              fieldname,
                              ":",
                              dd[recordname][fieldname],
                              "数据不正确"
                            );
                            continue;
                          } //故障码或三字节不符合标准，不执行copy操作；
                        }

                        if (
                          fieldname == "DFESCls" &&
                          !(
                            parseInt(dd[recordname][fieldname]) >= 0 &&
                            parseInt(dd[recordname][fieldname]) < 22
                          )
                        ) {
                          console.log(
                            recordname,
                            ".",
                            fieldname,
                            ":",
                            dd[recordname][fieldname],
                            "数据不正确"
                          );
                          continue; //故障类不在1-30，不执行copy操作；
                        }
                        if (
                          fieldname == "CtlMsk" &&
                          $.inArray(
                            parseInt(dd[recordname][fieldname]),
                            [0, 1, 512, 3072]
                          ) == -1
                        ) {
                          console.log(
                            recordname,
                            ".",
                            fieldname,
                            ":",
                            dd[recordname][fieldname],
                            "数据不正确"
                          );
                          continue;
                        }
                        if (
                          fieldname == "DisblMsk" &&
                          $.inArray(
                            parseInt(dd[recordname][fieldname]),
                            [0, 32768, 65535, 4294967295]
                          ) == -1
                        ) {
                          console.log(
                            recordname,
                            ".",
                            fieldname,
                            ":",
                            dd[recordname][fieldname],
                            "数据不正确"
                          );
                          continue;
                        }
                        cell.value(dd[recordname][fieldname]);
                        cell.foreColor("green");
                        cell.backColor("#e3efda");
                        if (
                          sheet.comments.get(
                            selection.row + i,
                            selection.col + j
                          )
                        )
                          sheet.comments.remove(
                            selection.row + i,
                            selection.col + j
                          ); //复制完成后删除对比comment；
                      }
                    }
                  }
                }
              }
              compare(info);
            }
          }
        }
      }
    });

  spread.resumePaint();
}

function setFaultPath(sheet, _handover_Val) {
  //Handover操作仅针对DFC Sheet有效；
  let cell,
    layout = sheet.sheetLayout,
    recordname,
    fieldname,
    recordInDD,
    rawValInDD,
    phyValInDD;
  const selections = sheet.getSelections(); //确认需要进行Handover操作的选中区域；
  let checkEndRow, j;

  const CopyLayout = {
    c1: 2,
    cCount: 7,
    keyColumnIndex: 3,
    keyFromRow: 3,
    keyToRow: sheet.getRowCount() - 3,
    fieldColumnIndex: {
      DTCO: 4,
      FaultTyp: 5,
      DFESCls: 6,
      CtlMsk: 7,
      DisblMsk: 8,
      //EnvRef: 9,
    }, //handover操作涉及的列；
  };
  let col_Count = Object.getOwnPropertyNames(
    CopyLayout.fieldColumnIndex
  ).length;

  let checkStartCol = layout.keyColumnIndex; //Handover设置数据起始列（Fault Path）；
  let checkEndCol = layout.keyColumnIndex + col_Count; //Handover设置终止列；
  let handoverCol = layout.fieldColumnIndex["Handover"]; //Handover所在列；

  for (const field in CopyLayout.fieldColumnIndex) {
    CopyLayout.fieldColumnIndex[field] = layout.fieldColumnIndex[field] || -1;
  } //将复制过程需要操作的列的序号与表格的实际列序号对应。

  let info = {}; //确定设置后进行对比的区域。

  let Close_DFC = {
    CtlMsk: 0,
    DFESCls: 0,
    DTCO: "P0000",
    DisblMsk: 65535,
    FaultTyp: "00",
  }; //关闭故障的操作。

  let Open_DFC = {
    CtlMsk: 0,
    DFESCls: 3,
    DTCO: "P0000",
    DisblMsk: 0,
    FaultTyp: "00",
  }; //无库时打开故障的操作。

  let dataset = undefined;

  $("#des-dataset-drop-panel")
    .find(".chrome-download-item:first")
    .each(function () {
      //获取对比库；
      if ($(this).hasClass("selected")) {
        //找到Des中被选中的库或hex或DCM。
        const datasetId = this.parentElement.getAttribute("data-did");
        dataset = AppNS.datasets.search(datasetId);
      }
    });

  spread.suspendPaint();

  for (const selection of selections) {
    //支持多区域操作;
    info.startRow = selection.row; //对比起始行;
    info.endRow = selection.row + selection.rowCount - 1; //对比终止行;

    for (let i = 0; i < selection.rowCount; i++) {
      if (sheet.getRowVisible(selection.row + i)) {
        //对筛选过滤的行不进行操作；
        const handover_Val =
          _handover_Val ||
          sheet
            .getCell(selection.row + i, handoverCol)
            .text()
            .trim()
            .toUpperCase(); //获取Handover列信息；
        //console.log(handover_Val);

        if (handover_Val === "Y") {
          //交付为打开故障；
          if (dataset === undefined) {
            for (let field in CopyLayout.fieldColumnIndex) {
              cell = sheet.getCell(
                selection.row + i,
                CopyLayout.fieldColumnIndex[field]
              );
              cell.value(Open_DFC[field]);
            }
          } else {
            copyData([
              {
                row: selection.row + i,
                col: checkStartCol + 1,
                rowCount: 1,
                colCount: col_Count,
              },
            ]); //一次仅处理一行；
          }
        } else if (handover_Val === "N") {
          //交付为关闭故障;
          for (let field in CopyLayout.fieldColumnIndex) {
            /*   
                        if(dataset != undefined && ){

                        }
                        */
            cell = sheet.getCell(
              selection.row + i,
              CopyLayout.fieldColumnIndex[field]
            );
            cell.value(Close_DFC[field]);
          }
        }
      }
    }

    compare(info);
  }

  spread.resumePaint();
}

function openFault() {
  const sheet = spread.getActiveSheet();
  if (sheet.type === "DFC List") {
    //打开故障操作仅针对DFC Sheet有效；
    setFaultPath(sheet, "Y");
  } else {
    alert("请在DFC Source页面进行故障设置操作！");
  }
}

function closeFault() {
  const sheet = spread.getActiveSheet();
  if (sheet.type === "DFC List") {
    //打开故障操作仅针对DFC Sheet有效；
    setFaultPath(sheet, "N");
  } else {
    alert("请在DFC Source页面进行故障设置操作！");
  }
}

function listHandover() {
  //sheet = AppNS.sourceDataset.DTCListSheet;
  //console.log(sheet.sheetLayout);
  const sheet = spread.getActiveSheet();
  $("#handover-dataset-drop-panel")
    .find(".chrome-download-item")
    .each(function () {
      if ($(this).hasClass("selected")) {
        const datasetId = this.parentElement.getAttribute("data-did");
        const dataset = AppNS.datasets.search(datasetId);

        let handover_raw,
          handover_record = {},
          layout,
          recordname = "",
          recordInDD,
          cell,
          cellVal,
          rawValInDD,
          phyValInDD;
        layout = sheet.sheetLayout;
        //console.log(sheet.sheetLayout);

        if (dataset.data[0] != undefined && dataset.data[0].length != 0) {
          handover_raw = $.extend(true, [], dataset.data[0]); //深拷贝，只对拷贝出的libData进行操作，不改变从excel中读取的原始数据，以便重复使用excel原始数据；
        }

        if (dataset.type === "EXCEL") {
          //handover_raw = libData; //解析出来的数组格式的交付库；
          if (handover_raw != undefined && handover_raw.length > 0) {
            for (let i = 0; i < handover_raw.length; i++) {
              let recordname = handover_raw[i].name;
              handover_record[recordname] = handover_raw[i];
              delete handover_record[recordname].name; //删除数组元素的'name'属性，数组库变为结构体；
            }
            //console.log(handover_record);
          }
        } else {
          return false;
        }

        if (sheet) {
          spread.suspendPaint();
          let checkStartRow, checkEndRow, j;

          checkStartRow = layout.keyFromRow;
          checkEndRow = layout.keyToRow;

          for (let i = checkStartRow; i <= checkEndRow; i++) {
            recordname = sheet.getText(i, layout.keyColumnIndex).toUpperCase(); //KeyColumnIndex是DFC名称列，是工具输出sheet的第i行的DFC名称; 输出DFC区分大小写，库不区分大小写，故需要转换为大写比较；
            recordInDD =
              handover_record[recordname] == undefined
                ? undefined
                : handover_record[recordname]; //handover_record是处理后的交付表格数据。
            if (recordInDD) {
              if (recordInDD["Handover"]) {
                sheet
                  .getCell(i, sheet.sheetLayout.fieldColumnIndex["Handover"])
                  .text(recordInDD["Handover"]);
              }
            }
          }
          spread.resumePaint();
        }
      }
    });
}

function attachToolbarItemEvents(sheet) {
  // ***** Tab - Common Area *****
  // ***** Import - A2L/HEX *****
  $("#ribbon-btn-import-a2l-hex").click(() => {
    console.log("这里执行了吗");
    ipcRenderer.send("open-a2l", "single");
  });
  // ***** Import - XML *****
  $("#ribbon-btn-import-xml").click(() => {
    ipcRenderer.send("open-files", {
      filters: [
        {
          name: "XML",
          extensions: ["xml"],
        },
      ],
    });
  });
  // ***** Import - DCM *****
  $("#ribbon-btn-import-dcm").click(() => {
    ipcRenderer.send("open-files", {
      multiSelections: true,
      filters: [
        {
          name: "DCM",
          extensions: ["dcm", "txt"],
        },
      ],
    });
  });
  // ***** Import - EXCEL *****
  $("#ribbon-btn-import-excel").click(() => {
    $("#input-file-excel").click();
  });
  $("#input-file-excel").change(function (e) {
    const file = this.files[0];
    excelIO.open(
      file,
      function (json) {
        //spread.fromJSON(json);
        //console.log(json);
        let listFile;
        // if(file.name.match(/DSM Lib/)){
        listFile = excelToDFCTable(json);
        // }
        // else if(file.name.match(/扫描工具/)){
        //listFile = excelToscantool(json);
        // }
        // else if(file.name.match(/DINH/)){
        // listFile = excelToDINHTable(json);
        //console.log('DINH table is: ',listFile);
        // }

        //console.log(listOfDFCTable);
        const id =
          "dataset-" + performance.now().toString(16).replace(".", "z");
        addToDatasetsPanel(
          $("#datasets-panel-excel-list"),
          id,
          file.name,
          "",
          "white-space:normal;"
        );
        addDataset(id, "EXCEL", file.name, listFile);
        $(e.target).val("");
      },
      function (e) {
        console.log(e);
      }
    );

    function excelToDFCTable(json) {
      try {
        const output = [];
        //let configCheck = {};

        for (const sheetname in json.sheets) {
          let recordTable = [];
          // 注意field的命名统一，例如Class的field name统一为DFESCls
          const fieldIndex = {
            name: -1,
            DTCO: -1,
            FaultTyp: -1,
            descriptionEn: -1,
            descriptionCn: -1,
            CtlMsk: -1,
            DisblMsk: -1,
            DFESCls: -1,
            EnvRef: -1,
            responsible: -1,
            Handover: -1,
            remark: -1,
            label: -1,
            labelprop: -1,
          };
          let recordname,
            nameColumnIndex = -1;

          if (sheetname.match(/Evaluation/i)) continue;

          const sheetData = json.sheets[sheetname].data.dataTable;
          if (!sheetData) continue;
          const rows = Object.keys(sheetData); //sheet按行顺序标号；rows为数组；
          const rowCount = rows.length;

          if (rowCount < 2) {
            //alert('No Lib data Found!');
            continue;
          } //如果sheet解析出的行数小于2行，则认为表格中无数据；

          const checkRow = rowCount > 5 ? 5 : rowCount; //只在sheet的前5行寻找表头”Fault Path“

          let FaultP_rowIndex = -1,
            FaultP_colIndex = -1; //默认没有Fault Path;

          //寻找表头的循环：
          outer: for (let i = 0; i < checkRow; i++) {
            const firstRow = sheetData[rows[i]];
            //const columns = Object.keys(firstRow);
            for (const _c in firstRow) {
              const fieldname =
                firstRow[_c].value != undefined
                  ? firstRow[_c].value
                  : "undefined";

              //if (fieldname == 'undefined') continue;
              if (fieldname == "Fault Path(DFC)") {
                FaultP_rowIndex = i;
                //FaultP_colIndex = _c;
                break outer; //找到Fault Path即跳出整个寻找表头的循环；
              }
            }
            if (FaultP_rowIndex === -1) {
              delete sheetData[rows[i]]; //未找到表头，删除这一行,但剩余行的标号仍然不是0；
              delete rows[i]; //未找到表头，删除这一行标号；
            }
          }

          if (FaultP_rowIndex === -1) {
            //alert('No Lib data Found!');
            continue;
          }

          //找到了Fault Path：
          //rows = Object.keys(rows);
          const firstRow = sheetData[rows[FaultP_rowIndex]]; //FaultP_rowIndex即为Fault Path所在行的标号；
          //console.log(firstRow);
          //const columns = Object.keys(firstRow);

          for (const _c in firstRow) {
            const fieldname =
              firstRow[_c].value != undefined
                ? firstRow[_c].value
                : "undefined";
            if (fieldname.match(/Fault Path\(DFC\)/)) fieldIndex.name = _c;
            else if (fieldname.match(/Pcode/i)) fieldIndex.DTCO = _c;
            else if (fieldname.match(/FTB$/i)) fieldIndex.FaultTyp = _c;
            else if (fieldname.match(/ISO Description/i))
              fieldIndex.descriptionEn = _c;
            else if (fieldname.match(/UAES说明/)) fieldIndex.descriptionCn = _c;
            else if (fieldname.match(/CtlMsk/i)) fieldIndex.CtlMsk = _c;
            else if (fieldname.match(/DisblMsk/i)) fieldIndex.DisblMsk = _c;
            else if (fieldname.match(/负责部门/i)) fieldIndex.responsible = _c;
            else if (fieldname.match(/Class/i)) fieldIndex.DFESCls = _c;
            else if (fieldname.match(/Handover/i)) fieldIndex.Handover = _c;
            else if (fieldname.match(/备注/i)) fieldIndex.remark = _c;
            else if (fieldname.match(/EnvRef/i)) fieldIndex.EnvRef = _c;
            else if (fieldname.match(/平台/i)) fieldIndex.platform = _c;
            else if (fieldname.match(/客户/i)) fieldIndex.customer = _c;
            else if (fieldname.match(/总分/i)) fieldIndex.totlepart = _c;
            else if (fieldname.match(/功能标签$/i)) fieldIndex.label = _c;
            else if (fieldname.match(/功能标签值$/i)) fieldIndex.labelprop = _c;
            else if (fieldname.match(/FTB Description$/i))
              fieldIndex.FTB_Description = _c;
          }

          if (fieldIndex.name === -1) continue;
          //let libCount = 0;

          for (const r of rows) {
            if (r == undefined) continue; //删除Array rows中的元素只是将其变为undefined，其位置仍然存在；
            recordname = sheetData[r][fieldIndex.name]; //recordname是一个object，其value属性值是DFC的名称；
            //console.log(recordname);
            //console.log(typeof(recordname));
            //console.log(r);
            if (recordname.value == undefined) {
              console.log("No DFC Founde in row ", r);
              continue;
            } //某行没有故障路径，跳过该行,并纪录；

            if (recordname.value == "Fault Path(DFC)") continue; //跳过表头行；
            recordname = recordname.value.trim().toUpperCase(); //故障路径名去除前后空格换行等，且库中故障路径名不区分大小写；
            //    recordname = recordname.value.replace(/^DFC_/, '').toUpperCase();

            let libRow = {};
            libRow.name = recordname;

            for (const field in fieldIndex) {
              if (field == "name") continue;

              if (fieldIndex.field != -1) {
                const cell = sheetData[r][fieldIndex[field]];
                libRow[field] =
                  cell != undefined
                    ? cell.value != undefined
                      ? cell.value
                      : ""
                    : ""; //sheetData中cell的value属性值写入变量recordTable;
                libRow[field] = libRow[field].toString().trim(); //去除表格中数据前后的空格及换行符，并变为string格式；
              }

              /*
                            if(field == 'DTCO' || 'FaultTyp' || 'DFESCls' || 'CtlMsk' || 'DisblMsk'){
                                if(libRow[field] != undefined){
                                    libRow[field] = libRow[field].toString().trim(); //去除表格中数据前后的空格及换行符，并变为string格式；
                                }
                            }
                            */

              //表格中三字节一位'x'自动替换为两位‘0x’;
              if (field == "FaultTyp") {
                if (libRow[field] != undefined) {
                  if (libRow[field].toString().length === 1) {
                    libRow[field] = "0" + libRow[field];
                  }
                }
              }
            }

            recordTable.push(libRow); //libRow为从库中获取的一行数据，写入数组recordTable；
          }

          if (Object.keys(recordTable).length > 0) {
            output.push(recordTable);
            return output;
          }
        }
        //let kkkdkd = 'add things';
        if (output.length === 0) alert("No DSM Lib found in input file!");
      } catch (e) {
        console.log(e);
        alert("load file fail! Error: " + e);
      }
    }

    function excelToscantool(json) {
      try {
        const output = [];
        //let configCheck = {};

        for (const sheetname in json.sheets) {
          let recordTable = [];
          // 注意field的命名统一，例如Class的field name统一为DFESCls
          const fieldIndex = {
            name: -1,
            DTCO: -1,
            FaultTyp: -1,
            descriptionEn: -1,
            descriptionCn: -1,
            CtlMsk: -1,
            DisblMsk: -1,
            DFESCls: -1,
            EnvRef: -1,
            responsible: -1,
            Handover: -1,
            remark: -1,
            label: -1,
            labelprop: -1,
          };
          let recordname,
            nameColumnIndex = -1;

          if (sheetname.match(/Evaluation/i)) continue;

          const sheetData = json.sheets[sheetname].data.dataTable;
          if (!sheetData) continue;
          const rows = Object.keys(sheetData); //sheet按行顺序标号；rows为数组；
          const rowCount = rows.length;
          let curveNames = [];
          let curves = {};
          let label = {};

          for (const r of rows) {
            if (sheetData[r][0] === "Curve") {
              curveNames = [];
              for (let i = 1; i < sheetData[r].length; i++) {
                curveNames[i] = sheetData[r][i].value;
                if (
                  sheetData[r][i].value != "配置" &&
                  sheetData[r][i].value != "方案"
                ) {
                  Curves[curveNames[i]] = [];
                }
              }
            }
            if (sheetData[r][0] === "Label") {
              label[sheetData[r][1]] = sheetData[r][2];
            }

            recordTable.push(libRow); //libRow为从库中获取的一行数据，写入数组recordTable；
          }

          if (Object.keys(recordTable).length > 0) {
            output.push(recordTable);
            return output;
          }
        }
        //let kkkdkd = 'add things';
        if (output.length === 0) alert("No DSM Lib found in input file!");
      } catch (e) {
        console.log(e);
        alert("load file fail! Error: " + e);
      }
    }

    function excelToDINHTable(json) {
      try {
        const output = [];
        //let configCheck = {};

        for (const sheetname in json.sheets) {
          let recordTable = {};
          // 注意field的命名统一，例如Class的field name统一为DFESCls
          const fieldIndex = {
            DFCname: -1,
            FIDname: -1,
            LimView: -1,
            label: -1,
            labelprop: -1,
          };
          let recordname,
            nameColumnIndex = -1;

          if (sheetname.match(/Evaluation/i)) continue;

          const sheetData = json.sheets[sheetname].data.dataTable;
          if (!sheetData) continue;
          const rows = Object.keys(sheetData); //sheet按行顺序标号；rows为数组；
          const rowCount = rows.length;

          if (rowCount < 2) {
            //alert('No Lib data Found!');
            continue;
          } //如果sheet解析出的行数小于2行，则认为表格中无数据；

          const checkRow = rowCount > 5 ? 5 : rowCount; //只在sheet的前5行寻找表头”Fault Path“

          let FaultP_rowIndex = -1,
            FaultP_colIndex = -1; //默认没有Fault Path;

          //寻找表头的循环：
          outer: for (let i = 0; i < checkRow; i++) {
            const firstRow = sheetData[rows[i]];
            //const columns = Object.keys(firstRow);
            for (const _c in firstRow) {
              const fieldname =
                firstRow[_c].value != undefined
                  ? firstRow[_c].value
                  : "undefined";

              //if (fieldname == 'undefined') continue;
              if (fieldname == "LimView") {
                FaultP_rowIndex = i;
                //FaultP_colIndex = _c;
                break outer; //找到Fault Path即跳出整个寻找表头的循环；
              }
            }
            if (FaultP_rowIndex === -1) {
              delete sheetData[rows[i]]; //未找到表头，删除这一行,但剩余行的标号仍然不是0；
              delete rows[i]; //未找到表头，删除这一行标号；
            }
          }

          if (FaultP_rowIndex === -1) {
            //alert('No Lib data Found!');
            continue;
          }

          //找到了Fault Path：
          //rows = Object.keys(rows);
          const firstRow = sheetData[rows[FaultP_rowIndex]]; //FaultP_rowIndex即为Fault Path所在行的标号；
          //console.log(firstRow);
          //const columns = Object.keys(firstRow);

          for (const _c in firstRow) {
            const fieldname =
              firstRow[_c].value != undefined
                ? firstRow[_c].value
                : "undefined";
            if (fieldname.match(/DFC name/i)) fieldIndex.DFCname = _c;
            else if (fieldname.match(/FID name/i)) fieldIndex.FIDname = _c;
            else if (fieldname.match(/LimView/i)) fieldIndex.LimView = _c;
            else if (fieldname.match(/功能标签$/)) fieldIndex.label = _c;
            else if (fieldname.match(/功能标签值$/)) fieldIndex.labelprop = _c;
            //else if (fieldname.match(/Fault Description$/i)) fieldIndex.FTB_Description = _c;
          }

          if (fieldIndex.name === -1) continue;
          //let libCount = 0;

          for (const r of rows) {
            if (r == undefined) continue; //删除Array rows中的元素只是将其变为undefined，其位置仍然存在；
            //console.log('Test Point',sheetData[r]);
            recordname = sheetData[r][fieldIndex.DFCname]; //recordname是一个object，其value属性值是DFC的名称；
            //console.log(recordname);
            //console.log(typeof(recordname));
            //console.log(r);
            if (recordname.value == undefined) {
              console.log("No DFC Found in row ", r);
              continue;
            } //某行没有故障路径，跳过该行,并纪录；

            if (recordname.value == "DFC name") continue; //跳过表头行；
            recordname = recordname.value.trim().toUpperCase(); //故障路径名去除前后空格换行等，且库中故障路径名不区分大小写；
            //    recordname = recordname.value.replace(/^DFC_/, '').toUpperCase();

            if (recordTable[recordname] === undefined) {
              recordTable[recordname] = [];
            }

            let libRow = {};
            libRow.name = recordname;

            for (const field in fieldIndex) {
              if (field == "DFCname") continue;

              if (fieldIndex.field != -1) {
                const cell = sheetData[r][fieldIndex[field]];
                libRow[field] =
                  cell != undefined
                    ? cell.value != undefined
                      ? cell.value
                      : ""
                    : ""; //sheetData中cell的value属性值写入变量recordTable;
                libRow[field] = libRow[field].toString().trim(); //去除表格中数据前后的空格及换行符，并变为string格式；

                if (field === "FIDname") {
                  libRow[field] =
                    cell != undefined
                      ? cell.value != undefined
                        ? cell.value
                        : "FId_Unknown"
                      : "FId_Unknown";
                  libRow[field] = libRow[field].trim();
                  //recordTable[recordname]["FIDname"].push(libRow[field]);
                } else if (field === "LimView") {
                  libRow[field] =
                    cell != undefined
                      ? cell.value != undefined
                        ? cell.value
                        : "noLimit"
                      : "noLimit";
                  libRow[field] = libRow[field].trim();
                  //recordTable[recordname]["LimView"].push(libRow[field]);
                }
              }
            }

            recordTable[recordname].push({
              FIDname: libRow["FIDname"],
              LimView: libRow["LimView"],
            });

            //recordTable[recordname].sort(function(a,b){return a.FIDname>b.FIDname;});
            //console.log(libRow);

            //recordTable.push(libRow); //libRow为从库中获取的一行数据，写入数组recordTable；
          }

          for (const key in recordTable) {
            let temp = recordTable[key];
            recordTable[key].sort(function (a, b) {
              let aa = a.FIDname.length,
                bb = b.FIDname.length;
              let cc = aa < bb ? aa : bb;
              let dd = 0;
              for (let i = 0; i < cc; i++) {
                if (a.FIDname[i] === b.FIDname[i]) continue;
                //console.log('type1: '+(a.FIDname[i] > b.FIDname[i])+'\n');
                dd = a.FIDname[i] > b.FIDname[i] ? 1 : -1;
                return dd;
              }
              //console.log(a.FIDname+':'+b.FIDname+'\n');
              //console.log('type2: '+(aa>bb)+'\n');
              return aa - bb;
            });
          }

          if (Object.keys(recordTable).length > 0) {
            output.push(recordTable);
            return output;
          } //每个符合要求的sheet内容均放入output；
        }
        //let kkkdkd = 'add things';
        if (output.length === 0) alert("No DINH Lib found in input file!");
      } catch (e) {
        console.log(e);
        alert("load file fail! Error: " + e);
      }
    }
  });

  // ***** Panels - Property Panel *****
  $("#ribbon-btn-toggle-sheet-props-panel").click(toggleInspector);
  // ***** Panels - Datasets Panel *****
  $("#ribbon-btn-toggle-datasets-panel").click(toggleDatasetsPanel);
  // ***** Panels - Filter *****
  $("#ribbon-btn-sheet-filter").click(() => {
    updateFilter(spread.getActiveSheet());
  });

  // ***** Remove - active sheet *****
  $("#ribbon-btn-remove-active-sheet").click(removeActiveSheet);
  // ***** Remove - other sheets *****
  $("#ribbon-btn-remove-other-sheets").click(() => {
    if (confirm("Sure to remove other sheets?")) removeOtherSheets();
  });
  // ***** Remove - all sheets *****
  $("#ribbon-btn-remove-all-sheets").click(() => {
    if (confirm("Sure to clear all sheets?")) removeAllSheets();
  });

  // ***** Export - EXCEL *****
  $("#ribbon-btn-export-as-excel").click(exportToExcel);
  // ***** Export - DCM *****
  //$('#ribbon-btn-export-as-dcm').click(exportCurrentSheetToDCM);
  $("#ribbon-btn-export-as-dcm").click(exportCurSheetToDCM);
  // ***** Tab - Common Area - End *********

  // ***** Tab - DSM ***********
  // ***** Action - List *****
  $("#ribbon-btn-action-list").click(listDFCsheet);
  // ***** Action - Compare *****
  $("#ribbon-btn-action-compare").click(() => {
    compare();
  });
  // ***** Action - Copy *****
  $("#ribbon-btn-action-copy").click(() => {
    copyData();
  });
  // ***** Action - List input *****
  $("#ribbon-btn-action-handover").click(listHandover);
  // ***** Action - Set input*****
  $("#ribbon-btn-action-run").click(() => {
    setFaultPath(spread.getActiveSheet());
  });

  // ***** Operation - Open DFC *****
  $("#ribbon-btn-open-fault-path").click(() => {
    openFault(spread.getActiveSheet());
  });
  // ***** Operation - Close DFC *****
  $("#ribbon-btn-close-fault-path").click(() => {
    closeFault(spread.getActiveSheet());
  });

  // ****** Config - DSM lib Config ***********
  $("#ribbon-btn-config-lib").click(() => {
    let testorder = getCorrectLibFromConfigure(AppNS.destinationDataset);
  });
  // ****** Config - EvnRef selected ***********
  $("#ribbon-btn-config-envref").click(() => {
    if ($("#ribbon-btn-config-envref").hasClass("active")) {
      $("#ribbon-btn-config-envref").removeClass("active");
    } else $("#ribbon-btn-config-envref").addClass("active");
  });
  $("#ribbon-btn-output-DTCM").click(() => {
    if ($("#ribbon-btn-output-DTCM").hasClass("active")) {
      $("#ribbon-btn-output-DTCM").removeClass("active");
    } else $("#ribbon-btn-output-DTCM").addClass("active");
  });
  //******* Config - Ctl/Disblmsk removed *******
  $("#ribbon-btn-config-ctldis").click(() => {
    if ($("#ribbon-btn-config-ctldis").hasClass("active")) {
      $("#ribbon-btn-config-ctldis").removeClass("active");
    } else $("#ribbon-btn-config-ctldis").addClass("active");
  });
  // ****** Config - Custom SGM selected *********
  $("#ribbon-btn-config-isSGM").click(() => {
    if ($("#ribbon-btn-config-isSGM").hasClass("active")) {
      $("#ribbon-btn-config-isSGM").removeClass("active");
    } else $("#ribbon-btn-config-isSGM").addClass("active");
  });
  // ****** Config - output DCM partly selected *********
  $("#ribbon-btn-config-partDCM").click(() => {
    if ($("#ribbon-btn-config-partDCM").hasClass("active")) {
      $("#ribbon-btn-config-partDCM").removeClass("active");
    } else $("#ribbon-btn-config-partDCM").addClass("active");
  });
  // ****** Config - DTC List including responsible column selected *******
  $("#ribbon-btn-output-Resp").click(function () {
    if ($("#ribbon-btn-output-Resp").hasClass("active")) {
      $("#ribbon-btn-output-Resp").removeClass("active");
    } else $("#ribbon-btn-output-Resp").addClass("active");
  });

  // ****** Show - DTC Lit ********
  $("#ribbon-btn-add-sheet-of-DTC-list").click(() => {
    let sheet = spread.getActiveSheet(); //导出DTC List的操作仅基于DFC List页面，相关参数均在生成DFC List的时候写入sheet对象中；
    if (!sheet || sheet.type != "DFC List") {
      alert("请先选中故障设置页面再进行导出DTC List操作！");
      return false;
    }
    const is1788 = sheet.name()[4] === "U";
    let sheetname = sheet.name();
    //console.log(sheetname);
    let sheetDFC = {};
    sheetDFC.output = getDFCListFromSheet(sheet);
    sheetDFC.prop = sheet.prop;
    //console.log(sheetDFC);

    const fields_normal = [
      {
        head: "故障路径\r\nFault Path",
        prop: "name",
        width: 180,
        align: 0,
      },
      {
        head: "故障码DTC\r\n(Two Bytes)",
        prop: "DTCO",
        width: 80,
        align: 1,
      },
      {
        head: "故障码DTC\r\n(Fault Byte)",
        prop: "FaultTyp",
        width: 100,
        align: 1,
      },
      {
        head: "ISO Description",
        prop: "descriptionEn",
        width: 420,
        align: 0,
      },
      {
        head: "UAES说明",
        prop: "descriptionCn",
        width: 320,
        align: 0,
      },
      {
        head: "故障类\r\nClass",
        prop: "DFESCls",
        width: 80,
        align: 1,
      },
      {
        head: "MIL",
        prop: "MIL",
        width: 80,
        align: 1,
      },
      {
        head: "SVS",
        prop: "SVS",
        width: 80,
        align: 1,
      },
    ];
    const fields_SGM = [
      {
        head: "故障路径\r\nFault Path",
        prop: "name",
        width: 180,
        align: 0,
      },
      {
        head: "故障码DTC\r\n(Two Bytes)",
        prop: "DTCO",
        width: 80,
        align: 1,
      },
      {
        head: "故障码DTC\r\n(Fault Byte)",
        prop: "FaultTyp",
        width: 100,
        align: 1,
      },
      {
        head: "故障中文描述\r\n(Fault Description)",
        prop: "FTB_Description",
        width: 260,
        align: 0,
      },
      {
        head: "ISO Description",
        prop: "descriptionEn",
        width: 420,
        align: 0,
      },
      {
        head: "UAES说明",
        prop: "descriptionCn",
        width: 320,
        align: 0,
      },
      {
        head: "故障类\r\n(Class)",
        prop: "DFESCls",
        width: 80,
        align: 1,
      },
      {
        head: "MIL",
        prop: "MIL",
        width: 80,
        align: 1,
      },
      {
        head: "SVS",
        prop: "SVS",
        width: 80,
        align: 1,
      },
    ];

    let fields = $("#ribbon-btn-config-isSGM").hasClass("active")
      ? fields_SGM
      : fields_normal;

    if ($("#ribbon-btn-output-Resp").hasClass("active")) {
      fields[fields.length] = {
        head: "负责部门",
        prop: "responsible",
        width: 80,
      };
    }

    let head_title = [
      {
        rowHeight: 50,
        span: [
          {
            startCol: 2,
            colRange: 2,
            text: "UAES",
            font: "bold 26pt Arial",
            align: 1,
          },
          {
            startCol: 4,
            colRange: fields.length - 1, //fields.length - span[0].length(2) + 序号列(1)；
            text: "请输入DTC List名称",
            font: "bold 20pt Arial",
            align: 1,
          },
        ],
      },
    ];

    for (const DFCName in sheetDFC.output) {
      //console.log(DFCName);
      sheetDFC.output[DFCName].MIL = readLamp(
        parseInt(sheetDFC.output[DFCName].DFESCls),
        sheetDFC.prop.srcMILDef,
        is1788,
        DFCName,
        "MIL"
      );
      sheetDFC.output[DFCName].SVS = readLamp(
        parseInt(sheetDFC.output[DFCName].DFESCls),
        sheetDFC.prop.srcSVSDef,
        is1788,
        DFCName,
        "SVS"
      );
      if (sheetDFC.output[DFCName]["DFESCls"] === "0") {
        delete sheetDFC.output[DFCName];
      }
    }

    const DTCListSheet = listDataToNewSheet(
      "DTC List_" + sheetname,
      sheetDFC,
      fields,
      "DTC List",
      head_title
    );

    function readLamp(Cls, Def, is1788 = false, DFCName = "", lampTyp) {
      //let lamp = \u2713;
      //let lampDef = Def[Cls];
      if (lampTyp === "MIL" && Cls === 2) {
        if (is1788 && !DFCName.match(/max/i)) return "\u2713";
        else return "blink or \u2713";
      } else {
        if (Def[Cls].match("NO_")) return "\u2715"; //
        else if (Def[Cls].match("Blinking")) return "blink"; //
        else if (Def[Cls].match("Conti")) return "\u2713"; //
      }
    }
  });
  // ***** Show - XML-export *****
  $("#ribbon-btn-show-dsm-xml").click(() => {
    const xml = AppNS.sourceDataset;
    if (!xml.data || xml.type != "XML") return;
    const xmlSheetDef = {
      "LONG-NAME": {
        alias: "Description",
        columnWidth: 180,
      },
      "LONG-NAME-GERMAN": {
        alias: "Description in German",
        columnWidth: 0,
      },
      "SHORT-NAME": {
        alias: "Name",
        columnWidth: 180,
      },
    };

    const tttset = xml.data.getScantool();
    //console.log(xml.data);
    //console.log(tttset);
    //console.log(tttset.)

    const DFC_FID = {};
    const FID_DFC = {};

    const DFCS = xml.data.DSMNodeToObj(xml.data.xml.querySelector("DSM-DFCS"))[
      "DSM-DFCS"
    ];
    const FIDS = xml.data.DSMNodeToObj(xml.data.xml.querySelector("DSM-FIDS"))[
      "DSM-FIDS"
    ];

    for (const [i, item] of DFCS.entries()) {
      const theDFC = item["DSM-DFC"];
      DFC_FID[theDFC["SHORT-NAME"]] = {
        desc: theDFC["LONG-NAME"],
        DINHs: [],
      };

      if (theDFC["DSM-DFC-INHS"] && theDFC["DSM-DFC-INHS"].entries) {
        for (const [j, DINH] of theDFC["DSM-DFC-INHS"].entries()) {
          DFC_FID[theDFC["SHORT-NAME"]]["DINHs"].push({
            FID: DINH["DSM-DFC-INH"],
            LIM: theDFC["DSM-DFC-INHLIMS"][j]["DSM-DFC-INHLIM"],
            CAT: theDFC["DSM-DFC-INHCATS"][j]["DSM-DFC-INHCAT"],
          });
        }
      } else if (theDFC["DSM-DFC-INHS"]["DSM-DFC-INH"]) {
        DFC_FID[theDFC["SHORT-NAME"]]["DINHs"].push({
          FID: theDFC["DSM-DFC-INHS"]["DSM-DFC-INH"],
          LIM: theDFC["DSM-DFC-INHLIMS"]["DSM-DFC-INHLIM"],
          CAT: theDFC["DSM-DFC-INHCATS"]["DSM-DFC-INHCAT"],
        });
      }
    }

    for (const [i, item] of FIDS.entries()) {
      const theFID = item["DSM-FID"];
      FID_DFC[theFID["SHORT-NAME"]] = {
        desc: theFID["LONG-NAME"],
        DINHSources: [],
      };

      if (
        theFID["DSM-FID-INHSOURCES"] &&
        theFID["DSM-FID-INHSOURCES"].entries
      ) {
        for (const [j, DFC] of theFID["DSM-FID-INHSOURCES"].entries()) {
          const source = DFC["DSM-FID-INHSOURCE"];
          const _s = source.indexOf("(");
          const _DFC = source.substring(0, _s);
          const _LIM = source.substring(_s + 1, source.length - 1);
          FID_DFC[theFID["SHORT-NAME"]]["DINHSources"].push({
            DFC: _DFC,
            CAT: theFID["DSM-FID-INHSOURCECATS"][j]["DSM-FID-INHSOURCECAT"],
            LIM: _LIM,
          });
        }
      } else if (theFID["DSM-FID-INHSOURCES"]["DSM-FID-INHSOURCE"]) {
        const source = theFID["DSM-FID-INHSOURCES"]["DSM-FID-INHSOURCE"];
        if (!source) continue;
        const _s = source.indexOf("(");
        const _DFC = source.substring(0, _s);
        const _LIM = source.substring(_s + 1, source.length - 1);
        FID_DFC[theFID["SHORT-NAME"]]["DINHSources"].push({
          DFC: _DFC,
          CAT: theFID["DSM-FID-INHSOURCECATS"]["DSM-FID-INHSOURCECAT"],
          LIM: _LIM,
        });
      }
    }

    // 如果顺利得到DFC_FID的数据对象的话，则生成相应Sheet
    if (DFC_FID) {
      const sheetname = "<xml>DFC->FID";
      if (spread.getSheetFromName(sheetname))
        spread.removeSheet(spread.getSheetIndex(sheetname));

      const sheet = new GC.Spread.Sheets.Worksheet(sheetname);
      sheet.setRowCount(10000);
      const sheetCount = spread.getSheetCount();
      spread.addSheet(sheetCount, sheet);
      spread.suspendPaint();

      let DFCIndex = 0,
        startRow = 0,
        startColumn = 0;
      // 调整列宽
      sheet.setColumnWidth(startColumn + 0, 80);
      sheet.setColumnWidth(startColumn + 1, 150);
      sheet.setColumnWidth(startColumn + 2, 120);
      sheet.setColumnWidth(startColumn + 3, 120);
      sheet.setColumnWidth(startColumn + 4, 500);
      sheet.setRowHeight(startRow, 24);

      sheet.setValue(startRow, startColumn + 0, "No.");
      sheet.setValue(startRow, startColumn + 1, "FID Name");
      sheet.setValue(startRow, startColumn + 2, "Limit");
      sheet.setValue(startRow, startColumn + 3, "Category");
      sheet.setValue(startRow, startColumn + 4, "Description");

      const titleRange = sheet.getRange(startRow, startColumn, 1, 5);
      titleRange.font("bold 16px Arial");
      titleRange.borderBottom(
        new GC.Spread.Sheets.LineBorder(
          "Black",
          GC.Spread.Sheets.LineStyle.double
        )
      );

      startRow++;

      const DFCS = Object.keys(DFC_FID).sort();

      for (const DFC of DFCS) {
        DFCIndex++;
        const theDFC = DFC_FID[DFC];

        const _cell_1 = sheet.getCell(startRow, startColumn);
        _cell_1.font("14px Consolas");
        _cell_1.foreColor("blue");
        _cell_1.text("DFC Name");

        const _cell_2 = sheet.getCell(startRow, startColumn + 1);
        _cell_2.font("italic 14px Consolas");
        _cell_2.foreColor("blue");
        _cell_2.text(DFC);

        const _cell_3 = sheet.getCell(startRow, startColumn + 4);
        _cell_3.font("italic 14px Consolas");
        _cell_3.foreColor("blue");
        _cell_3.text(theDFC.desc);

        sheet
          .getRange(startRow + 1, startColumn, theDFC.DINHs.length, 5)
          .font("12px Segoe UI");
        sheet
          .getRange(startRow + 1, startColumn, theDFC.DINHs.length, 1)
          .hAlign(GC.Spread.Sheets.HorizontalAlign.center);

        for (const [i, FID] of theDFC.DINHs.entries()) {
          sheet.setValue(startRow + i + 1, startColumn + 0, i + 1);
          sheet.setValue(startRow + i + 1, startColumn + 1, FID.FID);
          sheet.setValue(startRow + i + 1, startColumn + 2, FID.LIM);
          sheet.setValue(startRow + i + 1, startColumn + 3, FID.CAT);
          sheet.setValue(
            startRow + i + 1,
            startColumn + 4,
            FID_DFC[FID.FID] ? FID_DFC[FID.FID].desc : ""
          );
        }

        startRow += theDFC.DINHs.length + 1;
      }

      sheet.setRowCount(startRow);
      spread.resumePaint();
    }

    // 如果顺利得到FID_DFC的数据对象的话，则生成相应Sheet
    if (FID_DFC) {
      const sheetname = "<xml>FID->DFC";
      if (spread.getSheetFromName(sheetname))
        spread.removeSheet(spread.getSheetIndex(sheetname));

      const sheet = new GC.Spread.Sheets.Worksheet(sheetname);
      sheet.setRowCount(10000);
      const sheetCount = spread.getSheetCount();
      spread.addSheet(sheetCount, sheet);
      spread.suspendPaint();

      let FIDIndex = 0,
        startRow = 0,
        startColumn = 0;

      sheet.setColumnWidth(startColumn + 0, 80);
      sheet.setColumnWidth(startColumn + 1, 150);
      sheet.setColumnWidth(startColumn + 2, 120);
      sheet.setColumnWidth(startColumn + 3, 120);
      sheet.setColumnWidth(startColumn + 4, 500);
      sheet.setRowHeight(startRow, 24);

      sheet.setValue(startRow, startColumn + 0, "No.");
      sheet.setValue(startRow, startColumn + 1, "DFC Name");
      sheet.setValue(startRow, startColumn + 2, "Limit");
      sheet.setValue(startRow, startColumn + 3, "Category");
      sheet.setValue(startRow, startColumn + 4, "Description");

      const titleRange = sheet.getRange(startRow, startColumn, 1, 5);
      titleRange.font("bold 16px Arial");
      titleRange.borderBottom(
        new GC.Spread.Sheets.LineBorder(
          "Black",
          GC.Spread.Sheets.LineStyle.double
        )
      );

      startRow++;

      for (const FID in FID_DFC) {
        FIDIndex++;
        const theFID = FID_DFC[FID];

        const _cell_1 = sheet.getCell(startRow, startColumn);
        _cell_1.font("14px Consolas");
        _cell_1.foreColor("blue");
        _cell_1.text("FID Name");

        const _cell_2 = sheet.getCell(startRow, startColumn + 1);
        _cell_2.font("italic 14px Consolas");
        _cell_2.foreColor("blue");
        _cell_2.text(FID);

        const _cell_3 = sheet.getCell(startRow, startColumn + 4);
        _cell_3.font("italic 14px Consolas");
        _cell_3.foreColor("blue");
        _cell_3.text(theFID.desc);

        sheet
          .getRange(startRow + 1, startColumn, theFID.DINHSources.length, 5)
          .font("12px Segoe UI");
        sheet
          .getRange(startRow + 1, startColumn, theFID.DINHSources.length, 1)
          .hAlign(GC.Spread.Sheets.HorizontalAlign.center);

        for (const [i, DFC] of theFID.DINHSources.entries()) {
          sheet.setValue(startRow + i + 1, startColumn + 0, i + 1);
          sheet.setValue(startRow + i + 1, startColumn + 1, DFC.DFC);
          sheet.setValue(startRow + i + 1, startColumn + 2, DFC.LIM);
          sheet.setValue(startRow + i + 1, startColumn + 3, DFC.CAT);
          sheet.setValue(
            startRow + i + 1,
            startColumn + 4,
            DFC_FID[DFC.DFC] ? DFC_FID[DFC.DFC].desc : ""
          );
        }

        startRow += theFID.DINHSources.length + 1;
      }
      sheet.setRowCount(startRow);
      spread.resumePaint();
    }

    const rootTagName = "CFGEXP_DSM";
    const rootNode = xml.data.xml.querySelector(rootTagName);

    for (const sheetNode of rootNode.children) {
      if (sheetNode.children.length > 0) {
        const sheetName = sheetNode.nodeName;
        const sheet = addSheet(sheetName);

        const startRow = 0,
          startColumn = 1,
          fields = {};

        let currentRow = startRow;

        spread.suspendPaint();

        if (
          sheetNode.children[0].nodeName ===
          sheetNode.children[sheetNode.children.length - 1].nodeName
        ) {
          // 为数组类型节点，例如DSM-DFCS
          for (let i = 0; i < sheetNode.children.length; i++) {
            const rowNode = sheetNode.children[i];
            let value = "";

            if (i === 0) {
              for (let k = 0; k < rowNode.children.length; k++) {
                const fieldNode = rowNode.children[k];
                const fieldName = fieldNode.nodeName;
                fields[fieldName] = {
                  columnOffset: k,
                  columnWidth: xmlSheetDef[fieldName]
                    ? xmlSheetDef[fieldName].columnWidth
                    : 120,
                };

                if (fieldName === "SHORT-NAME") {
                }

                sheet.setValue(startRow, startColumn + k, fieldNode.nodeName);
                sheet.setColumnWidth(
                  startColumn + k,
                  fields[fieldName]["columnWidth"]
                );
              }
              const titleRange = sheet.getRange(startRow, -1, 1, -1);
              titleRange.font("bold 13px Arial");
              titleRange.borderBottom(
                new GC.Spread.Sheets.LineBorder(
                  "Black",
                  GC.Spread.Sheets.LineStyle.double
                )
              );
              sheet.setRowHeight(startRow, 18);
              currentRow++;
            }

            for (const fieldNode of rowNode.children) {
              if (fieldNode.children.length === 0) {
                value = fieldNode.textContent;
              } else {
                for (let j = 0; j < fieldNode.children.length; j++) {
                  const subNode = fieldNode.children[j];
                  if (j === 0) value = subNode.textContent;
                  else value += "\n" + subNode.textContent;
                }
              }

              if (fields[fieldNode.nodeName]) {
                const columnOffset = fields[fieldNode.nodeName]["columnOffset"];
                sheet.setValue(currentRow, startColumn + columnOffset, value);
              }
            }
            currentRow++;
          }
        } else {
          // 为对象类型节点，例如DSM-ENV-INFO、DSM-INFO
          for (const _f of sheetNode.children) {
            const backColor = currentRow % 2 ? "white" : "#AAA";

            const kCell = sheet.getCell(currentRow, startColumn);
            kCell.text(_f.nodeName);
            kCell.font("bold 13px Arial");

            const vCell = sheet.getCell(currentRow, startColumn + 1);
            vCell.text(_f.textContent);

            sheet.getRange(currentRow, startColumn, 1, 2).backColor(backColor);
            currentRow++;
          }
        }

        spread.resumePaint();
      }
    }

    function addSheet(sheetname, rowCount = 10000, columnCount = 100) {
      if (spread.getSheetFromName(sheetname)) sheetname += "_副本";

      const sheet = new GC.Spread.Sheets.Worksheet(sheetname);
      sheet.setRowCount(rowCount);
      sheet.setColumnCount(columnCount);
      const sheetCount = spread.getSheetCount();
      spread.addSheet(sheetCount, sheet);
      return sheet;
    }
  });
  // ***** Tab - DSM - End *****

  // ***** Tab - scantool *****
  // ***** Show - List *****
  $("#ribbon-btn-add-sheet-of-System-Constant").click(() => {
    const srcDataset = AppNS.sourceDataset;
    // function模块用'funcs'标识，label用所属的function标识；
    const scantoolFuncs = {
      mode1_2: {
        funcs: ["Signals_Std"],
        labels: ["DFES_xAsgnFrzFrSig_CA", "DFES_xAsgnFrzFrDid_CA"],
      },
      mode_DSMRdy: {
        funcs: ["DSMRdy"],
      },
      mode6: {
        funcs: ["DTR"],
      },
      mode9: {
        funcs: ["DIUMPR", "I15031_srv9"],
      },
    };

    /*
        let testFunc = [
                'ASDdc_TrqCalc',
                'TESIGOUT',
                'BBKHAKT',
                'DcmDspUDS_DID',
                'DcmDspUds_Appl',
                'Clth_DD',
                'FanCtl_Spd',
                'EnvT_VDMod',
                'DMDLU'
        ];

        let testData = getFunctionfromSource(srcDataset,testFunc);
        console.log('testData:', testData);
        */

    let scantool_list = {};

    let scantool_data = {};
    let modes = Object.keys(scantoolFuncs);
    for (let mode of modes) {
      scantool_list[mode] = {
        val_blks: [],
        vals: [],
      };

      for (let func of Object.keys(scantoolFuncs[mode])) {
        if (func === "funcs") {
          let output = getFunctionfromSource(
            srcDataset,
            scantoolFuncs[mode][func]
          );

          //console.log(output);
          for (let ele of Object.keys(output.data)) {
            scantool_data[ele] = output.data[ele];
            scantool_list[mode]["val_blks"] = scantool_list[mode][
              "val_blks"
            ].concat(output.data[ele].val_blks);
            scantool_list[mode]["vals"] = scantool_list[mode]["vals"].concat(
              output.data[ele].vals
            );
          }
        } else {
          //console.log(func);
          let output = getLabelsfromSource(
            srcDataset,
            scantoolFuncs[mode][func]
          );
          //console.log(output);
          for (let ele of Object.keys(output.data)) {
            scantool_data[ele] = output.data[ele];
            scantool_list[mode]["val_blks"] = scantool_list[mode][
              "val_blks"
            ].concat(output.data[ele].val_blks);
            scantool_list[mode]["vals"] = scantool_list[mode]["vals"].concat(
              output.data[ele].vals
            );
          }
        }
      }
    }
    //console.log('scantool_List:',scantool_list);

    const field_Head = [
        {
          head: "Type",
          prop: "type",
          width: 80,
        },
      ],
      field_Foot = [
        {
          head: "parameter",
          prop: "labelname",
          width: 120,
        },
        {
          head: "sourceVal",
          prop: "sourceVal",
          width: 120,
        },
        {
          head: "suppVal",
          prop: "suppVal",
          width: 120,
        },
        {
          head: "destVal",
          prop: "destVal",
          width: 120,
        },
        {
          head: "description",
          prop: "description",
          width: 120,
        },
        {
          head: "config",
          prop: "config",
          width: 120,
        },
      ];
    let field_DSMRdy = [
      {
        head: "name",
        prop: "name",
        width: 80,
      },
      {
        head: "source value",
        prop: "value",
        width: 120,
      },
      {
        head: "lib val",
        prop: "value_lib",
        width: 120,
      },
      {
        head: "option",
        prop: "option",
        width: 80,
      },
    ];
    let prop = null;

    const newSheet = addSheet("scantoolTest", 3, 30, true);
    spread.suspendPaint();
    //console.log(scantool_data);
    listLabelsintoSheet(newSheet, scantool_data);
    spread.resumePaint();

    //const testSheet =

    const newListsheet = listDSMRdyintoSheet(
      "DSMRdy_" + srcDataset.name[0],
      scantool_list.mode_DSMRdy,
      field_DSMRdy,
      "scantool",
      prop
    );
    /*
        getScantoolfromSource();
        let testData = getFunctionfromSource(srcDataset,['DIUMPR','DFES','Fan_DD','Fan_Diag','DNWSE','Signals_Std','DTR']);
        console.log(testData);

        let testData_labels = getLabelsfromSource(srcDataset,{'DFES':['DFES_xAsgnFrzFrSig_CA', 'DFES_xAsgnFrzFrDid_CA'],'DTR':['DTR_xAsgnCANRslt_CA','DTR_numCANOBDId_CA']});
        console.log(testData_labels);

        listScantool('scantool_test',srcDataset,field_DSMRdy,'scantool_mode1');
        */

    function listDSMRdyintoSheet(_name, data, fields, _type, _prop) {
      if (spread.getSheetFromName(_name)) {
        console.log(spread.getSheetFromName(_name));
        spread.removeSheet(spread.getSheetIndex(_name));
      }

      let startRow = 2,
        startColumn = 2,
        maxRowCount = 100,
        maxColCount = startColumn + fields.length + 3;

      const sheet = addSheet(_name, maxRowCount, maxColCount, true);
      sheet.type = _type;
      sheet.prop = _prop || null;
      //const sheetCount = spread.getSheetCount();
      //spread.addSheet(sheetCount,sheet);

      const layout = {
        cl: 2,
        cCount: fields.length,
        keyColumnIndex: 3,
        keyFromRow: startRow + 1,
        fieldColumnIndex: {},
      };
      for (const [i, field] of fields.entries()) {
        layout.fieldColumnIndex[field.prop] = layout.keyColumnIndex + i;
      }
      sheet.sheetLayout = layout;
      console.time("draw");
      spread.suspendPaint();

      if (data.val_blks.length > 0) {
        let rowCount = 0;
        for (let i = 0; i < data.val_blks.length; i++) {
          if (i == 0) {
            rowCount = startRow + 1;
            sheet.setValue(startRow, startColumn, "Index");
            for (let [j, field] of fields.entries()) {
              sheet.setValue(startRow, startColumn + j + 1, field.head);
            }
          }
          let currentData = data.val_blks[i];

          sheet.setValue(rowCount, startColumn, "Val_blk");
          sheet.setValue(rowCount, startColumn + 1, currentData.name);
          for (let j = 0; j < currentData.prop.phyDec.length; j++) {
            rowCount += 1;
            sheet.setValue(rowCount, startColumn, j);
            let cell = sheet.getCell(rowCount, startColumn + 1);
            cell.value(currentData.prop.phyDec[j]);
          }
        }
      }

      sheet.getRange(0, 0, 1, maxColCount).backColor("blue");
      sheet.frozenRowCount(startRow);
      sheet.frozenColumnCount(startColumn);
      spread.resumePaint();
      console.timeEnd("draw");
      sheet.getCell(startRow, startColumn);
      return sheet;
    }

    // ************ 此函数定义将getFunction/Labels函数获取的对象按Function列出； *******//
    //************                                      ********************/
    function listLabelsintoSheet(sheet, data) {
      if (sheet) {
        let startRow = 0,
          startColumn = 2,
          indexColumn = 2;
        let funcs = Object.keys(data);
        for (let func of funcs) {
          startRow = sheet.getRowCount();
          sheet.addRows(startRow, 1);
          sheet.setValue(startRow, startColumn, "Function");
          sheet.setValue(startRow, startColumn + 1, data[func].name);
          sheet.setValue(startRow, startColumn + 2, data[func].version);
          startRow += 1;
          if (data[func].maps.length > 0) {
          }
          if (data[func].curves.length > 0) {
          }
          if (data[func].val_blks.length > 0) {
            let val_blks = data[func].val_blks;
            for (let i = 0; i < val_blks.length; i++) {
              sheet.addRows(startRow, 5);
              sheet.setValue(startRow, startColumn, "Val_Blk");
              sheet.setValue(startRow, startColumn + 1, val_blks[i].name);
              sheet.setValue(startRow + 1, startColumn, "Index");
              sheet.setValue(startRow + 2, startColumn, "Source Val");
              sheet.setValue(startRow + 3, startColumn, "Lib_Val");
              sheet.setValue(startRow + 4, startColumn, "Options");

              let val_blk = val_blks[i].prop;
              let val_blk_data = val_blk.phyDec || val_blk.WERT || val_blk.TEXT;
              for (let j = 0; j < val_blk_data.length; j++) {
                sheet.setValue(startRow + 1, startColumn + j + 1, j);
                sheet.setValue(
                  startRow + 2,
                  startColumn + j + 1,
                  val_blk_data[j]
                );
                //sheet.setValue(startRow+3,startColumn+j+1,lib_data[val_blks[i].name][j]);
              }
              startRow += 5;
            }
          }
          if (data[func].vals.length > 0) {
            let vals = data[func].vals;
            let colCount = startColumn;
            sheet.addRows(startRow, 1);
            sheet.setValue(startRow, startColumn, "Vals");
            sheet.setValue(startRow, startColumn + 1, "name");
            sheet.setValue(startRow, startColumn + 2, "Source Val");
            //sheet.setValue(startRow,startColumn+3,'Lib Val');
            startRow += 1;
            for (let i = 0; i < vals.length; i++) {
              let val =
                vals[i].prop.phyDec || vals[i].prop.WERT || vals[i].prop.TEXT;
              sheet.addRows(startRow + i, 1);
              sheet.setValue(startRow + i, startColumn, "Val");
              sheet.setValue(startRow + i, startColumn + 1, vals[i].name);
              sheet.setValue(startRow + i, startColumn + 2, val);
              //startRow+=1;
            }
            startRow += vals.length;
          }
        }
      }
    }
  });

  // ***** Tab - DINH *****
  // ***** Show - DINH *****
  $("#ribbon-btn-action-list-DINH").click(() => {
    const srcDataset = AppNS.sourceDataset;
    if (srcDataset && srcDataset.type === "A2LHEX") {
      let DINH_sourceOut = getDINHTable(srcDataset.data);
      //console.log("DINH_source out: ",DINH_sourceOut);

      let title_DINH = [
        {
          head: "label Name",
          prop: "labelname",
          width: 80,
          align: 0,
        },
        {
          head: "DFC Name",
          prop: "name",
          width: 160,
          align: 0,
        },
        {
          head: "备注",
          prop: "remark",
          width: 80,
          align: 0,
        },
        {
          head: "Compare",
          prop: "Comp_res",
          width: 80,
          align: 1,
        },
        {
          head: "Length",
          prop: "labellength",
          width: 80,
          align: 1,
        },
      ];

      const newListsheet = listDataToNewSheet(
        "DINH_" + srcDataset.name[0],
        DINH_sourceOut,
        title_DINH,
        "DINH List"
      );
      setSheetStyle(newListsheet, title_DINH, 7);

      if (!spread.getActiveSheet().bindCompareHandler) {
        let sheet = newListsheet;
        sheet.bind(spreadNS.Events.EditEnded, function (e, info) {
          info.startRow = info.row;
          info.endRow = info.row;
          //console.log(info);
          compare_DINH(info); //表格上修改完成，则自动对该行进行对比；
          //console.log(info);
        });
      }
    } else {
      alert("Source Dataset中无a2l hex数据！");
    }
  });

  $("#ribbon-btn-action-compare-DINH").click(() => {
    compare_DINH();
  });

  $("#ribbon-btn-action-copy-DINH").click(() => {
    copy_DINH();
  });

  $("#ribbon-btn-action-close-DINH").click(() => {
    close_DINH();
  });

  $("#ribbon-btn-action-output-DINH").click(() => {
    exportCurSheetToDCM();
  });
  // ***** Tab - DINH - End *****

  // **********************************************
  // ***********     Other Actions        *********
  // **********************************************
  // 添加表格
  $("#addtable").click(function () {
    var sheet = spread.getActiveSheet(),
      row = sheet.getActiveRowIndex(),
      column = sheet.getActiveColumnIndex(),
      name = "Table" + tableIndex,
      rowCount = 1,
      colCount = 1;

    tableIndex++;

    var selections = sheet.getSelections();

    if (selections.length > 0) {
      var range = selections[0],
        r = range.row,
        c = range.col;

      (rowCount = range.rowCount), (colCount = range.colCount);

      // update row / column for whole column / row was selected
      if (r >= 0) {
        row = r;
      }
      if (c >= 0) {
        column = c;
      }
    }

    sheet.suspendPaint();
    try {
      // handle exception if the specified range intersect with other table etc.
      sheet.tables.add(
        name,
        row,
        column,
        rowCount,
        colCount,
        spreadNS.Tables.TableThemes.light2
      );
    } catch (e) {
      alert(e.message);
    }
    sheet.resumePaint();

    spread.focus();

    onCellSelected();
  });

  // 添加备注
  $("#addcomment").click(function () {
    var sheet = spread.getActiveSheet(),
      row = sheet.getActiveRowIndex(),
      column = sheet.getActiveColumnIndex(),
      comment;

    sheet.suspendPaint();
    comment = sheet.comments.add(row, column, new Date().toLocaleString());
    sheet.resumePaint();

    comment.commentState(spreadNS.Comments.CommentState.edit);
  });

  //
  $("#addpicture, #doImport").click(function () {
    $("#fileSelector").data("action", this.id);
    $("#fileSelector").click();
  });

  $("#toggleInspector").click(toggleInspector);

  $("#doClear").click(function () {
    var $dropdown = $("#clearActionList"),
      $this = $(this),
      offset = $this.offset();

    $dropdown.css({
      left: offset.left,
      top: offset.top + $this.outerHeight(),
    });
    $dropdown.show();
    processEventListenerHandleClosePopup(true);
  });

  $("#doExport").click(function () {
    var $dropdown = $("#exportActionList"),
      $this = $(this),
      offset = $this.offset();

    $dropdown.css({
      left: offset.left,
      top: offset.top + $this.outerHeight(),
    });
    $dropdown.show();
    processEventListenerHandleClosePopup(true);
  });

  $("#addslicer").click(processAddSlicer);

  const srcDatasetDropPanel = $("#src-dataset-drop-panel")[0];
  const desDatasetDropPanel = $("#des-dataset-drop-panel")[0];
  const handoverDatasetDropPanel = $("#handover-dataset-drop-panel")[0];

  srcDatasetDropPanel.addEventListener("dragover", (event) => {
    event.preventDefault();
  });
  srcDatasetDropPanel.addEventListener("drop", dropSrcDesDropPanel);

  desDatasetDropPanel.addEventListener("dragover", (event) => {
    event.preventDefault();
  });
  desDatasetDropPanel.addEventListener("drop", dropSrcDesDropPanel);

  handoverDatasetDropPanel.addEventListener("dragover", (event) => {
    event.preventDefault();
  });
  handoverDatasetDropPanel.addEventListener("drop", dropSrcDesDropPanel);

  const checkboxTypeBtnIds = [
    "#ribbon-btn-label-dfc-list",
    "#ribbon-btn-label-dsm-scantool",
    "#ribbon-btn-label-power-stage",
  ];
  $(checkboxTypeBtnIds.join(",")).bind("click", function (event) {
    cheboxBoxTypeBtnClickHandler(event, $(this));
  });

  function cheboxBoxTypeBtnClickHandler(event, $btn) {
    if (!$btn.hasClass("disabled")) $btn.toggleClass("active");
  }

  // license
  //const license = require('./scripts/Main_require/license.js');
  //console.log("License is: ",license);
}

function getScantoolfromSource() {
  const srcDataset = AppNS.sourceDataset;
  if (srcDataset && srcDataset.type == "A2LHEX") {
    const scantoolFuncs = {
      mode1: ["Signals_Std"],
      DSMRdy: ["DSMRdy"],
      //'mode2': ['DFES_xAsgnFrzFrSig_C'],
      mode6: ["DTR"],
      mode9: ["DIUMPR", "I15031_srv9"],
    };

    let output = {};
    let mode_names = Object.keys(scantoolFuncs);
    for (let mode of mode_names) {
      output[mode] = {};
      let funcs = scantoolFuncs[mode];
      for (let func of funcs) {
        output[mode][func] = {};
        let func_module = srcDataset.data.FUNCTION[func];
        let func_version = func_module.FUNCTION_VERSION;
        let labelnames = func_module.DEF_CHARACTERISTIC[0].children;
        output[mode][func].version = func_version.substring(
          1,
          func_version.length - 1
        ); //去掉version属性中的引号；
        output[mode][func].name = func;
        for (let label of labelnames) {
          let label_module = srcDataset.data.CHARACTERISTIC[label];
          output[mode][func][label] = {
            charType: label_module.charType,
            name: label_module.name,
            phyDec: label_module.phyDec,
            optionsTable: label_module.optionsTable
              ? label_module.optionsTable
              : undefined,
          };
        }
      }
    }
    //console.log(output);
  }
}

//此函数定义了从A2lHex或DCM中获取指定Functions的相关信息（func:name,version,）的方法
function getFunctionfromSource(_dataset, funcs) {
  //const srcDataset = AppNS.sourceDataset;
  //对_dataset参数的有效性在函数调用前检查；
  let output = {};
  let return_Val = {
    data: output,
    "data-type": _dataset.type,
  };
  if (_dataset.type == "A2LHEX") {
    for (let func of funcs) {
      if (_dataset.data.FUNCTION[func] == undefined) continue;
      output[func] = {};
      let func_module = _dataset.data.FUNCTION[func];
      let labelnames = func_module.DEF_CHARACTERISTIC[0].children;
      output[func] = {
        version: func_module.FUNCTION_VERSION,
        name: func,
        vals: [],
        val_blks: [],
        curves: [],
        maps: [],
      };
      for (let label of labelnames) {
        let label_module = _dataset.data.CHARACTERISTIC[label];
        if (label_module == undefined) continue;
        let label_type = label_module.charType;
        switch (label_type) {
          case "VALUE":
            output[func]["vals"].push({
              name: label_module.name,
              prop: {
                charType: label_module.charType,
                phyDec: label_module.phyDec,
                rawHex: label_module.rawHex,
                optionsTable: label_module.optionsTable
                  ? label_module.optionsTable
                  : undefined,
              },
            });
            break;
          case "VAL_BLK":
            output[func]["val_blks"].push({
              name: label_module.name,
              prop: {
                charType: label_module.charType,
                phyDec: label_module.phyDec,
                rawHex: label_module.rawHex,
                optionsTable: label_module.optionsTable
                  ? label_module.optionsTable
                  : undefined,
              },
            });
            break;
          case "CURVE":
            output[func]["curves"].push({
              name: label_module.name,
              prop: {
                charType: label_module.charType,
                phyDec: label_module.phyDec,
                rawHex: label_module.rawHex,
                optionsTable: label_module.optionsTable
                  ? label_module.optionsTable
                  : undefined,
              },
            });
            break;
          case "MAP":
            output[func]["maps"].push({
              name: label_module.name,
              prop: {
                charType: label_module.charType,
                phyDec: label_module.phyDec,
                rawHex: label_module.rawHex,
                optionsTable: label_module.optionsTable
                  ? label_module.optionsTable
                  : undefined,
              },
            });
            break;
          default:
            break;
        }
      }
    }
  } else if (_dataset.type == "DCM") {
    let DCM_type = [
      //'FUNKTIONEN',                   // funct. definition
      //'VARIANTENKODIERUNG KRITERIUM', // variant coding
      //'MODULKOPF',                    // module header
      "FESTWERT", // parameter
      "FESTWERTEBLOCK", // function array or matrix
      "KENNLINIE", // curve
      "KENNFELD", // MAP
      "GRUPPENKENNFELD", // map with *SSTX and *SSTY
      "GRUPPENKENNLINIE", // curve with *SSTX
      "STUETZSTELLENVERTEILUNG", // *SST no WERT
    ];
    for (let key of DCM_type) {
      let labeldata = _dataset.data[key];
      if (labeldata == undefined) continue;
      let labelnames = Object.keys(labeldata);
      for (let label of labelnames) {
        let func = labeldata[label].FUNKTION;
        if (funcs.indexOf(func) > -1) {
          if (output[func] === undefined) {
            output[func] = {
              name: func,
              version: null,
              vals: [],
              val_blks: [],
              curves: [],
              maps: [],
            };
          }
          switch (key) {
            case "FESTWERT":
              output[func]["vals"].push({
                name: label,
                prop: labeldata[label],
              });
              break;
            case "FESTWERTEBLOCK":
              output[func]["val_blks"].push({
                name: label,
                prop: labeldata[label],
              });
              break;
            case "KENNLINIE":
            case "GRUPPENKENNLINIE":
              output[func]["curves"].push({
                name: label,
                prop: labeldata[label],
              });
              break;
            case "KENNFELD":
            case "GRUPPENKENNFELD":
              output[func]["maps"].push({
                name: label,
                prop: labeldata[label],
              });
              break;
            default:
              break;
          }
        }
      }
    }
    if (_dataset.data["FUNKTIONEN"]) {
      let funcsdata = _dataset.data.FUNKTIONEN.FUNKTIONEN.FKT;
      if (Object.keys(funcsdata).length > 0) {
        for (let i of Object.keys(output)) {
          //console.log(i);
          if (Object.keys(funcsdata).indexOf(i) > -1) {
            output[i].version = funcsdata[i].version;
            output[i].desc = funcsdata[i].desc;
          }
        }
      }
    }
  }
  console.log(output);
  return return_Val;
}

function getLabelsfromSource(_dataset, labels) {
  let output = {};
  let return_Val = {
    data: output,
    "data-type": _dataset.type,
  };
  if (_dataset.type == "A2LHEX") {
    for (let label of labels) {
      if (_dataset.data.CHARACTERISTIC[label] == undefined) continue;
      let label_module = _dataset.data.CHARACTERISTIC[label];
      if (label_module != undefined) {
        let func = label_module.defFunc.name;
        if (!output[func]) {
          output[func] = {
            name: func,
            version: label_module.defFunc.version,
            vals: [],
            curves: [],
            val_blks: [],
            maps: [],
          };
        }
        let label_type = label_module.charType;
        switch (label_type) {
          case "VALUE":
            output[func]["vals"].push({
              name: label_module.name,
              prop: {
                charType: label_module.charType,
                phyDec: label_module.phyDec,
                rawHex: label_module.rawHex,
                optionsTable: label_module.optionsTable
                  ? label_module.optionsTable
                  : undefined,
              },
            });
            break;
          case "VAL_BLK":
            output[func]["val_blks"].push({
              name: label_module.name,
              prop: {
                charType: label_module.charType,
                phyDec: label_module.phyDec,
                rawHex: label_module.rawHex,
                optionsTable: label_module.optionsTable
                  ? label_module.optionsTable
                  : undefined,
              },
            });
            break;
          case "CURVE":
            output[func]["curves"].push({
              name: label_module.name,
              prop: {
                charType: label_module.charType,
                phyDec: label_module.phyDec,
                rawHex: label_module.rawHex,
                optionsTable: label_module.optionsTable
                  ? label_module.optionsTable
                  : undefined,
              },
            });
            break;
          case "MAP":
            output[func]["maps"].push({
              name: label_module.name,
              prop: {
                charType: label_module.charType,
                phyDec: label_module.phyDec,
                rawHex: label_module.rawHex,
                optionsTable: label_module.optionsTable
                  ? label_module.optionsTable
                  : undefined,
              },
            });
            break;
          default:
            break;
        }
      }
    }
  } else if (_dataset.type == "DCM") {
    let DCM_type = [
      //'FUNKTIONEN',                   // funct. definition
      //'VARIANTENKODIERUNG KRITERIUM', // variant coding
      //'MODULKOPF',                    // module header
      "FESTWERT", // parameter
      "FESTWERTEBLOCK", // function array or matrix
      "KENNLINIE", // curve
      "KENNFELD", // MAP
      "GRUPPENKENNFELD", // map with *SSTX and *SSTY
      "GRUPPENKENNLINIE", // curve with *SSTX
      "STUETZSTELLENVERTEILUNG", // *SST no WERT
    ];
    for (let key of DCM_type) {
      if (_dataset[key]) {
        for (let label of labels) {
          if (_dataset[key][label]) {
            let func = _dataset[key][label].FUNKTION;
            let label_data = _dataset[key][label];
            if (output[func] == undefined) {
              output[func] = {
                name: func,
                version:
                  _dataset.FUNKTIONEN &&
                  _dataset.FUNKTIONEN.FUNKTIONEN.FKT[func] &&
                  _dataset.FUNKTIONEN.FUNKTIONEN.FKT[func].version
                    ? _dataset.FUNKTIONEN.FUNKTIONEN.FKT[func].version
                    : null,
                vals: [],
                val_blks: [],
                curves: [],
                maps: [],
              };
            }
            switch (key) {
              case "FESTWERT":
                output[func]["vals"].push({
                  name: label,
                  prop: labeldata[label],
                });
                break;
              case "FESTWERTBLOCK":
                output[func]["val_blks"].push({
                  name: label,
                  prop: labeldata[label],
                });
                break;
              case "KENNLINIE":
              case "GRUPPENKENNLINIE":
                output[func]["curves"].push({
                  name: label,
                  prop: labeldata[label],
                });
                break;
              case "KENNFELD":
              case "GRUPPENKENNFELD":
                output[func]["maps"].push({
                  name: label,
                  prop: labeldata[label],
                });
                break;
              default:
                break;
            }
          }
        }
      }
    }
  }
  return return_Val;
}

function getDefFuncforLabels(data) {
  let labels = Object.keys(data.CHARACTERISTIC);
  let funcs = Object.keys(data.FUNCTION);
  for (let func of funcs) {
    if (data.FUNCTION[func].DEF_CHARACTERISTIC == undefined) continue;
    let func_version = data.FUNCTION[func].FUNCTION_VERSION
      ? data.FUNCTION[func].FUNCTION_VERSION.match(/^\"([\s\S]*)\"$/)[1]
      : null;
    for (let label of data.FUNCTION[func].DEF_CHARACTERISTIC[0].children) {
      if (data.CHARACTERISTIC[label]) {
        data.CHARACTERISTIC[label]["defFunc"] = {
          name: func,
          version: func_version,
        };
      }
    }
  }
}
//ribbon menubar events handlers (end)
function exportCurrentSheetToDCM() {
  const sheet = spread.getActiveSheet();
  const sheetDFC = getDFCListFromSheet(sheet);
  const prop = sheet.prop;
  //console.log(sheetDFC);
  //console.log(prop);
  //const a2l = AppNS.sourceDataset.data;
  //const labelnames_DCM = AppNS.sourceDataset.uniformedDFC.labelnames;
  const out = {};
  if (sheet.type === "DFC List") {
    const layout = sheet.sheetLayout;
    let info = [];
    let selections = sheet.getSelections();
    let partly_ExportDCM_Sel = $("#ribbon-btn-config-partDCM").hasClass(
      "active"
    );
    //console.log(partly_ExportDCM_Sel);

    if (partly_ExportDCM_Sel) {
      for (let i = 0; i < selections.length; i++) {
        info[i] = {
          startRow: selections[i].row,
          endRow: selections[i].row + selections[i].rowCount,
        };
      }
    } else {
      info = [
        {
          startRow: layout.keyFromRow,
          endRow: layout.keyToRow,
        },
      ];
    }

    if (layout) {
      let name,
        key,
        func,
        value,
        keyCol,
        labclass = "WERT";
      for (const j of info) {
        for (let row = j.startRow; row < j.endRow; row++) {
          keyCol = layout.keyColumnIndex;
          name = sheet.getCell(row, keyCol).text(); //Source数据中的故障路径名；
          //const Name = name.toUpperCase(); //转换为全大写，与uniformedDFC对应；
          //const labelnames_of_name = AppNS.sourceDataset.uniformedDFC[name]['labelnames']; //一个具体DFC包含的所有标定量（class,DTCO,FTB,EnvRef,CtlMsk,DisblMsk）
          const labelnames_of_name = sheetDFC[name].labelnames;
          //console.log(labelnames_of_name);
          if (sheet.getRowVisible(row) || partly_ExportDCM_Sel != true) {
            //部分输出DCM时，忽略隐藏的行；全部输出时，不忽略隐藏的行；
            for (const field in layout.fieldColumnIndex) {
              switch (field) {
                case "DTCO":
                  key = labelnames_of_name["DTCO"];
                  value = DSM.calcDTCO(
                    sheet.getCell(row, layout.fieldColumnIndex[field]).text()
                  );
                  func = "DFES";
                  labclass = "WERT";
                  break;
                case "FaultTyp":
                  key = labelnames_of_name["FaultTyp"];
                  value = parseInt(
                    "0x" +
                      sheet.getCell(row, layout.fieldColumnIndex[field]).text()
                  );
                  func = "DFES";
                  labclass = "WERT";
                  break;
                case "DFESCls":
                  key = labelnames_of_name["DFESCls"];
                  value = parseInt(
                    sheet.getCell(row, layout.fieldColumnIndex[field]).value()
                  );
                  func = "DFES";
                  labclass = "WERT";
                  break;
                case "CtlMsk":
                  key = labelnames_of_name["CtlMsk"];
                  value = parseInt(
                    sheet.getCell(row, layout.fieldColumnIndex[field]).value()
                  );
                  func = "DFC";
                  labclass = "WERT";
                  break;
                case "DisblMsk":
                  key = labelnames_of_name["DisblMsk"];
                  value = parseInt(
                    sheet.getCell(row, layout.fieldColumnIndex[field]).value()
                  );
                  func = "DFC";
                  labclass = "WERT";
                  break;
                case "EnvRef":
                  key = labelnames_of_name["EnvRef"];
                  value =
                    '"' +
                    sheet.getCell(row, layout.fieldColumnIndex[field]).value() +
                    '"';
                  func = "DFES";
                  labclass = "TEXT";
              }
              out[key] = {
                value: value,
                belongToFunction: func,
                labelclass: labclass,
              };
            }
          }
        }
      }
    }
    AppNS.readyToWrite = a2l.exportDSMInfoToDCM(out);
    ipcRenderer.send("select-save-dir", {
      filters: [
        {
          name: "DCM",
          extensions: ["dcm"],
        },
      ],
    });
  } else {
    alert("please choose the right sheet to export DCM files!");
  }
}

function getDFCListFromSheet(sheet) {
  //console.log(sheet.type);
  /********不在函数中判断sheet是否DFC List，而是在调函数前先判断sheet type ***********/
  let output = {};
  let layout = sheet.sheetLayout;
  //let rowEnd = sheet.getRowCount();
  //let colEnd = sheet.getColumnCount();
  for (let i = layout.keyFromRow; i < layout.keyToRow; i++) {
    let DFCname = sheet.getCell(i, layout.keyColumnIndex).value();
    output[DFCname] = {};
    output[DFCname]["name"] = DFCname;
    for (let field in layout.fieldColumnIndex) {
      output[DFCname][field] = sheet
        .getCell(i, layout.fieldColumnIndex[field])
        .value();
    }
    if (prop != "" && prop.labelnames != undefined) {
      output[DFCname].labelnames = {};
      for (let labelname in prop.labelnames) {
        output[DFCname].labelnames[labelname] =
          prop.labelnames[labelname].prefix +
          DFCname +
          prop.labelnames[labelname].suffix;
      }
    }
  }
  return output;
}

// *******此部分定义数据处理的公共模块，包括list，compare, copy, exportDCM, etc.  ****************
// ******* common for action list **********

Array.prototype.remove = function (dx) {
  if (isNaN(dx) || dx > this.length) {
    return false;
  }
  for (var i = 0, n = 0; i < this.length; i++) {
    if (this[i] != this[dx]) {
      this[n++] = this[i];
    }
  }
  this.length -= 1;
};

function updateLabelCheckIconState() {
  const d = AppNS.sourceDataset;
  const g = [
    "#ribbon-btn-label-dfc-list",
    "#ribbon-btn-label-dsm-scantool",
    "#ribbon-btn-label-power-stage",
  ];
  if (d) {
    if (d.type === "A2LHEX") $(g.join(",")).removeClass("disabled");
    else if (d.type === "EXCEL") {
      $(g.shift()).removeClass("disabled");
      $(g.join(",")).addClass("disabled");
    }
  } else {
    $(g.join(",")).addClass("disabled");
  }
}

function getRawLibConfig(libDataRaw) {
  if (libDataRaw != undefined && libDataRaw.length != 0) {
    let libData = $.extend(true, [], libDataRaw); //深拷贝，只对拷贝出的libData进行操作，不改变从excel中读取的原始数据，以便重复使用excel原始数据；
    let recordTable = {};
    let configCheck = {};
    let errMessage_2 = "";

    for (let i = 0; i < libData.length; i++) {
      if (libData[i] == undefined || "") continue;
      let recordname = libData[i].name;
      let j = -1;

      if (recordTable[recordname] != undefined) {
        //故障路径已经出现，说明有同名故障路径；
        j = 0;
        let nameMark = "@";

        while (recordTable[recordname + nameMark + j] != undefined) {
          j++;
        }

        if (j === 0) {
          recordTable[recordname]["repeat"] = true; //j===0，第一次发现同名故障路径；将首个被发现的故障路径标记属性"repeated";

          if (recordTable[recordname]["label"] != "") {
            //同名故障路径的label及labelprop写入项目Config数组；
            configCheck[recordTable[recordname]["label"]] =
              configCheck[recordTable[recordname]["label"]] != undefined
                ? configCheck[recordTable[recordname]["label"]]
                : new Array();
            if (
              configCheck[recordTable[recordname]["label"]].indexOf(
                recordTable[recordname]["labelprop"]
              ) === -1
            ) {
              //配置确认选项没有才加入待选项，用于去重；
              configCheck[recordTable[recordname]["label"]].push(
                recordTable[recordname]["labelprop"]
              );
            }
          }
        }

        recordname = recordname + nameMark + j; //同名故障路径用“@+num”进行区分,后续则是对此新项进行配置；
      }
      recordTable[recordname] = libData[i]; //名称区分后加入库；
      if (j > -1) {
        recordTable[recordname]["repeat"] = true; //此时加入的项的属性设置；
        if (recordTable[recordname]["label"] != "") {
          configCheck[recordTable[recordname]["label"]] =
            configCheck[recordTable[recordname]["label"]] != undefined
              ? configCheck[recordTable[recordname]["label"]]
              : new Array();
          if (
            configCheck[recordTable[recordname]["label"]].indexOf(
              recordTable[recordname]["labelprop"]
            ) === -1
          ) {
            //配置确认选项没有才加入待选项，用于去重；
            configCheck[recordTable[recordname]["label"]].push(
              recordTable[recordname]["labelprop"]
            );
          }
        }
      }
      delete recordTable[recordname].name; //删除数组元素的'name'属性，数组库变为结构体；
    }
    for (let i in configCheck) {
      if (configCheck[i] != undefined) {
        configCheck[i].sort(function (a, b) {
          return a > b ? 1 : -1;
        });
      }
    }

    //console.log(recordTable,configCheck);
    return {
      recordTable,
      configCheck,
    };
  }
}

function getCorrectLib(totalLib, proConfigure) {
  //totalLib，根据库处理得到的Lib，同名故障路径用“@+num”区分；proConfigure，用户选择的项目配置；
  var rawTable = totalLib;
  var errMessage = "";
  for (let i in rawTable) {
    if (rawTable[i]["repeat"] === true) {
      //对有重复项的故障路径；
      if (rawTable[i]["label"] != "") {
        //重复项有label属性；
        for (let j in proConfigure) {
          if (rawTable[i]["label"] === j) {
            if (rawTable[i]["labelprop"] === proConfigure[j]) {
              //该项labelprop与用户选择的配置相同；
              let newI = i.split("@")[0]; //去掉添加的"@+num"区分后缀；
              //console.log(newI);

              if (i.split("@")[1] != undefined) {
                //如果这不是第一项，即已经有一个配置项进入了库；
                if (
                  rawTable[newI] != undefined &&
                  rawTable[newI]["labelprop"] === proConfigure[j]
                ) {
                  //如果这个进入的配置项也与用户选择的项目配置一致，说明此配置重复了，则提示错误信息，并将两项均删除；
                  errMessage +=
                    newI +
                    " is repeated with the same label property and ia deleted!\n\r";
                  delete rawTable[newI];
                  delete rawTable[i];
                  break;
                } else {
                  rawTable[newI] = rawTable[i];
                  delete rawTable[i];
                }
              }
              break;
            } else {
              //与用户配置不同，直接删除；
              delete rawTable[i];
              break;
            }
          }
        }
      } else {
        //重复项没有label属性，错误信息提示，并删除该项；
        errMessage +=
          i.split("@")[0] +
          " is repeated without function label and is deleted!\n\r";
        delete rawTable[i];
      }
    }
  }
  //console.log("the following is",rawTable);
  if (errMessage == "") errMessage += "导入成功，当前配置下库中数据OK！";
  alert(errMessage);
  return rawTable;
}

function selCustomAndPlatform(libDataRaw, preConfig) {
  if (libDataRaw.data[0] != undefined && libDataRaw.data[0].length != 0) {
    let libData = $.extend(true, [], libDataRaw.data[0]); //深拷贝，只对拷贝出的libData进行操作，不改变从excel中读取的原始数据，以便重复使用excel原始数据；
    let errMessage_cus = "The following DFCs has no customer messsage: \n\r";
    let errMessage_plat = "The following DFCs has no platform message: \n\r";
    let DFCnames = {
      normal: [],
    };
    DFCnames[preConfig["客户"]] = [];

    for (let i = 0; i < libData.length; i++) {
      if (libData[i].platform != undefined && libData[i].platform != "") {
        //有平台信息，根据选择保留或删除此条DFC；
        if (libData[i].platform != preConfig["平台"]) {
          //平台信息不对，删除此条DFC，后面无需再判断，直接进入下一个DFC；
          libData.splice(i, 1);
          i = i - 1;
          continue;
        }
      } else {
        //无平台信息，写入提示Message，先不删除此项；
        errMessage_plat += libData[i].name + "\n\r";
      }
      //if(libData[i] == undefined) continue; //如果此项已经删除，无需判断客户，继续下一项；

      if (libData[i].customer != undefined && libData[i].customer != "") {
        //有客户信息，根据客户信息选择保留或删除此条DFC；
        if (preConfig["客户"] === "普通") {
          if (libData[i].customer != "普通") {
            libData.splice(i, 1);
            i = i - 1;
          }
        } else {
          if (libData[i].customer == "普通") {
            DFCnames["normal"].push(libData[i].name);
          } else if (libData[i].customer == preConfig["客户"]) {
            DFCnames[preConfig["客户"]].push(libData[i].name);
          } else {
            libData.splice(i, 1);
            i = i - 1;
          }
        }
      } else {
        errMessage_cus += libData[i].name + "\n\r";
      }
    }

    //console.log(DFCnames);
    //console.log(libData);

    if (preConfig["客户"] != "普通") {
      //如果选择标签不是普通，则还需要删除客户为“普通”标签中的重复DFC；
      for (let j = 0; j < libData.length; j++) {
        /*
                if(libData[j] == undefined){                            //对libData中的undefined项先进行删除；
                    libData.splice(j,1);
                    j=j-1;
                    continue;
                }
                */
        if (
          libData[j].customer == "普通" &&
          DFCnames[preConfig["客户"]].indexOf(libData[j].name) != -1
        ) {
          //对客户为“普通”且在所选客户标签中存在的DFC，删除此DFC；
          libData.splice(j, 1);
          j = j - 1;
        }
      }
    }

    //console.log(libData);

    //console.log(libData.length);
    if (
      errMessage_cus != "The following DFCs has no customer messsage: \n\r" ||
      errMessage_plat != "The following DFCs has no platform message: \n\r"
    ) {
      alert(errMessage_cus + "\n\r" + errMessage_plat);
    }

    return libData;
  }
}

function getConfig(selectParam) {
  //createSelections();
  let x = document.querySelectorAll(selectParam);
  let proConfigure = {};
  //console.log(x);
  for (let i = 0; i < x.length; i++) {
    //console.log(x[i].name);
    proConfigure[x[i].name] = x[i].value;
  }
  //console.log(proConfigure);
  return proConfigure;
}

function createSelections(
  config_dad,
  configContent,
  configAfterId,
  config_body,
  configCheck
) {
  /*****************************************************************************************
   *
   *  <config_dad>
   *       <config_head>
   *       </config_head>
   *       <config_body>
   *             <configContent>
   *             </configContent>
   *
   *             <configAfter>
   *             </configAfter>
   *       </config_body>
   * </config_dad>
   *
   *****************************************************************************************/
  let confDIV = document.getElementById(config_dad);
  let configAfter = document.getElementById(configAfterId);
  let confSelections = document.createElement("div");
  confSelections.setAttribute("id", configContent);
  confSelections.setAttribute("class", "proConfig-body-labels");
  document
    .getElementById(config_body)
    .insertBefore(confSelections, configAfter);

  for (let i in configCheck) {
    var br = document.createElement("br");

    var confName = document.createElement("label");
    confName.setAttribute("class", "proConfig-body-labels-label");
    confName.innerHTML = i + "：";
    var conf_Sel = document.createElement("select");
    conf_Sel.setAttribute("id", i);
    conf_Sel.setAttribute("name", i);
    conf_Sel.setAttribute("class", "proConfig-body-labels-select");
    for (let j = 0; j < configCheck[i].length; j++) {
      conf_Sel.options.add(new Option(configCheck[i][j], configCheck[i][j]));
    }
    conf_Sel.options.add(new Option("Not in Lib", "Not in Lib")); //每个选项都增加一个“Not in Lib”选项，用于处理库中配置均不对的情况；
    confSelections.appendChild(confName);
    confSelections.appendChild(conf_Sel);
    confSelections.appendChild(br);
  }
  confDIV.style.display = "block";
}

function getCorrectLibFromConfigure(libData) {
  let customAndPlatformSelection = getCustomAndPlatform(libData);
  createSelections(
    "preConfig",
    "preConfig-content",
    "preConfig-afterConfig",
    "preConfig-body",
    customAndPlatformSelection
  );

  $("#preConfig-confirm").off("click");
  $("#preConfig-cancel").off("click");
  $("#preConfig-confirm").click(function () {
    let preConfig = getConfig("#preConfig select");
    let rawLib_preSel = selCustomAndPlatform(libData, preConfig);
    $("#preConfig-content").remove();
    $("#preConfig").css("display", "none");

    let datafromExcel = getRawLibConfig(rawLib_preSel);
    let rawLib = datafromExcel.recordTable;
    let configCheck = datafromExcel.configCheck;
    //console.log(datafromExcel);
    createSelections(
      "proConfig",
      "proConfig-content",
      "proConfig-afterConfig",
      "proConfig-body",
      configCheck
    );
    let proConfig, correctLib;
    $("#proConfig-confirm").off("click");
    $("#proConfig-cancel").off("click");
    $("#proConfig-confirm").click(function () {
      proConfig = getConfig("#proConfig select");
      correctLib = getCorrectLib(rawLib, proConfig);
      AppNS.destinationDataset.data.correctLib = correctLib;
      $("#proConfig-content").remove();
      $("#proConfig").css("display", "none");
      //console.log(correctLib);
      return correctLib;
    });

    $("#proConfig-cancel").click(function () {
      if (AppNS.destinationDataset.data.correctLib == undefined) {
        alert("数据匹配前必须先选择正确的库！");
        $("#proConfig-content").remove();
        $("#preConfig-content").remove();
        $("#proConfig").css("display", "none");
        getCorrectLibFromConfigure(libData);
      } else {
        $("#proConfig-content").remove();
        $("#proConfig").css("display", "none");
      }
    });
    /*let correctLib = getCorrectLib(rawLib,proConfig);
        AppNS.destinationDataset.data.correctLib = correctLib;
        $("#proConfigContent").remove();
        $("#proConfig").css("display",'none');
        console.log(correctLib);
        */
    //return correctLib;
  });

  $("#preConfig-cancel").click(function () {
    if (AppNS.destinationDataset.data.correctLib == undefined) {
      alert("数据匹配前必须先选择正确的库！");
      $("#preConfig-content").remove();
      getCorrectLibFromConfigure(libData);
    } else {
      $("#preConfig-content").remove();
      $("#preConfig").css("display", "none");
    }
  });
}

function askSaveIfNeed() {
  let exitOrNot = "";
  //dialog.showMessageBox
  const response = dialog.showMessageBox(remote.getCurrentWindow(), {
    message: "Sure to Close the window?",
    type: "question",
    buttons: ["Yes", "No"],
  });
  if (response == 0) exitOrNot = "exit";
  if (response == 1) exitOrNot = "notexit";
  return exitOrNot;
}

function getCustomAndPlatform(libDataRaw) {
  if (libDataRaw.data[0] != undefined && libDataRaw.data[0].length != 0) {
    let libData = libDataRaw.data[0];
    let preCheck = {};
    preCheck["客户"] = new Array();
    preCheck["平台"] = new Array();

    for (let i = 0; i < libData.length; i++) {
      if (
        libData[i].customer != undefined &&
        preCheck["客户"].indexOf(libData[i].customer) === -1
      ) {
        preCheck["客户"].push(libData[i].customer);
      }
      if (
        libData[i].platform != undefined &&
        preCheck["平台"].indexOf(libData[i].platform) === -1
      ) {
        preCheck["平台"].push(libData[i].platform);
      }
    }

    if (preCheck["客户"].indexOf("") != -1) {
      preCheck["客户"].remove(preCheck["客户"].indexOf(""));
    }

    if (preCheck["客户"].indexOf("Default") != -1) {
      preCheck["客户"].remove(preCheck["客户"].indexOf("Default"));
    }

    return preCheck;
  }
}

function getDINHTable(_a2lDataset) {
  const labels = _a2lDataset.CHARACTERISTIC,
    DINHlabelnames = _a2lDataset.FUNCTION.DINH.DEF_CHARACTERISTIC[0].children,
    DFCDSQs_FId = {},
    FId_DFCDSQs = {};
  let DFCDSQname, DINHLimName, FIdname, DINHlabel, DINHLimLabel;
  let maxLen = 0;
  //let prop = {};

  let prefix_FId,
    prefix_Lim,
    suffix = "_CA";

  //console.log(DINHlabelnames);
  for (let labelname of DINHlabelnames) {
    if (labelname.match(/(DINH_FId.D|DINH_FIdView.D)/)) {
      //从DINH_FId.DFC/DSQ获取所有DFC/DSQ；
      if (!prefix_FId) {
        prefix_FId = labelname.split(".")[0] + ".";
        prefix_Lim = prefix_FId.replace("FId", "Lim");
      }

      DFCDSQname = labelname.slice(prefix_FId.length, -3);
      DINHLimName = "DINH_Lim." + DFCDSQname + "_CA";
      DINHlabel = labels[labelname].phyDec;
      DINHLimLabel = labels[DINHLimName].phyDec;
      maxLen = maxLen > DINHlabel.length ? maxLen : DINHlabel.length;

      DFCDSQs_FId[DFCDSQname] = {
        FIdname: DINHlabel,
        FIDLim: DINHLimLabel,
      };

      if (DINHlabel.length > 0) {
        for (let [i, item] of DINHlabel.entries()) {
          if (FId_DFCDSQs[item] === undefined) {
            FId_DFCDSQs[item] = [];
          }
          FId_DFCDSQs[item].push({
            DFCDSQname: DFCDSQname,
            DINHLim: DINHLimLabel[i].slice(1, -1),
          });
        }
      }
    }
  }

  let prop = {
    prefix_FId: prefix_FId,
    prefix_Lim: prefix_Lim,
    suffix: suffix,
  };
  return {
    DFCDSQs_FId,
    FId_DFCDSQs,
    maxLen,
    prop,
  };
}

function listDataToNewSheet(
  _sheetname,
  sourceData,
  fields,
  _sheet_type,
  head_title = []
) {
  const startRow = 2,
    startCol = 2;
  const _output = sourceData.DFCDSQs_FId || sourceData.output; //DINH的输出也应修改为output；

  const names = Object.keys(_output).sort();

  let maxRowCount, maxColCount, frozenColdd;
  //console.log(names);
  if (_sheet_type === "DTC List") {
    //DTC List是否需要在此处区分待考虑，初步判断无需区分；
    maxRowCount = startRow + head_title.length + 1 + names.length + 2; //上边框+表头行+标题行+数据行+下边框；
    maxColCount = startCol + 1 + fields.length + 2; //左边框+序号列+fields列+数据列+右边框；
  } else if (_sheet_type === "DINH List") {
    (maxRowCount = startRow + 1 + names.length * 2 + 2), //上边框+标题行+数据行+下边框；
      (maxColCount = startCol + 1 + fields.length + sourceData.maxLen + 2); //左边框+序号列+fields列+数据列+右边框；
  } else {
    maxRowCount = startRow + head_title.length + 1 + names.length + 2; //上边框+表头行+标题行+数据行+下边框；
    maxColCount = startCol + 1 + fields.length + 2; //左边框+序号列+fields列+数据列+右边框；
  }

  const sheet = addSheet(_sheetname, maxRowCount, maxColCount, true);
  sheet.type = _sheet_type;
  sheet.prop = sourceData.prop || "";
  let layout = {
    cCount: fields.length,
    keyfromCol: startCol + 1, //fields起始列；
    keyColumnIndex: -1, //关键列，一般为label名称列，对应fieldsColumnIndex中的name属性，为输入DCM的label名称所在列；
    keyFromRow: startRow + head_title.length + 1, //数据起始行；
    keyToRow: maxRowCount - 2, //数据结束行；
    datafromCol: -1, //数据起始列，一般仅用于curve型数据；
    fieldColumnIndex: {},
  };

  for (const [i, field] of fields.entries()) {
    layout.fieldColumnIndex[field.prop] = layout.keyfromCol + i;
  }
  layout.keyColumnIndex = layout.fieldColumnIndex.name; //表格关键列：DFC_Name；
  layout.datafromCol = layout.keyfromCol + fields.length;

  sheet.sheetLayout = layout;

  console.time("draw");
  spread.suspendPaint();

  let name,
    FId_name,
    FId_Lim,
    maxDataLen = 0,
    DTC_FauTyp;

  let PCODE_str, errMessage, okMessage, errOrOk;
  let deleteRows = [];

  if (_sheet_type === "DTC List") {
    PCODE_str = {};
    errMessage = "Warning!!!\n\r";
    okMessage = "No Repeat DTC configured, DTC List is valid!";
    errOrOk = 0;
  }

  for (let i = 0; i < names.length; i++) {
    name = names[i];

    if (i === 0) {
      //标题行处理；
      sheet.setValue(layout.keyFromRow - 1, startCol, "Index"); //自动添加Index列；
      for (let [j, ele] of fields.entries()) {
        sheet.setValue(layout.keyFromRow - 1, startCol + 1 + j, ele.head); //标题行；
      }
    }

    if (_sheet_type === "DINH List") {
      FId_name = _output[name].FIdname;
      FId_Lim = _output[name].FIDLim;
      maxDataLen = maxDataLen < FId_name.length ? FId_name.length : maxDataLen;
      /**********每个DFC对应2行数据，一为FId Name;一为FId Lim ***********/
      sheet.setValue(layout.keyFromRow + 2 * i, startCol, 2 * i + 1);
      sheet.setValue(layout.keyFromRow + 2 * i + 1, startCol, 2 * i + 2); //序号列；

      for (let [j, ele] of fields.entries()) {
        //let backColor = ['white','grey'];
        switch (ele.head) {
          case "label Name":
            sheet
              .getCell(layout.keyFromRow + 2 * i, startCol + j + 1)
              .value("FId_Name")
              .backColor("#F5F5F5");
            sheet
              .getCell(layout.keyFromRow + 2 * i + 1, startCol + j + 1)
              .value("FId_Lim");
            break;
          case "DFC Name":
            sheet
              .getCell(layout.keyFromRow + 2 * i, startCol + j + 1)
              .value(name)
              .backColor("#F5F5F5");
            sheet
              .getCell(layout.keyFromRow + 2 * i + 1, startCol + j + 1)
              .value(name);
            break;
          case "Length":
            sheet.setValue(
              layout.keyFromRow + 2 * i,
              startCol + j + 1,
              FId_name.length
            );
            sheet.setValue(
              layout.keyFromRow + 2 * i + 1,
              startCol + j + 1,
              FId_Lim.length
            );
          default:
            break;
        }
      }

      /**************数据列 ******************/
      for (let [j, ele] of FId_name.entries()) {
        sheet.setValue(
          startRow + 2 * i + 1,
          startCol + j + fields.length + 1,
          ele.slice(1, -1)
        );
        sheet.setValue(
          startRow + 2 * i + 2,
          startCol + j + fields.length + 1,
          FId_Lim[j].slice(1, -1)
        );
      }
    } else if (_sheet_type === "DFC List") {
      let data = _output[name];

      sheet.setValue(layout.keyFromRow + i, startCol, i + 1); //序号列；

      /**********数据写入表格 ************/
      for (const [j, ele] of fields.entries()) {
        const cell = sheet.getCell(
          layout.keyFromRow + i,
          layout.keyfromCol + j
        );
        cell.value(data[ele.prop]);
      }
    } else if (_sheet_type === "DTC List") {
      let data = _output[name];
      if (data["DFESCls"] == "0") {
        deleteRows.push(layout.keyFromRow + i); //Class为0的项筛选出来，对应行需要删掉；
        continue;
      }
      DTC_FauTyp = data["DTCO"] + data["FaultTyp"]; //用于检查DTC List数据的重复性；
      if (PCODE_str[DTC_FauTyp] === undefined) {
        PCODE_str[DTC_FauTyp] = [];
      }
      PCODE_str[DTC_FauTyp].push(name); //根据故障码生成数组结构体，key为故障码，value为配为该故障码的DFCname；

      sheet.setValue(layout.keyFromRow + i, startCol, i + 1); //序号列；
      /**********数据写入表格 ************/
      for (const [j, ele] of fields.entries()) {
        const cell = sheet.getCell(
          layout.keyFromRow + i,
          layout.keyfromCol + j
        );
        cell.value(data[ele.prop]);
      }
    }
  }

  if (_sheet_type === "DTC List") {
    for (let r = 0; r < deleteRows.length; r++) {
      let lastBlankRow = deleteRows[deleteRows.length - 1 - r];
      sheet.deleteRows(lastBlankRow, 1); //自后向前，删除Class为0的行；
    }
    for (let i = 0; i < sheet.getRowCount(); i++) {
      sheet.setValue(layout.keyFromRow + i, startCol, i + 1); //对新表格，重新设置序号列；
    }
  }

  setSheetStyle(sheet, fields, head_title);

  /*********DTC List的数据重复性检查及提示 ************/
  if (_sheet_type === "DTC List") {
    let repeat_DFCs = [];
    for (let j in PCODE_str) {
      if (j != "P000000" && PCODE_str[j].length > 1) {
        errOrOk = 1;
        errMessage +=
          "The following DFCs \n\r" +
          PCODE_str[j].sort().join("\n") +
          "\n\r have the same DTC: " +
          j +
          ";\n\r===========================\n\r";
        repeat_DFCs = repeat_DFCs.concat(PCODE_str[j]);
      }
    }
    //console.log(repeat_DFCs);

    for (let k = layout.keyFromRow; k < layout.keyToRow; k++) {
      let DFCName = sheet.getCell(k, layout.keyColumnIndex).text();
      if (repeat_DFCs.indexOf(DFCName) != -1) {
        sheet.getRange(k, startCol, 1, fields.length + 1).backColor("red");
      }
    }
    if (errOrOk === 0) {
      alert(okMessage);
    }
    if (errOrOk === 1) {
      errMessage += "Please check DSM set!";
      alert(errMessage);
    }
  }

  //console.log(maxDataLen);
  spread.resumePaint();
  console.time("draw");

  return sheet;
}

function setSheetStyle(sheet, fields, head_title) {
  const startRow = 2,
    startCol = 2;

  const backColor1 = "#777777",
    backColor2 = "#2e77b7",
    defaultFont = "11pt Calibri",
    defaultWidth = 140;

  let rowCount = sheet.getRowCount();
  let colCount = sheet.getColumnCount();
  let layout = sheet.sheetLayout;

  let frozenRow = layout.keyFromRow; //标题行；
  let frozenCol;

  if (sheet.type === "DINH List")
    frozenCol = layout.datafromCol; //DINH从数据列冻窗格；
  else frozenCol = layout.keyColumnIndex + 1; //其他从DFC name处冻结窗格；

  spread.suspendPaint();

  sheet
    .getRange(0, 0, rowCount, colCount)
    .backColor("white")
    .font(defaultFont)
    .hAlign(0)
    .vAlign(1); //总体设置；

  if (sheet.name().match("DINH")) {
    let backColor3 = ["white", "#FFDEAD"];
    for (let i = layout.keyFromRow; i < layout.keyToRow; i++) {
      sheet
        .getCell(i, layout.fieldColumnIndex.labelname)
        .backColor(backColor3[i % 2]);
      sheet
        .getCell(i, layout.fieldColumnIndex.name)
        .backColor(backColor3[i % 2]);
    }
  }

  /**********四周边框样式设置 ********************/
  sheet.getRange(0, 0, 1, colCount).backColor(backColor1);
  sheet.getRange(0, 0, rowCount, 1).backColor(backColor1);
  sheet.getRange(0, colCount - 1, rowCount, 1).backColor(backColor1);
  sheet.getRange(rowCount - 1, 0, 1, colCount).backColor(backColor1);

  /***********表头格式设置 *****************/
  if (head_title.length > 0) {
    sheet
      .getRange(startRow, startCol, head_title.length, colCount - 4)
      .backColor(backColor2)
      .foreColor("white");
    for (let i = 0; i < head_title.length; i++) {
      sheet.setRowHeight(startRow + i, head_title[i].rowHeight);
      for (let [j, ele] of head_title[i].span.entries()) {
        sheet.addSpan(startRow + i, ele.startCol, 1, ele.colRange);
        sheet
          .getCell(startRow + i, ele.startCol)
          .value(ele.text)
          .font(ele.font)
          .hAlign(ele.align);
      }
    }
  }

  /*************标题行格式设置 ***********/
  sheet
    .getRange(layout.keyFromRow - 1, startCol, 1, colCount - 4)
    .backColor(backColor2)
    .foreColor("white")
    .hAlign(1)
    .wordWrap(true); //表头背景字和文字颜色设置，蓝色背景，白色文字；
  sheet.getRange(layout.keyFromRow - 1, startCol, rowCount - 4, 1).hAlign(1); //序号列格式；

  if (sheet.type === "DTC List") {
    //DTC List的特殊格式设置；
    sheet.setRowHeight(layout.keyFromRow - 1, 35); //标题行行高；
    sheet.setValue(layout.keyFromRow - 1, startCol, "序号\r\nindex");
    sheet
      .getRange(layout.keyFromRow - 1, startCol, 1, colCount - 4)
      .backColor("white")
      .foreColor("black")
      .font("bold 10pt Arial")
      .hAlign(1)
      .wordWrap(true); //背景色，字体，居中，换行；
    sheet
      .getRange(startRow, startCol, rowCount - 4, colCount - 4)
      .setBorder(new spreadNS.LineBorder("black", spreadNS.LineStyle.thin), {
        all: true,
      }); //整个内容区域加边框线；
  }

  //列宽
  sheet.setColumnWidth(0, 10);
  sheet.setColumnWidth(1, 10); //左边框；
  sheet.setColumnWidth(startCol, 40); //序号列；
  sheet.setColumnWidth(colCount - 2, 10);
  sheet.setColumnWidth(colCount - 1, 10); //右边框；
  for (let i = 0; i < fields.length; i++) {
    sheet.setColumnWidth(
      layout.fieldColumnIndex[fields[i].prop],
      fields[i].width
    );
    sheet
      .getRange(
        layout.keyFromRow,
        layout.fieldColumnIndex[fields[i].prop],
        layout.keyToRow - layout.keyFromRow,
        1
      )
      .hAlign(fields[i].align);
  }

  for (let j = startCol + fields.length; j < colCount - 3; j++) {
    sheet.setColumnWidth(j + 1, defaultWidth);
  }

  sheet.frozenRowCount(frozenRow);
  sheet.frozenColumnCount(frozenCol);

  spread.resumePaint();
}

function compare_DINH(info) {
  const sheet = spread.getActiveSheet();
  if (sheet && sheet.name().match(/[DFC_List|scantool|IUPR|pwrstg|DINH]/)) {
    //console.log(sheet.name());
    console.log("compare function run...");
    //console.log(info);
    const sheetname = sheet.name();
    const CompLayout = sheet.sheetLayout;
    const destDataset = AppNS.destinationDataset;
    let dd; //data_in_destination;

    if (destDataset.type === "A2LHEX") {
      if (sheetname.match(/DFC_List/)) dd = DSM.getDFCTable(destDataset.data);
      else if (sheetname.match(/DINH/))
        dd = getDINHTable(destDataset.data).DFCDSQs_FId;
    } else if (destDataset.type === "EXCEL") {
      dd = destDataset.data.correctLib;
    } else if (destDataset.type === "DCM") {
      dd = destDataset.data; //待开发;
    }

    sheet.suspendPaint();
    let checkStartRow, checkEndRow, checkColRange, j;
    if (info) {
      checkStartRow = info.startRow;
      checkEndRow = info.endRow;
    } else {
      checkStartRow = CompLayout.keyFromRow;
      checkEndRow = CompLayout.keyToRow;
      sheet.comments.clear();
    }

    if (sheetname.match(/DFC_List/)) {
    } else if (sheetname.match(/DINH/)) {
      let labelname, labellen, recordname, recordIndd;
      if (destDataset.type === "EXCEL") {
        let fieldsLen = Object.keys(CompLayout.fieldColumnIndex).length;
        for (let i = checkStartRow; i <= checkEndRow; i += 2) {
          //FID_name和FID_LimView各占一行，一起参与一次对比；
          if (i >= CompLayout.keyToRow) continue;
          labelname = sheet.getText(i, CompLayout.fieldColumnIndex.labelname);
          if (labelname == "FId_Lim") {
            i = i - 1; //如果选中的起始行为FId_Lim，则回退一行；
            labelname = sheet.getText(i, CompLayout.fieldColumnIndex.labelname);
          }
          labellen = sheet.getText(i, CompLayout.fieldColumnIndex.labellength); //对应标定量的数据长度；
          let dataStartCol = CompLayout.keyfromCol + fieldsLen; //数据起始列；
          recordname = sheet
            .getText(i, CompLayout.keyColumnIndex)
            .toUpperCase(); //DFC的名称暂不区分大小写；
          recordIndd = dd[recordname];
          let IsEqual_name,
            IsEqual_lim,
            deflen = 0; //deflen是DINH库中定义的数据长度；
          if (recordIndd) deflen = recordIndd.length;
          if (recordIndd && deflen > 0) {
            let FIDname, FIDLim;
            let nameCell, limCell;

            for (const field in CompLayout.fieldColumnIndex) {
              if (field === "remark" || field === "responsible") {
                let j = CompLayout.fieldColumnIndex[field];
                sheet.getCell(i, j).text(recordIndd[field]);
              }
            }
            //数据部分的对比；
            for (let j = 0; j < labellen; j++) {
              nameCell = sheet.getCell(i, j + dataStartCol);
              limCell = sheet.getCell(i + 1, j + dataStartCol);
              FIDname = nameCell.text();
              FIDLim = limCell.text();
              if (j < recordIndd.length) {
                if (FIDname != recordIndd[j]["FIDname"]) {
                  sheet.comments.add(
                    i,
                    j + dataStartCol,
                    "FId_name\n" +
                      destDataset.name +
                      "\n" +
                      recordIndd[j]["FIDname"]
                  );
                  nameCell.foreColor("red");
                  nameCell.backColor("#ffcbc7");
                  IsEqual_name = "Not Equal";
                } else {
                  nameCell.foreColor("green");
                  nameCell.backColor("#e3efda");
                  sheet.comments.remove(i, j + dataStartCol);
                }
                if (FIDLim != recordIndd[j]["LimView"]) {
                  sheet.comments.add(
                    i + 1,
                    j + dataStartCol,
                    "LimView\n" +
                      destDataset.name +
                      "\n" +
                      recordIndd[j]["LimView"]
                  );
                  limCell.foreColor("red");
                  limCell.backColor("#ffcbc7");
                  IsEqual_lim = "Not Equal";
                } else {
                  limCell.foreColor("green");
                  limCell.backColor("#e3efda");
                  sheet.comments.remove(i + 1, j + dataStartCol);
                }
              }
            }
            //当data长度短于库中长度时：
            if (deflen > labellen) {
              IsEqual_name = "Not Equal";
              IsEqual_lim = "Not Equal";
              sheet.comments.add(
                i,
                CompLayout.fieldColumnIndex.labellength,
                "lib-data: " + deflen + "-" + labellen
              );
              sheet.comments.add(
                i + 1,
                CompLayout.fieldColumnIndex.labellength,
                "lib-data: " + deflen + "-" + labellen
              );
              sheet
                .getCell(i, CompLayout.fieldColumnIndex.labellength)
                .foreColor("red")
                .backColor("#ffcbc7"); //数据长度列标红显示；
              sheet
                .getCell(i + 1, CompLayout.fieldColumnIndex.labellength)
                .foreColor("red")
                .backColor("#ffcbc7");
            } else if (deflen <= labellen) {
              //当data长度不短于库中长度时：
              sheet
                .getCell(i, CompLayout.fieldColumnIndex.labellength)
                .foreColor("green")
                .backColor("#e3efda"); //数据长度列正常显示；
              sheet
                .getCell(i + 1, CompLayout.fieldColumnIndex.labellength)
                .foreColor("green")
                .backColor("#e3efda");
              for (let j = deflen; j < labellen; j++) {
                nameCell = sheet.getCell(i, j + dataStartCol);
                limCell = sheet.getCell(i + 1, j + dataStartCol);
                FIDname = nameCell.text();
                FIDLim = limCell.text();
                //FIDname
                if (FIDname === "FId_Unused") {
                  nameCell.foreColor("green");
                  nameCell.backColor("#e3efda");
                  sheet.comments.remove(i, j + dataStartCol);
                } else {
                  sheet.comments.add(
                    i,
                    j + dataStartCol,
                    "FId_name:\nFId_Unused"
                  );
                  nameCell.foreColor("red");
                  nameCell.backColor("#ffcbc7");
                  IsEqual_name = "Not Equal";
                }
                //FIDLim
                if (recordname.match(/DFC_/)) {
                  if (FIDLim === "Def50_Deb100") {
                    limCell.foreColor("green");
                    limCell.backColor("#e3efda");
                    sheet.comments.remove(i + 1, j + dataStartCol);
                  } else {
                    sheet.comments.add(
                      i + 1,
                      j + dataStartCol,
                      "LimView:\nDef50_Deb100"
                    );
                    limCell.foreColor("red");
                    limCell.backColor("#ffcbc7");
                    IsEqual_lim = "Not Equal";
                  }
                }
                if (recordname.match(/DSQ_/)) {
                  if (FIDLim === "Qual_Frozen_8") {
                    limCell.foreColor("green");
                    limCell.backColor("#e3efda");
                    sheet.comments.remove(i + 1, j + dataStartCol);
                  } else {
                    sheet.comments.add(
                      i + 1,
                      j + dataStartCol,
                      "LimView:\nDef50_Deb100"
                    );
                    limCell.foreColor("red");
                    limCell.backColor("#ffcbc7");
                    IsEqual_lim = "Not Equal";
                  }
                }
              }
            }

            if (!IsEqual_name) IsEqual_name = "Equal";
            if (!IsEqual_lim) IsEqual_lim = "Equal";
            let [foreColor, backColor] =
              IsEqual_name === "Not Equal"
                ? ["red", "#ffcbc7"]
                : ["green", "#e3efda"];
            sheet
              .getCell(i, CompLayout.fieldColumnIndex["Comp_res"])
              .text(IsEqual_name)
              .foreColor(foreColor)
              .backColor(backColor);
            [foreColor, backColor] =
              IsEqual_lim === "Not Equal"
                ? ["red", "#ffcbc7"]
                : ["green", "#e3efda"];
            sheet
              .getCell(i + 1, CompLayout.fieldColumnIndex["Comp_res"])
              .text(IsEqual_lim)
              .foreColor(foreColor)
              .backColor(backColor);
          } else {
            sheet
              .getCell(i, CompLayout.fieldColumnIndex.Comp_res)
              .text("Not Found");
            sheet
              .getCell(i + 1, CompLayout.fieldColumnIndex.Comp_res)
              .text("Not Found");
            sheet
              .getRange(
                i,
                CompLayout.fieldColumnIndex.Comp_res,
                2,
                dataStartCol +
                  parseInt(labellen) -
                  CompLayout.fieldColumnIndex.Comp_res
              )
              .backColor("#eeeeee");
          }
        }
      }
    }

    sheet.resumePaint();

    if (!sheet.bindCompareHandler) {
      sheet.bindCompareHandler = true;
    }
  } else alert("no correct sheet selected!");
}

function copy_DINH(infos) {
  const sheet = spread.getActiveSheet();
  const selections = infos || sheet.getSelections();
  const destDataset = AppNS.destinationDataset;
  if (sheet && sheet.name().match(/[DFC_List|scantool|IUPR|pwrstg|DINH]/)) {
    const sheetname = sheet.name();
    const layout = sheet.sheetLayout;
    let dd;
    //获取目标数据（库）；
    if (destDataset.type === "A2LHEX") {
      if (sheetname.match(/DFC_List/)) dd = DSM.getDFCTable(destDataset.data);
      else if (sheetname.match(/DINH/)) dd = getDINHTable(destDataset.data);
    } else if (destDataset.type === "EXCEL") {
      dd = destDataset.data.correctLib;
    } else if (destDataset.type === "DCM") {
      dd = destDataset.data; //待开发;
    }
    //copy
    if (dd) {
      let info = {};
      let cell, recordname, recordIndd, labelname, labellen;
      spread.suspendPaint();
      for (const selection of selections) {
        //支持复选区域操作；
        info.startRow = selection.row;
        info.endRow = selection.row + selection.rowCount;
        info.startCol = selection.col || undefined;
        info.endCol = selection.col + selection.colCount || undefined;

        if (sheetname.match(/DFC_List/)) {
        } else if (sheetname.match(/DINH/)) {
          let startCol = 0,
            endCol = 0;
          for (let i = info.startRow; i < info.endRow; i++) {
            if (
              sheet.getRowVisible(i) &&
              sheet.getText(i, layout.fieldColumnIndex.Comp_res) === "Not Equal"
            ) {
              //仅对可见及对比结果为“Not Equal”的行执行操作；
              labellen = sheet.getText(i, layout.fieldColumnIndex.labellength);
              labellen = parseInt(labellen);
              if (info.startCol === layout.fieldColumnIndex.name) {
                //选中区域首列为DFC name列，则表示对整行进行copy操作；
                startCol = layout.datafromCol;
                endCol = startCol + labellen;
              }
              startCol = Math.max(startCol, layout.datafromCol);
              endCol = Math.min(endCol, layout.datafromCol + labellen);
              recordname = sheet.getText(i, layout.fieldColumnIndex.name);
              if (destDataset.type === "EXCEL")
                recordname = recordname.toUpperCase();
              recordIndd = dd[recordname];
              labelname = sheet.getText(i, layout.fieldColumnIndex.labelname);
              //console.log(recordname,recordIndd,labelname);
              for (let j = startCol; j < endCol; j++) {
                cell = sheet.getCell(i, j);
                //console.log(sheet.comments.get(i,j));
                if (sheet.comments.get(i, j)) {
                  if (j - layout.datafromCol < recordIndd.length) {
                    if (labelname === "FId_Name") {
                      cell.value(recordIndd[j - layout.datafromCol].FIDname);
                    } else if (labelname === "FId_Lim") {
                      cell.value(recordIndd[j - layout.datafromCol].LimView);
                    }
                    //console.log("new data is "+cell.value());
                  } else {
                    if (recordname.match(/DFC_/)) {
                      if (labelname === "FId_Name") {
                        cell.value("FId_Unused");
                      } else if (labelname === "FId_Lim") {
                        cell.value("Def50_Deb100");
                      }
                    }
                    if (recordname.match(/DSQ_/)) {
                      if (labelname === "FId_Name") {
                        cell.value("FId_Unused");
                      } else if (labelname === "FId_Lim") {
                        cell.value("Qual_Frozen_8");
                      }
                    }
                  }
                }
              }
            }
          }

          compare_DINH(info);
        }
      }

      spread.resumePaint();
    } else {
      alert("no correct Lib exist!");
    }
  } else {
    alert("Select the correct sheet to do copy action!");
  }
}

function close_DINH(infos) {
  const sheet = spread.getActiveSheet();
  const selections = infos || sheet.getSelections();
  const destDataset = AppNS.destinationDataset;
  if (sheet && sheet.name().match(/[DFC_List|scantool|IUPR|pwrstg|DINH]/)) {
    const sheetname = sheet.name();
    const layout = sheet.sheetLayout;

    //close
    let info = {};
    let cell, recordname, recordIndd, labelname, labellen;
    spread.suspendPaint();
    for (const selection of selections) {
      //支持复选区域操作；
      info.startRow = selection.row;
      info.endRow = selection.row + selection.rowCount;
      info.startCol = selection.col || undefined;
      info.endCol = selection.col + selection.colCount || undefined;

      if (sheetname.match(/DFC_List/)) {
      } else if (sheetname.match(/DINH/)) {
        let startCol = 0,
          endCol = 0;
        for (let i = info.startRow; i < info.endRow; i++) {
          if (sheet.getRowVisible(i)) {
            //仅对可见行执行操作；
            labellen = sheet.getText(i, layout.fieldColumnIndex.labellength);
            labellen = parseInt(labellen);
            if (info.startCol === layout.fieldColumnIndex.name) {
              //选中DFC name列，则表示对整行进行copy操作；
              startCol = layout.datafromCol;
              endCol = startCol + labellen;
            }
            startCol = Math.max(startCol, layout.datafromCol);
            endCol = Math.min(endCol, layout.datafromCol + labellen);
            recordname = sheet.getText(i, layout.fieldColumnIndex.name);
            //if(destDataset.type === 'EXCEL') recordname = recordname.toUpperCase();
            //recordIndd = dd[recordname];
            labelname = sheet.getText(i, layout.fieldColumnIndex.labelname);
            //console.log(recordname,recordIndd,labelname);

            if (labelname === "FId_Name") {
              //FId_Name统一为FId_Unused;
              for (let j = startCol; j < endCol; j++) {
                cell = sheet.getCell(i, j);
                cell.value("FId_Unused");
              }
            } else if (labelname === "FId_Lim") {
              //FId_Lim还需要区分DFC和DSQ；
              if (recordname.match(/DFC_/)) {
                for (let j = startCol; j < endCol; j++) {
                  cell = sheet.getCell(i, j);
                  cell.value("Def50_Deb100");
                }
              }
              if (recordname.match(/DSQ_/)) {
                for (let j = startCol; j < endCol; j++) {
                  cell = sheet.getCell(i, j);
                  cell.value("Qual_Frozen_8");
                }
              }
            }
          }
        }

        compare_DINH(info);
      }
    }

    spread.resumePaint();
  } else {
    alert("Select the correct sheet to do copy action!");
  }
}

function exportCurSheetToDCM() {
  const sheet = spread.getActiveSheet();
  const prop = sheet.prop;
  const layout = sheet.sheetLayout;
  let info = [];
  let partly_ExportDCM_Sel = $("#ribbon-btn-config-partDCM").hasClass("active");
  let selections = sheet.getSelections();
  let out = {};

  if (partly_ExportDCM_Sel) {
    for (let i = 0; i < selections.length; i++) {
      info[i] = {
        startRow: selections[i].row,
        endRow: selections[i].row + selections[i].rowCount,
      };
    }
  } else {
    info = [
      {
        startRow: layout.keyFromRow,
        endRow: layout.keyToRow,
      },
    ];
  }
  //console.log('info: ',info);

  if (layout) {
    let key, len, func, value, keyCol, labclass;
    //console.log('node1..');
    if (sheet.type === "DFC List") {
      out.type = "DSM";
      out.data = {};
      let dataColumn = [
        "CtlMsk",
        "DisblMsk",
        "DFESCls",
        "DTCO",
        "FaultTyp",
        "EnvRef",
      ];
      for (const j of info) {
        for (let row = j.startRow; row < j.endRow; row++) {
          if (sheet.getRowVisible(row) || partly_ExportDCM_Sel != true) {
            let name = sheet.getValue(row, layout.keyColumnIndex);
            for (const field of dataColumn) {
              /*
                            switch(field) {
                                case 'DTCO':
                                    key = prop.labelnames.DTCO.prefix + name + prop.labelnames.DTCO.suffix;
                                    value = DSM.calcDTCO(sheet.getValue(row,layout.fieldColumnIndex[field]));
                                    func = 'DFES';
                                    labclass = 'WERT';
                                    break;
                                case 'FaultTyp':
                                    key = prop.labelnames.FaultTyp.prefix + name + prop.labelnames.FaultTyp.suffix;
                                    value = parseInt('0x'+sheet.getValue(row,layout.fieldColumnIndex[field]));
                                    func = 'DFES';
                                    labclass = 'WERT';
                                    break;
                                case 'DFESCls':
                                    key = prop.labelnames.DFESCls.prefix + name + prop.labelnames.DFESCls.suffix;
                                    value = parseInt(sheet.getValue(row,layout.fieldColumnIndex[field]));
                                    func = 'DFES';
                                    labclass = 'WERT';
                                    break;
                                case 'CltMsk':
                                    key = prop.labelnames.CtlMsk.prefix + name + prop.labelnames.CtlMsk.suffix;
                                    value = parseInt(sheet.getValue(row,layout.fieldColumnIndex[field]));
                                    func = 'DFC';
                                    labclass = 'WERT';
                                    break;
                                case 'DisblMsk':
                                    key = prop.labelnames.DisblMsk.prefix + name + prop.labelnames.DisblMsk.suffix;
                                    value = parseInt(sheet.getValue(row,layout.fieldColumnIndex[field]));
                                    func = 'DFC';
                                    labclass = 'WERT';
                                    break;
                                case 'EnvRef':
                                    key = prop.labelnames.EnvRef.prefix + name + prop.labelnames.EnvRef.suffix;
                                    value = '"'+sheet.getValue(row, layout.fieldColumnIndex[field])+'"';
                                    func = 'DFES';
                                    labclass = 'TEXT';
                                    break;
                            }
                            */
              if (layout.fieldColumnIndex[field] != undefined) {
                key =
                  prop.labelnames[field].prefix +
                  name +
                  prop.labelnames[field].suffix;
                if ($.inArray(field, ["CtlMsk", "DisblMsk"]) > -1) {
                  value = parseInt(
                    sheet.getValue(row, layout.fieldColumnIndex[field])
                  );
                  func = "DFC";
                  labclass = "WERT";
                } else {
                  func = "DFES";
                  labclass = "WERT";
                  if (field === "DTCO") {
                    value = DSM.calcDTCO(
                      sheet.getValue(row, layout.fieldColumnIndex[field])
                    );
                  } else if (field === "DFESCls") {
                    value = parseInt(
                      sheet.getValue(row, layout.fieldColumnIndex[field])
                    );
                  } else if (field === "FaultTyp") {
                    value = parseInt(
                      "0x" + sheet.getValue(row, layout.fieldColumnIndex[field])
                    );
                  } else if (field === "EnvRef") {
                    value =
                      '"' +
                      sheet.getValue(row, layout.fieldColumnIndex[field]) +
                      '"';
                    labclass = "TEXT";
                  }
                }
                out.data[key] = {
                  value: value,
                  belongToFunction: func,
                  labelclass: labclass,
                };
              }
            }
          }
        }
      }
    } else if (sheet.type === "DINH List") {
      //console.log('node2..');
      out.type = "DINH";
      out.data = {};
      for (const j of info) {
        for (let row = j.startRow; row < j.endRow; row++) {
          if (sheet.getRowVisible(row) || partly_ExportDCM_Sel != true) {
            let name = sheet.getValue(row, layout.fieldColumnIndex.name);
            //if(name === null) continue; //此处是否需要关闭？有null应让程序报错！
            let labelname = sheet.getValue(
              row,
              layout.fieldColumnIndex.labelname
            );
            let fullname;
            if (labelname == "FId_Name") {
              fullname = prop.prefix_FId + name + prop.suffix;
            } else if (labelname === "FId_Lim") {
              fullname = prop.prefix_Lim + name + prop.suffix;
            }
            //console.log(row,fullname,"node3..");
            key = fullname;
            value = [];
            len = sheet.getValue(row, layout.fieldColumnIndex.labellength);
            for (let k = 0; k < len; k++) {
              value.push(
                '"' + sheet.getValue(row, k + layout.datafromCol) + '"'
              );
            }
            func = "DINH";
            labclass = "TEXT";

            out.data[key] = {
              len: len,
              value: value,
              belongToFunction: func,
              labelclass: labclass,
            };
          }
        }
      }
    } else if (sheet.type === "Scant List") {
      out.type = "Scantool";
    } else {
      alert("Please choose the right sheet to export DCM!");
      return false;
    }

    console.log(out);
    //alert('test succeed!');

    AppNS.readyToWrite = a2l.exportDSMInfoToDCM(out);
    ipcRenderer.send("select-save-dir", {
      filters: [
        {
          name: "DCM",
          extensions: ["dcm"],
        },
      ],
    });
  }
}
