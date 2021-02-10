/**
 *スタイルシートクラス
 *スタイルシート要素を管理してエクスポートする
 *可能な限り最小の形式。
 *笑わないで
 *出力可能。
*/
function Stylesheet () {
  this.selectors = {};
  this.keyframes = {};
}

/**
 *プロパティとその値を特定のセレクターに設定します。
 *プロパティを追加する
 * @param {string} selector Selector
 * @param {string} property設定するプロパティ
 * @param {string | number} value設定する値
*/
Stylesheet.prototype.setProperty = function (selector, property, value) {
  var styles = this.selectors[selector] || {};
  styles[property] = value;
  this.selectors[selector] = styles;
};

/**
 *キーフレームを設定する
 * @param {string} nameキーフレーム名
 * @param {string} contentキーフレームのコンテンツ
*/
Stylesheet.prototype.setKeyframe = function (name, content) {
  this.keyframes[name] = content;
};

/**
 *インスタンスに設定されたコンテンツを使用して生成します
 * CSS
 * @return {string} Le CSS
*/
Stylesheet.prototype.render = function () {
  var output = '\n';

  // stylesを生成します
  var prop, props, style, css = [];
  for (var selector in this.selectors) {
    style = '';
    props = this.selectors[selector];
    for (prop in props) {
      style += prop + ':' + props[prop] + ';';
    }
    output += selector + '{' + style + '}\n';
//console.log(output);
  }

  //キーフレームを連結します
  for (var keyframe in this.keyframes) {
    output += '@keyframes ' + keyframe + '{\n' + this.keyframes[keyframe] + '}\n';
  }
  return output;
};

