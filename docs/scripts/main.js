/**
//---------------------------------------------------------------------------------------------
 * Nowpro svg アニメ再生ツール　javascript メインファイル
 * 
 *  2020/03/17 Programed by Fujii Yasuhiko
 *   [Vivus Instant] ©maxwellito 
 *   [kanjivg]       ©2009-2018 Ulrich Apel-Licensing
 *   [Merge&more]    ©2020 NOWPRODUCTION
//---------------------------------------------------------------------------------------------
 */

/**
 * URLパラメータ値を取得する
 *
 * @param  name {string} パラメータのキー文字列
 * @return  url {url} 対象のURL文字列（任意）
 */
//function getParam(name, url) {
var getParam = function (name, url) {
  if (!url) url = window.location.href;
  name = name.replace(/[\[\]]/g, "\\$&");
  var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"), results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return null;
  var result = decodeURIComponent(results[2].replace(/\+/g, " "))
  return result;
}

/**
 * サイドバーの開閉処理
 *    
 * @param   sw
 * @return  呼び出すたびにトグル開閉
 */
closeSidebar = function (sw) {
  var viewer_el = document.getElementById('viewer');
  var viewerHeader_el = document.getElementById('viewHeader');
  var sidebar_el = document.getElementById('sidebar');

  //初回起動時のみON状態のデータをいれておく。（初回はデータが入っていない）
  if(viewer_el.style.left === ""){
    viewer_el.setAttribute('style', 'left:0;');
    viewerHeader_el.setAttribute('style', 'left:0;');
    sidebar_el.setAttribute('style', 'width:0;');
  }

  if ( viewer_el.style.left === "15rem" | sw ==="off" | sw === "OFF"){
    viewer_el.setAttribute('style', 'left:0;');
    viewerHeader_el.setAttribute('style', 'left:0;');
    sidebar_el.setAttribute('style', 'width:0;');
  } else {
    viewer_el.setAttribute('style', 'left:15rem;');
    viewerHeader_el.setAttribute('style', 'left:15rem;');
    sidebar_el.setAttribute('style', 'width:15rem;');
  }
}

/**
//---------------------------------------------------------------------------------------------
 * ビューコントロールとオプションコントロール（オプションからvivus呼び出し）処理
//---------------------------------------------------------------------------------------------
 */
var viewerCtrl = new ViewerController(document.querySelector('.viewer')),
optionCtrl = new OptionController(document.querySelector('.sidebar'), viewerCtrl);

/**
//---------------------------------------------------------------------------------------------
 * URL からパラメータを取得する
 * exp.
//http://www.nowpross.com/tegaki/svg_tool/index.html?kanjiWord=優&sideBar=OFF&strokeWidth=6&fontSize=3&displayOrders=on&strokeColor=on&colorGroups=画数&duration=6000&loop=on
//http://www.nowpross.com/tegaki/svg_tool/index.html?kanjiWord=優&sideBar=ON&strokeWidth=1&fontSize=3&displayOrders=OFF&strokeColor=OFF&colorGroups=部首&duration=4000&loop=OFF
//---------------------------------------------------------------------------------------------
 */
var getKw    = getParam('kanjiWord');    //kanjiWord    = 漢字   文字
var getSb    = getParam('sideBar');      //sideBar      = ON/OFF サイドバーの表示/非表示
var getWidth = getParam('strokeWidth');  //strokeWidth  = 1-10   １画の太さ
var getFont  = getParam('fontSize');     //fontSize     = 1-10    画数fontサイズ
var getDo    = getParam('displayOrders');//displayOrders= ON/OFF 画数表示/非表示
//var getSc    = getParam('strokeColor');  //strokeColor  = ON/OFF カラー表示
var getCg    = getParam('colorGroups');  //colorGroups  = 画数/部首 画数別/部首別/部位別
var getDr    = getParam('draft');        //draft        = ON/OFF 下書き
var getDu    = getParam('duration');     //duration     = 1000-10000 アニメーション期間
var getLp    = getParam('loop');         //loop         = ON/OFF ループ

//漢字の指定があればその漢字を自動再生
if (getKw) {
  var elm = document.getElementById('kanjiWord');
  var str = "";

  //漢字の指定が　熟語　だった場合　1語づつ　タイマーが来れば　切り替えていく処理
  if (getKw.length == 1) {
    //単漢字処理
    str = getKw;
  } else if (getKw.length > 1) {
    //複漢字処理
    str = getKw.substr(0,1);          //とりあえず先頭の文字
  }

  elm.setAttribute('value', str);
//  viewerCtrl.serchKanjiSVG();
//  console.log( "main:kanjiWord=", getKw );

}

