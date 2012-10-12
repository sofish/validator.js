/*! Simple Validator
 * @author: sofish https://github.com/sofish
 * @copyright: MIT license */

// 约定：以 /\$\w+/ 表示的字符，比如 $item 表示的是一个 jQuery Object
 ~function ($) {

  var patterns, fields, addErrorClass, novalidate, validateForm, validateFields, radios, checkboxs
    , unvalidFields = []

  // 类型判断
  patterns = {

    // 当前校验的元素，默认没有，在 `validate()` 方法中传入
    // $item: {},

    email: function(text){
      return /^(?:[a-z0-9]+[_\-+.]?)*[a-z0-9]+@(?:([a-z0-9]+-?)*[a-z0-9]+.)+([a-z]{2,})+$/i.test(text);
    },

    // 仅支持 8 种类型的 day
    // 20120409 | 2012-04-09 | 2012/04/09 | 2012.04.09 | 以上各种无 0 的状况
    date: function (text) {
      var reg = /^([1-2]\d{3})([-/.])?(1[0-2]|0?[1-9])([-/.])?([1-2]\d|3[01]|0?[1-9])$/
        , taste, d;

      if (!reg.test(text)) return false;

      taste = reg.exec(text);
      year = +taste[1], month = +taste[3] - 1, day = +taste[5];

      d = new Date(year, month, day);
      
      return (year === d.getFullYear() && month === d.getMonth() && day === d.getDate());
    },

    // 手机：仅中国手机适应；以 1 开头，第二位是 3-9，并且总位数为 11 位数字
    mobile: function(text){
      return /^1[3-9]\d{9}$/.test(text);
    },

    // 座机：仅中国座机支持；区号可有 3、4位数并且以 0 开头；电话号不以 0 开头，最 8 位数，最少 7 位数
    //  但 400/800 除头开外，适应电话，电话本身是 7 位数
    // 0755-29819991 | 0755 29819991 | 400-6927972 | 4006927927 | 800...
    tel: function(text){
      return /^(?:(?:0\d{2,3}[- ]?[1-9]\d{6,7})|(?:[48]00[- ]?[1-9]\d{6}))$/.test(text);
    },

    number: function(text){
      return /^(?:[1-9]\d*|0)(?:[.]\d)?$/.test(text);
    },

    // 判断是否在 min / max 之间
    range: function(text){
      var min = this.$item.attr('min')
        , max = this.$item.attr('max')
      return text >= min && text <= max;
    },

    // 目前只允许 http(s)
    url: function(text){
      return /^(?:http[s]?:\/\/)?(?:[a-z0-9]+(?:[a-z0-9]+(?:[-][a-z0-9]+)?)+\.)+[a-z]+$/i.test(text);
    },

    // 密码项目前只是不为空就 ok，可以自定义
    password: function(text){
      return this.notEmpty(text);
    },

    // radio 根据当年 radio 的 name 属性获取元素，所有元素都被
    radio: function(){
      // TODO: a better way?!
      var form = this.$item.parents('form').eq(0)
        , identifier = 'input:radio[name=' + this.$item.attr('name') + ']'
        , result = false

      radios || (radios = $(identifier, form))

      // TODO: a faster way?!
      radios.each(function(i, item){
        if(item.checked && !result) return result = true;
      })

      return result;
    },

    // 表单项不为空
    notEmpty: function(text){
      return  !!text.length && !/^\s+$/.test(text)
    }
  }

  // 获取待校验的项
  fields  = function(identifie, form) {
    return $(identifie, form);
  }

  // 校验一个表单项
  // 出错时返回一个对象，当前表单项和类型；通过时返回 false
  validate = function($item, klass, parent){
    var pattern, val, pass, type

    pattern = $item.attr('pattern');
    type = $item.attr('type') || 'notEmpty';
    val = $item.val();

    // TODO: new 出来的这个正则是否与浏览器一致？
    pass = pattern ? new RegExp(pattern).test(val) : (patterns.$item = $item, patterns[type](val));

    return pass ? false : {
        $el: addErrorClass($item, klass, parent)
      , type: type
    }
  }

  // 校验表单项
  validateFields = function($fields, method, klass, parent) {
    // TODO：坐成 delegate 的方式？
    var field
    $fields.on(method, function(){
      // 如果有错误，返回的结果是一个对象，传入 validedFields 可提供更快的 `validateForm`
      (field = validate.call(this, $(this), klass, parent)) && unvalidFields.push(field);
    })
  }

  // 校验表单
  validateForm = function ($fields, method, klass, parent) {
    if(method && !validateFields.length) return true;
    var field
    $fields.each(function() {
      (field = validate.call(this, $(this), klass, parent)) && unvalidFields.push(field);
    })

    return !validateFields.length;
  }

  // 添加错误 class
  // @param `$item` {jQuery Object} 传入的 element
  // @param [optional] `klass` {String} 当一个 class 默认值是 `error`
  // @param [optional] `parent` {Boolean} 为 true 的时候，class 被添加在当前出错元素的 parentNode 上
  //   默认在
  addErrorClass = function($item, klass, parent){
    return parent ? $item.parent().addClass(klass) : $item.addClass(klass);
  }

  // 添加 `novalidate` 到 form 中，防止浏览器默认的校验（样式不一致并且太丑）
  novalidate = function($form){
    return $form.attr('novalidate') || $form.attr('novalidate', 'true')
  }

  // 真正的操作逻辑开始，yayayayayayaya!
  // 用法：$form.validator(options)
  // 参数：options = {
  //    identifie: {String}, // 需要校验的表单项，（默认是 `[required]`）
  //    klass: {String}, // 校验不通过时错误时添加的 class 名（默认是 `error`）
  //    isErrorOnParent: {Boolean} // 错误出现时 class 放在当前表单项还是（默认是 element 本身）
  //    method: {String | false}, // 触发表单项校验的方法，当是 false 在点 submit 按钮之前不校验（默认是 `blur`）
  //
  //    TODO: 再考虑一下如何做比较合适
  //    before: {Function}, // 表单检验之前
  //    after: {Function}, // 表单校验之后
  //  }
  $.fn.validator = function(options) {
    var $form = this
      , options = options || {}
      , identifie = options.identifie || '[required]'
      , klass = options.error || 'error'
      , isErrorOnParent = options.isErrorOnParent || false
      , method = options.method || 'blur'
      , before = options.before
      , after = options.after
      , $items = fields(identifie, $form)

    // 防止浏览器默认校验
    novalidate($form);

    // 表单项校验
    method && validateFields($items, method, klass, isErrorOnParent);

    // 提交校验
    $form.on('submit', function(e){
      return validateForm($items, method, klass, isErrorOnParent);
    })

  }
}(jQuery);