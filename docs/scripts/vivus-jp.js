'use strict';

var requestAnimFrame, cancelAnimFrame, parsePositiveInt;

/**
 * VivusInstantInstant
 * Beta version
 *
 * Fork of VivusInstant to make inline animated SVG
 */
/**
 * クラスコンストラクター
 * オプション構造
 * タイプ： 'delayed' | 'async' | 'oneByOne' | 'script'（アイテムを非同期で描画する必要があるかどうかを知るため、デフォルト：遅延）
 * 期間：<int>（フレーム単位）
 *  start： 'inViewport' | 'manual' | 'autostart'（アニメーションを自動的に開始、デフォルト：inViewport）
 *  delay：<int>（最初と最後のパスの描画間の遅延）
 *  dashGap <integer>ダッシュ間の空白余白
 *  SVGの各パス要素のpathTimingFunction <function>タイミングアニメーション関数
 *  animTimingFunction <function>完全なSVGのタイミングアニメーション関数
 *  forceRender <boolean>更新されたすべてのパスアイテムをブラウザに再レンダリングさせる
 *  selfDestroy <boolean>は、SVGの余分なスタイリングをすべて削除し、元のままにします
 * 
 * 属性「タイプ」はデフォルトで「遅延」になっています。
 * -「遅延」
 * すべてのパスは同時に描画されますが、
 * 開始前のそれらの間のわずかな遅延
 * -「非同期」
 * すべてのパスは同時に開始および終了します
 *   - '一つずつ'
 * 一度に描画されるパスは1つだけです
 * 最初のものの終わりは引き分けを引き起こします
 * 次の
 * 
 * これらの値はすべて個別に上書きできます
 *  SVGの各パスアイテムについて
 * フレームの値は常に利用されます
 * 期間の値。
 * どこかで失敗すると、エラーがスローされます。
 *  幸運を。
 * 
 *  @constructor
 *  @this {VivusInstant}
 *  @param {DOM | String}要素SVGのDom要素またはそのID
 *  @param {Object} optionsアニメーションに関するオプション
 */

/*

 *SVG path d= タグの説明
 * Mまたはm = moveto
 * Lまたはl = lineto
 * Hまたはh = horizontal lineto
 * Vまたはv = vertical lineto
 * Cまたはc = curveto
 * Sまたはs = smooth curveto
 * Qまたはq = quadratic Bézier curve
 * Tまたはt = smooth quadratic Bézier curveto
 * Aまたはa = elliptical Arc
 * Zまたはz = closepath
*/

//画数のカラーデータ 60画まで対応
var colorData = ["#bf0000","#bf5600","#bfac00","#7cbf00","#26bf00","#00bf2f","#00bf85","#00a2bf",
                 "#004cbf","#0900bf","#5f00bf","#b500bf","#bf0072","#bf001c","#bf2626","#bf6b26",
                 "#bfaf26","#89bf26","#44bf26","#26bf4c","#26bf91","#26a8bf","#2663bf","#2d26bf",
                 "#7226bf","#b726bf","#bf2682","#bf263d","#bf4c4c","#bf804c",
                 "#bf0000","#bf5600","#bfac00","#7cbf00","#26bf00","#00bf2f","#00bf85","#00a2bf",
                 "#004cbf","#0900bf","#5f00bf","#b500bf","#bf0072","#bf001c","#bf2626","#bf6b26",
                 "#bfaf26","#89bf26","#44bf26","#26bf4c","#26bf91","#26a8bf","#2663bf","#2d26bf",
                 "#7226bf","#b726bf","#bf2682","#bf263d","#bf4c4c","#bf804c"];
var _this = this;

function VivusInstant (element, options) {
  this.dashGap = 1;

  // Setup
  this.options = options;
  this.setElement(element,options);
  this.setOptions(options);
console.log("vivusInstant:options:",options);
}

/**
*要素部分
**************************************
 *インスタンス内の要素を確認および設定します
 *メソッドは何も返しませんが、
 *パラメータが無効な場合はエラー。
 *
 * @param {DOM | String}要素SVG Dom要素またはそのid
 */
