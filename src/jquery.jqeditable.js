/**
 * jQuery就地编辑插件
 *
 * @author Macc Liu
 * @copyright (c) 2018 Zeupin.com.
 * @license MIT License (see https://github.com/zeupin/jqeditable/blob/master/LICENSE)
 *
 */
(function ($) {

  'use strict';

  /**
   * 插件的主函数
   *
   * @param {String|Function} url 服务器端的php文件地址或本地的js处理函数
   * @param {Object} options 选项
   */
  $.fn.jqeditable = function (url, options) {
    // 合并设置
    var settings = $.extend({}, $.fn.jqeditable.defaults, {
      "url": url
    }, options);

    // 对需要使用就地编辑的元素逐个进行设置
    return this.each(function () {
      $.fn.jqeditable._make(this, [], settings);
    });
  }


  /**
   * 输入界面构造器
   *
   * @param {HTMLElement} ele 当前元素
   * @param {Array} params 附加参数
   * @param {Object} settings 传入的设置参数
   */
  $.fn.jqeditable._make = function (ele, params, settings) {
    /*
     * 根据data-ed-type进行输入控件构建
     */
    var input_type = "text"; // 默认是单行文本输入框
    if (ele.hasAttribute("data-ed-type")) {
      input_type = ele.getAttribute("data-ed-type").toString().toLowerCase();
    }

    var editor = null;

    switch (input_type) {
      case "text":
        editor = $.fn.jqeditable._TEXT(ele, params, settings);
        break;
      case "select":
        editor = $.fn.jqeditable._SELECT(ele, params, settings);
        break;
    }

    // $(ele)
    var j_ele = $(ele);

    // 构造 ele_params
    var ele_params = params;
    if (ele.hasAttribute("data-ed-params")) {
      var ed_params = j_ele.data("ed-params");
      if (ed_params) {
        ed_params = $.fn.jqeditable.parseParams(ed_params);
      } else {
        ed_params = [];
      }
      ele_params = params.concat(ed_params);
      ed_params = null;
    }

    // 如果有data-ed-name属性，则生成一个form
    if (ele.hasAttribute("data-ed-name")) {

      // dblclick可激活编辑状态
      j_ele.dblclick(function (e) {

        /* $(this) */
        var jqthis = $(this);

        /* 阻止双击的默认行为 */
        e.preventDefault();
        e.stopPropagation();

        // data-ed-name
        var ed_name = j_ele.data("ed-name");

        // data-ed-value
        var ed_value = null;
        if (this.hasAttribute("data-ed-value")) {
          ed_value = jqthis.data("ed-value"); // 字段初值
        } else {
          ed_value = this.innerText;
        }

        // form
        var form = $("<form></form>");

        // form.attrs
        form.attr({});

        // form.position 将form定位到元素一样的位置
        var posParent = this;
        var posLeft = this.offsetLeft;
        var posTop = this.offsetTop;
        while (posParent != document.body) {
          posParent = posParent.offsetParent;
          var posParentPosition = $(posParent).css("position");
          if (posParentPosition == 'absolute') {
            break;
          } else if (posParentPosition == 'relative') {
            // 正常显示流
            posLeft += posParent.offsetLeft;
            posTop += posParent.offsetTop;
            break;
          } else if (posParentPosition == 'fixed') {
            break;
          } else {
            // 正常显示流
            posLeft += posParent.offsetLeft;
            posTop += posParent.offsetTop;
          }
        }
        form.css({
          position: "absolute",
          left: posLeft + 'px',
          top: posTop + 'px'
        });

        /* form 输入控件 */
        var divEditor = $('<div class="jqeditable_div_input"></div>');
        divEditor.append(editor);

        /* form 提交按钮和取消按钮 */
        var divButtons = $('<div class="jqeditable_div_buttons"></div>');
        var submitBtn = $('<input type="submit" value="提交">');
        var cancelBtn = $('<input type="button" value="取消">');
        cancelBtn.click(function (e) {
          form.remove();
        });
        divButtons.append(submitBtn, cancelBtn);

        /* 拼装form */
        form.append(divEditor, divButtons);

        /* form.submit() */
        form.submit(function (e) {

          /* 阻止表单的默认行为 */
          e.preventDefault();
          e.stopPropagation();

          var formdata = $(this).serializeArray();
          var data = ele_params.concat(formdata);

          // ajax请求
          var request = {
            url: settings.url,
            type: settings.ajaxType,
            data: data,
            dataType: "json",
          };

          // ajax.是否允许跨域
          if (settings.crossDomain) {
            request.crossDomain = true;
            request.xhrFields = {
              'Access-Control-Allow-Origin': '*'
            };
            console.log(request);
          }

          // ajax应答
          var response = {
            // 成功
            success: function (data, status, xhq) {

              if (data[0] === 0) {
                // 显示“修改成功”
                $.fn.jqeditable.msgbox({
                  "text": '修改成功',
                }, form);

                /*
                 * 如果设置了settings.success()回调函数，则交其处理。
                 * 如果没有设置settings.success()回调函数，则用editor.success()处理。
                 */
                if (settings.success && $.isFunction(settings.success)) {
                  settings.success(ele, data[2]);
                } else {
                  editor.success(data[2]);
                }
              } else {
                // 返回的格式不对，或者data[0]不为0
                $.fn.jqeditable.msgbox({
                  "text": '修改失败',
                }, form);

                // 如果设置了error回调函数
                if (settings.error && $.isFunction(settings.error)) {
                  settings.error(data[1]);
                }
              }
            },

            // 有错
            error: function (xhr, status, err) {
              $.fn.jqeditable.msgbox({
                "text": '修改失败',
              }, form);

              // 如果设置了error回调函数
              if (settings.error && $.isFunction(settings.error)) {
                settings.error(status);
              }
            }
          }

          // 发起请求
          $.ajax($.extend(request, response));

          // 返回false
          return false;
        });

        /* 把form插入到当前元素之后 */
        $(posParent).after(form);

        /* focus到form的第一个有效输入控件 */
        form.find(':input:visible:enabled:first').focus();
      });
    }

    // 遍历子元素
    j_ele.children().each(function (idx, ele) {
      $.fn.jqeditable._make(ele, ele_params, settings);
    });
  }


  /**
   * 显示一个消息框
   *
   * @param {Object} options
   * @param {Object} form 用作基准位置的form
   */
  $.fn.jqeditable.msgbox = function (options, form) {
    /* 默认设置 */
    var defaults = {
      "timeout": 3000, // 消息框显示多长时间，默认3000毫秒
    };

    /* 合并设置 */
    var settings = $.extend(defaults, options);

    /* div */
    var div = $('<div></div>');
    div.css({
      "position": "absolute",
      "left": form.css("left"),
      "top": form.css("top"),
      "border": "1px solid orange",
      "background-color": "yellow"
    });
    div.text(settings.text);

    /* 隐藏form */
    form.hide();

    /* 把msgbox加到form后面 */
    form.after(div);

    /* 消息框只显示指定的时间，默认是3秒 */
    window.setTimeout(function () {
      div.remove();
    }, settings.timeout);
  }


  /**
   * jQuery.serialize()函数的逆函数
   *
   * @param {String} str 要反序列化的字符串
   */
  $.fn.jqeditable.parseParams = function (str) {
    var items = [];
    var a = str.split('&');
    $.each(a, function (idx, item) {
      var eqpos = item.indexOf('=');
      if (eqpos == -1 || eqpos == 0) {
        // invalid
      } else {
        var name = item.substring(0, eqpos);
        var value = item.substring(eqpos + 1);
        items.push({
          name: name,
          value: value,
        });
      }
    });
    return items;
  }


  /**
   * 生成TEXT输入控件
   *
   * @param {HTMLElement} ele 当前元素
   * @param {Array} params 附加参数
   * @param {Object} settings 传入的设置参数
   *
   * @return {jQuery} 生成的输入控件,jQuery对象格式
   */
  $.fn.jqeditable._TEXT = function (ele, params, settings) {
    var ed_name = ele.getAttribute("data-ed-name");
    var ed_value = null;
    if (ele.hasAttribute("data-ed-value")) {
      ed_value = ele.getAttribute("data-ed-value");
    } else {
      ed_value = ele.innerText;
    }

    var editor = $('<input type="text" name="' + ed_name + '"/>');
    editor.attr({
      "name": ed_name,
      "value": ed_value
    });

    // 提交成功后的默认处理
    editor.success = function (value) {
      ele.setAttribute("data-ed-value", value);
      ele.innerHTML = value;
      return;
    }

    // 返回生成的输入控件
    return editor;
  }


  /**
   * 生成SELECT输入控件
   *
   * @param {HTMLElement} ele 当前元素
   * @param {Array} params 附加参数
   * @param {Object} settings 传入的设置参数
   *
   * @return {jQuery} 生成的输入控件,jQuery对象格式
   */
  $.fn.jqeditable._SELECT = function (ele, params, settings) {
    var ed_name = ele.getAttribute("data-ed-name");
    var ed_value = ele.getAttribute("data-ed-value");
    var ed_options = ele.getAttribute("data-ed-options");

    /*
     * select的选项集合, 要事先定义好一个数组变量, 格式为:
     * const your_options = [
     *  {"value":值1, "caption":"标题1"},
     *  {"value":值2, "caption":"标题2"},
     *  ...
     * ]
     */
    var options = null;
    try {
      options = eval(ed_options);
    } catch (e) {
      // 构造出错, 返回一个null
      return null;
    }

    var editor = $('<select name="' + ed_name + '"/>');
    for (var option of options) {
      var opt = $('<option/>');
      opt.text(option.caption);
      opt.attr('value', option.value);
      if (option.value == ed_value) {
        opt.attr("selected", 'selected');
        ele.innerText = option.caption;
      }
      editor.append(opt);
    }

    // 提交成功后的默认处理
    editor.success = function (value) {
      for (var option of options) {
        if (value == option.value) {
          ele.setAttribute("data-ed-value", value);
          ele.innerHTML = option.caption;
          return;
        }
      }
    }

    // 返回生成的输入控件
    return editor;
  }


  /**
   * 缺省配置
   */
  $.fn.jqeditable.defaults = {
    "crossDomain": true, // 是否允许跨域
    "ajaxType": "POST", // ajax类型
  };
})(jQuery);