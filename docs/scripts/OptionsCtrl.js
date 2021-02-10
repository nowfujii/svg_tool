/**
* OptionControllerクラス
 * 新vivusを呼び出しkanjivgのsvgを1ストロークアニメーションします。
 *  漢字に特化した制御を行い、漢字情報も付加します。
 *  また、ストロークのカラー指定を　画数別、部首別、部品別、白黒　の4種類選択できます。
 *  さらに、変更したSVGをファイルへダウンロードできます。（アニメーション情報は含みますが実行はしません）
 *    Programmed by Fujii Yasuhiko
 *    Copyright ©2020 NOWPRODUCTION CO.,LTD
 * @param {DOMelement} el Option dom element
 * @param {ViewerController} viewer Viewer controller
 */

//画数のカラーデータ 60画まで対応     //add fujii
var colorData = ["#bf0000","#bf5600","#bfac00","#7cbf00","#26bf00","#00bf2f","#00bf85","#00a2bf",
                 "#004cbf","#0900bf","#5f00bf","#b500bf","#bf0072","#bf001c","#bf2626","#bf6b26",
                 "#bfaf26","#89bf26","#44bf26","#26bf4c","#26bf91","#26a8bf","#2663bf","#2d26bf",
                 "#7226bf","#b726bf","#bf2682","#bf263d","#bf4c4c","#bf804c",
                 "#bf0000","#bf5600","#bfac00","#7cbf00","#26bf00","#00bf2f","#00bf85","#00a2bf",
                 "#004cbf","#0900bf","#5f00bf","#b500bf","#bf0072","#bf001c","#bf2626","#bf6b26",
                 "#bfaf26","#89bf26","#44bf26","#26bf4c","#26bf91","#26a8bf","#2663bf","#2d26bf",
                 "#7226bf","#b726bf","#bf2682","#bf263d","#bf4c4c","#bf804c"];

var _this = this;
function OptionController (el, viewer) {
  this.el                 = el;
  this.viewer             = viewer;
  this.vivus              = null;
  this.buttons            = el.querySelectorAll('button');
  this.fields             = el.querySelectorAll('form *[name]');
  this.panelKanji         = el.querySelector('.kanjivg-class-panel');
  this.panelLoop          = el.querySelector('.control-loop-panel');
  this.panelDelay         = el.querySelector('.delay-panel');
  this.panelTriggerClass  = el.querySelector('.manual-trigger-class-panel');
  this.updateForm();

  //ズーム処理用
  this.scale = 1.1;
  this.svg = "";
  this.message = "";
  this.initialViewBox="";

  this.kanjiInfo = "";
  _this = this;

// DB読み込み
  this.loadSqlDB();
};

//-----------------------------------------------------------------------------------
//辞書DBを読み込む
//-----------------------------------------------------------------------------------
var DB = null;
OptionController.prototype.loadSqlDB = function () {
  var baseUrl = 'scripts/dist/';
  var url = "http://www.nowpross.com/tegaki/svg_tool/scripts/dist/newdic.sqlite";
  var config = {
    locateFile: filename => `${baseUrl}/${filename}`
  }

  initSqlJs(config).then(function (SQL) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = 'arraybuffer';

    xhr.onload = e => {
      //callback
      var uInt8Array = new Uint8Array(xhr.response);
      var db = new SQL.Database(uInt8Array);
      DB = db;
      console.log("DB辞書が読み込めました: ",DB);

      //指定されているkanjiWordがあれば検索しサイドバーの漢字情報へ書き込む
      _this.kanjiInfo = _this.getKanjiInfo(0);
      print(_this.kanjiInfo);
    };

    xhr.send();
  });
};

