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

    // 对需要使用就地编辑的元素逐个进行处理
    return this.each(function () {
      $.fn.editable.make(this, [], settings);
    });
  }


  /**
   * 构造器
   *
   * @param {HTMLElement} me 当前元素
   * @param {Array} params 附加参数
   */
  $.fn.editable.make = function (me, params, settings) {
    // $(me)
    var j_me = $(me);

    // params做叠加
    var ed_params = j_me.data("ed-params");
    if (ed_params) {
      ed_params = $.fn.editable.parseParams(ed_params);
    } else {
      ed_params = [];
    }
    var new_params = params.concat(ed_params);

    // 如果有data-ed-name属性，则生成一个form
    if (this.hasAttribute("data-ed-name")) {

      // dblclick可激活编辑状态
      j_me.dblclick(function (e) {
        /* $(this) */
        var jqthis = $(this);

        /* 阻止双击的默认行为 */
        e.preventDefault();
        e.stopPropagation();

        // data-ed-name
        var ed_name = j_me.data("ed-name");

        // data-ed-value
        var ed_value = null;
        if (this.hasAttribute("data-ed_value")) {
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
          var data = new_params.concat(formdata);
          var url = settings.url;

          $.ajax({
            // 请求
            url: url,
            type: "GET",
            data: data,
            crossDomain: true,
            xhrFields: {
              'Access-Control-Allow-Origin': '*'
            },
            // 应答
            success: function (data, status, xhq) {
              $.fn.editable.msgbox({
                "text": data,
              }, form);
            },
            error: function (xhr, status, err) {}
          });
          return false;
        });

        /* 把form插入到当前元素之后 */
        jqthis.after(form);

        /* focus到form的第一个有效输入控件 */
        form.find(':input:visible:enabled:first').focus();
      });
    }

    // 遍历子元素
    j_me.children().each(function (idx, ele) {
      $.fn.editable.make(ele, new_params, settings);
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
    var settings = $.extend({}, defaults, options);

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
  $.fn.editable.defaults = {};
})(jQuery);