VivusInstant.prototype.setElement = function (element,options) {
  // Basic check
  if (typeof element === 'undefined') {
    throw new Error('NOWPRO SVGアニメーション再生ツール [constructor]: "element"パラメータは既存のIDに関連していません');
  }

  // Set the element
  if (element.constructor === String) {
    element = document.getElementById(element);
    if (!element) {
      throw new Error('NOWPRO SVGアニメーション再生ツール [constructor]: "element"パラメーターは既存のIDに関連していません');
    }
  }

  this.el = element;
//  this.id = this.generateKey(8);                                  //一角ごとのランダムなclass名を生成
  var paths = this.el.querySelectorAll('path');                     //大きな要素は取れている
  var ids = paths[0].id.split(/:|-/);
  this.id = ids[1];                                                 //一角ごとのユニコードをclass名に

  this.styleTag = document.createElement('style');                  //stlye タグを作成 
  this.styleTag.setAttribute('data-made-with', 'vivus-NOWPRO');     //attributeを変更（オリジナルから手を入れたので違いを出すため）
  this.el.appendChild(this.styleTag);
  this.preMapping(options);
  this.strokeMapping(options);       //add by YasuhikoFujii
console.log("vivus:setElement:this.styleTag:",this.styleTag);
};

/**
 *事前マッピングにより、構築する「アニメーション可能な」パスを選択します
 *マップ配列
 * @return {[type]} [説明]
 */
VivusInstant.prototype.preMapping = function (options) {
  var i, path, pathObj,gObj;
  var paths = this.el.querySelectorAll('path');
  var g = this.el.querySelectorAll('g');                            //大きな要素は取れている
  var colIdx = 0;                                                   //カラーテーブルのインデックス番号
  this.map = [];
  for (i = 0; i < paths.length; i++) {
    path = paths[i];
    if (this.isInvisible(path)) {
      continue;
    }
    pathObj = {
      el: path,
      length: Math.ceil(path.getTotalLength())
    };

    //イベント埋め込み
    path.addEventListener("click",this.strokeClick);               //クリックイベント登録

    // パスの長さが正しいかどうかをテスト
    if (isNaN(pathObj.length)) {
      if (window.console && console.warn) {
        console.warn('VivusInstant [mapping]：パス要素の長さを取得できません', path);
      }
      continue;
    }

    //下書き用のpathはスキップする
      if (path.id.match(/-d/)) {
//console.log("idに-dが含まれている！スキップ=",path.id);
        continue;
      }

    // SVGの style をリセット
    if (path.style.strokeDasharray || path.style.strokeDashoffset) {
      window.onerror('警告：SVGの一部の要素は、「strokeDasharray」や「strokeDashoffset」を使用します。 これにより、望ましくない影響が生じる可能性があります。')
    }
    path.style.strokeDasharray  = '';
    path.style.strokeDashoffset = '';
    pathObj.strokeDasharray     = pathObj.length + ' ' + (pathObj.length + this.dashGap * 2);
    pathObj.strokeDashoffset    = pathObj.length + this.dashGap;
    pathObj.length += this.dashGap;
    pathObj.class               = 'path_' + this.id + '_' + this.map.length;
    pathObj.el.classList.add(pathObj.class);  //# FIX DAT' SHITE 一角づつのデータの最後にユニークなクラス名を追加 class="****_0"

//追加オプション用タグの埋め込み
    if (!options.colorGroups){
      pathObj.stroke            = colorData[colIdx];              //1画の色 部首　の場合は個別にはカラーを追加しない
      colIdx++;
    }
    pathObj.strokewidth         = strokeWidth.value;              //1画の太さ
    pathObj.strokelinecap       = "round";                        //1画のlinecapタイプ
    pathObj.strokelinejoin      = "round";                        //1画のlinejoinタイプ
    pathObj.style               = "-webkit-tap-highlight-color: rgba(0, 0, 0, 0);";  //マウスホバー時のカラー

    this.map.push(pathObj);
  }
}