//-----------------------------------------------------------------------------------
//VIVUS セット
//-----------------------------------------------------------------------------------
OptionController.prototype.setVivus = function(n) {
console.log("setVivus:_this: ",_this);
  var options = _this.getOptions(_this);             //サイドバーで設定したオプション
  var option  = {};                                  //vivusに設定するオプション

  //フォームの数値更新
  OptionController.prototype.updateFormAll();

  //文字がなければ処理しない
  if (!options.kanjiWord) {
    console.log("文字がないのでvivus呼び出ししません。setVivus:options.kanjiWord: ",str);
    return;
  }

  //サロゲート文字を含んだN文字目の文字
  var str = stringToArray(options.kanjiWord)[n];
console.log("setVivus:kanji= ",str);


  //既にvivusがあれば一旦クリアして再起動
  if(_this.vivus) {
    _this.vivus.stop();
    _this.vivus.reset();
    _this.vivus.destroy();
    document.getElementById('SVGID').remove();
    console.log("option:setVivus():reset ---------------------------------------",_this.vivus);
  }

  //ファイル名のサロゲート処理
  var fname = convertCodePoints(str);
  if (!chkSurrogatePair(str)) {
    fname = '0' + fname;
  } else {
    console.log("サロゲートコード：svg filename: ",fname);
  }

  //animTimingFunction 文字列から関数を指定する方法がわからないので　一旦これ・・
  switch (options.animTimingFunction) {
    case "Vivus.LINEAR":
      option = {animTimingFunction:Vivus.LINEAR}; break;
    case "Vivus.EASE":
      option = {animTimingFunction:Vivus.EASE}; break;
    case "Vivus.EASE_OUT":
      option = {animTimingFunction:Vivus.EASE_OUT}; break;
    case "Vivus.EASE_IN":
      option = {animTimingFunction:Vivus.EASE_IN}; break;
    case "Vivus.EASE_OUT_BOUNCE":
      option = {animTimingFunction:Vivus.EASE_OUT_BOUNCE}; break;
    default:
      option = {animTimingFunction:Vivus.LINEAR};
  }

  option.file        = '../kanjivg/kanji/' +  fname + '.svg';   //サーバーのフォルダー構成にkanjivg/kanji/があるのが前提
  option.onReady     = function(myVivus) {
    //SVGファイル読み込み後のコールバック
console.log("callback: ",myVivus);
    myVivus.el.setAttribute('id', "SVGID"); //elementはidによって管理されるので強制的に付け加える
    _this.svg = myVivus.el;
    _this.viewer.svgTag = myVivus.el;
    _this.viewer.svgWrap.innerHTM = myVivus.el;
    _this.viewer.svgFileName = fname+'.svg';
console.log("onReady:callback() svg: ",_this.svg);
console.log("callback:viewer:",_this.viewer);

    //ズームの初期値セット
    //this.svg = document.querySelector('svg');
    _this.message = document.querySelector('#message span');
    if (myVivus.el) {
      myVivus.el.setAttribute('viewBox','0 0 110 110');
      _this.initialViewBox      = myVivus.el.getAttribute('viewBox');
      _this.message.textContent = _this.initialViewBox;
    }

    //下書き用のpath追加
    _this.addUnderPath(myVivus);

    //pathのストローク別情報の修正
    _this.changeStrokePath(myVivus);

    //画数番号の修正
    _this.changeStrokeNum(myVivus);

    //クリック位置を取得するために追加
    _this.viewer.svgPos = _this.viewer.svgTag.createSVGPoint();    //Create once for document

    //pathにclickイベントを追加する
    _this.addClickEvent(myVivus);
  };
  option.start       = options.start;
  option.type        = options.type;
  option.duration    = parseInt(options.duration);
  option.forceRender = false;   //IEの場合true

console.table("option:vivus new:options: ",options);
console.table("option:vivus new:option: ",option);

  _this.vivus = new Vivus( "svg-div", option, OptionController.prototype.vivusCallback );  //アニメーション終了時のコールバック指定
//  _this.vivus.play();

//  document.getElementById('outputStrokeNow').innerHTML = _this.strokeNow;
console.log("_this.vivus.map.length: ",_this.vivus.map);
  document.getElementById('outputStrokeSuu').innerHTML = _this.vivus.map.length;
};



/**
 * アニメーション後のコールバック関数
 */
OptionController.prototype.vivusCallback = function() {
  console.log("VIVUS Animetion after CALLBACK!!");
};

/**
 * pathにclickイベントを追加する
 */
OptionController.prototype.addClickEvent = function (myVivus) {
//  var options = _this.getOptions(_this);                    //サイドバーで設定したオプション
  var paths   = myVivus.el.querySelectorAll('path');

  for (var path of paths) {
    if (path.id.match(/-s/)) {
      //イベント埋め込み
      path.addEventListener("click",this.strokeClick);      //クリックイベント登録
    }
  }
};

