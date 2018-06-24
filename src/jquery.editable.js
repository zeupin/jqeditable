/**
 * jQuery就地编辑插件
 *
 * @author Macc Liu
 * @copyright (c) 2018 Zeupin.com.
 * @license MIT License (see https://github.com/zeupin/editable/blob/master/LICENSE)
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
  $.fn.editable = function (url, options) {
    // 合并设置
    var settings = $.extend({}, $.fn.editable.defaults, {
      "url": url
    }, options);

    // 对需要使用就地编辑的元素逐个进行设置
    return this.each(function () {
      $.fn.editable.make(this, [], settings);
    });
  }


  /**
   * 输入界面构造器
   *
   * @param {HTMLElement} ele 当前元素
   * @param {Array} params 附加参数
   * @param {Object} settings 传入的设置参数
   */
  $.fn.editable.make = function (ele, params, settings) {
    // $(ele)
    var j_ele = $(ele);

    // 构造 ele_params
    var ele_params = params;
    if (ele.hasAttribute("data-ed-params")) {
      var ed_params = j_ele.data("ed-params");
      if (ed_params) {
        ed_params = $.fn.editable.parseParams(ed_params);
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
          if (['absolute', 'relative', 'fixed'].indexOf(posParentPosition) == -1) {
            posLeft += posParent.offsetLeft;
            posTop += posParent.offsetTop;
          } else {
            break;
          }
        }
        form.css({
          position: "absolute",
          left: posLeft + 'px',
          top: posTop + 'px'
        });

        /* form 输入控件 */
        var divInput = $('<div class="editable_div_input"></div>');
        var input = $('<input type="text"/>');
        input.attr({
          name: ed_name,
          value: ed_value
        });
        divInput.append(input);

        /* form 提交按钮和取消按钮 */
        var divButtons = $('<div class="editable_div_buttons"></div>');
        var submitBtn = $('<input type="submit" value="提交">');
        var cancelBtn = $('<input type="button" value="取消">');
        cancelBtn.click(function (e) {
          form.remove();
        });
        divButtons.append(submitBtn, cancelBtn);

        /* 拼装form */
        form.append(divInput, divButtons);

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
            success: function (data, status, xhq) {

              if (data[0] === 0) {
                // 修改成功
                $.fn.editable.msgbox({
                  "text": '修改成功',
                }, form);

                // 把返回的数据保存到 data-ed-value
                jqthis.attr("data-ed-value", data[2]);

                // 把返回的数据
                jqthis.text(data[2]);

                // 如果设置了success回调函数
                if (settings.success && $.isFunction(settings.success)) {
                  settings.success(data[2]);
                }
              } else {
                // 返回的格式不对，或者data[0]不为0
                $.fn.editable.msgbox({
                  "text": '修改失败',
                }, form);
              }
            },

            error: function (xhr, status, err) {
              $.fn.editable.msgbox({
                "text": '修改失败',
              }, form);
            }
          }

          // 发起请求
          $.ajax($.extend(request, response));
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
      $.fn.editable.make(ele, ele_params, settings);
    });
  }


  /**
   * 显示一个消息框
   *
   * @param {Object} options
   * @param {Object} form 用作基准位置的form
   */
  $.fn.editable.msgbox = function (options, form) {
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
  $.fn.editable.parseParams = function (str) {
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
   * 缺省配置
   */
  $.fn.editable.defaults = {
    "crossDomain": true, // 是否允许跨域
    "ajaxType": "POST", // ajax类型
  };
})(jQuery);