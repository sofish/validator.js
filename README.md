# validator.js

一个简单、轻量级，但功能强大的 Validator 组件，并且可以方便扩展类型判断：

- jQuery 插件，即插即用
- 基于 HTML5 的 API 设计
- 兼容主流浏览器，包括 IE 6+

> DEMO [form validator](http://sofish.github.io/validator.js/)

## 线上运行版本

- 一行搞定：[iNews.io Register](http://inews.io/account/register)
- 进阶使用：[百姓网发布表单](http://shanghai.baixing.com/fabu/ershouqiche)

## 使用方法

### 一、实例化
```js
$('#form_id').validator(options);
```

`validator` 方法支持一个 `options` 对象作为参数。当不传参数时，`options` 具备默认值。参数储存在 `$('').data('__options__')`。完整的对象如下描述：

```js
options = {
  // 需要校验的表单项，（默认是 `[required]`），支持任何 jQuery 选择器可以选择的标识
  identifie: {String},

  // 校验不通过时错误时添加的 class 名（默认是 `error`），当校验为空时，还同时拥有 `empty` 这个 classname
  klass: {String},

  // 错误出现时 `klass` 放在当前表单项还是父节点（默认是当前表单项）
  isErrorOnParent: {Boolean},

  // 触发表单项校验的方法，当是 false 在点 submit 按钮之前不校验（默认是 `blur`）
  method: {String | false},

  // 出错时的 callback，第一个参数是所有出错表单项集合
  errorCallback(unvalidFields): {Function},

  before: {Function}, // 表单检验之前
  after: {Function}, // 表单校验之后，只有 __return true__ 才会提交表单
 }
```

### 二、验证表单
```js
$('#form_id').validate(); // or
$('#form_id').validate(options);
```

`validate` 方式支持一个 `options` 对象作为参数，该参数只在调用时供__一次性__使用。当不传参数时，`options` 使用 `validator` 的参数作为默认值。完整的对象如下描述：

```js
options = {
  // 需要校验的表单项，（默认是 `[required]`），支持任何 jQuery 选择器可以选择的标识
  identifie: {String},

  // 校验不通过时错误时添加的 class 名（默认是 `error`），当校验为空时，还同时拥有 `empty` 这个 classname
  klass: {String},

  // 错误出现时 `klass` 放在当前表单项还是父节点（默认是当前表单项）
  isErrorOnParent: {Boolean},

  // 触发表单项校验的方法，当是 false 在点 submit 按钮之前不校验（默认是 `blur`）
  method: {String | false},

  // 出错时的 callback，第一个参数是所有出错表单项集合
  errorCallback(unvalidFields): {Function},
 }
```

### 三、HTML 标记

目前 type 的类型支持 email/tel/url/range/number 等 HTML5 Form API 支持的类型，当 type 不存在，但为验证项时，则测试表单是否有空；当有标记 `maxLength` 的时候验证表单值的长度；当有 min/max 的时候和 `type=range` 一样验证当前值是否在 min/max 区间：`min <= value <= max`。

同时，如果表单存在 pattern 属性，则不使用 type 作为验证，保持与 HTML5 API 一致，可以作为一种表单自定义验证的方式。比如下面这个表项，将不按 type="email" 来验证，而是使用 pattern 中的正则表达式来验证：

```html
<input type="email" pattern="参照 HTML5 规范的正则表达式" />
```

注：type 的支持在 validator.js 中的 patterns 这个对象中。

#### 1. 一般标记

在 html 标记上，一个需要验证的表单项，需要加上 `required` 属性，或者 `options.identifie` 中指定的选择器名。如：

```html
<input type="email" required />
<select required>
  <option>...
</select>
<div contenteditable pattern="^\d+$"></div>
```

#### 2. Checkbox & Radio

`input:checkbox` 默认不校验，`input:radio` 根据 name 属性来区分组别，也即当所有 `name='abc'` 的 radio 有一个被 checked，那么表示这一组 radio 通过验证：

```html
<label><input type="radio" required name="abc" value="A">[A]</label>
<label><input type="radio" required name="abc" value="B">[B]</label>
<label><input type="radio" required name="abc" value="C">[C]</label>
```

#### 3. 异步支持

当需要异步验证时，在表单添加一个 data-url 的属性指定异步验证的 URL 那可，有几个可选的项：

```
data-url: 异步验证的 url
data-method: [可选] AJAX 请求的方法: get,post,getJSON 等，默认是 get
data-key: [可选] 发送当前表单值时用的 key，默认是 'key'：$.get(url, {key: 表单的值})
```

html 标记如下：

```html
<input type="text" data-url="https://api.github.com/legacy/user/search/china" data-method="getJSON" required>
```

#### 4. 二选一

支持二选一，比如联系方式，座机和手机可以只填一项。HTML 的标记如下，在需要此功能的项添加 `data-aorb` 属性，指定 a 或者 b，顺序可以相反：

```js
<input data-aorb="a" >
<input data-aorb="b" >
```

NOTE: 顺便说一句，实现多选一代码可以更简单一点，但问题在于这是个好设计吗？所以多想一下。

#### 5. 支持自定义元素的事件

可以在 html 中添加 `data-event` 以在单独的元素中触发自定义事件。假设我们设置一个 `hello` 事件，最终会触发在验证这个表单前触发 `before.hello` 事件，并且在验证完当前表单后触发一个 `after.hello` 事件。默认不触发任何事件：

```html
<input id="event" type="text" data-event="hello" required>
```

可以使用标准的 jQuery `on` 来监听这个事件：

```js
$('#event').on('before:hello', function(event, element){
  alert('`before.hello` event trigger on $("#' + element.id + '")');
})

$('#event').on('after:hello', function(event, element){
  alert('`after.hello` event trigger on $("#' + element.id + '")');
})
```
#### 6. 支持在指定元素添加错误 class
可以在 html 中添加 `data-parent` 用以指定需要添加错误 class 的元素，属性值为任意 jQuery 选择器支持的语法。例如一个表单被嵌套多层，可以通过在该表单上添加 `data-parent='div[name="test"].parent'` 来制定在距该表单最近的父级元素中 `name="test"` 并且 `class="parent"` 的 `div` 元素上添加错误 class。例：

```html
<div name="test" class="parent">
	<p>
		<input type="test" data-parent="div[name="test"].parent" required>
	</p>
</div>
```

## 通用约定和代码规范：

- 以 2-spaces 作为缩进
- 变量先定义后赋值（除非赋值可以写成单行）
- 代码中出现以 $ 开头的对象，该为 jQuery 对象，比如 $item

## 测试用例：

使用 index.php 这个文件

## 许可协议

基于 MIT 协议授权，你可以使用于任何地方（包括商业应用）、修改并重新发布。详见：[LICENSE](https://github.com/sofish/validator.js/blob/master/LICENSE)

## 贡献者

- __[Chris Yip](https://github.com/ChrisYip)__: [http://chrisyip.im/](http://chrisyip.im/)
- __[青花木木](https://github.com/zhanglin800)__: [http://zhanglin.org](http://zhanglin.org)