/**
 * 下書き用のPathを追加
 * 　SVGの先頭要素としてgを追加し、id名は_Draftsを与える（class名、styleを変更）
 * 　この要素の中にpath要素を複製する。
 * 　複製時にstyleは削除する。
 */
OptionController.prototype.addUnderPath = function (myVivus) {
  var options = _this.getOptions(_this);                    //サイドバーで設定したオプション
  var gs      = myVivus.el.querySelectorAll('g');
  var paths   = myVivus.el.querySelectorAll('path');
  var clone   = document.importNode(gs[gs.length-1], true);
  var ids     = clone.id.split('_');
  clone.id    = clone.id.replace('StrokeNumbers','Drafts');
  clone.setAttribute('class','drafts_'+ids[1]);

  //オプションを見て下書きのON/OFF制御
  if (options.draft) {
    clone.setAttribute('style','stroke-width: '+options.strokeWidth+'; stroke:#d0d0d0; fill:none;stroke-linecap:round;stroke-linejoin:round;');
  } else {
    clone.setAttribute('style','stroke-width: 0; stroke:#d0d0d0; fill:none;stroke-linecap:round;stroke-linejoin:round;');
  }

  clone.textContent = null;                               //複製しているので子要素をすべて削除
  myVivus.el.insertBefore(clone, myVivus.el.firstChild);  //svgの最初の子要素として追加

  for (var elm of paths) {
    var clone2 = document.importNode(elm, true);
    clone2.id = clone2.id.replace('s','d');
    clone2.setAttribute('style','');
    clone.appendChild(clone2);                            //cloneの最後に子要素として追加
  }

console.log("下書き用のpathを追加:",myVivus.el);
};

/**
 * ストローク情報をオプションをみて変更
 *   画数別：部首別：部位別：白黒
 */　
