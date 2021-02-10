/**
  *リストのforEachに使用するポリフィル
  * Todd Mottoのソリューションは
  * https://css-tricks.com/snippets/javascript/loop-queryselectorall-matches/
  *
  * @param {array} arrayループする配列
  * @param {Function}実行するコールバック関数
  * @param {object}スコープメソッドを実行するコンテキスト
  */
var forEach = function (array, callback, scope) {
  for (var i = 0; i < array.length; i++) {
    callback.call(scope, i, array[i]); // passes back stuff we need
  }
};

/**
  *文字列を整数に解析します。
  *数値が正またはnullでない場合
  *メソッドはデフォルト値を返します
  *または未定義の場合は0
  *
  * @param {string} value解析する文字列
  * @param {*} defaultValue解析された結果が無効な場合に返す値
  * @return {数値}
  *
  */
var parsePositiveInt = function (value, defaultValue) {
  var output = parseInt(value, 10);
  return (output >= 0) ? output : defaultValue;
};

/**
* XMLHttpRequestにて画像をbase64形式のURLに変換
*  2020/3/10 fujii added
*/
/*toBase64Url = function ( reader, url, callback) {
  var xhr = new XMLHttpRequest();
  xhr.onload = function() {
    reader.onloadend = function() {
      callback(reader);
    }
    reader.readAsDataURL(xhr.response);
  };

  xhr.open('GET', url.name);
  xhr.responseType = 'blob';
  xhr.send();
}

function toBinArray(str) {
  var l = str.length,
    arr = new Uint8Array(l);
  for (var i = 0; i < l; i++) arr[i] = str.charCodeAt(i);
  return arr;
}

function toBinString(arr) {
  var uarr = new Uint8Array(arr);
  var strings = [], chunksize = 0xffff;
  // There is a maximum stack size. We cannot call String.fromCharCode with as many arguments as we want
  for (var i = 0; i * chunksize < uarr.length; i++) {
    strings.push(String.fromCharCode.apply(null, uarr.subarray(i * chunksize, (i + 1) * chunksize)));
  }
  return strings.join('');
}
*/

/**
*Dropイベントを強制的に発火させる
*  2020/3/9 fujii added
*/
/*function fireDropEvent(domElement, files) {
  // DataTransferの偽物を定義する
  class FakeDataTransfer {
    constructor(files) {
      this.dropEffect = 'none';
      this.effectAllowed = 'all';
      this.items = [];
      this.types = ['Files'];
      this.files = files;
    }
    addElement() {          // do nothing
    }
    clearData() {           // do nothing
    }
    getData() {      return "";
    }
    setData() {             // do nothing
    }
    setDragImage() {        // do nothing
    }
  }

  // ECMAScript 5のdefinePropertyという機能を使って上書きする
  const event = new DragEvent("drop");
  Object.defineProperty(event, "dataTransfer", {value: new FakeDataTransfer(files)});
  domElement.dispatchEvent(event);
  return event;
};
*/

/**
 * base64のデコード時に文字化けせずにデコードする(元からのバグを修正)
 *  2020/3/9 fujii added
 */
/*function b64DecodeUnicode(str) {
    // 逆変換: バイナリー文字列から "%" エンコードへ、そしてオリジナルの文字列へ。
    return decodeURIComponent(atob(str).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
}
*/

//-----------------------------------------------------------------------------------
// 漢字情報、部品構成情報を　サイドバーへ書き込む
//-----------------------------------------------------------------------------------
var outputElm   = document.getElementById('output');
var errorElm    = document.getElementById('error');

function print(text) {
  outputElm   = document.getElementById('output');
//  outputElm.innerHTML = text.replace(/\n/g, '<br>');
  outputElm.innerHTML = text;
};

function printBuikan(arry) {
  outputElm   = document.getElementById('outputBuikan');
  var text ='';
  if (arry.length != 0) {
    text = arry[0] + ':';
//console.log(arry);
    for (var i = 1; i < arry.length; i++) {
      text = text + arry[i] + ' ';
    }
  }
  outputElm.innerHTML = text;
};

function error(e) {
  console.log(e);
  errorElm.style.height = '2em';
  errorElm.textContent = e.message;
};

function noerror() {
  errorElm.style.height = '0';
};

//-----------------------------------------------------------------------------------
//サロゲート文字用  //𩸽 29e3e
//-----------------------------------------------------------------------------------
function stringToArray (str) {
    return str.match(/[\uD800-\uDBFF][\uDC00-\uDFFF]|[^\uD800-\uDFFF]/g) || [];
};

/**
* サロゲートペアが含まれているかをチェックする
* 検査対象文字が上位もしくは下位サロゲートであればtrueを返す
*/
function chkSurrogatePair(str) {
  for ( var i = 0; i < str.length; i++) {
    var c = str.charCodeAt(i);
    if ((0xD800 <= c && c <= 0xDBFF) || (0xDC00 <= c && c <= 0xDFFF)) { 
      return true; 
    }
  }
  return false;
};

// 文字列をCode Point(16進数)の配列にして返す
function convertCodePoints(str) {
    return Array.from(str).map(char => {
        return char.codePointAt(0).toString(16);
    });
};

//-----------------------------------------------------------------------------------
//階層の深さ
//-----------------------------------------------------------------------------------
function getDepth (obj) {
    var depth = 0;
    if (obj.children) {
        obj.children.forEach(function (d) {
            var tmpDepth = getDepth(d)
            if (tmpDepth > depth) {
                depth = tmpDepth
            }
        })
    }
    return 1 + depth
};