/**
 *画数用にMapping
 *idの中身に-gが入って、kvg:radicalがあり、generalortraditならclass追記する
 * preMappingでは、optionsがsetされていないので、thisに値が入っていないため、setOptions()のあとに処理
 * add by Yasuhiko Fujii
 * マップ配列
 *  @return {[type]} [説明]
*/
VivusInstant.prototype.strokeMapping = function (options) {
//console.log("strokeMapping:this ",this);
  var i, stroke,strokeObj;

  //stroke numberを探しclassを追加する
  var strokes = this.el.querySelectorAll('g');                  //画数表示用数字のブロック StrokeNumbers_**** を探す
//console.log("strokes=",strokes);
  this.mapStroke = [];
  var num = 0;
  for (i = 0; i < strokes.length; i++) {
    stroke = strokes[i];
    if (this.isInvisible(stroke)) {
      continue;
    }
    strokeObj = {
      el: stroke,
    };

    //画数用のオブジェクトがあったらそこのstyleを書き換える
    if ( stroke.id.match(/StrokeNumbers_/)) {
      strokeObj.class = 'stroke_' + this.id;                    //
      strokeObj.el.classList.add(strokeObj.class);              //# FIX DAT' SHITE 一角づつのデータの最後にユニークなクラス名を追加 class="****_0"

      //画数表示　のON/OFF　で　fontSizeを０にするか　画数fontサイズ　を採用するか
      if (options.displayOrders){
        strokeObj.el.style.fontSize = options.fontSize;         //画数fontサイズ　から取得
      } else {
        strokeObj.el.style.fontSize = '0';                      //画数fontサイズ　から取得
      }
      strokeObj.el.style.fill = "#d0d0d0";
      this.mapStroke.push(strokeObj);
    }

    //attributesにkeyとvalueが入っているので kvg:radical を探す
    for (var j = 0; j < stroke.attributes.length; j++) {
      var node = stroke.attributes[j],
      key = node.name,
      value = node.value;
      if (key.match(/kvg:radical/)) {
        if (value.match(/general|tradit/)) {
          //kvg:radicalのオブジェクトに　general or tradit があったらclass追加  nelson は多分いらない
          strokeObj.class = 'radical_' + this.id;
          strokeObj.el.classList.add(strokeObj.class);       //# FIX DAT' SHITE 一角づつのデータの最後にユニークなクラス名を追加 class="****_0"
          this.mapStroke.push(strokeObj);
          num++;
        }
      }
    }
  }
}


/**
 * generateKey
 * 長さのあるランダムキーを生成します
 * お好みの、そしてそれを返します
 *
 * @param {number} length IDの長さ
 * @return {string} id
 */
VivusInstant.prototype.generateKey = function (length) {
 var output = '',
   src = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqsrtuvwxyz',
   len = src.length;

 while (length > 0) {
   output += src[Math.floor(Math.random()*len)];
   length--;
 }
 return output;
};


/**
*オプション部分
* インスタンスにユーザーオプションを設定する
* メソッドは何も返しませんが、
* パラメータが無効な場合はエラー
*
* @param {object} optionsコンストラクターからのオブジェクト
*/
VivusInstant.prototype.setOptions = function (options) {
  var allowedTypes = ['delayed', 'async', 'oneByOne', 'scenario', 'scenario-sync'];
  var allowedStarts =  ['manual', 'autostart'];

  // Set the animation type
  if (options.type && allowedTypes.indexOf(options.type) === -1) {
    throw new Error('VivusInstant [constructor]: ' + options.type + ' is not an existing animation `type`');
  }
  else {
    this.type = options.type || allowedTypes[0];
  }

  // Set the start type
  if (options.start && allowedStarts.indexOf(options.start) === -1) {
    throw new Error('VivusInstant [constructor]: ' + options.start + ' is not an existing `start` option');
  }
  else {
    this.start = options.start || allowedStarts[0];
  }

  this.loop               = !!options.loop;
  this.loopEnd            = parsePositiveInt(options.loopEnd, 0);
  this.loopTransition     = parsePositiveInt(options.loopTransition, 0);
  this.loopStart          = parsePositiveInt(options.loopStart, 0);
  this.duration           = parsePositiveInt(options.duration, 2000);
  this.delay              = parsePositiveInt(options.delay, null);
  this.pathTimingFunction = options.pathTimingFunction || 'linear';
  this.ignoreInvisible    = options.hasOwnProperty('ignoreInvisible') ? !!options.ignoreInvisible : false;
  this.triggerClass       = options.triggerClass || 'start';

  this.frameLength        = this.currentFrame = this.delayUnit = this.speed = this.handle = null;
  this.totalDuration      = this.loopStart + this.duration + this.loopEnd + this.loopTransition;

  if (this.delay >= this.duration) {
    throw new Error('VivusInstant [constructor]: delay must be shorter than duration');
  }
  this.kanjiWord          = options.kanjiWord || "　";      //漢字
  this.strokeWidth        = options.strokeWidth;            //1画の太さ
//  this.stroke             = colorData[0];                 //1画の色
  this.fontSize           = options.fontSize;               //画数fontサイズ
  this.zoomFactor         = options.zoomFactor;             //ズーム％
  this.displayOrders      = options.displayOrders;          //画数表示
  this.colorGroups        = options.colorGroups;            //画数/部首　カラー表示
  this.draft              = options.draft;                  //下書き表示

  this.strokeColor        = options.strokeColor;            //１画　カラー/黒表示
  this.strokeLineCap      = "round";                        //1画のlinecapタイプ
  this.strokeLineJoin     = "round";                        //1画のlinejoinタイプ
  this.style              = "-webkit-tap-highlight-color: rgba(0, 0, 0, 0);";  //マウスホバー時のカラー
  if (typeof options.strokeNum === "undefined"){
    this.strokeNum        = -1;                             //クリックしていないので-1
  } else {
    this.strokeNum        = options.strokeNum;              //クリックしたストローク番号
  }
  this.strokeSlider       = options.strokeSlider;           // value="0" min="1" max="10" step="1"
  this.mapping();
};