OptionController.prototype.changeStrokePath = function (myVivus) {
  var options = _this.getOptions(_this);                    //サイドバーで設定したオプション
  var gs      = myVivus.el.querySelectorAll('g');
  var paths   = myVivus.el.querySelectorAll('path');
//console.log("svg:",myVivus.el);
//console.log("myVivus.el.querySelectorAll('g'):",gs);
//console.log("myVivus.el.querySelectorAll('path'):",paths);
  var buiKan = new Array();;    //部位のelementを追記

//  console.log("colorGroups: ",options.colorGroups);
  switch(options.colorGroups){
    case 'kakusuu':
      //画数別：すべてのストロークカラーを変える
      var i = 0;
      for (var path of paths) {
        if (path.id.match(/-s/)) {
          var attr = path.getAttribute('style');
          var style = ' stroke:'+ colorData[i] + '; stroke-width: ' + options.strokeWidth +";";
          path.setAttribute('style',attr+style);
          i++;
        }
      }
      break;
    case 'bushu':
      //部首別
      for (var g of gs) {
        var radical = g.getAttribute('kvg:radical');
        var attr  = g.getAttribute('style');
        if (attr == null) attr = '';
        if (radical == null) {
          //部首以外
            var style = 'stroke-width: ' + options.strokeWidth +";";
        } else {
          if (radical != null && radical.match(/general|tradit/)) {
            //部首にのみカラーを割り当てる
            var style = ' stroke:'+ colorData[0] + '; stroke-width: ' + options.strokeWidth +";";
          } else {
          //部首以外
            var style = 'stroke-width: ' + options.strokeWidth +";";
          }
        }
        g.setAttribute('style',attr+style);
      }
      break;
    case 'buhin':
      //部品別
      var i = 0;    //カラー番号インデックス
      for (var g of gs) {
        var id      = g.getAttribute('id');
        var element = g.getAttribute('kvg:element');
        var attr    = g.getAttribute('style');
        var radical = g.getAttribute('kvg:radical');
        var style   = "";
        if (attr == null) attr = '';
        if (element != null) {
          if (!g.id.match(/-g/)) {
            console.log("親：root: len: ",g.children.length + " id:" + id + " :" + element + " :" + radical); //親要素
            //部位の漢字を残す
            if (element != null) buiKan.push(element);

            //親のradicalにgeneralがあれば部首のみ
            if (radical !=null && radical.match(/general|tradit/)) {
              style = ' stroke: ' + colorData[i*2] + '; stroke-width: ' + options.strokeWidth +";";
              g.setAttribute('style',attr+style);
              i++;
              break;
            }

            for (var j = 0; j < g.children.length; j++) {
//              console.log("　子：root children[", j + ']' +g.children[j].id + ' :' +g.children[j].children.length + " :" + g.children[j].getAttribute('kvg:element')  + " :" + g.children[j].getAttribute('kvg:radical'));    //子要素
              //部位の漢字を残す
              if (g.children[j].getAttribute('kvg:element') != null) buiKan.push(g.children[j].getAttribute('kvg:element'));

              //子のradicalにgeneralがあれば部首のみ
              if (g.children[j].getAttribute('kvg:radical') !=null && g.children[j].getAttribute('kvg:radical').match(/general|tradit/)) {
                style = ' stroke: ' + colorData[i*2] + '; stroke-width: ' + options.strokeWidth +";";
                g.children[j].setAttribute('style',attr+style);
                i++;
                continue;
              }

              //子の孫にｇがあるかチェック
              var gflag = false;
              for (var k = 0; k < g.children[j].children.length; k++){
//                console.log(g.children[j].children[k].id);
                if (g.children[j].children[k].id.match(/-g/)) {
                  gflag = true;
                  break;
                }
              }
              if (!gflag) {
                //孫がなければ子のスタイルを変更
                style = ' stroke: ' + colorData[i*2] + '; stroke-width: ' + options.strokeWidth +";";
                g.children[j].setAttribute('style',attr+style);
                i++;
              }
              for (var k = 0; k < g.children[j].children.length; k++){
                style = "";
                if (g.children[j].children[k].getAttribute('kvg:element') != null) {
//                  console.log("　　孫：root mago[", k + ']' + g.children[j].children[k].id + " :" + g.children[j].children[k].getAttribute('kvg:element'));

                  //部品の漢字を残す
                  if (g.children[j].children[k].getAttribute('kvg:element') != null) buiKan.push(g.children[j].children[k].getAttribute('kvg:element'));

                  style = ' stroke: ' + colorData[i*2] + '; stroke-width: ' + options.strokeWidth +";";
                  g.children[j].children[k].setAttribute('style',attr+style);
                  i++;
                } else {
                  for (var l = 0; l < g.children[j].children[k].children.length; l++){
//                    console.log("　　　ひ孫：root mago[", k + ']' + g.children[j].children[k].children[l].id + " :" + g.children[j].children[k].children[l].getAttribute('kvg:element'));

                  //部品の漢字を残す
                  if (g.children[j].children[k].children[l].getAttribute('kvg:element') != null) buiKan.push(g.children[j].children[k].children[l].getAttribute('kvg:element'));

                    style = ' stroke: ' + colorData[i*2] + '; stroke-width: ' + options.strokeWidth +";";
                    g.children[j].children[k].children[l].setAttribute('style',attr+style);
                    i++;
                  }
                }
              }
            }
          }
        }
      }
      break;

    case 'sirokuro':
      //白黒：すべてのストロークカラーは黒
      break;
  }

  //  console.log("部位漢字：",buiKan);
  printBuikan(buiKan);
console.log("ストローク情報をオプションをみて変更:",myVivus.el);
};

/**
 * 画数番号の制御
 *   画数表示ON・OFF、fontサイズ
 */　
OptionController.prototype.changeStrokeNum = function (myVivus) {
  var options = _this.getOptions(_this);                    //サイドバーで設定したオプション
  var gs    = myVivus.el.querySelectorAll('g');

  for (var g of gs) {
    if (g.id.match(/StrokeNumbers_/)) {
      var style    = g.getAttribute('style');

      //画数表示
      if (options.displayOrders) {
        g.setAttribute('style','font-size: ' + options.fontSize + '; fill:#d0d0d0;');
      } else {
        g.setAttribute('style','font-size: 0' + '; fill:#d0d0d0;');
      }
    }
  }
};

//-----------------------------------------------------------------------------------
// ボタンイベント
//-----------------------------------------------------------------------------------

/**
 * 指定した漢字の情報を取得
 *  
 */
