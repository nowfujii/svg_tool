/**
 * ViewerControllerクラス
 *
 *    Programmed by Fujii Yasuhiko
 *    Copyright ©2020 NOWPRODUCTION CO.,LTD
 * @param {DOM} el Viewer element
 */
function ViewerController (el) {
  this.el = el;
  this.svgTag = null;
  this.svgPos = null;         //クリック位置の取得用で追加
  this.svgFileName = null;
//  this.newSvgCb = null;
//  this.introEl = el.querySelector('.introbox');

  this.svgWrap = document.createElement('div');
  this.svgWrap.classList.add('viewer-wrap');
  el.appendChild(this.svgWrap);

  // Create the 'a' tag to download
  this.downloadAnchor = document.createElement('a');
  this.downloadAnchor.style = 'display: none';
  this.el.appendChild(this.downloadAnchor);
}

/**
 * SVGコンテンツタイプ
 * @type {String}
 */
ViewerController.prototype.SVG_CONTENT_TYPE = 'image/svg+xml';

/**
 *ダウンロードをシミュレートしてSVGを提供
 */
ViewerController.prototype.download = function () {
    //SVGのゴミをCDATAに書き換える処理
    var innerHTML = this.dustToCdata(this.svgTag.outerHTML);
//console.log("download: ",this.svgTag.outerHTML);
    var blob = new Blob([innerHTML], {type: this.SVG_CONTENT_TYPE}),
    url = window.URL.createObjectURL(blob);
    this.downloadAnchor.href = url;
    this.downloadAnchor.download = this.svgFileName.replace(/\.svg$/i, '_animated.svg');
    this.downloadAnchor.click();
    window.setTimeout(function () {
      window.URL.revokeObjectURL(url);
    }, 10);
};

/**
 *SVGデータに正規のCDATAで置き換える
  * cdata:これがないとブラウザでエラーが出る
*/
ViewerController.prototype.dustToCdata = function(inSVG) {
  var cdata = 
'<!-- \n' +
' Super筆順辞典 for Web : Animation SVG\n' +
'\n' +
'     Copyright ©2020 NOWPRODUCTION CO.,LTD\n' +
'-->\n' +
'<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.0//EN" "http://www.w3.org/TR/2001/REC-SVG-20010904/DTD/svg10.dtd" [\n' + 
'  <!ATTLIST g\n' +
'    xmlns:kvg       CDATA #FIXED "http://kanjivg.tagaini.net"\n' +
'    kvg:element     CDATA #IMPLIED\n' +
'    kvg:variant     CDATA #IMPLIED\n' +
'    kvg:partial     CDATA #IMPLIED\n' +
'    kvg:original    CDATA #IMPLIED\n' +
'    kvg:part        CDATA #IMPLIED\n' +
'    kvg:number      CDATA #IMPLIED\n' +
'    kvg:tradForm    CDATA #IMPLIED\n' +
'    kvg:radicalForm CDATA #IMPLIED\n' +
'    kvg:position    CDATA #IMPLIED\n' +
'    kvg:radical     CDATA #IMPLIED\n' +
'    kvg:phon        CDATA #IMPLIED \n' +
'  >\n' +
'  <!ATTLIST path\n' +
'    xmlns:kvg       CDATA #FIXED "http://kanjivg.tagaini.net"\n' +
'    kvg:type        CDATA #IMPLIED \n' +
'  >\n' +
']>\n' +
'<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 110 110" id="SVGID">\n';

  //DOMにappendすると改行されなくなるのでダウンロードファイルでは修正しておく
  var a = inSVG.replace('<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 110 110" id="SVGID">',cdata)
  a = a.replace(/<\/path><\/g>/g,'</path>\n</g>');
  a = a.replace(/path></g,'path>\n\t<');
  a = a.replace(/><path/g,'>\n\t<path');
  return(a);
};

