'use strict';

/**
  *パスフォーマー
  * ベータ版
  *
  * SVGバージョン1.1を使用して変換する
  *子要素から「パス」要素
  *
  *このコードは純粋に
  * https://github.com/Waest/SVGPathConverter
  */

/**
  *クラスコンストラクター
  *
  * @param {DOM | String}要素SVGのDom要素またはそのID
  */
function Pathformer(element) {
  // Test params
  if (typeof element === 'undefined') {
    throw new Error('Pathformer [constructor]: "element"パラメータが必要です');
  }

  // Set the element
  if (element.constructor === String) {
    element = document.getElementById(element);
    if (!element) {
      throw new Error('Pathformer [constructor]: "element" パラメーターは既存のIDに関連していません');
    }
  }
  if (element instanceof window.SVGElement || element instanceof window.SVGGElement || /^svg$/i.test(element.nodeName)) {
    this.el = element;
  } else {
    throw new Error('Pathformer [constructor]: "element" パラメータは文字列またはSVG要素である必要があります');
  }

  // Start
  this.scan(element);
}

/**
  *変換できるタグのリスト
  *パス要素へ
  *
  * @type {Array}
  */
Pathformer.prototype.TYPES = ['line', 'ellipse', 'circle', 'polygon', 'polyline', 'rect'];

/**
  *を含む属性名のリスト
  *データ この配列は、それらをリストして、
  *パーセンテージなどの悪い値が含まれています。
  *
  * @type {Array}
  */
Pathformer.prototype.ATTR_WATCH = ['cx', 'cy', 'points', 'r', 'rx', 'ry', 'x', 'x1', 'x2', 'y', 'y1', 'y2'];

/**
  *変換に互換性のある要素を見つけます
  *いいね！メソッドを適用
  *
  * @param {object} optionsコンストラクターからのオブジェクト
  */
Pathformer.prototype.scan = function (svg) {
  var fn, element, pathData, pathDom,
      elements = svg.querySelectorAll(this.TYPES.join(','));
//console.log("Pathfomer:scan:svg:",svg);
//console.log("Pathfomer:scan:elements:",elements);
  for (var i = 0; i < elements.length; i++) {
    element = elements[i];
    fn = this[element.tagName.toLowerCase() + 'ToPath'];
    pathData = fn(this.parseAttr(element.attributes));
    pathDom = this.pathMaker(element, pathData);
    element.parentNode.replaceChild(pathDom, element);
  }
};


/**
  *「line」要素を読み取り、抽出および変換する
  *データ。`path`オブジェクトの準備を整えます。
  *
  * @param {DOMelement}要素変換する行要素
  * @return {object} `path`要素のデータ
  */
Pathformer.prototype.lineToPath = function (element) {
  var newElement = {},
      x1 = element.x1 || 0,
      y1 = element.y1 || 0,
      x2 = element.x2 || 0,
      y2 = element.y2 || 0;

  newElement.d = 'M' + x1 + ',' + y1 + 'L' + x2 + ',' + y2;
  return newElement;
};

/**
  *「rect」要素を読み取り、抽出および変換する
  *データ。`path`オブジェクトの準備を整えます。
  * radius-borderはまだ担当していません。
  *（あなたの助けは大歓迎です）
  *
  * @param {DOMelement}要素変換するRect要素
  * @return {object} `path`要素のデータ
  */
Pathformer.prototype.rectToPath = function (element) {
  var newElement = {},
      x      = parseFloat(element.x)      || 0,
      y      = parseFloat(element.y)      || 0,
      width  = parseFloat(element.width)  || 0,
      height = parseFloat(element.height) || 0;

  if (element.rx || element.ry) {
    var rx = parseInt(element.rx, 10) || -1,
        ry = parseInt(element.ry, 10) || -1;
    rx = Math.min(Math.max(rx < 0 ? ry : rx, 0), width/2);
    ry = Math.min(Math.max(ry < 0 ? rx : ry, 0), height/2);

    newElement.d = 'M ' + (x + rx) + ',' + y + ' ' +
                   'L ' + (x + width - rx) + ',' + y + ' ' +
                   'A ' + rx + ',' + ry + ',0,0,1,' + (x + width) + ',' + (y + ry) + ' ' +
                   'L ' + (x + width) + ',' + (y + height - ry) + ' ' +
                   'A ' + rx + ',' + ry + ',0,0,1,' + (x + width - rx) + ',' + (y + height) + ' ' +
                   'L ' + (x + rx) + ',' + (y + height) + ' ' +
                   'A ' + rx + ',' + ry + ',0,0,1,' + x + ',' + (y + height - ry) + ' ' +
                   'L ' + x + ',' + (y + ry) + ' ' +
                   'A ' + rx + ',' + ry + ',0,0,1,' + (x + rx) + ',' + y;
  }
  else {
    newElement.d = 'M' + x + ' ' + y + ' ' +
                   'L' + (x + width) + ' ' + y + ' ' +
                   'L' + (x + width) + ' ' + (y + height) + ' ' +
                   'L' + x + ' ' + (y + height) + ' Z';
  }
  return newElement;
};

