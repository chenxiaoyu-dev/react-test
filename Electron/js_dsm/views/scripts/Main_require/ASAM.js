/**********************************************************************************
* 使用正则表达式
* CHARACTERISTIC 16000+个结果，16ms
* MEASUREMENT 14000+个结果，12ms
*
*
***********************************************************************************/
class A2L {
	constructor (a2lFilePath) {
	  this.path = a2lFilePath;    
  };

  load (path) {
    path = path || this.path || '';
    if (!path) return;
    const text = require('fs').readFileSync(path, 'utf-8');
    
    if (!text) return;
    const a2l = this;
    const tags = [{
      name: 'CHARACTERISTIC',
      handler: generalHandler,
      definition: {
          '1': 'name',
          '2': 'description',
          '3': 'charType',
          '4': 'address',
          '5': 'recordLayout',
          '6': 'maxDiff',
          '7': 'conversion',
          '8': 'lowerLimit',
          '9': 'upperLimit'
      },
      childDef: [{
          name: 'AXIS_DESCR',
          handler: generalHandler,
          definition: {
              '1': 'axisType',
              '2': 'inputQuantity',
              '3': 'conversion',
              '4': 'maxAxisPoints',
              '5': 'lowerLimit',
              '6': 'upperLimit'
          }
        }]
      },{
        name: 'MEASUREMENT',
        handler: generalHandler,
        definition: {
            '1': 'name',
            '2': 'description',
            '3': 'dataType',
            '4': 'conversion',
            '5': 'resolution',
            '6': 'accuracy',
            '7': 'lowerLimit',
            '8': 'upperLimit'
        }
      },{
        name: 'RECORD_LAYOUT',
        handler: generalHandler,
        definition: {
          '1': 'name'
        }
      },{
        name: 'COMPU_METHOD',
        handler: generalHandler,
        definition: {
            '1': 'name',
            '2': 'description',
            '3': 'conversion',
            '4': 'format',
            '5': 'unit'
        }
      },{
        name: 'COMPU_VTAB',
        handler: generalHandler,
        definition: {
            '1': 'name',
            '2': 'description',
            '3': 'conversion',
            '4': 'count'
            //'5': 'hex2phyDec'
        }
      },{
        name: 'COMPU_TAB',
        handler: generalHandler,
        definition: {
            '1': 'name',
            '2': 'description',
            '3': 'conversion',
            '4': 'count'
        }
      },{
        name: 'FUNCTION',
        handler: generalHandler,
        definition: {
          '1': 'name',
          '2': 'description'
        },
        childDef: [{
          name: 'DEF_CHARACTERISTIC',
          handler: labelsHandler
        },{
          name: 'IN_MEASUREMENT',
          handler: labelsHandler
        },{
          name: 'OUT_MEASUREMENT',
          handler: labelsHandler
        },{
          name: 'LOC_MEASUREMENT',
          handler: labelsHandler
        }] 
      },{
        name: 'AXIS_PTS',
        handler: generalHandler,
        definition: {
            '1': 'name',
            '2': 'description',
            '3': 'address',
            '4': 'inputQuantity',
            '5': 'recordLayout',
            '6': 'maxDiff',
            '7': 'conversion',
            '8': 'maxAxisPoints',
            '9': 'lowerLimit',
            '10': 'upperLimit'
        }
      },{
        name: 'MOD_COMMON',
        handler: generalHandler,
        definition: {
          '1': 'name',
        }
      },{
        name: 'MOD_PAR',
        handler: generalHandler,
        definition: {
          '1': 'name',
        },
        removes: ['SYSTEM_CONSTANT'],
        childDef: [{
            name: 'MEMORY_SEGMENT',
            handler: doNothing
        }, {
            name: 'CALIBRATION_METHOD',
            handler: doNothing
        }]
      }
    ];

    
    for (const [i, tag] of tags.entries()) {
      a2l[tag.name] = {};
  
      setTimeout(() => {               
        const result = text.match(getRegExpByTag(tag.name));
        if (result) {
          let item = '';
          const n = result.length;
          for (let i = 0; i < n; i++) {
              item = result[i]; 
              if (tag.removes)  tag.removes.map((str) => { item = item.replace(new RegExp(str, 'g'), '')}) 
              tag.handler(a2l[tag.name], tag.name, item, tag.definition, tag.childDef);
          }
        }   
      });
    }


    function getRegExpByTag (tag) {
      return new RegExp('/begin\\s+' + tag + '([\\s\\S]*?)' + '/end\\s+' + tag, 'g');
    };

    function removeBeginAndEnd (text, tag) {
      const reg1 = new RegExp('/begin\\s+' + tag, 'i');
      const reg2 = new RegExp('/end\\s+' + tag, 'i');

      return text.replace(reg1, '').replace(reg2, '');
    }
   
    function generalHandler (obj, tag, text, rowDef, childDef) {
      text = removeBeginAndEnd(text, tag);
      let row, k = 0, record, recordname, spaceIndex, extraFieldname, extraFieldValue, temp = {};  
      
      // 先拣选出已定义的childDef
      if (childDef) {
        for (const def of childDef) {

          temp[def.name] = [];
          text = text.replace(getRegExpByTag(def.name), function (child) {
            child = removeBeginAndEnd(child, def.name).trim();
            temp[def.name][temp[def.name].length] = {};
            def.handler(temp[def.name][temp[def.name].length - 1], def.name, child, def.definition);
            return '';
          });

          if (temp[def.name].length === 0) delete temp[def.name];
          
        }
      }

      // 移除可能存在的未定义的children nodes
      text = text.replace(/\/begin[\s\S]*?\/end\s[\w]+\b/g, '');

      // 根据row definition来拣选
      if (rowDef) {
        if(tag === "COMPU_VTAB"){
          /*********对COMPU_VTAB，需要考虑两种格式，一种用Tab分隔，一种用\r分隔，实际操作时先统一为\r分隔，再统一处理 */
            text = text.trim().split(/\n/);
            let text_head = text.slice(0,4); //前五行为tag中固定内容；
            let text_end  = text.slice(4,text.length).join(" ").trim(); //第六行及之后为hex与phy值的转化关系，先把换行分隔的重新统一为一行；
            text_end  = text_end.replace(/(\")([^\"]+)(\")/g,"$1$2$3\n").trim(); //将转化关系行根据插入换行变为\r分隔；
            text      = text_head.concat(text_end).join("\n"); //前五行与转化关系重新拼接；
        }
        
        record = rowsToObj(text, rowDef); 
        if (rowDef['1'] === 'name') recordname = record.name;
      }
  
      if (recordname === undefined) Object.assign(obj, record);
      else obj[recordname] = Object.assign(record, temp);

      function rowsToObj (text, rowDef) {
        // pure text means without subnodes in it
        const record = {};
        const rows = text.trim().split('\n');
        let k = 0, spaceIndex;
        
        for (let i = 0; i < rows.length; i++) {
            row = rows[i].trim();
            if (row.length === 0) continue;
            else k++;
      
            if (rowDef[k] != undefined) record[rowDef[k]] = row;         
            else {
              spaceIndex = row.search(/\s/); // <-- first blank space
              if (spaceIndex === -1) record[row] = row;
              else {
                  extraFieldname  = row.substr(0, spaceIndex);
                  extraFieldValue = row.substr(spaceIndex).trim();
                  record[extraFieldname] = extraFieldValue; 
              }
            }
        }
      
        return record;
      };
    };

    function functionHandler () {

    };
  
    function labelsHandler (obj, tag, text) {
      text = removeBeginAndEnd(text, tag);

      obj['children'] = text.split(/\s+/);
      
    };

    function doNothing () {};
  };

  getNode (label, rootNode = this) {
    if (!label) return;
    let self = rootNode, RV = null, found = false, i = 0;
    
    (function recursion(obj){
      for (const key in obj){
        if (found) return null;
        else {
          i++ ;

          if (i < Infinity){
            if (key == label) {
              found = true;
              return RV = obj[key];
            } else if (key != 'parent' && typeof(obj[key]) == 'object') {
              recursion(obj[key]);
            }
          } else {
            // too many times of recursion! Stop!
            console.log('Warning: Times of recursion too big! Stopped!')
            return null;
          }
        }

      }
    }).call(null, self);

    return RV;
  };

  getByteOrder () {
    return this.BYTE_ORDER = this.getNode('BYTE_ORDER', this['MOD_COMMON']);
  };

  readCHAR (theCHAR) {
    let returnValue = null;

    const $hex           = this.hexData;
    const $byte_order    = this.BYTE_ORDER || this.getByteOrder();
    const $COMPU_METHOD  = this.COMPU_METHOD;
    const $RECORD_LAYOUT = this.RECORD_LAYOUT;
    const $VTabs         = this.COMPU_VTAB;
    const $Tabs          = this.COMPU_TAB;

    if ($hex && $byte_order){
      if (theCHAR == undefined){ // read all
        let CHARs = this.CHARACTERISTIC;

        if (CHARs){
          for (const name in CHARs){
            if (CHARs[name].phyDec === undefined) read(CHARs[name], this);
          }
          returnValue =  CHARs;
        }
      }
      else{ // read the specific CHARACTERISTIC
        if (theCHAR.constructor.name === 'String') theCHAR = this.getCHAR(theCHAR);
        read(theCHAR, this);
        returnValue =  theCHAR;
      }

      return returnValue;
    }
    return null;

    // sub functions begin
    function splitAddress(address = ''){
      if (address && typeof address === 'string'){
        let len = address.length;
        if (len >= 7 && len <= 10){
          let blockAddr = address.substr(2, len - 6),
              dataAddr  = parseInt('0x' + address.substr(len - 4));

          while (blockAddr.length < 4) {
            blockAddr  = '0' + blockAddr;
          }

          return [blockAddr, dataAddr];
        } else return ['', NaN];
      }
    };

    function getBytes(str){
      if (!str) return;
      else if (str.match('UBYTE')) return [1, false];
      else if (str.match('SBYTE')) return [1, true];
      else if (str.match('UWORD')) return [2, false];
      else if (str.match('SWORD')) return [2, true];
      else if (str.match('ULONG')) return [4, false];
      else if (str.match('SLONG')) return [4, true];
      else if (str.match('A_UINT64')) return [8, false];
      else if (str.match('A_INT64')) return [8, true];
      else if (str.match('FLOAT32_IEEE')) return [4, true];
      else if (str.match('FLOAT64_IEEE')) return [8, true];
    };

    function convertRaw2Phy(rawHex, convObj, format){
      let rawDec   = parseInt(rawHex),
          convType = convObj.conversion,
          coeffs   = '',
          tabRef   = '',
          n;  // 格式化数字时的小数位数
      if (format) {
        const tokens = format.split('.');
        if (tokens.length > 1) n = parseInt(tokens[1]);
      }
      switch (convType) {
        case 'RAT_FUNC':
          coeffs = convObj.COEFFS.split(/\s/);
          if ((coeffs[0] - coeffs[3] * rawDec) === 0){
            return ( (coeffs[5]*rawDec - coeffs[2]) / (coeffs[1] - coeffs[4]*rawDec) ).toFixed(n);
          }
          break;
        case "TAB_VERB":
          tabRef = convObj['COMPU_TAB_REF'];
          if (tabRef){
            return $VTabs[tabRef]['' + rawDec];
          }
          break;
        default: //"TAB_INTP", "TAB_NOINTP"
          tabRef = convObj['COMPU_TAB_REF'];
          if (tabRef){
            return $Tabs[tabRef]['' + rawDec];
          }
          break;
      }

      return NaN;
    };

    // rawHex = "07A3", not "0x07A3"
    function adjustByteOrder(rawHex, byte_order, signed){
      if (rawHex){
        if (rawHex.length % 2 === 0){
          let bytes = rawHex.length / 2,
              newRawHex = '',
              newRawDec = 0;

          if (byte_order === 'MSB_LAST'){
            for (let i=0; i<bytes; i++){
              newRawHex = rawHex.substr(i*2, 2) + newRawHex;
            }
          }

          if (byte_order === 'MSB_FIRST') newRawHex = rawHex;

          newRawDec = parseInt('0x' + newRawHex);

          if (signed && newRawDec.toString(2).length == newRawHex.length*4){
            return newRawDec - (0x01 << (newRawHex.length*4));
          }

          return newRawDec;
        }
      }
    };

    function read(theCHAR, A2L){
      try {
        const address    = theCHAR.address;
        const charType   = theCHAR.charType;
        const format     = theCHAR.FORMAT; // 格式化数字
        const conversion = $COMPU_METHOD[theCHAR.conversion];
        //if (!conversion) {console.log(theCHAR); return null;}
        const unit       = conversion.unit;
        const layout     = $RECORD_LAYOUT[theCHAR.recordLayout];
  
  
        let [blockAddr, dataAddr] = splitAddress(address);
  
        if (blockAddr != undefined && dataAddr != undefined){
          let theDataBlock = $hex.dataBlock[blockAddr],
              offset       = 0,
              rawHex       = '',
              rawHex2      = '',
              rawHex3      = '',

              AXIS_DESCR   = null,

              bytesOfValue = 0,
              ptsOfValue   = 0,
              valueSigned  = false,
  
              bytesOfXPts  = 0,
              XPtsSigned   = false,
              bytesOfXAxis = 0,
              ptsOfXAxis   = 0,
              XAxisSigned  = false,
  
              bytesOfYPts  = 0,
              YPtsSigned   = false,
              bytesOfYAxis = 0,
              ptsOfYAxis   = 0,
              YAxisSigned  = false,
  
              adjustedRawDec  = NaN,
              adjustedRawDec2 = NaN,
              adjustedRawDec3 = NaN;
  
          switch (charType) {
            case 'VALUE':
              offset = dataAddr * 2;
              [bytesOfValue, valueSigned] = getBytes(layout.FNC_VALUES);
              rawHex = theDataBlock.substr(offset, bytesOfValue * 2);
              adjustedRawDec = adjustByteOrder(rawHex, $byte_order, valueSigned);
              theCHAR.rawHex = '0x' + rawHex;
              theCHAR.cvtDec = adjustedRawDec;
              theCHAR.phyDec = convertRaw2Phy(adjustedRawDec, conversion, format);
              theCHAR.byteOffset = dataAddr; // 为写入HEX方便地址查找
              break;
            case "VAL_BLK":
              ptsOfValue = theCHAR.NUMBER;
              offset = dataAddr * 2;
              [bytesOfValue, valueSigned] = getBytes(layout.FNC_VALUES);
              if (ptsOfValue > 0){
                theCHAR.rawHex = [];
                theCHAR.cvtDec = [];
                theCHAR.phyDec = [];
                theCHAR.byteOffset = [];
  
                for (let i = 0; i<ptsOfValue; i++){
                  rawHex = theDataBlock.substr(offset + i * bytesOfValue * 2, bytesOfValue * 2);
                  adjustedRawDec = adjustByteOrder(rawHex, $byte_order, valueSigned);
                  theCHAR.rawHex.push('0x' + rawHex);
                  theCHAR.cvtDec.push(adjustedRawDec);
                  theCHAR.phyDec.push(convertRaw2Phy(adjustedRawDec, conversion, format));
                  theCHAR.byteOffset.push(dataAddr + i * bytesOfValue);
                }
              }
              break;
            case "CURVE":
              AXIS_DESCR = theCHAR.AXIS_DESCR;
              const axisObj = AXIS_DESCR?AXIS_DESCR[0]:null;
              if (axisObj){
                theCHAR.rawHex = {x:[], value:[]};
                theCHAR.cvtDec = {x:[], value:[]};
                theCHAR.phyDec = {x:[], value:[]};
                theCHAR.byteOffset = {x:[], value:[]};
  
                const formatAxis = axisObj.FORMAT;
                const conversionAxis = $COMPU_METHOD[axisObj.conversion];
  
                offset = dataAddr * 2;
  
                ptsOfValue = parseInt(axisObj.maxAxisPoints);
                [bytesOfValue, valueSigned] = getBytes(layout.FNC_VALUES);
                [bytesOfXPts,  XPtsSigned ] = layout.NO_AXIS_PTS_X?getBytes(layout.NO_AXIS_PTS_X):[bytesOfValue, valueSigned];
                [bytesOfXAxis, XAxisSigned] = layout.AXIS_PTS_X?getBytes(layout.AXIS_PTS_X):[bytesOfValue, valueSigned];
  
                for (var i = 0; i < ptsOfValue; i++) {
                  // rawHex : X Axis
                  // rawHex2: Value
                  rawHex = theDataBlock.substr(offset + (i * bytesOfXAxis + bytesOfXPts) * 2, bytesOfXAxis * 2);
                  adjustedRawDec = adjustByteOrder(rawHex, $byte_order, XAxisSigned);
  
                  rawHex2= theDataBlock.substr(offset + (i * bytesOfValue + bytesOfXPts + ptsOfValue * bytesOfXAxis) * 2, bytesOfValue * 2);
                  adjustedRawDec2 = adjustByteOrder(rawHex2, $byte_order, valueSigned);
  
                  theCHAR.rawHex.x.push('0x' + rawHex);
                  theCHAR.rawHex.value.push('0x' + rawHex2);
  
                  theCHAR.cvtDec.x.push(adjustedRawDec);
                  theCHAR.cvtDec.value.push(adjustedRawDec2);
  
                  theCHAR.phyDec.x.push(convertRaw2Phy(adjustedRawDec, conversionAxis, formatAxis));
                  theCHAR.phyDec.value.push(convertRaw2Phy(adjustedRawDec2, conversion, format));
  
                  theCHAR.byteOffset.x.push(dataAddr + bytesOfXPts + i * bytesOfXAxis);
                  theCHAR.byteOffset.value.push(dataAddr + bytesOfXPts + ptsOfValue * bytesOfXAxis + i * bytesOfValue);
                }
              }
              break;
            case "MAP":
              AXIS_DESCR = theCHAR.AXIS_DESCR;
              if (!(AXIS_DESCR && AXIS_DESCR.length === 2)) return;
              const axisObj1 = AXIS_DESCR[0],
                    axisObj2 = AXIS_DESCR[1];
              
              theCHAR.rawHex = {x:[], y:[], value:[]};
              theCHAR.cvtDec = {x:[], y:[], value:[]};
              theCHAR.phyDec = {x:[], y:[], value:[]};
              theCHAR.byteOffset = {x:[], y:[], value:[]};

              const formatAxisX = axisObj1.FORMAT,
                    formatAxisY = axisObj2.FORMAT;
              
              const conversionAxisX = $COMPU_METHOD[axisObj1.conversion],
                    conversionAxisY = $COMPU_METHOD[axisObj2.conversion];

              offset = dataAddr * 2;

              ptsOfXAxis = parseInt(axisObj1.maxAxisPoints);
              ptsOfYAxis = parseInt(axisObj2.maxAxisPoints);
              
              [bytesOfValue, valueSigned] = getBytes(layout.FNC_VALUES);
              [bytesOfXPts,  XPtsSigned ] = getBytes(layout.NO_AXIS_PTS_X)||[bytesOfValue, valueSigned];
              [bytesOfXAxis, XAxisSigned] = getBytes(layout.AXIS_PTS_X)   ||[bytesOfValue, valueSigned];
              [bytesOfYPts,  YPtsSigned ] = getBytes(layout.NO_AXIS_PTS_Y)||[bytesOfXPts,  XPtsSigned ];
              [bytesOfYAxis, YAxisSigned] = getBytes(layout.AXIS_PTS_Y)   ||[bytesOfXPts,  XPtsSigned ];

              // rawHex : X Axis
              // rawHex2: Y Axis
              // rawHex3: Value
              const ptsOfXAxisFromHex = theDataBlock.substr(offset, bytesOfXPts * 2),
                    ptsOfYAxisFromHex = theDataBlock.substr(offset, bytesOfYPts * 2);

              offset += 2* (bytesOfXPts + bytesOfYPts);

              for (let i = 0; i < ptsOfXAxis; i++) {                
                rawHex = theDataBlock.substr(offset, 2 * bytesOfXAxis);
                adjustedRawDec = adjustByteOrder(rawHex, $byte_order, XAxisSigned);

                theCHAR.rawHex.x.push(rawHex);
                theCHAR.cvtDec.x.push(adjustedRawDec);
                theCHAR.phyDec.x.push(convertRaw2Phy(adjustedRawDec, conversionAxisX, formatAxisX));

                offset += 2 * bytesOfXAxis;
              }

              for (let i = 0; i < ptsOfYAxis; i++) {
                rawHex2 = theDataBlock.substr(offset, 2 * bytesOfYAxis);
                adjustedRawDec2 = adjustByteOrder(rawHex2, $byte_order, YAxisSigned);

                theCHAR.rawHex.y.push(rawHex2);
                theCHAR.cvtDec.y.push(adjustedRawDec2);
                theCHAR.phyDec.y.push(convertRaw2Phy(adjustedRawDec2, conversionAxisY, formatAxisY));

                offset += 2 * bytesOfYAxis;
              }

              for (let i = 0; i < ptsOfXAxis; i++) {
                const _temp1 = [], _temp2 = [], _temp3 = [];
                for (let j = 0; j < ptsOfYAxis; j++) {
                  rawHex3 = theDataBlock.substr(offset, 2 * bytesOfValue);
                  adjustedRawDec3 = adjustByteOrder(rawHex3, $byte_order, valueSigned);

                  _temp1.push(rawHex3);
                  _temp2.push(adjustedRawDec3);
                  _temp3.push(convertRaw2Phy(adjustedRawDec3, conversion, format));

                  offset += 2 * bytesOfValue;
                }
                theCHAR.rawHex.value.push(_temp1);
                theCHAR.cvtDec.value.push(_temp2);
                theCHAR.phyDec.value.push(_temp3);
              }
              break;
            default:
          }
  
          theCHAR.unit = unit;
  
          if (conversion.conversion === 'TAB_VERB' ) {
            theCHAR.optionsTable = $VTabs[conversion['COMPU_TAB_REF']];
          } else if (conversion.conversion === 'TAB_INTP' || conversion.conversion === 'TAB_NOINTP') {
            theCHAR.optionsTable = $Tabs[conversion['COMPU_TAB_REF']];
          }
        }
      } catch (e) {
        console.log(theCHAR, e);
      }
      
    }
  };

  getCHAR (exp) {
    let $char = this.CHARACTERISTIC;
    let $mode = '';

    if (typeof(exp) === 'object' && exp.exec) $mode = 'all';
    else if (typeof(exp) === 'string') $mode = 'single';
    else $mode = '';

    if (exp && $char){ // Ready? Go!
      let $char_names = Object.keys($char).sort();

      // str == RegExp object, fetch all matched CHARACTERISTIC
      if ($mode == 'all'){
        let output = [];
        for (const char_name of $char_names){
          if (char_name.match(exp)) output.push($char[char_name]);
        }
        return output;
      }

      // str == some string, fetch the first matched element
      else if ($mode == 'single'){
        for (const char_name of $char_names){
          if (char_name.match(exp)){
            return $char[char_name];
          }
        }
      }
    }
  }

  getSC (name) {
    let out;
    const MOD_PAR = this.MOD_PAR;
    const systemName = Object.keys(MOD_PAR)[0];
    let value = MOD_PAR[systemName]['"' + name + '"'];

    if (typeof value === 'string') {
      if (value[0] === '"' && value[value.length-1] === '"') {
        out = parseInt(value.substr(1, value.length-2));
        return out;
      }
    }

    return NaN;
  }

  getPlatform () {
    const _m = this.path.match(/(\w+)\.a2l$/i);
    const filename = _m && _m[1];
    if (filename) {
      const I = filename[0].toUpperCase();
      switch (I) {
        case 'E': return '17810.1';
        case 'D': return '17810';
        case 'F': return 'UP6 UP6D';
        case 'U': return 'ME1788';
      }
    }
  }

  exportDSMInfoToDCM (out) {
    let objectList = out.data;
    let string = 'KONSERVIERUNG_FORMAT 2.0\r\n';
    const template1 = '\r\nFESTWERT {$label$}' + '\r\n'
      + '\tFUNKTION {$function$}' + '\r\n'
      +'\tEINHEIT_W \"-\"' + '\r\n'
      + '\t{$labclass} {$value$}' + '\r\n'
      + 'END' + '\r\n';
    const template2 = '\r\nFESTWERTEBLOCK {$label%} {$len$}' +'\r\n'
      + '\tFUNKTION {$function$}' + '\r\n'
      + '\tEINHEIT_W \"-\"' + '\r\n'
      + '\t{$labclass$}   {$value$}' + '\r\n'
      + 'END' + '\r\n'; 

    if (objectList && typeof objectList === 'object') {
      for (const name in objectList) {
        let _s;
        if(out.type === 'DSM'){
          _s = template1;
          _s = _s.replace('{$label$}', name)
              .replace('{$function$}', objectList[name].belongToFunction)
              .replace('{$labclass}', objectList[name].labelclass)
              .replace('{$value$}', objectList[name].value);
        }else if(out.type === 'DINH'){
          _s = template2;
          let result = [],j=0, valueArr = [];
          for(let i=0; i<objectList[name].value.length;i+=6){
            result.push(objectList[name].value.slice(i,i+6));
          }
          for(let i=0; i<result.length;i++){
            valueArr.push(result[i].join('   '));
          }
          let _value = valueArr.join('\r\n\t'+objectList[name].labelclass+'   ');
          _s = _s.replace('{$label%}', name)
               .replace('{$len$}', objectList[name].len)
               .replace('{$function$}', objectList[name].belongToFunction)
               .replace('{$labclass$}', objectList[name].labelclass)
               .replace('{$value$}', _value);
        }
        
        string += _s;
      }
    }
    
    return string;
  }

  /*
  exportDSMInfoToDCM (objectList) {
    let string = 'KONSERVIERUNG_FORMAT 2.0\r\n';
    const template1 = '\r\nFESTWERT {$label$}' + '\r\n'
      + '\tFUNKTION {$function$}' + '\r\n'
      +'\tEINHEIT_W \"-\"' + '\r\n'
      + '\t{$labclass} {$value$}' + '\r\n'
      + 'END' + '\r\n'; 

    if (objectList && typeof objectList === 'object') {
      for (const name in objectList) {
        let _s = template1;
        _s = _s.replace('{$label$}', name)
            .replace('{$function$}', objectList[name].belongToFunction)
            .replace('{$labclass}', objectList[name].labelclass)
            .replace('{$value$}', objectList[name].value);
        
        string += _s;
      }
    }
    
    return string;
  }
  */
}

class HEX {
  constructor (hexFilePath) {
    const text = require('fs').readFileSync(hexFilePath, 'utf-8');
    return init(text);

    function init (text) {
      const out = {dataBlock:{}};
      let lines = text.split(/\n/);
      let len = 0, line, dataLine, currentBlock, dataByteCount, blockAddr, type, state = 'idle', nextIsFirstDataLine = false;
      for (const [i, _line_] of lines.entries()){
        line = _line_.trim();
        len = line.length;
        dataByteCount = parseInt(line.substr(1, 2), 16);
        blockAddr = line.substr(3, 4);
        type = line.substr(7, 2);
        dataLine = line.substr(9, len - 11);
  
        if (len == 15) {
          if (type == '04') {
            if (out['dataBlock'][dataLine] == undefined) {
              // 初始化
              out['dataBlock'][dataLine] = '';
              nextIsFirstDataLine = true;
            }
            currentBlock = dataLine;
            state = 'push';
          } else state = 'idle';         
        } else if (state == 'push'){
          if (nextIsFirstDataLine) {
            nextIsFirstDataLine = false;
            for (let i = 0; i < parseInt('0x' + blockAddr); i++) {
              out.dataBlock[currentBlock] += '--';
            }
          }
          out.dataBlock[currentBlock] += dataLine;
        }
      }

      return out;
    }
  }
}

class DCM {
  constructor (dcmFilePath) {
    const text = require('fs').readFileSync(dcmFilePath, 'utf-8');
    return init(text);

    function init (text) {
      const out = {count: 0};
      let cls = 0, key = '', keywordType = '',  valArray, currentNode = out, tokens = [], state = 'idle', element;
      let keywords = {
        element:[
          'FUNKTIONEN',                   // funct. definition
          'VARIANTENKODIERUNG KRITERIUM', // variant coding
          'MODULKOPF',                    // module header
          'FESTWERT',                     // parameter
          'FESTWERTEBLOCK',               // function array or matrix
          'KENNLINIE',                    // curve
          'KENNFELD',                     // MAP
          'GRUPPENKENNFELD',              // map with *SSTX and *SSTY          
          'GRUPPENKENNLINIE',             // curve with *SSTX
          'STUETZSTELLENVERTEILUNG',      // *SST no WERT          
        ],
        value: ['TEXT', 'WERT', 'ST/X', 'ST/Y', 'FKT']
      }
  
      if (text){
        let lines = text.split(/\n/);
        if (lines){
          for (const [i, _line_] of lines.entries()){
            let line = _line_.replace(/(^\s+)|(\s+$)/g, '');
            if (line){
              // real work starts here!
              tokens = line.split(/\s+/);
              if (tokens && tokens.length >= 1){
  
                key = tokens[0].toUpperCase();
                keywordType = getKeywordType(key, keywords);
  
                // case 0: meet a new element, init it!
                if (keywordType == 'element'){
                  out.count = out.count + 1;
                  if (out[key] == undefined) out[key] = {};
                  currentNode = out[key];
                  if(tokens[1]) initElement(key, tokens.slice(1), currentNode);
                  else initElement(key,tokens,currentNode);
                  state = 'read';
  
                // case 1: leave the element
                } else if (key == 'END'){
                  state = 'idle';
                  if(currentNode.type == 'KENNFELD' || currentNode.type == 'GRUPPENKENNFELD'){                    
                    let size_y = currentNode['WERT'].length/currentNode['ST/Y'].length;
                    let result = [];
                    for (let i=0;i<currentNode['WERT'].length;i+=size_y){
                      result.push(currentNode['WERT'].slice(i,i+size_y));
                    }
                    currentNode['WERT'] = result;     
                  }
                  currentNode = out;                  
                }
  
                // case 2: entered a new element, read keyword and value
                else if (state == 'read'){                  
                    switch (keywordType) {
                      case 'value':                        
                        if (currentNode.type === 'FESTWERT') {
                          currentNode[key] = tokens[1];
                        } 
                        else if(['STUETZSTELLENVERTEILUNG','FESTWERTEBLOCK','KENNLINIE','GRUPPENKENNFELD','GRUPPENKENNLINIE','KENNFELD'].indexOf(currentNode.type) > -1){
                          valArray = [];
                          tokens.slice(1).forEach(function(str){
                            let r = str.match(/^\"([\s\S]*?)\"$/);
                            if (r) valArray.push(r[1]);
                            else valArray.push(str);
                          });
                          if (!currentNode[key]) currentNode[key] = [];
                          currentNode[key] = currentNode[key].concat(valArray);
                        }
                        else if(currentNode.type == 'FUNKTIONEN'){
                          line = line.substring(key.length).trim();
                          let ele_name = line.split(/\s+/)[0];
                          let ele_version = removeQuotes(line.match(/\"([\s\S]*?)\"/g)[0]);
                          let ele_desc = removeQuotes(line.match(/\"([\s\S]*?)\"/g)[1]).substring(ele_version.length).trim();
                          if (!currentNode[key]) currentNode[key] = {};
                          currentNode[key][ele_name] = {
                            'name': ele_name,
                            'version': ele_version,
                            'desc': ele_desc
                          };
                        }
                        break;
                      case 'other':
                        line = line.substring(key.length).trim();
                        currentNode[key] = removeQuotes(line);
                        break;
                      default: break;
                    }
                }
              }
            }
          }
          return out;
        }
      }
      function initElement(key, tokens, node){
        currentNode = (node[tokens[0]] = {type:key});
  
        if (key == 'FESTWERTEBLOCK'){
          if (tokens.length == 1) {currentNode.size_x = tokens[1];}
          if (tokens.length == 3) {currentNode.size_x = tokens[1]; currentNode.size_y = tokens[2];}
        } else if (key == 'FESTWERT'){
          // ==================
        } else if (key == 'FUNKTIONEN'){
          // ==================
        }
  
      }
      function getKeywordType(key, lib){
        if (key && lib){
          let types = Object.keys(lib);
          for (const type of types){
            if (lib[type].indexOf(key) >= 0) return type;
          }
  
          return 'other';
        }
        return null;
      }
      function removeQuotes(str){
        let r = str.match(/\"([\s\S]*?)\"/);
        if (r) return r[1];
        else return str;
      }
    }
  }
}

function XML (xmlFilePath) {
  const fs = require('fs')
  const txt = fs.readFileSync(xmlFilePath, {encoding: 'utf-8'});
  let $DOMParser = new DOMParser;
  out = {
    xml: $DOMParser.parseFromString(txt, 'application/xml'),
    getDFCs: function(){
      const output = {};
      const xml = this.xml;
      const DFCSNode = xml.querySelector('DSM-DFCS');

      const _DFCs = this.DSMNodeToObj(DFCSNode);
      let _DFC;
      for (const item of _DFCs['DSM-DFCS']) {
        _DFC = item['DSM-DFC'];
        output[_DFC['SHORT-NAME'].substr(4)] = _DFC;
      }

      return output;
    },
    DSMNodeToObj: function (node){
      const output = {};
      recursion(node, output);
      return output;
      function recursion(node, parent) {
        let tag, val, childrenCount;
        tag = node.tagName;

        if (node.children.length === 0) {            
          val = node.textContent;

          parent[tag] = val;
        } else {
          childrenCount = node.children.length;

          if (childrenCount > 1 && node.children[0].tagName === node.children[1].tagName) {
            parent[tag] = [];

             for (let i = 0; i < childrenCount; i++) {
              parent[tag][i] = {};
              recursion(node.children[i], parent[tag][i]);
            }
          } else {
            parent[tag] = {};

            for (const child of node.children) {
              recursion(child, parent[tag]);
            }
          }
        }
      }
    },
    getAll: function () {
      const _t = [
        'DSM-DFCS',
        'DSM-VIRTUALDFCS',
        'DSM-DSQS',
        'DSM-DFPS',
        'DSM-FIDS',
        'DSM-FIDS-SCHEDULED',
        'DSM-FIDS-IUMPR',
        'DSM-TRIGGERS',
        'DSM-DTRS',
        'DSM-CLASSES',
        'DSM-ENV-INFO',
        'DSM-PARAM-LISTS',
        'DSM-COMPU-METHODS',
        'DSM-CONF',
        'DSM-STANDARD-CONFIG',
        'DSM-DTR-SIZE',
        'DSM-RDY-CONF-LSTS',
        'DSM-LABEL-DEFAULT-VALUES',
        'DSM-SYSCONST-INPUTS',
        'DSM-FLT-CLASS-PARAMETERS',
      ];
      let parentNode, output = {};
      for (const nodename of _t) {
        parentNode = this.xml.querySelector(nodename);
        if (parentNode) output[nodename] = (this.DSMNodeToObj(parentNode));
        else console.log('not found' + nodename);
      }

      return output;
    },
    getScantool: function(){
      const output = {};
      const xml = this.xml;
      const scantoolNodes = xml.querySelectorAll("ECU");
      for (const scantoolNode of scantoolNodes){
        if (scantoolNode.attributes['name'].value.match(/EngineControl/)){
          const scantoolModes = scantoolNode.querySelectorAll('SEMANTIC_GROUP');
          for (const scantoolMode of scantoolModes){
            output[scantoolMode.attributes['name'].value] = scantoolNodeToObj(scantoolMode);
          }
        }
      }
      return output;

      function scantoolNodeToObj(node){
        const output = {};
        recursion_scantool(node,output);
        console.log(output);
        arrtoObj_scantool(output);

        return output;

        function recursion_scantool(node, parent){
            let tag, val, childrenCount;
            //console.log(node);
            tag = node.tagName;
            childrenCount = node.children.length;

            /*没有子元素了*/
            if (childrenCount === 0) {            
              val = node.textContent;
              parent[tag] = val;
              
            } 
            else {
              //childrenCount = node.children.length;
              parent[tag] = {};
              if(node.attributes['name'] != undefined){
                parent[tag]["name"] = node.attributes['name'].value;
              }
              
              let arr_Count = {};

              for (let i = 0; i < childrenCount; i++) {
                  if(node.children[i].attributes['name'] != undefined){
                    //let tag_Arr = node.children[i].tagName + "_Arr";                    
                    
                    if(parent[tag][node.children[i].tagName] === undefined){
                      //tag_Arr = node.children[i].tagName+"_Arr";
                      parent[tag][node.children[i].tagName] = [];
                      //parent[tag][tag_Arr] = [];
                      arr_Count[node.children[i].tagName] = 0;
                    }                  
                    
                    parent[tag][node.children[i].tagName][arr_Count[node.children[i].tagName]] = {};
                    recursion_scantool(node.children[i], parent[tag][node.children[i].tagName][arr_Count[node.children[i].tagName]]);
                    //parent[tag][tag_Arr].push(parent[tag][node.children[i].tagName][arr_Count[node.children[i].tagName]][node.children[i].tagName]);
                    //parent[tag][node.children[i].tagName][arr_Count[node.children[i].tagName]] = parent[tag][node.children[i].tagName][arr_Count[node.children[i].tagName]][tag];
                  
                    arr_Count[node.children[i].tagName]++;
                  }
                  else {
                    //parent[tag] = {};
                    recursion_scantool(node.children[i],parent[tag]);
                  }
              }
            }
        }

        function arrtoObj_scantool(output){
          if(output != undefined && typeof(output) != 'string' && Object.keys(output).length > 0){
            let tagNames = Object.keys(output);
            //console.log("0:",output);
            //console.log("1:"+tagNames);
            
            for (let key of tagNames){
              /*
              console.log("2:"+key);
              console.log("2.5:"+typeof(key));
              console.log("2.7:"+output);
              console.log("3:"+output[key]);
              */
              if(Array.isArray(output[key]) == true){
                for(let i=0; i<output[key].length; i++){
                  if(output[key][i][key] != undefined){
                    output[key][i] = output[key][i][key];
                  }                  
                }
                //console.log("operated:"+output[key]);
              }
              arrtoObj_scantool(output[key]);
            }
          }
        }

      }
    }
  }

  return out;
}

/*
    'COMPU_METHOD',
    'RECORD_LAYOUT',
    'AXIS_PTS',
    'COMPU_VTAB',
    'COMPU_TAB',
    'FUNCTION',
    'MOD_PAR', <-- system constant
    'MOD_COMMON' <--Byte order
*/
module.exports = {A2L, HEX, DCM, XML};