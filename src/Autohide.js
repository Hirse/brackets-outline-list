define(function (require, exports, module) {
    "use strict";

    var Mustache            = brackets.getModule("thirdparty/mustache/mustache");

    var OutlineManager      = require("src/OutlineManager");
    var prefs               = require("src/Preferences");
    var placeholderTemplate = require("text!templates/placeholder.html");

    var $placeholder = $(Mustache.render(placeholderTemplate));
    var $content = $(".content");
    var $mainView = $(".main-view");
    var isExposed = false;


    function enableContentTransition() {
        $mainView.css("background-color", "#47484b");
        $content.addClass("outline-autohide-content");
    }

    function disableContentTransition() {
        $mainView.css("background-color", "");
        $content.removeClass("outline-autohide-content");
    }

    function showPlaceholder() {
        var toolbarPx = $("#main-toolbar:visible").width() || 0;
        $mainView.append($placeholder);
        $placeholder.css("width", "20px");
        $placeholder.css("right", toolbarPx + "px");
        $content.css("right", ($placeholder.width() || 0) + toolbarPx + "px");
    }

    function hidePlaceholder() {
        var toolbarPx = $("#main-toolbar:visible").width() || 0;
        $placeholder.remove();
        $content.css("right", toolbarPx + "px");
    }

    function exposeOutline() {
        if (!isExposed) {
            $content.bind("transitionend", function () {
                var $outline = $("#outline");
                $outline.css("visibility", "visible");
            });
            hidePlaceholder();
            OutlineManager.showOutline();
            var $outline = $("#outline");
            $outline.css("visibility", "hidden");
            isExposed = true;
        }
    }

    function coverOutline() {
        if (isExposed) {
            OutlineManager.hideOutline();
            showPlaceholder();
            $placeholder.on("mouseover", exposeOutline);
            isExposed = false;
        }
    }

    function enable() {
        if (!prefs.get("sidebar")) {
            $content.on("mouseover", coverOutline);
            if (prefs.get("enabled")) {
                isExposed = true;
                coverOutline();
                enableContentTransition();
            }
        }
    }

    function disable() {
        $content.off("mouseover", coverOutline);
        $placeholder.off("mouseover", exposeOutline);
        if (prefs.get("enabled")) {
            if (!isExposed) {
                hidePlaceholder();
                OutlineManager.showOutline();
            }
        } else {
            if (!isExposed) {
                hidePlaceholder();
            } else {
                OutlineManager.hideOutline();
            }
        }
        disableContentTransition()
        isExposed = false;
    }

    function reset(callback) {
        callback = (typeof callback === 'function') ? callback : function () {};
        disable();
        callback();
        enable();
    }

    module.exports = {
        enable: enable,
        disable: disable,
        reset: reset
    };
});
