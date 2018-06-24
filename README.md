# editable

`jquery.editable`是[宙品科技](http://zeupin.com)制作的一款基于`jquery`的就地编辑插件，简单易用，MIT协议。

## 方法

1. 页面中引入`jquery.js`和`jquery.editable.js`。
2. 对要输入的元素，加上`data-ed-name`属性（必填），以及其它一些控制属性，如`data-ed-value`（选填）。
3. 用`$(jQuery选择集).editable(后台文件路径, {选项集合})`激活。
4. 双击要就地编辑的元素，可激活编辑界面。
5. editable插件把修改后的内容提交给后台，后台处理后，返回形如[code, msg, data]的固定格式的json应答（例如返回`[0, null, "李四"]`）。
6. editable根据返回结果，更新前端的内容。有success回调的，调用success回调；没有success回调的，就更新待编辑元素的data-ed-value和innerText。

## 示例

```html
<html>
<head>
  ...
</head>
<body>
  <div class="editable" data-ed-params="id=1">
    <span data-ed-name="from">NZD</span>
    <span data-ed-name="to">CNY</span>
    <span data-ed-name="rate">4.6</span>
  </div>

  <table class="editable">
    <tr data-ed-params="id=1">
      <td data-ed-name="name">张三</td>
      <td data-ed-name="age">18</td>
      <td data-ed-name="gender">男</td>
    </tr>
    <tr data-ed-params="id=2">
      <td data-ed-name="name">李四</td>
      <td data-ed-name="age">20</td>
      <td data-ed-name="gender">女</td>
    </tr>
  </table>

  <script src="path/to/jquery.js"></script>
  <script src="path/to/jquery.editable.js"></script>

  <script>
    $(".editable").editable("http://path/to/your/app/save.php", {
      ajaxType: "POST"
    });
  </script>
</body>
</html>
```

示例说明：
1. 双击张三，会出现输入框。
2. 输入新的名字，比如说王五，点击提交。
3. 发出一个jquery ajax请求到 http://path/to/your/app/save.php
4. 后台收到的数据：（假设后台是php）
    [
      "id" => "1",
      "name" => "王五",
    ]
5. 后台返回固定json格式的数据，格式为 [code, msg, data]。code===0时，表示后台操作成功，code为其它（甚至是字符串'0'）表示操作失败。
6. editable收到后台的应答后，检查code===0，则显示“修改成功”，然后把新的data更新data-ed-value的值和前台的显示内容。如果code!==0，则显示“修改失败”。

## options

### ajaxType

见`jQuery.ajax()`的`type`选项，可为`POST`、`GET`等。默认为`POST`。

### success 回调函数

定义为：

```js
/**
 * @param {HTMLElement} ele 对应的元素
 * @param {*} data 为后台应答的[code,msg,data]中的data
 */
success: function(ele, data){
  ...
}
```

> 注意：
> 1. 如果设置了success回调函数，则由回调函数负责更新`data-ed-value`和前台显示数据。

### error 回调函数

定义为：

```js
/**
 * @param {String} msg 错误信息
 */
error: function(msg){
  ...
}
```