OptionController.prototype.getKanjiInfo = function (n) {
  var dbIndex = ["番号　　　","漢字　　　","画数　　　","部首　　　","部首読み　","音読み　　","訓読み　　","表外音読み","表外訓読み"
                ,"語句　　　","語句読み　","習得学年　","漢検　　　","区分　　　","備考　　　","ＪＩＳ　　","国字　　　","許容字体　"
                ,"許容画数　","ユニコード","語句ルビ　","光村27年　","教出27年　","三省27年　","東書27年　","学図27年　"];
  var result = "";
  var options = _this.getOptions(_this);             //サイドバーで設定したオプション

  //サロゲート文字を含んだN文字目の文字  
  var str = "";
  if (!options.kanjiWord) {
    console.log("kanjiWordの指定がありません！");
    return "";
  }
  str = stringToArray(options.kanjiWord);
console.log("getKanjiInfo:kanji= ",str[n]);

  if (DB) {
    if (str[n]) {

      //サロゲート文字対応
      if (chkSurrogatePair(str[n])){
        console.log("サロゲートコードです： ",convertCodePoints(str[n]));
      }

      var sql = 'SELECT * FROM newdic WHERE kanji="' + str[n] + '" LIMIT 10;';
      try {
        _this.kanjiInfo = DB.exec(sql);
      } catch(e) {
        console.log( "DB selectでエラーが発生しました！　:" + str[n] + ": "+e.message );
        return '';
      }

      //辞書にデータが有れば出力
      if (_this.kanjiInfo.length) {
//      console.log("DB.columns[0]:",r[0].columns);
        console.log("DB.values[0] :",_this.kanjiInfo[0].values[0]);
        for (var i = 0; i < _this.kanjiInfo[0].values[0].length; i++) {
          result = result + dbIndex[i] + ":　" + _this.kanjiInfo[0].values[0][i] + '<br>\n';
        }
        return result;
      } else {
        console.log("辞書にデータがありません！",str[n]);
        return '';
      }
    } else {
      console.log("kanjiWordの指定がありません！");
      return '';
    }
  } else {
      console.log("DB はまだロードされていません！",DB);
      return '';
  }
}

/**
 * イベント；index.htmlより更新ボタンが押されたら呼び出される
 */
OptionController.prototype.updateParam = function () {
  OptionController.prototype.updateFormAll();
  var kanjiInfo = OptionController.prototype.getKanjiInfo(0);
  if (kanjiInfo != "") {
    print(kanjiInfo);
  } else {
    print("その文字は辞書にありません。");
  }
  this.strokeNow = null;
  this.strokeNum = 0;

  OptionController.prototype.setVivus(0);
};

/**
 *イベント；フォームの値を確認して、サブパネルの可視性を更新します。
 * これは、入力から直接トリガーされます。
 */
OptionController.prototype.updateForm = function () {
  var options = this.getOptions(this);
//console.log("updateForm:option:",options);
  this.panelLoop.style.display         = options.loop ? '' : 'none';
  this.panelDelay.style.display        = options.type === 'delayed' ? '' : 'none';
  this.panelTriggerClass.style.display = options.start === 'manual' ? '' : 'none';
};

/**
 * フォームの数値表示をすべて更新します
 *
 */
OptionController.prototype.updateFormAll = function () {
  var value = "";
  var options = _this.getOptions(_this);

  //1画の太さ
  document.getElementById('strokeWidth').value          = options.strokeWidth;
  document.getElementById('outputStrokeWidth').value    = options.strokeWidth;

  //fontサイズ
  document.getElementById('fontSize').value             = options.fontSize;
  document.getElementById('outputFontsize').value       = options.fontSize;

  //ストローク
  document.getElementById('strokeSlider').value         = options.strokeSlider;
  document.getElementById('outputstrokeSlider').value   = options.strokeSlider;

  //遅延
  document.getElementById('duration').value             = options.duration;
  document.getElementById('outputDuration').value       = options.duration;

  //開始遅延
  document.getElementById('loopStart').value            = options.loopStart;
  document.getElementById('outputloopStart').value      = options.loopStart;

  //一時停止
  document.getElementById('loopEnd').value              = options.loopEnd;
  document.getElementById('outputloopEnd').value        = options.loopEnd;

  //フェード
  document.getElementById('loopTransition').value       = options.loopTransition;
  document.getElementById('outputloopTransition').value = options.loopTransition;

  //画数表示
  document.getElementById('displayOrders').checked      = options.displayOrders;

  //画数別/部首別/部品別/白黒別
  document.getElementById('colorGroups').value          = options.colorGroups;

  //下書き表示
  document.getElementById('draft').checked              = options.draft;

};

