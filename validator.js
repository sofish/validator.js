/*! Simple Validator
 * @author: sofish https://github.com/sofish
 * @copyright: MIT license */

// 约定：以 /\$\w+/ 表示的字符，比如 $item 表示的是一个 jQuery Object
 ~function ($) {

  var patterns, fields, errorElement, addErrorClass, removeErrorClass, novalidate, validateForm
    , validateFields, radios, removeFromUnvalidFields, asyncValidate, linkageValidate
    , limitsValidate, validateReturn, unvalidFields = []

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

      return year === d.getFullYear() && month === d.getMonth() && day === d.getDate();
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
      var min = +this.$item.attr('min')
        , max = +this.$item.attr('max')
        , result = /^\-?(?:[1-9]\d*|0)(?:[.]\d)?$/.test(text)
        , text = +text
        , step = +this.$item.attr('step');

      // ignore invalid range silently
      isNaN(min) && (min = text - 1);
      isNaN(max) && (max = text + 1);

      // 目前的实现 step 不能小于 0
      return result && (isNaN(step) || 0 >= step ?
        (text >= min && text <= max) : 0 === (text + min) % step && (text >= min && text <= max));
    },

    // 判断是否在 min / max 之间
    range: function(text){
      return this.number(text);
    },

    // 支持类型:
    // http(s)://(username:password@)(www.)domain.(com/co.uk)(/...)
    // (s)ftp://(username:password@)domain.com/...
    // git://(username:password@)domain.com/...
    // irc(6/s)://host:port/... // 需要测试
    // afp over TCP/IP: afp://[<user>@]<host>[:<port>][/[<path>]]
    // telnet://<user>:<password>@<host>[:<port>/]
    // smb://[<user>@]<host>[:<port>][/[<path>]][?<param1>=<value1>[;<param2>=<value2>]]
    url: function(text){
      var protocols = '((https?|s?ftp|irc[6s]?|git|afp|telnet|smb):\\/\\/)?'
        , userInfo = '([a-z0-9]\\w*(\\:[\\S]+)?\\@)?'
        , domain = '([a-z0-9]([\\w]*[a-z0-9])*\\.)?[a-z0-9]\\w*\\.[a-z]{2,}(\\.[a-z]{2,})?'
        , port = '(:\\d{1,5})?'
        , ip = '\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}'
        , address = '(\\/\\S*)?'
        , domainType = [protocols, userInfo, domain, port, address]
        , ipType = [protocols, userInfo, ip, port, address]
        , validate

      validate = function(type){
        return new RegExp('^' + type.join('') + '$', 'i').test(text);
      };

      return validate(domainType) || validate(ipType);
    },

    // 密码项目前只是不为空就 ok，可以自定义
    password: function(text){
      return this.text(text);
    },

    // radio 根据当前 radio 的 name 属性获取元素，只要 name 相同的这几个元素中有一个 checked，则验证难过
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

    // 目前只检验是否已选，多选需结合 limitsValidate
    checkbox: function(){
      return !!this.$item.attr('checked');
    },

    // text[notEmpty] 表单项不为空
    // [type=text] 也会进这项
    text: function(text){
      var max = parseInt(this.$item.attr('maxlength'), 10)
        , noEmpty

      notEmpty = function(text){
        return !!text.length && !/^\s+$/.test(text)
      }

      return isNaN(max) ? notEmpty(text) : notEmpty(text) && text.length <= max;
    }
  }

  // 异步验证
  asyncValidate = function($item, klass, isErrorOnParent){
    var data = $item.data()
      , url = data['url']
      , method = data['method'] || 'get'
      , key = data['key'] || 'key'
      , text = $item.val()
      , params = {}

    params[key] = text;

    $[method](url, params).success(function(isValidate){
      var message = isValidate ? 'IM VALIDED' : 'unvalid';
      return validateReturn.call(this, $item, klass, isErrorOnParent, message);
    }).error(function(){
      // 异步错误，供调试用，理论上线上不应该继续运行
    });
  }

  // 把有相同 name 属性的元素编为一组，判断组内所有合法元素数量是否在范围内
  // limits: String, 'min,max', 'min,' 只有最小值，',max' 只有最大值，'n' 则只允许有 n 个
  limitsValidate = function($item, klass, parent){
    var $items = $item.closest('form').find('[type=' + $item.attr('type') + '][name="' + $item.attr('name') + '"]')
      , limits = $item.attr('data-limits')
      , taste = /^(\d)*( *, *)*(\d)*$/.exec(limits) || []
      , min = parseInt(taste[1], 10)
      , max = parseInt(taste[3], 10)
      , result = 0
      , _unvalidFields = []
      , message, field

    $.each($items, function(idx, item){
      result += true === validate.apply(this, [$(item), klass, parent]) ? 1 : 0
    })

    isNaN(min) && (min = 0)
    ;(isNaN(max) || !taste[2]) && (max = result)
    // FIXME: different error messages for different elements
    ;(min > result || result > max) && (message = 'unvalid')

    // TODO: better way to handle error elements
    $.each($items, function(){
      field = validateReturn.apply(this, [$(this), klass, parent, message])
      field && _unvalidFields.push(field)
    })

    return _unvalidFields;
  }

  // 验证后的返回值
  validateReturn = function($item, klass, parent, message){
    var ret
    // 返回的错误对象 = {
    //    $el: {jQuery Element Object} // 当前表单项
    //  , type: {String} //表单的类型，如 [type=radio]
    //  , message: {String} // error message，只有两种值
    // }
    // NOTE: 把 jQuery Object 传到 trigger 方法中作为参数，会变成原生的 DOM Object
    return /^(?:unvalid|empty)$/.test(message) ? (ret = {
        $el: addErrorClass.call(this, $item, klass, parent)
      , type: $item.attr('type') || 'text'
      , error: message
    }, $item.trigger('after:' + $item.data('event'), $item), ret):
    (removeErrorClass.call(this, $item, klass, parent), $item.trigger('after:' + $item.data('event'), $item), false);
  }

  // 获取待校验的项
  fields  = function(identifie, form) {
    return $(identifie, form);
  }

  // 校验一个表单项
  // 出错时返回一个对象，当前表单项和类型；通过时返回 false
  validate = function($item, klass, parent){

    if(!$item) return 'DONT VALIDATE UNEXIST ELEMENT';

    var async, type, val, limits, pattern, message

    async = $item.data('url');
    event = $item.data('event');

    // 当指定 `data-event` 的时候在检测前触发自定义事件
    // NOTE: 把 jQuery Object 传到 trigger 方法中作为参数，会变成原生的 DOM Object
    event && $item.trigger('before:' + event, $item);

    // 异步验证则不进行普通验证
    if(async) return asyncValidate.apply(this, [$item, klass, parent]);

    // 把当前元素放到 patterns 对象中备用
    patterns.$item = $item;
    type = $item.attr('type') || 'text';
    val = $item.val();
    limits = $item.attr('data-limits') || false

    // 所有都最先测试是不是 empty，checkbox 是可以有值
    // 但通过来说我们更需要的是 checked 的状态
    // 暂时去掉 radio/checkbox/linkage/aorb 的 notEmpty 检测
    if (!limits && !/^(?:radio|checkbox)$/.test(type) && !patterns['text'](val))
      return validateReturn.call(this, $item, klass, parent, 'empty');

    pattern = $item.attr('pattern');
    // HTML5 pattern 支持
    // TODO: new 出来的这个正则是否与浏览器一致？
    message = message ? message :
      pattern ? (new RegExp(pattern).test(val) || 'unvalid') :
      patterns[type](val) || 'unvalid';

    // 正常验证返回值
    return limits ? message : validateReturn.call(this, $item, klass, parent, message);
  }

  // 校验表单项
  validateFields = function($fields, method, klass, parent) {
    // TODO：坐成 delegate 的方式？
    var field
    $fields.on(method, function(){
      // 如果有错误，返回的结果是一个对象，传入 validedFields 可提供更快的 `validateForm`
      if (this.getAttribute('data-limits')) {
        unvalidFields = unvalidFields.concat(limitsValidate.apply(this, [$(this), klass, parent]))
      } else {
        (field = validate.call(this, $(this), klass, parent)) && unvalidFields.push(field);
      }
    })
  }

  // 校验表单：表单通过时返回 false，不然返回所有出错的对象
  validateForm = function ($fields, method, klass, parent) {
    if(method && !validateFields.length) return true;
    var field, groups = {}

    // 防止 push 重复项
    unvalidFields = [];

    $fields.each(function() {
      if ($(this).attr('data-limits')) {
        groups[this.name] instanceof Array || (groups[this.name] = [])
        if (1 < groups[this.name].length) return;
        groups[this.name].push(this)
      } else {
        (field = validate.call(this, $(this), klass, parent)) && unvalidFields.push(field)
      }
    })

    for (var k in groups) {
      unvalidFields = unvalidFields.concat(limitsValidate.apply(this, [$(groups[k]), klass, parent]))
    }
    // FIXME: Checkbox demo 2: validateFields.length alway equal true, can't return invalid elements
    return validateFields.length ? unvalidFields : false;
  }

  // 从 unvalidField 中删除
  removeFromUnvalidFields = function($item){
    var obj, index

    // 从 unvalidFields 中删除
    obj = $.grep(unvalidFields, function(item) {
      return item['$el'] = $item;
    })[0];

    if(!obj) return;
    index = unvalidFields.indexOf(obj);
    return unvalidFields.splice(index, 1);
  }

  // 添加/删除错误 class
  // @param `$item` {jQuery Object} 传入的 element
  // @param [optional] `klass` {String} 当一个 class 默认值是 `error`
  // @param [optional] `parent` {Boolean} 为 true 的时候，class 被添加在当前出错元素的 parentNode 上
  errorElement = function($item, parent){
    return $item.data('parent') ? $item.closest($item.data('parent')) : parent ? $item.parent() : $item;
  }

  addErrorClass = function($item, klass, parent){
    errorElement($item, parent).addClass(klass)
  }

  removeErrorClass = function($item, klass, parent){
    removeFromUnvalidFields.call(this, $item);
    errorElement($item, parent).removeClass(klass)
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
  //    errorCallback(unvalidFields): {Function}, // 出错时的 callback，第一个参数是出错的表单项集合
  //
  //    before: {Function}, // 表单检验之前
  //    after: {Function}, // 表单校验之后，只有返回 True 表单才可能被提交
  //  }
  $.fn.validator = function(options) {
    var $form = this
      , options = options || {}
      , identifie = options.identifie || '[required]'
      , klass = options.error || 'error'
      , isErrorOnParent = options.isErrorOnParent || false
      , method = options.method || 'blur'
      , before = options.before || function() {return true;}
      , after = options.after || function() {return true;}
      , errorCallback = options.errorCallback || function(fields){}
      , $items = fields(identifie, $form)

    // 防止浏览器默认校验
    novalidate($form);

    // 表单项校验
    method && validateFields.call(this, $items, method, klass, isErrorOnParent);

    // 提交校验
    $form.on('submit', function(e){
      e.preventDefault()
      before.call(this, $items);
      validateForm.call(this, $items, method, klass, isErrorOnParent);

      // 当指定 options.after 的时候，只有当 after 返回 true 表单才会提交
      return after.call(this, $items) && unvalidFields.length === 0 ? true : e.preventDefault(), errorCallback.call(this, unvalidFields);
    })

  }
}(jQuery);
