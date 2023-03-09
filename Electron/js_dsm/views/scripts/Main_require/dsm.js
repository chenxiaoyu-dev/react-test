/*
    Attention!
    SC_DFC_CTLDISBLLAYOUT_SY effects on the label of ctlmsk and disblmsk
*/
const DFCNamingRules = {
  DFESCls: [
    {
      prefix: "DFES_Cls.",
      suffix: "_C",
    },
  ],
  DisblMsk: [
    {
      prefix: "DFC_DisblMsk.",
      suffix: "_C",
    },
    {
      prefix: "DFC_DisblMsk2.",
      suffix: "_C",
    },
  ],
  CtlMsk: [
    {
      prefix: "DFC_CtlMsk.",
      suffix: "_C",
    },
    {
      prefix: "DFC_CtlMsk2.",
      suffix: "_C",
    },
  ],
  DTCO: [
    {
      prefix: "DFES_DTCO.",
      suffix: "_C",
    },
  ],
  DTCM: [
    {
      prefix: "DFES_DTCM.",
      suffix: "_C",
    },
  ],
  FaultTyp: [
    {
      prefix: "DFES_FaultTyp.",
      suffix: "_C",
    },
  ],
  EnvRef: [
    {
      prefix: "DFES_EnvRef.",
      suffix: "_C",
    },
  ],
};

function getDFCTable(_a2lDataset) {
  const a = _a2lDataset,
    c = a.CHARACTERISTIC,
    output = {};
  prop = {};
  let record, recordname;
  //   console.log(a);
  prop["labelnames"] = {};
  /************MIL及SVS灯点亮规则的label */
  prop.srcMILDef = c.DFES_xClsFltMIL_CA.phyDec;
  prop.srcSVSDef = c.DFES_xClsFltSVS_CA.phyDec;

  /********根据系统常数选择ctlmsk还是ctlmsk2 */
  let ctlTyp = a.getSC("DFC_CTLDISBLLAYOUT_SY");
  for (let name in DFCNamingRules) {
    if (name != "DisblMsk" && name != "CtlMsk") {
      prop["labelnames"][name] = DFCNamingRules[name][0];
    } else {
      prop["labelnames"][name] =
        ctlTyp === 1 ? DFCNamingRules[name][1] : DFCNamingRules[name][0];
      //console.log(prop);
    }
  }

  for (const rule of DFCNamingRules["DFESCls"]) {
    const DFESClsList = a.getCHAR(new RegExp(rule.prefix));
    if (DFESClsList.length === 0) continue;

    for (const DFESCls of DFESClsList) {
      record = {
        name: "", // true name
        DFESCls: 0,
        DisblMsk: 0,
        CtlMsk: 0,
        DTCO: "P0000",
        FaultTyp: "00",
        EnvRef: "xSet2",
        DTCM: "",
        labelnames: {},
      };

      recordname = DFESCls.name.match(
        new RegExp(rule.prefix + "([\\w]+)" + rule.suffix)
      )[1];
      record.name = recordname;
      console.log(recordname);
      const _disblMsk = getLabelOfDFCRelated(a, recordname, "DisblMsk"),
        _ctlMsk = getLabelOfDFCRelated(a, recordname, "CtlMsk"),
        _DTCO = getLabelOfDFCRelated(a, recordname, "DTCO"),
        _DTCM = getLabelOfDFCRelated(a, recordname, "DTCM"),
        _faultTyp = getLabelOfDFCRelated(a, recordname, "FaultTyp");
      _EnvRef = getLabelOfDFCRelated(a, recordname, "EnvRef");

      //   console.log(_DTCM);

      record.DFESCls = parseInt(DFESCls.phyDec);
      record.DisblMsk = parseInt(_disblMsk.v);
      record.CtlMsk = parseInt(_ctlMsk.v);
      record.DTCO = calcDTCO(parseInt(_DTCO.v));
      if (_DTCM) {
        record.DTCM = parseInt(_DTCM.v);
      }

      //   console.log(record.DTCM);
      record.FaultTyp = calcFaultTyp(parseInt(_faultTyp.v));
      record.EnvRef = _EnvRef.v.slice(1, -1);
      record.labelnames = {
        DFESCls: DFESCls.name,
        DisblMsk: _disblMsk.k,
        CtlMsk: _ctlMsk.k,
        DTCO: _DTCO.k,

        FaultTyp: _faultTyp.k,
        EnvRef: _EnvRef.k,
      };
      if (_DTCM) {
        record.labelnames["DTCM"] = _DTCM.k;
      }

      //recordname      = recordname.toUpperCase();
      output[recordname] = record;
    }

    delete output["DFC_Unused"];
  }
  //console.log(output);
  //console.log(kekeke);
  return { output, prop };
}

function getLabelOfDFCRelated(a2l, _DFCname, _labelname) {
  try {
    const _allChars = a2l.CHARACTERISTIC;
    const _CDLayout = a2l.getSC("DFC_CTLDISBLLAYOUT_SY");

    if (_labelname === "DisblMsk" && _CDLayout === 1) {
      const theChar = _allChars["DFC_DisblMsk2_C"];
      //   console.log(theChar);
      if (theChar)
        return {
          k: "DFC_DisblMsk2_C",
          v: theChar.phyDec,
        };
    }
    console.log(DFCNamingRules[_labelname]);
    for (const rule of DFCNamingRules[_labelname]) {
      const k = rule.prefix + _DFCname + rule.suffix;
      console.log(k);
      console.log(_allChars);
      const theChar = _allChars[k];
      console.log(theChar);
      if (theChar)
        return {
          k: k,
          v: theChar.phyDec,
        };
    }

    return;
  } catch (e) {
    console.log(e);
  }
}

function calcDTCO(int) {
  if (typeof int === "number") {
    // 1234 => PXXXX
    if (int >= 0 && int < 0x10000) {
      const hexStr = (int + 0x10000).toString(16);
      const i = parseInt(hexStr[1], 16);

      if (i <= 0x3) {
        return (
          "P" + (int - 0x0000 + 0x10000).toString(16).substr(1).toUpperCase()
        );
      } else if (i <= 0x7) {
        return (
          "C" + (int - 0x4000 + 0x10000).toString(16).substr(1).toUpperCase()
        );
      } else if (i <= 0xb) {
        return (
          "B" + (int - 0x8000 + 0x10000).toString(16).substr(1).toUpperCase()
        );
      } else {
        return (
          "U" + (int - 0xc000 + 0x10000).toString(16).substr(1).toUpperCase()
        );
      }
    }

    return "-";
  } else if (typeof int === "string") {
    const I = int[0].toUpperCase();
    let k;
    if (I === "P") k = 0;
    else if (I === "C") k = 0x4000;
    else if (I === "B") k = 0x8000;
    else if (I === "U") k = 0xc000;

    return k + parseInt("0x" + int.substr(1));
  }
}

function calcFaultTyp(int) {
  if (int < 0x100 && int >= 0) {
    return (int + 0x100).toString(16).substr(1).toUpperCase();
  } else return "--";
}

function getLabelfromFunction(_a2lDataset, func) {
  const a = _a2lDataset;
  c = a.CHARACTERISTIC;
  d = a.FUNCTION;
  output = {};
  if (func != undefined && func.length > 0) {
    for (let i = 0; i < func.length; i++) {}
  }
}

module.exports = {
  getDFCTable,
  calcDTCO,
  calcFaultTyp,
};