/**
 *イベント；フォームのストロークスライダーが動かされれば更新されます
 * これは、入力から直接トリガーされます。
 */
OptionController.prototype.updateSlider = function (strokeSlider) {
  var options = _this.getOptions(_this);

  //スライダー横の数字セット
  var oss = document.getElementById('outputstrokeSlider');
  if (oss){
    oss.value = strokeSlider;
  }
  options.strokeSlider = strokeSlider;

  //ストローククリックされていれば処理する
  if (typeof _this.strokeNum === "undefined"){
    //クリックされていなかった時
    console.log("updateSlider:this.strokeNumストローククリックされていない", _this.strokeNum);  //クリックされたストローク番号
  } else {
    //クリックされている時
    //選択しているストロークのdashoffsetを直接操作する
    if (_this.strokeNum < _this.vivus.map.length ) {
//console.log("updateSlider():",strokeSlider);
//console.log("updateSlider():strokeNum", _this.strokeNum);
//console.log("_this.vivus.map:",_this.vivus.map);
      var path = _this.vivus.map[_this.strokeNum];
//console.log("path:",path);
      path.el.style.strokeDashoffset = strokeSlider;
    }

  }
};

/**
 * 指定されたstrokeNumのpathを返す
 * 
 */
OptionController.prototype.getStrokePath = function (strokeNum) {
  var paths = document.querySelectorAll('path');
  var s = '-s' + strokeNum;
console.log("",s);
  for (var path of paths) {
    if (path.id.match(s)) {
      console.log("path: ",path);
    }
  }
};

/**
 *イベント；ZOOMボタン　+/reset/-ボタンが動かされれば更新されます
 * これは、入力から直接トリガーされます。
 */
// +ボタン押下時 scale=0.9090909090909091
OptionController.prototype.updatePlus = function () {
  //ズーム処理用
  this.svg = document.querySelector('svg');
  if (this.svg) {
    this.zoomAtCenter(this.svg, 1/this.scale);
  }
};

// リセットボタン押下時
OptionController.prototype.updateReset = function () {
  this.svg = document.querySelector('svg');
  this.message = document.querySelector('#message span');
  if (this.svg) {
    this.svg.setAttribute('viewBox', this.initialViewBox);
    this.message.textContent = this.initialViewBox;
  }
};

// -ボタン押下時 scale=1.1
OptionController.prototype.updateMinus = function () {
  //ズーム処理用
  this.svg = document.querySelector('svg');
  if (this.svg) {
    this.zoomAtCenter(this.svg, this.scale);
  }
};

//svgの中心を保ったままscale倍のviewBox値を計算しセットします
OptionController.prototype.zoomAtCenter = function (svg, scale) {
//console.log("scale:",scale);
  const [minX, minY, width, height] = this.svg.getAttribute('viewBox').split(' ').map(s => parseFloat(s));
  const zoomedWidth  = width  * scale;
  const zoomedHeight = height * scale;
  const centerX = minX + width  / 2.0;
  const centerY = minY + height / 2.0;
  const zoomedMinX = centerX - zoomedWidth  / 2.0;
  const zoomedMinY = centerY - zoomedHeight / 2.0;
  const zoomedViewBox = [zoomedMinX, zoomedMinY, zoomedWidth, zoomedHeight].map(s => s.toFixed(2)).join(' ');
  this.svg.setAttribute('viewBox', zoomedViewBox);
  this.message.textContent = zoomedViewBox;
};

/**
  *次のストロークを一画づつ再生させる
  * @param 
  */