/**
  * svgをパスごとにマップします。
  *メソッドは何も返しません。
  * `map`配列。 この配列の各アイテムは、
  * SVGからのパス要素、次の情報
  *アニメーション。
  *
  */
VivusInstant.prototype.mapping = function () {
  var i, pAttrs, pathObj, totalLength, lengthMeter, timePoint;
  timePoint = lengthMeter = 0;

  totalLength = this.map.reduce(function (e, f) {return e + f.length}, 0);
  totalLength = totalLength === 0 ? 1 : totalLength;
  this.delay = this.delay === null ? this.duration / 3 : this.delay;
  this.delayUnit = this.delay / (this.map.length > 1 ? this.map.length - 1 : 1);

  for (i = 0; i < this.map.length; i++) {
    pathObj = this.map[i];

    switch (this.type) {
    case 'delayed':
      pathObj.startAt = this.delayUnit * i;
      pathObj.duration = this.duration - this.delay;
      break;

    case 'oneByOne':
      pathObj.startAt = lengthMeter / totalLength * this.duration;
      pathObj.duration = pathObj.length / totalLength * this.duration;
      break;

    case 'async':
      pathObj.startAt = 0;
      pathObj.duration = this.duration;
      break;

    case 'scenario-sync':
      path = pathObj.el;
      pAttrs = this.parseAttr(path);
      pathObj.startAt = timePoint + (parsePositiveInt(pAttrs['data-delay'], this.delayUnit) || 0);
      pathObj.duration = parsePositiveInt(pAttrs['data-duration'], this.duration);
      timePoint = pAttrs['data-async'] !== undefined ? pathObj.startAt : pathObj.startAt + pathObj.duration;
      this.frameLength = Math.max(this.frameLength, (pathObj.startAt + pathObj.duration));
      break;

    case 'scenario':
      path = pathObj.el;
      pAttrs = this.parseAttr(path);
      pathObj.startAt = parsePositiveInt(pAttrs['data-start'], this.delayUnit) || 0;
      pathObj.duration = parsePositiveInt(pAttrs['data-duration'], this.duration);
      this.frameLength = Math.max(this.frameLength, (pathObj.startAt + pathObj.duration));
      break;
    }
    lengthMeter += pathObj.length;
    this.frameLength = this.frameLength || this.duration;
  }
};

/**
  *パスを追加すべきかどうかを最もよく推測する方法
  *アニメーションかどうか。
  *
  * 1.設定されている場合、 `data-vivus-ignore`属性を使用する
  * 2.インスタンスが非表示のパスを無視する必要があるかどうかを確認する
  * 3.パスが表示されているかどうかを確認します
  *
  *今のところ、可視性チェックは不安定です。
  *ベータ段階で使用されます。
  *
  *その他の改善が計画されています。 検出のように
  *は、ストロークまたは有効な不透明度を取得したパスです。
  */
VivusInstant.prototype.isInvisible = function (el) {
  var rect,
    ignoreAttr = el.getAttribute('data-ignore');

  if (ignoreAttr !== null) {
    return ignoreAttr !== 'false';
  }

  if (this.ignoreInvisible) {
    rect = el.getBoundingClientRect();
    return !rect.width && !rect.height;
  }
  else {
    return false;
  }
};


