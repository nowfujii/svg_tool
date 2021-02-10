/**
 * vivus - JavaScript library to make drawing animation on SVG
 * @version v0.4.5
 * @link https://github.com/maxwellito/vivus
 * @license MIT
 */

(function () {

  'use strict';

/**
//------------------------------------------------------------------------------------------------------------------------
  *pathformer
  * ベータ版
  *
  * SVGバージョン1.1を使用して変換する
  *子要素から「パス」要素
  *
  *このコードは純粋に
  * https://github.com/Waest/SVGPathConverter
//------------------------------------------------------------------------------------------------------------------------
  */

/**
  *クラスコンストラクター
  *
  * @param {DOM | String}要素SVGのDom要素またはそのID
  */
function Pathformer(element) {
  // Test params
  if (typeof element === 'undefined') {
    throw new Error('Pathformer [constructor]: "element" parameter is required');
  }

  // Set the element
  if (element.constructor === String) {
    element = document.getElementById(element);
    if (!element) {
      throw new Error('Pathformer [constructor]: "element" parameter is not related to an existing ID');
    }
  }
  if (element instanceof window.SVGElement || 
      element instanceof window.SVGGElement ||
      /^svg$/i.test(element.nodeName)) {
    this.el = element;
  } else {
    throw new Error('Pathformer [constructor]: "element" parameter must be a string or a SVGelement');
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
    // Check if no data attribute contains '%', or the transformation is impossible
    if (this.ATTR_WATCH.indexOf(attr.name) !== -1 && attr.value.indexOf('%') !== -1) {
      throw new Error('Pathformer [parseAttr]: a SVG shape got values in percentage. This cannot be transformed into \'path\' tags. Please use \'viewBox\'.');
    }
    output[attr.name] = attr.value;
  }
  return output;
};

  'use strict';

var setupEnv, requestAnimFrame, cancelAnimFrame, parsePositiveInt;

/**
//------------------------------------------------------------------------------------------------------------------------
 * Vivus
 * Beta version
 *
 * Take any SVG and make the animation
 * to give give the impression of live drawing
 *
 * This in more than just inspired from codrops
 * At that point, it's a pure fork.
//------------------------------------------------------------------------------------------------------------------------
 */

/**
* Class constructor
*   option structure
*      type:                 'delayed'|'sync'|'oneByOne'|'script'
*                            （アイテムを同期的に描画する必要があるかどうかを確認するには、デフォルト：delayed）
*      duration:             <int>（フレーム単位）
*      start:                'inViewport'|'manual'|'autostart'（アニメーションを自動的に開始、デフォルト：inViewport）
*      delay:                <int>（最初と最後のパスの描画間の遅延）
*      dashGap               <integer> ダッシュ間の余白
*      pathTimingFunction    <function> SVGの各パス要素のタイミングアニメーション関数
*      animTimingFunction    <function>完全なSVGのタイミングアニメーション関数
*      forceRender           <boolean>は、更新されたすべてのパス項目をブラウザに再レンダリングします。
*      selfDestroy           <boolean>はSVGのすべての余分なスタイルを削除し、元のままにします
*
*   属性「type」はデフォルトで「delayed」です。
*     -delayed「遅延」      すべてのパスは同時に描画されますが、開始前にそれらの間の小さな遅延
*     -sync「同期」         すべてのパスが同時に開始および終了します
*     -oneByOne「一つずつ」  最初のパスの終わりが次のパスの描画をトリガーするときに、1つのパスのみが描画されます
*
*     これらの値はすべて、SVGのパス項目ごとに個別に上書きできます。フレームの値は、継続時間の値を常に利用します。
*     どこかで失敗した場合、エラーがスローされます。
*     
*      @コンストラクタ
*      @this {Vivus}
*      @param {DOM|String}  要素SVGのDom要素またはそのID
*      @param {Object}      オプションアニメーションに関するオプション
*      @param {Function}    コールバックアニメーションの最後のコールバック
 */

var _this = this;

function Vivus(element, options, callback) {
  console.log("vivus:element:",element);
  console.log("vivus:options:",options);
  console.log("vivus:callback:",callback);


  setupEnv();

  // Setup
  this.options = options;
  this.isReady = false;
  this.setElement(element, options);
  this.setOptions(options);
  this.setCallback(callback);


  if (this.isReady) {
    this.init(options);
  }
}

/**
 * Timing functions
 **************************************
 *
 * 開発者を支援するデフォルト関数。
 * 常にパラメーターとして数値（0から1の間）を取ります
 * 数値を返します（0と1の間）
 */
Vivus.LINEAR = function(x) {
  return x;
};
Vivus.EASE = function(x) {
  return -Math.cos(x * Math.PI) / 2 + 0.5;
};
Vivus.EASE_OUT = function(x) {
  return 1 - Math.pow(1 - x, 3);
};
Vivus.EASE_IN = function(x) {
  return Math.pow(x, 3);
};
Vivus.EASE_OUT_BOUNCE = function(x) {
  var base = -Math.cos(x * (0.5 * Math.PI)) + 1,
    rate = Math.pow(base, 1.5),
    rateR = Math.pow(1 - x, 2),
    progress = -Math.abs(Math.cos(rate * (2.5 * Math.PI))) + 1;
  return 1 - rateR + progress * rateR;
};

/**
 * Setters
 **************************************
 */

/**
 * インスタンスの要素を確認して設定します
 * メソッドは何も返しませんが、パラメータが無効な場合はエラーをスローします
 *
 * @param {DOM | String}  element  SVG Dom element or id of it
 */
Vivus.prototype.setElement = function(element, options) {
  var onLoad, self;
  var idTag = element;

  // Basic check
  if (typeof element === 'undefined') {
    throw new Error('NOWPRO SVGアニメーション再生ツール [constructor]: "element"パラメータは既存のIDに関連していません');
  }

  // Set the element
  if (element.constructor === String) {
    element = document.getElementById(element);
    if (!element) {
      throw new Error(
        'Vivus [constructor]: "NOWPRO SVGアニメーション再生ツール [constructor]: "element"パラメーターは既存のIDに関連していません'
      );
    }
  }
  this.parentEl = element;

  // Load the SVG with XMLHttpRequest and extract the SVG
  if (options && options.file) {
    self = this;
    onLoad = function() {
      var domSandbox = document.createElement('div');
      domSandbox.innerHTML = this.responseText;

      var svgTag = domSandbox.querySelector('svg');
      if (!svgTag) {
        throw new Error(
          'Vivus [load]: ロードされたファイルでSVGが見つかりません : ' +
            options.file
        );
      }

      self.el = svgTag;
      self.el.setAttribute('width', '100%');
      self.el.setAttribute('height', '100%');
      self.parentEl.appendChild(self.el);
      self.isReady = true;
//console.table("self.el:",self.el);
      self.init(options);
      self = null;
    };

    var oReq = new window.XMLHttpRequest();
    oReq.addEventListener('load', onLoad);
    oReq.open('GET', options.file);
    oReq.send();
    return;
  }

  switch (element.constructor) {
    case window.SVGSVGElement:
    case window.SVGElement:
    case window.SVGGElement:
      this.el = element;
      this.isReady = true;
      break;

    case window.HTMLObjectElement:
      self = this;
      onLoad = function(e) {
        if (self.isReady) {
          return;
        }
        self.el =
          element.contentDocument &&
          element.contentDocument.querySelector('svg');
        if (!self.el && e) {
          throw new Error(
            'Vivus [constructor]: ロードされたオブジェクトにはSVGが含まれていません'
          );
        } else if (self.el) {
          if (element.getAttribute('built-by-vivus')) {
            self.parentEl.insertBefore(self.el, element);
            self.parentEl.removeChild(element);
            self.el.setAttribute('width', '100%');
            self.el.setAttribute('height', '100%');
          }
          self.isReady = true;
          self.init(options);
          self = null;
        }
      };

      if (!onLoad()) {
        element.addEventListener('load', onLoad);
      }
      break;

    default:
      throw new Error(
        'Vivus [constructor]: 「element」パラメータが無効です（または「ファイル」属性がありません）'
      );
  }
};

/**
 * インスタンスにユーザーオプションを設定します。
 * メソッドは何も返しませんが、パラメータが無効な場合はエラーをスローします
 * @param  {object} options Object from the constructor
 */
Vivus.prototype.setOptions = function(options) {
  var allowedTypes = [
    'delayed',
    'sync',
    'async',
    'nsync',
    'oneByOne',
    'scenario',
    'scenario-sync'
  ];
  var allowedStarts = ['inViewport', 'manual', 'autostart'];

  // 基本チェック
  if (options !== undefined && options.constructor !== Object) {
    throw new Error(
      'Vivus [constructor]: 「オプション」パラメータはオブジェクトでなければなりません'
    );
  } else {
    options = options || {};
  }

  // アニメーションの種類を設定する
  if (options.type && allowedTypes.indexOf(options.type) === -1) {
    throw new Error(
      'Vivus [constructor]: ' +
        options.type +
        ' 既存のアニメーション「タイプ」ではありません'
    );
  } else {
    this.type = options.type || allowedTypes[0];
  }

  // 開始タイプを設定する
  if (options.start && allowedStarts.indexOf(options.start) === -1) {
    throw new Error(
      'Vivus [constructor]: ' +
        options.start +
        ' 既存の「開始」オプションではありません'
    );
  } else {
    this.start = options.start || allowedStarts[0];
  }

  this.isIE =
    window.navigator.userAgent.indexOf('MSIE') !== -1 ||
    window.navigator.userAgent.indexOf('Trident/') !== -1 ||
    window.navigator.userAgent.indexOf('Edge/') !== -1;
  this.duration = parsePositiveInt(options.duration, 120);
  this.delay = parsePositiveInt(options.delay, null);
  this.dashGap = parsePositiveInt(options.dashGap, 1);
  this.forceRender = options.hasOwnProperty('forceRender')
    ? !!options.forceRender
    : this.isIE;
  this.reverseStack = !!options.reverseStack;
  this.selfDestroy = !!options.selfDestroy;
  this.onReady = options.onReady;
  this.map = [];
  this.frameLength = this.currentFrame = this.delayUnit = this.speed = this.handle = null;

  this.ignoreInvisible = options.hasOwnProperty('ignoreInvisible')
    ? !!options.ignoreInvisible
    : false;

  this.animTimingFunction = options.animTimingFunction || Vivus.LINEAR;
  this.pathTimingFunction = options.pathTimingFunction || Vivus.LINEAR;

  if (this.delay >= this.duration) {
    throw new Error('Vivus [constructor]: 遅延は期間より短くなければなりません');
  }
};

/**
 * インスタンスへのコールバックを設定します
 * メソッドはenythingを返しませんが、パラメーターが無効な場合はエラーをスローします
 *
 * @param  {Function} callback アニメーション終了のコールバック
 */
Vivus.prototype.setCallback = function(callback) {
  // 基本チェック
  if (!!callback && callback.constructor !== Function) {
    throw new Error(
      'Vivus [constructor]: "コールバックパラメータは関数でなければなりません'
    );
  }
  this.callback = callback || function() {};
};

/**
 * パスごとにsvgをマップします。
 * このメソッドは何も返さず、 `map`配列を満たすだけです。
 * この配列の各項目は、SVGからのパス要素とアニメーションの情報を表します。
 *
 * [
 *   {
 *     el:       <DOMobj> パス要素
 *     length:   <number> パスラインの長さ
 *     startAt:  <number> パスアニメーションの開始時間 (in frames)
 *     duration: <number> パスアニメーション期間 (in frames)
 *   },
 * ]
 *
 */
Vivus.prototype.mapping = function(options) {
  var i, paths, path, pAttrs, pathObj, totalLength, lengthMeter, timePoint;
  timePoint = totalLength = lengthMeter = 0;
  paths = this.el.querySelectorAll('path');

  for (i = 0; i < paths.length; i++) {
    path = paths[i];
    if (this.isInvisible(path)) {
      continue;
    }
    pathObj = {
      el: path,
      length: Math.ceil(path.getTotalLength())
    };
    // パスの長さが正しいかどうかをテストする
    if (isNaN(pathObj.length)) {
      if (window.console && console.warn) {
        console.warn(
          'Vivus [mapping]: パス要素の長さを取得できません',
          path
        );
      }
      continue;
    }

    this.map.push(pathObj);
    path.style.strokeDasharray  = pathObj.length + ' ' + (pathObj.length + this.dashGap * 2);
    path.style.strokeDashoffset = pathObj.length + this.dashGap;
    pathObj.length += this.dashGap;
    totalLength += pathObj.length;

    this.renderPath(i);
  }

  totalLength = totalLength === 0 ? 1 : totalLength;
  this.delay = this.delay === null ? this.duration / 3 : this.delay;
  this.delayUnit = this.delay / (paths.length > 1 ? paths.length - 1 : 1);

  // 要求された場合はスタックを反転
  if (this.reverseStack) {
    this.map.reverse();
  }

  for (i = 0; i < this.map.length; i++) {
    pathObj = this.map[i];

    switch (this.type) {
      case 'delayed':
        pathObj.startAt = this.delayUnit * i;
        pathObj.duration = this.duration - this.delay;
        break;

      case 'oneByOne':
        pathObj.startAt = (lengthMeter / totalLength) * this.duration;
        pathObj.duration = (pathObj.length / totalLength) * this.duration;
        break;

      case 'sync':
      case 'async':
      case 'nsync':
        pathObj.startAt = 0;
        pathObj.duration = this.duration;
        break;

      case 'scenario-sync':
        path = pathObj.el;
        pAttrs = this.parseAttr(path);
        pathObj.startAt =
          timePoint +
          (parsePositiveInt(pAttrs['data-delay'], this.delayUnit) || 0);
        pathObj.duration = parsePositiveInt(
          pAttrs['data-duration'],
          this.duration
        );
        timePoint =
          pAttrs['data-async'] !== undefined
            ? pathObj.startAt
            : pathObj.startAt + pathObj.duration;
        this.frameLength = Math.max(
          this.frameLength,
          pathObj.startAt + pathObj.duration
        );
        break;

      case 'scenario':
        path = pathObj.el;
        pAttrs = this.parseAttr(path);
        pathObj.startAt =
          parsePositiveInt(pAttrs['data-start'], this.delayUnit) || 0;
        pathObj.duration = parsePositiveInt(
          pAttrs['data-duration'],
          this.duration
        );
        this.frameLength = Math.max(
          this.frameLength,
          pathObj.startAt + pathObj.duration
        );
        break;
    }
    lengthMeter += pathObj.length;
    this.frameLength = this.frameLength || this.duration;
  }

console.log("mapping:this.map[]:",this.map);
};


/**
 * アニメーションの現在の位置からSVGを描画する間隔メソッド。
 * `currentFrame`の値を更新し、SVGを再トレースします。
 * this.handleを使用してrequestAnimationFrameを格納し、アニメーションが停止するとクリアします。
 * したがって、この属性を使用して、アニメーションが再生されているかどうかを知ることができます。
 * アニメーションが終了すると、このメソッドはVivusコールバックをトリガーします。
 */
Vivus.prototype.drawer = function() {
  var self = this;
  this.currentFrame += this.speed;    //フレーム数カウント　speed分を足し加えていく

  if (this.currentFrame <= 0) {
console.log("マイナスの時呼ばれる？:",this.currentFrame);
    //最初の一回　onReadyCallback()が呼ばれる
    this.stop();
    this.reset();

  } else if (this.currentFrame >= this.frameLength) {
console.log("アニメーション終了:",this.currentFrame);
    //アニメーション終了
    this.stop();
    this.currentFrame = this.frameLength;
    this.trace();
    if (this.selfDestroy) {
      this.destroy();
    }
    //to callback

  } else {
//console.log("通常アニメーション処理:",this.currentFrame);
    //通常アニメーション処理 （timerを仕込んで自分自身を呼んでいる）
    this.trace();
    this.handle = requestAnimFrame(function() {
      self.drawer();
    });
    return;
  }

  //アニメーション完了時のコールバック呼び出し
  this.callback(this);
  if (this.instanceCallback) {
    this.instanceCallback(this);
    this.instanceCallback = null;
  }
};

/**
 * `currentFrame`値から現在の瞬間にSVGを描画します。 ほとんどの魔法はここにあります。
 * コツは `strokeDashoffset`スタイルプロパティを使用することです。
 * 最適化のため、 `map`の各アイテムに` progress`という新しいプロパティが追加されています。
 *
 * これには、パス要素の現在の進行状況が含まれています。 
 * 新しい値が異なる場合にのみ、新しい値がDOM要素に適用されます。
 * このメソッドは、SVGを再レンダリングするために多くのリソースを節約します。
 * アニメーションを順方向に再生できなかった場合は、改善される可能性があります。
 */
Vivus.prototype.trace = function() {
  var i, progress, path, currentFrame;
  currentFrame = this.animTimingFunction(this.currentFrame / this.frameLength) * this.frameLength;
  for (i = 0; i < this.map.length; i++) {
    path = this.map[i];
    progress = (currentFrame - path.startAt) / path.duration;
    progress = this.pathTimingFunction(Math.max(0, Math.min(1, progress)));
    if (path.progress !== progress) {
      path.progress = progress;
      path.el.style.strokeDashoffset = Math.floor(path.length * (1 - progress));
      this.renderPath(i);
    }
    //fujii
    if (progress && path.progress) {
      //progressに値が入っていれば現在アニメ中のストローク
      document.getElementById('outputStrokeNow').innerHTML = i;
      document.getElementById('outputStrokeSuu').innerHTML = this.map.length;
    }
  }
};

/**
 * ブラウザにマップ内のインデックスからパス要素を再レンダリングするよう強制するメソッド。
 * `forceRender`の値によって異なります。
 * 
 * トリックは、パス要素をそのクローンに置き換えることです。
 * この方法は、より多くのリソースを要求し、DOM操作が多すぎるため、推奨されません。
 * しかし、それはIEで魔法を起こさせる唯一の方法です。
 * デフォルトでは、このフォールバックはIEにのみ適用されます。
 * @param  {Number} index Path index
 */
Vivus.prototype.renderPath = function(index) {
  if (this.forceRender && this.map && this.map[index]) {
    var pathObj = this.map[index], newPath = pathObj.el.cloneNode(true);
    pathObj.el.parentNode.replaceChild(newPath, pathObj.el);
    pathObj.el = newPath;
  }
};

/**
 * SVGオブジェクトが読み込まれて準備ができると、このメソッドは初期化を続行します。
 *
 * これは、主にコンストラクタでオブジェクトタグを渡す場合が原因です。
 * ロードの終了を初期化します。
 */
Vivus.prototype.init = function(options) {
  // Set object variables
  this.frameLength = 0;
  this.currentFrame = 0;
  this.map = [];

  // Start
  new Pathformer(this.el);

  this.mapping(options);
  this.starter();

  if (this.onReady) {
    this.onReady(this);
  }
};

/**
 * アニメーションの開始をトリガーします。
 * `start`の値に応じて、異なるスクリプトが適用されます。
 *
 * `start`値が有効でない場合、エラーがスローされます。
 * ※技術的にも不可能です。
 */
Vivus.prototype.starter = function() {
  switch (this.start) {
    case 'manual':
      return;

    case 'autostart':
      this.play();
      break;

    case 'inViewport':
      var self = this,
        listener = function() {
          if (self.isInViewport(self.parentEl, 1)) {
            self.play();
            window.removeEventListener('scroll', listener);
          }
        };
      window.addEventListener('scroll', listener);
      listener();
      break;
  }
};

/**
 * Controls
 **************************************
 */

/**
* 3つの異なる状態（「開始」、「進行」、「終了」）の間のアニメーションの現在のステータスを取得します。
 * @return {string} Instance status
 */
Vivus.prototype.getStatus = function() {
  return this.currentFrame === 0
    ? 'start'
    : this.currentFrame === this.frameLength
    ? 'end'
    : 'progress';
};

/**
 * インスタンスを初期状態にリセットします：undraw注意、アニメーションをリセットするだけです。
 * アニメーションを再生している場合、これはそれを停止しません。 
 * しかし、最初から始めてください。
 *
 */
Vivus.prototype.reset = function() {
  return this.setFrameProgress(0);
};

/**
 * インスタンスを最終状態に設定します：描画注意、アニメーションを設定するだけです。
 * 巻き戻しでアニメーションを再生している場合、これはそれを停止しません。
 * ただし、最後から始めてください。
 */
Vivus.prototype.finish = function() {
  return this.setFrameProgress(1);
};

/**
 * 描画の進行レベルを設定します。
 *
 * @param {number} progress Level of progress to set
 */
Vivus.prototype.setFrameProgress = function(progress) {
  progress = Math.min(1, Math.max(0, progress));
  this.currentFrame = Math.round(this.frameLength * progress);
  this.trace();
  return this;
};

/**
 * アニメーションを希望の速度で再生します。
 * 速度は有効な数値（ゼロなし）でなければなりません。
 * デフォルトでは、速度の値は1です。
 * ただし、負の値は受け入れられます。
 *
 * そして、フロートでも動作します。
 * しかし、JavaScriptを使用していることを忘れないでください。
 * 彼と親しくなり、1/2 ^ xの値を指定してください。
 *
 * @param  {number} speed Animation speed [optional]
 */
Vivus.prototype.play = function(speed, callback) {
console.log("vivus.play():",speed);
  this.instanceCallback = null;

  if (speed && typeof speed === 'function') {
    this.instanceCallback = speed; // 最初のパラメータは実際にはコールバック関数です
    speed = null;
  } else if (speed && typeof speed !== 'number') {
    throw new Error('Vivus [play]: invalid speed');
  }
  // 最初のパラメータがコールバックでなかった場合は、秒数が
  if (callback && typeof callback === 'function' && !this.instanceCallback) {
    this.instanceCallback = callback;
  }

  this.speed = speed || 1;
  if (!this.handle) {
    this.drawer();
  }
  return this;
};

/**
 * 進行中の場合、現在のアニメーションを停止します。
 * エラーは発生しません。
 */
Vivus.prototype.stop = function() {
  if (this.handle) {
    cancelAnimFrame(this.handle);
    this.handle = null;
  }
  return this;
};

/**
 * インスタンスを破棄します。
 * すべてのパスタグのすべての不適切なスタイル属性を削除する
 */
Vivus.prototype.destroy = function() {
  this.stop();
  var i, path;
  for (i = 0; i < this.map.length; i++) {
    path = this.map[i];
    path.el.style.strokeDashoffset = null;
    path.el.style.strokeDasharray = null;
    this.renderPath(i);
  }
};

/**
 * Utils methods
 * Codropsのメソッドを含める
 **************************************
 */

/**
 * パスをアニメーションに追加する必要があるかどうかを最もよく推測する方法。
 * 
 *  1.設定されている場合は、 `data-vivus-ignore`属性を使用します
 *  2.インスタンスが非表示のパスを無視する必要があるかどうかを確認する
 *  3.パスが表示されているかどうかを確認します
 * 
 * 現在のところ、可視性チェックは不安定です。
 * ベータ段階で使用されます。
 * 
 * その他の改善も予定されています。 検出と同様に、パスはストロークまたは有効な不透明度を取得しました。
 */
Vivus.prototype.isInvisible = function(el) {
  var rect,
    ignoreAttr = el.getAttribute('data-ignore');

  if (ignoreAttr !== null) {
    return ignoreAttr !== 'false';
  }

  if (this.ignoreInvisible) {
    rect = el.getBoundingClientRect();
    return !rect.width && !rect.height;
  } else {
    return false;
  }
};

/**
 * DOM要素の属性を解析して
 * {attributeName => attributeValue}のオブジェクトを取得します
 *
 * @param  {object} element DOM element to parse
 * @return {object}         Object of attributes
 */
Vivus.prototype.parseAttr = function(element) {
  var attr,
    output = {};
  if (element && element.attributes) {
    for (var i = 0; i < element.attributes.length; i++) {
      attr = element.attributes[i];
      output[attr.name] = attr.value;
    }
  }
  return output;
};

/**
 * 要素がページビューポートにある場合に返信する
 *
 * @param  {object} el Element to observe
 * @param  {number} h  Percentage of height
 * @return {boolean}
 */
Vivus.prototype.isInViewport = function(el, h) {
  var scrolled = this.scrollY(),
    viewed = scrolled + this.getViewportH(),
    elBCR = el.getBoundingClientRect(),
    elHeight = elBCR.height,
    elTop = scrolled + elBCR.top,
    elBottom = elTop + elHeight;

  // 0の場合、要素はビューポートに入るとすぐに考慮されます。
  // 1の場合、要素は完全に内側にある場合にのみビューポートで考慮されます
  // value in percentage (1 >= h >= 0)
  h = h || 0;

  return elTop + elHeight * h <= viewed && elBottom >= scrolled;
};

/**
 * ビューポートの高さをピクセル単位で取得します
 *
 * @return {integer} Viewport height
 */
Vivus.prototype.getViewportH = function() {
  var client = this.docElem.clientHeight,
    inner = window.innerHeight;

  if (client < inner) {
    return inner;
  } else {
    return client;
  }
};

/**
 * ページのYオフセットを取得する
 *
 * @return {integer} Page Y offset
 */
Vivus.prototype.scrollY = function() {
  return window.pageYOffset || this.docElem.scrollTop;
};

setupEnv = function() {
  if (Vivus.prototype.docElem) {
    return;
  }

  /**
   * ドキュメント要素のエイリアス
   *
   * @type {DOMelement}
   */
  Vivus.prototype.docElem = window.document.documentElement;

  /**
   * 廃止されたブラウザの `requestAnimationFrame`または` setTimeout`関数のエイリアス。
   */
  requestAnimFrame = (function() {
    return (
      window.requestAnimationFrame ||
      window.webkitRequestAnimationFrame ||
      window.mozRequestAnimationFrame ||
      window.oRequestAnimationFrame ||
      window.msRequestAnimationFrame ||
      function(/* function */ callback) {
        return window.setTimeout(callback, 1000 / 60);
      }
    );
  })();

  /**
   * 廃止されたブラウザの `cancelAnimationFrame`または` cancelTimeout`関数のエイリアス。
   *
   */
  cancelAnimFrame = (function() {
    return (
      window.cancelAnimationFrame ||
      window.webkitCancelAnimationFrame ||
      window.mozCancelAnimationFrame ||
      window.oCancelAnimationFrame ||
      window.msCancelAnimationFrame ||
      function(id) {
        return window.clearTimeout(id);
      }
    );
  })();
};

/**
 * 文字列を整数に解析します。
 * 数値が正またはnullでない場合、メソッドはデフォルト値を返すか、未定義の場合は0を返します。
 *
 * @param {string}  解析する文字列
 * @param {*}       defaultValue解析された結果が無効な場合に返す値
 * @return {number}
 *
 */
parsePositiveInt = function(value, defaultValue) {
  var output = parseInt(value, 10);
  return output >= 0 ? output : defaultValue;
};


  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define([], function() {
      return Vivus;
    });
  } else if (typeof exports === 'object') {
    //ノード。 厳密なCommonJSでは機能しませんが、Nodeなどのmodule.exportsをサポートするCommonJSのような環境でのみ機能します。
    module.exports = Vivus;
  } else {
    // Browser globals
    window.Vivus = Vivus;
  }

}());