OptionController.prototype.strokeNext = function () {
  var options = this.getOptions(this);
/*console.log("strokeNext:this: ",this);
console.log("strokeNext:options: ",options);
console.log("strokeNext:kanjiInfo: ",this.kanjiInfo);
console.log("strokeNext:this.vivus: ",this.vivus);
*/
  //総画数表示
  document.getElementById('outputStrokeSuu').value = this.vivus.map.length;

  //次へ／戻る　ボタンの表示／非表示
  const sn = document.getElementById("stroke-next");
  const sb = document.getElementById("stroke-back");

  //モードチェック
  if (!this.strokeNow){
    //初回
    this.strokeNow = 0;
    sn.style.visibility ="visible";
    sb.style.visibility ="hidden";
  }

  if (this.strokeNow < this.vivus.map.length-1){
    //２回目以降
    this.strokeNow++;
    sn.style.visibility ="visible";
    sb.style.visibility ="visible";
  } else {
    //上限
    this.strokeNow = this.vivus.map.length;
    sn.style.visibility ="hidden";
    sb.style.visibility ="visible";
  }
console.log("this.strokeNow:",this.strokeNow);

  //CSS style にanimationを追加し@keyframe を付け加えてみる
  this.trace(this.strokeNow);
}

/**
  *前のストロークを一画づつ再生させる
  * @param 
  */
OptionController.prototype.strokeBack = function () {
  var options = this.getOptions(_this);
console.log("strokeBack:");

  //次へ／戻る　ボタンの表示／非表示
  const sn = document.getElementById("stroke-next");
  const sb = document.getElementById("stroke-back");

  //モードチェック
  if (!this.strokeNow){
    //初回
    this.strokeNow = 0;
    sn.style.visibility ="visible";
    sb.style.visibility ="hidden";
  }

  if (this.strokeNow > 1){
    //２回目以降
    this.strokeNow--;
    sn.style.visibility ="visible";
    sb.style.visibility ="visible";
  } else {
    //下限
    this.strokeNow = 0;
    sn.style.visibility ="visible";
    sb.style.visibility ="hidden";
  }

  //CSS style にanimationを追加し@keyframe を付け加えてみる
  this.trace(this.strokeNow);
}

/**
 * 指定されたpath番号のstyleにanimationを動的に追加し１ストロークアニメを行う
 *
 *
 */
OptionController.prototype.trace = function(i) {
  var i,path;

  //指定画のみアニメーション
//  OptionController.prototype.setVivus(0);
//  this.vivus.destroy();
//  this.vivus.init();
  this.vivus.stop();
  this.vivus.reset();
//前のアニメーション情報が消えてくれないので消す方法がわかればBackも切れに表示されるはず

  if (i < this.vivus.map.length && i > 0) {
    path = this.vivus.map[i-1];

    //CSSのStyleにanimation,キーフレームを追加(viewer.cssに.animation,anim_drawを記載)
    path.el.style.animation = "";
    path.el.style.transform = '';
console.log("path.el.style",path.el.style);
    path.el.style.animation = "anim_draw 413ms ease-in 0ms forwards";
console.log("path.el.style",path.el.style);

    //progressに値が入っていれば現在アニメ中のストローク
    document.getElementById('outputStrokeNow').innerHTML = i;
    document.getElementById('outputStrokeSuu').innerHTML = this.vivus.map.length;
  }
};


/**
//イベント；ストロークをクリックした際に飛んてくる
 * VivusInstant.prototype.strokeClick:ここから呼び出されている
 *  path: M は moveto, L は lineto, z は closepath
 */