/**
--------------------------------------------------------------------------------------------------------------------------------
 *styleタグの作成　→ this.styleTag.innerHTML
 *  Stylesheet.prototype.クラスを呼び出し
 *  mode: 0:ノーマルモード 1:１画のみアニメモード
--------------------------------------------------------------------------------------------------------------------------------
*/
VivusInstant.prototype.render = function (stroke, strokeSlider, mode) {
  var pathObj, anim,
  style = new Stylesheet();

  // 基本の　keyframes　設定
  var fadeDuration = (this.loopTransition/this.totalDuration) * 100;
  style.setKeyframe('path_' + this.id + '_draw', '100%{stroke-dashoffset:0;}\n');
  style.setKeyframe('path_' + this.id + '_fade', '0%{stroke-opacity:1;}\n' + (100 - fadeDuration)+'%{stroke-opacity:1;}\n'+ '100%{stroke-opacity:0;}\n');

  //下書きクラスと画数クラスと部首クラスのCSS生成

  //draft下書きクラスCSS生成
  var s = String(this.mapStroke[0].el.id);
  var ss = s.split(/:|-/);
  s = 'draft_' + ss[1];
  if (this.draft) {
    style.setProperty('.' + s, '\n\tstroke', '#d0d0d0');                                          //ON:下書きの色は灰色
    style.setProperty('.' + s, '\n\tstroke-width', this.strokeWidth);                             //線の太さは設定に従う
  } else {
    style.setProperty('.' + s, '\n\tstroke', '#ffffff');                                          //OFF:下書きの色は白
    style.setProperty('.' + s, '\n\tstroke-width', 0);                                            //線の太さ0
  }

  for (var i=0; i < this.mapStroke.length; i++) {
      //stroke画数クラスCSS生成
    if (this.mapStroke[i].class.match(/stroke/)){
      if(this.displayOrders){
        style.setProperty('.' + this.mapStroke[i].class, '\n\tfont-size', this.fontSize);         //表示　画数fontサイズ(1-10)
      } else {
        style.setProperty('.' + this.mapStroke[i].class, '\n\tfont-size', '0');                   //画数非表示
      }
      style.setProperty('.' + this.mapStroke[i].class, '\n\tfill', 'none');                       //塗りつぶし：しない
      style.setProperty('.' + this.mapStroke[i].class, '\n\tstroke', '#d0d0d0');                  //灰色
      style.setProperty('.' + this.mapStroke[i].class, '\n\tstroke-width', 0);                    //縁取りサイズ０
    } else {

      //radical部首クラスCSS生成
      if(this.strokeColor){
        if (this.mapStroke[i].class.match(/radical/)){
          style.setProperty('.' + this.mapStroke[i].class, '\n\tstroke', colorData[0]);           //カラー部首１
        } else {
          style.setProperty('.' + this.mapStroke[i].class, '\n\tstroke', colorData[1]);           //カラー部首２
        }
      } else {
        style.setProperty('.' + this.mapStroke[i].class, '\n\tstroke',  '#000000');               //黒
      }
    }
  }

  //1画づつstyleのCSS作成
  for (var i = 0; i < this.map.length; i++) {
    pathObj = this.map[i];

    //カラー表示
    if(this.strokeColor){
      //画数／部首　部首の場合は、strokeは設定しない
      if (!this.colorGroups){
        style.setProperty('.' + pathObj.class, '\n\tstroke',  pathObj.stroke);                    //カラー
      }
    } else {
      style.setProperty('.' + pathObj.class, '\n\tstroke',  '000000');                            //白黒
    }

    //
    style.setProperty('.' + pathObj.class, '\n\tstroke-width',    pathObj.strokewidth);           //線の太さ 1-10
    style.setProperty('.' + pathObj.class, '\n\tstroke-linecap',  pathObj.strokelinecap);         //線の形状
    style.setProperty('.' + pathObj.class, '\n\tstroke-linejoin', pathObj.strokelinejoin);        //
    style.setProperty('.' + pathObj.class, '\n\tstroke-dasharray',pathObj.strokeDasharray);       //アニメ用　線の間隔を指定　実線の長さ、空線の長さ

    //アニメーション情報を付加するかどうかをmodeとstrokeによって判断
    if (stroke == i && mode == 0) {
      //mode=0&stroke=iクリックした画からアニメーションさせるために、dashuarray,dashoffset,animation は、クリックしたstroke以下の場合追記しない。
      style.setProperty('.' + pathObj.class, '\n\tstroke-dashoffset',strokeSlider);                //アニメ用　線の位置を指定
    } else if (stroke < i && mode == 0 || mode != 0 && stroke == i) {

      //mode 0でstroke以上か、mode 1でstorke=iの時
      style.setProperty('.' + pathObj.class, '\n\tstroke-dashoffset',pathObj.strokeDashoffset);  //アニメ用　線の位置を指定

      //アニメーションループボタンがによるCSSの変更処理
      if (mode == 0) {
        if (!this.loop) {
          //ループさせない時
          anim = 'path_' + this.id + '_draw' + ' ' + (pathObj.duration >> 0) + 'ms' + ' ' + this.pathTimingFunction + ' ' + (pathObj.startAt >> 0) + 'ms' + ' forwards';
        } else {
          //ループさせる時
          anim = 'path_' + this.id + '_draw_' + i + ' ' + this.totalDuration + 'ms' + ' ' + this.pathTimingFunction + ' 0ms infinite,' + 'path_' + this.id + '_fade ' + this.totalDuration + 'ms ' + 'linear 0ms ' + 'infinite';

          //キーフレーム
          style.setKeyframe('path_' + this.id + '_draw_'+ i,
          ((this.loopStart+pathObj.startAt)/(this.totalDuration)*100)+'%{stroke-dashoffset: '+pathObj.strokeDashoffset+'}\n'+
          ((this.loopStart+pathObj.startAt+pathObj.duration)/(this.totalDuration)*100)+'%{ stroke-dashoffset: 0;}\n'+
          '100%{ stroke-dashoffset: 0;}\n');
        }

        //アニメーションの指定
        if (this.start === 'autostart') {
          style.setProperty('.' + pathObj.class, '\n\tanimation', anim);                            //アニメーションさせる要素、スピード、タイミングを指定
        } else {
          style.setProperty('.' + this.triggerClass + ' .' + pathObj.class, '\n\tanimation', anim); //アニメーションさせる要素、スピード、タイミングを指定
        }
      } else {
        //１画づつ送るモードでは、ループさせない+アニメーションの開始時間は０msとする
        anim = 'path_' + this.id + '_draw' + ' ' + (pathObj.duration >> 0) + 'ms' + ' ' + this.pathTimingFunction + ' 0ms' + ' forwards';
        style.setProperty('.' + pathObj.class, '\n\tanimation', anim);                            //アニメーションさせる要素、スピード、タイミングを指定
      }

    } else {
      if (mode == 0){
        style.setProperty('.' + pathObj.class, '\n\tstroke-dashoffset',0);                          //アニメ用　線の位置を指定
      } else {
        //１画づつ送るモードでは、現在のストロークより以前は表示、以後は非表示
        if (stroke < i) {
          style.setProperty('.' + pathObj.class, '\n\tstroke-dashoffset',pathObj.strokeDashoffset);  //アニメ用　線の位置を指定
        } else {
          style.setProperty('.' + pathObj.class, '\n\tstroke-dashoffset',0);                        //アニメ用　線の位置を指定
        }
      }
    }
  }
//console.log("vivus:render:this.styleTag:",this.styleTag);
  this.styleTag.innerHTML = style.render();
};