/**
  *「polyline」要素を読み取り、抽出および変換する
  *データ。`path`オブジェクトの準備を整えます。
  *
  * @param {DOMelement}要素変換するポリライン要素
  * @return {object} `path`要素のデータ
  */
Pathformer.prototype.polylineToPath = function (element) {
  var newElement = {},
      points = element.points.trim().split(' '),
      i, path;

  // Reformatting if points are defined without commas
  if (element.points.indexOf(',') === -1) {
    var formattedPoints = [];
    for (i = 0; i < points.length; i+=2) {
      formattedPoints.push(points[i] + ',' + points[i+1]);
    }
    points = formattedPoints;
  }

  // Generate the path.d value
  path = 'M' + points[0];
  for(i = 1; i < points.length; i++) {
    if (points[i].indexOf(',') !== -1) {
      path += 'L' + points[i];
    }
  }
  newElement.d = path;
  return newElement;
};


/**
  *「polygon」要素を読み取り、抽出して変換する
  *データ。`path`オブジェクトの準備を整えます。
  *このメソッドはpolylineToPathに依存しています。
  *ロジックは似ています。 作成されたパスは閉じられたばかりで、
  *したがって、最後に「Z」が必要です。
  *
  * @param {DOMelement}要素変換するポリゴン要素
  * @return {object} `path`要素のデータ
  */
Pathformer.prototype.polygonToPath = function (element) {
  var newElement = Pathformer.prototype.polylineToPath(element);

  newElement.d += 'Z';
  return newElement;
};

/**
  *「ellipse」要素を読み取り、抽出および変換します
  *データ `path`オブジェクトの準備を整えます。
  *
  * @param {DOMelement}要素変換する楕円要素
  * @return {object} `path`要素のデータ
  */
Pathformer.prototype.ellipseToPath = function (element) {
  var newElement = {},
      rx = parseFloat(element.rx) || 0,
      ry = parseFloat(element.ry) || 0,
      cx = parseFloat(element.cx) || 0,
      cy = parseFloat(element.cy) || 0,
      startX = cx - rx,
      startY = cy,
      endX = parseFloat(cx) + parseFloat(rx),
      endY = cy;

  newElement.d = 'M' + startX + ',' + startY +
                 'A' + rx + ',' + ry + ' 0,1,1 ' + endX + ',' + endY +
                 'A' + rx + ',' + ry + ' 0,1,1 ' + startX + ',' + endY;
  return newElement;
};

/**
  *「circle」要素を読み取り、抽出および変換します
  *データ。`path`オブジェクトの準備を整えます。
  *
  * @param {DOMelement}要素変換するCircle要素
  * @return {object} `path`要素のデータ
  */
Pathformer.prototype.circleToPath = function (element) {
  var newElement = {},
      r  = parseFloat(element.r)  || 0,
      cx = parseFloat(element.cx) || 0,
      cy = parseFloat(element.cy) || 0,
      startX = cx - r,
      startY = cy,
      endX = parseFloat(cx) + parseFloat(r),
      endY = cy;
      
  newElement.d =  'M' + startX + ',' + startY +
                  'A' + r + ',' + r + ' 0,1,1 ' + endX + ',' + endY +
                  'A' + r + ',' + r + ' 0,1,1 ' + startX + ',' + endY;
  return newElement;
};

/**
  *元の要素から「パス」要素を作成する
  *および準備されたオブジェクト
  *
  * @param {DOMelement}要素変換する元の要素
  * @param {object} pathDataパスデータ（ `toPath`メソッドから）
  * @return {DOMelement}パス要素
  */
Pathformer.prototype.pathMaker = function (element, pathData) {
  var i, attr, pathTag = document.createElementNS('http://www.w3.org/2000/svg','path');
  for(i = 0; i < element.attributes.length; i++) {
    attr = element.attributes[i];
    if (this.ATTR_WATCH.indexOf(attr.name) === -1) {
      pathTag.setAttribute(attr.name, attr.value);
    }
  }
  for(i in pathData) {
    pathTag.setAttribute(i, pathData[i]);
  }

//console.log("pathformer:pathmaker");
//console.log(pathTag);

  return pathTag;
};

/**
 * DOM要素の属性を解析して
 *属性のオブジェクトを取得=>値
 *
 * @param {NamedNodeMap}属性解析するDOM要素の属性オブジェクト
 * @return {object}属性のオブジェクト
 */
Pathformer.prototype.parseAttr = function (element) {
  var attr, output = {};
  for (var i = 0; i < element.length; i++) {
    attr = element[i];
    // データ属性に「％」が含まれていないか、変換が不可能かどうかを確認してください
    if (this.ATTR_WATCH.indexOf(attr.name) !== -1 && attr.value.indexOf('%') !== -1) {
      throw new Error('Pathformer [parseAttr]: SVGシェイプはパーセンテージで値を取得しました。 これは path タグに変換できません。 viewBox を使用してください。');
    }
    output[attr.name] = attr.value;
  }

//console.log("pathformer:parseAttr");
//console.log(output);

  return output;
};