OptionController.prototype.strokeClick = function (e) {
  var options   = _this.getOptions(_this);
console.log("strokeClick:",e);

  //クリックしたスクリーン上の位置をSVG座標系へ変換
  var pt               = _this.viewer.svgPos;
  pt.x                 = e.clientX;
  pt.y                 = e.clientY;
  var cursorpt         = pt.matrixTransform(_this.viewer.svgTag.getScreenCTM().inverse());
  var nums             = e.target.id.split(/:|-/);
  var n                = nums[2].replace(/s|d/,'');
  _this.strokeNum      = n-1;                                                       //update slider use
  options.strokeNum    = n-1;
  //総画数表示
  document.getElementById('outputStrokeSuu').vinnerHTML = _this.vivus.map.length;
  //現在の画数表示
  document.getElementById('outputStrokeNow').innerHTML = n;

//console.log("strokeClick:n",n);
  //ターゲットストロークのdashoffsetをスライダーのmax,valueへセットする
  var ary              = e.path[0].style['stroke-dasharray'];
  var aryOffset        = ary.split(',');
  var offset           = Number(aryOffset[0]) + 1;
  options.strokeSlider = offset;
//console.log("ary: ",ary);
//console.log("offset: ",offset);

  var element          = document.getElementById("strokeSlider");                    //スライダーID
  element.max          = offset;
  element.min          = 0;
  element.value        = offset;
  element.step         = 1;
  document.getElementById('outputstrokeSlider').value = offset;              //スライダー横の数値

  //以前のストローク番号のoffsetをクリックしたストロークの位置によりセットする
//console.log("options.strokeNum",options.strokeNum);
//console.log("_this.strokeBefore",_this.strokeBefore);
//console.log("offset:",offset);
//console.log("_this.offsetBefore",_this.offsetBefore);

  if (typeof _this.strokeBefore === "undefined") {
    console.log("初めてクリックしたので前の画はない！");
    this.strokeNow = 0;
  } else {
    //前のストロークのdashoffsetを０にする
    _this.strokeDashoffset(_this.strokeBefore,0);
  }

  //現在のストロークのdashoffsetをmaxにする
  _this.strokeDashoffset(options.strokeNum,offset);

  console.log("(SVGクリック位置x:" + cursorpt.x + ", SVGクリック位置y:" + cursorpt.y + ")");
/*console.log("options.strokeNum=",   options.strokeNum);
console.log("options.strokeSlider=",options.strokeSlider);
console.log("array:",ary);
console.log("offset:",offset);
*/

  //以前のストローク番号を保存
  _this.strokeBefore = options.strokeNum;
  _this.offsetBefore = offset;
};

/**
 * 指定されたpathNumの style.strokeDashOffset を offsetにてセットする
 * 
 */
OptionController.prototype.strokeDashoffset = function (pathNum, offset) {
  var path = _this.vivus.map[pathNum];
  var st = path.el.style.strokeDashoffset;
//  console.log("st:",st);
  path.el.style.strokeDashoffset = offset;
};

/**
 *入力値をシリアル化する基本的な方法
 * フォームで。 それは安いですが、仕事をします。
 * @return {Object}フォームのシリアル化された値
 */
OptionController.prototype.getOptions = function (this_) {
  var options = {};
  forEach(this_.fields, function (index, el) {
    if (el.type === 'radio' && !el.checked) {
      return;
    }
    else if (el.type === 'checkbox') {
      options[el.name] = el.checked;
    }
    else if (el.value) {
      options[el.name] = el.value;
    }
  });
//console.log("option:getOptions(): ",options);
  return options;
};

/**
 *アクションボタンの有効化/無効化
 * @param {boolean} areEnabled設定する新しい状態
 */
OptionController.prototype.toggleActions = function (areEnabled) {
  forEach(this.buttons, function(index, button) {
    button.disabled = !areEnabled;
  });
};



/**
 * ダウンロードをトリガーする
 */
OptionController.prototype.download = function () {
//  this.vivus.toggleTrigger(false);
  this.viewer.download();
//  this.vivus.toggleTrigger(true);
};

/**
 *pathの中から***-s(num)の指定するDashoffset値(value)をセットする
 * pathそのもののstyleに追記するので、CSSのみにしたい場合はrender()を利用すること。
 */
OptionController.prototype.setPathAttr = function (num, value) {
  var paths = document.querySelectorAll('path');
  var pathObj;

  for (i = 0; i < paths.length; i++) {
    path = paths[i];
    pathObj = {
      el: path,
      length: Math.ceil(path.getTotalLength())
    };

    //下書き用のpathはスキップする
    if (path.id.match(/-d/)) {
      continue;
    }

    var sp = path.id.split(/s|-/);
    if (sp[2] ==num) {
//  console.log("sp[2]:クリックされたストロークのid:",path.id);
      var el = document.getElementById(path.id);     //スライダーID
      el.style.strokeDashoffset = value;
//  console.log("el.style.strokeDashoffset:",el.style.strokeDashoffset);
      break;
    }
  }
};

// ビジーwaitを使う方法
function sleep(waitMsec) {
  var startMsec = new Date();

  // 指定ミリ秒間だけループさせる（CPUは常にビジー状態）
  while (new Date() - startMsec < waitMsec);
}