//slideBarの表示／非表示
if (getSb) {
  closeSidebar(getSb)
}

//strokeWidth  = 1-10   １画の太さ
if (getWidth) {
  var elm = document.getElementById('strokeWidth');
  elm.setAttribute('value', getWidth);
  optionCtrl.updateForm()
//  console.log("main:strokeWidth=",getWidth);
}

//fontSize     = 1-10    画数fontサイズ
if (getFont) {
  var elm = document.getElementById('fontSize');
  elm.setAttribute('value', getFont);
  optionCtrl.updateForm()
//  console.log("main:fontSize=",getFont);
}

//displayOrders= ON/OFF 画数表示/非表示
if (getDo) {
  var elm = document.getElementById('displayOrders');
  if (getDo==="ON"|getDo==="on") {
    elm.setAttribute('checked', 'checked'); //checked="checked"
    elm.setAttribute('value', "ON");
  } else {
    elm.removeAttribute('checked');         //checked=""
    elm.setAttribute('value', "OFF");
  }
  optionCtrl.updateForm()
//  console.log("main:displayOrders=",getDo);
}

//strokeColor  = ON/OFF カラー表示
/*if (getSc) {
  var elm = document.getElementById('strokeColor');
  if (getSc==="ON"|getSc==="on") {
    elm.setAttribute('checked', 'checked'); //checked="checked"
    elm.setAttribute('value', "ON");
  } else {
    elm.removeAttribute('checked');         //checked=""
    elm.setAttribute('value', "OFF");
  }
  optionCtrl.updateForm()
//  console.log("main:strokeColor=",getSc);
}
*/

//colorGroups  = 画数/部首/部位    画数別/部首別/部位別
if (getCg) {
  var elm = document.getElementById('colorGroups');
  if (getCg==="画数") {
    elm.removeAttribute('checked');         //checked=""
    elm.setAttribute('value', "kakusuu");
  } else if (getCg==="部首") {
    elm.setAttribute('checked', 'checked'); //checked="checked"
    elm.setAttribute('value', "bushu");
  } else if (getCg==="部品") {
    elm.setAttribute('checked', 'checked'); //checked="checked"
    elm.setAttribute('value', "buhin");
  } else if (getCg==="白黒") {
    elm.setAttribute('checked', 'checked'); //checked="checked"
    elm.setAttribute('value', "sirokuro");
  }

  optionCtrl.updateForm()
//  console.log("main:colorGroups=",getCg);
}

//draft  = ON/OFF 下書き表示
if (getDr) {
  var elm = document.getElementById('draft');
  if (getDr==="ON"|getDr==="on") {
    elm.setAttribute('checked', 'checked'); //checked="checked"
    elm.setAttribute('value', "ON");
  } else {
    elm.removeAttribute('checked');         //checked=""
    elm.setAttribute('value', "OFF");
  }
  optionCtrl.updateForm()
//  console.log("main:draft=",getDr);
}

//duration     = 1000-10000 アニメーション期間
if (getDu) {
  var elm = document.getElementById('duration');
  elm.setAttribute('value', getDu);
  optionCtrl.updateForm()
//  console.log("main:duration=",getDu);
}

//loop         = ON/OFF ループ
if (getLp) {
  var elm = document.getElementById('loop');
  if (getLp==="ON"|getLp==="on") {
    elm.setAttribute('checked', 'checked'); //checked="checked"
    elm.setAttribute('value', "ON");
  } else {
    elm.removeAttribute('checked');         //checked=""
    elm.setAttribute('value', "OFF");
  }
  optionCtrl.updateForm()
//  console.log("main:loop=",getLp);
}

//ユーザーにエラーについて簡単に通知する
var alertBoxTimeout,
alertBox = document.querySelector('.alert-error');
window.onerror = function (msg) {
  alertBox.textContent = msg;
  alertBox.classList.add('show');
  if (!alertBoxTimeout) {
    setTimeout(function () {
      alertBox.classList.remove('show');
    }, 8000);
  }
};

//tabデザイン
document.addEventListener('DOMContentLoaded', function(){
  var $tab_link = $(".tab_link");
  var $tab_body_item = $(".tab-body_item");
  $tab_link.on("click",function(e){
    var target = $(e.currentTarget);
    //タブの表示非表示
    $tab_link.removeClass("on");
    target.addClass("on");
    //タブの中身の表示非表示
    var num =　target.data("tab-body");
    $tab_body_item.removeClass("on");
    $(".tab-body_item-"+num).addClass("on");
  });
});