/**
  *トリガークラスの追加または削除
  * @param {boolean} statusクラスを設定する必要があるかどうか
  */
VivusInstant.prototype.toggleTrigger = function (status) {
  if (this.start !== 'manual') {
    return;
  }

  if (status) {
    this.el.classList.add(this.triggerClass);
  }
  else {
    this.el.classList.remove(this.triggerClass);
  }
}

//イベント：ストロークをクリックした際に飛んてくる
VivusInstant.prototype.strokeClick = function (e) {
  OptionController.prototype.strokeClick(e);                        //optionの関数へ送る
};

//指定されたストロークの strokeDasharray,strokeDashoffset を返す
VivusInstant.prototype.getstrokeDasharray = function (stroke) {
  var pathObj = this.map[stroke];
  return pathObj.strokeDasharray;
};
VivusInstant.prototype.getstrokeDashoffset = function (stroke) {
  var pathObj = this.map[stroke];
  return pathObj.strokeDashoffset;
};
VivusInstant.prototype.setstrokeDasharray = function (stroke, value) {
  var pathObj = this.map[stroke];
  this.map[stroke].strokeDasharray = value;
};
VivusInstant.prototype.setstrokeDashoffset = function (stroke, value) {
  var pathObj = this.map[stroke];
  this.map[stroke].strokeDashoffset = value;
};
VivusInstant.prototype.setstrokeDashoffset2 = function (pathObj, value) {
  pathObj.strokeDashoffset = value;
};
