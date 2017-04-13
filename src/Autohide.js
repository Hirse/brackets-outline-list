define(function (require, exports, module) {
    "use strict";

    /* beautify preserve:start *//* eslint-disable no-multi-spaces */
    var Mustache            = brackets.getModule("thirdparty/mustache/mustache");

    var OutlineManager      = require("src/OutlineManager");
    var prefs               = require("src/Preferences");
    var placeholderTemplate = require("text!templates/placeholder.html");
    /* eslint-enable no-multi-spaces *//* beautify preserve:end */

    var $placeholder = $(Mustache.render(placeholderTemplate));
    var $content = $(".content");
    var $mainView = $(".main-view");
    var isExposed = false;
    var sidebarPlusTransitionRemoved = false;


    /**
     * Enable animation on transition for the content container.
     */
    function enableContentTransition() {
        $mainView.css("background-color", "#47484b");
        $content.addClass("outline-autohide-content");
    }

    /**
     * Disable animation on transition for the content container.
     */
    function disableContentTransition() {
        $content.removeClass("outline-autohide-content");
        // Hack to compatibilize with Sidebar Plus extension.
        // The 'if' statement would not be needed if no Sidebar Plus.
        if (!$content.hasClass("sidebarplus-content")) {
            $mainView.css("background-color", "");
        }
    }

    /**
     * Remove class 'sidebarplus-content' from '.content' if necessary.
     * (Hack to compatibilize with Sidebar Plus extension, because the CSS rules
     * in it override the Outline rules and make it not work correctly).
     */
    function removeSidebarPlusTransition() {
        if ($content.hasClass("sidebarplus-content")) {
            $content.removeClass("sidebarplus-content");
            sidebarPlusTransitionRemoved = true;
        }
    }

    /**
     * Add class 'sidebarplus-content' to '.content' if previously removed.
     * (Hack to compatibilize with Sidebar Plus extension).
     */
    function addSidebarPlusTransition() {
        if (sidebarPlusTransitionRemoved) {
            $content.addClass("sidebarplus-content");
        }
    }

    /**
     * Insert a placeholder on right.
     */
    function showPlaceholder() {
        var toolbarPx = $("#main-toolbar:visible").width() || 0;
        $mainView.append($placeholder);
        $placeholder.css("width", "20px");
        $placeholder.css("right", toolbarPx + "px");
        $content.css("right", ($placeholder.width() || 0) + toolbarPx + "px");
        $content.bind("transitionend.outline", function () {
            addSidebarPlusTransition();
        });
    }

    /**
     * Remove the placeholder.
     */
    function hidePlaceholder() {
        var toolbarPx = $("#main-toolbar:visible").width() || 0;
        $placeholder.remove();
        $content.css("right", toolbarPx + "px");
    }

    /**
     * Hide the placeholder and show the Outline.
     */
    function exposeOutline() {
        if (!isExposed) {
            $content.bind("transitionend.outline", function () {
                var $outline = $("#outline");
                $outline.css("visibility", "visible");
                addSidebarPlusTransition();
            });
            removeSidebarPlusTransition();
            hidePlaceholder();
            OutlineManager.showOutline();
            var $outline = $("#outline");
            $outline.css("visibility", "hidden");
            isExposed = true;
        }
    }

    /**
     * Hide the Outline and show the placeholder.
     */
    function coverOutline() {
        if (isExposed) {
            removeSidebarPlusTransition();
            OutlineManager.hideOutline();
            showPlaceholder();
            $placeholder.on("mouseover", exposeOutline);
            isExposed = false;
        }
    }

    /**
     * Enable Outline auto-hide.
     */
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

    /**
     * Disable Outline auto-hide.
     */
    function disable() {
        $content.off("mouseover", coverOutline);
        $placeholder.off("mouseover", exposeOutline);
        if (prefs.get("enabled") && !isExposed) {
            hidePlaceholder();
            OutlineManager.showOutline();
        } else if (!prefs.get("enabled") && isExposed) {
            OutlineManager.hideOutline();
        } else if (!prefs.get("enabled") && !isExposed) {
            hidePlaceholder();
        }
        disableContentTransition();
        isExposed = false;
    }

    /**
     * Disable auto-hide, execute a function and re-enable it.
     * @param {function} callback To be executed between disable and re-enable.
     */
    function reset(callback) {
        disable();
        if (typeof callback === "function") {
            callback();
        }
        enable();
    }

    module.exports = {
        enable: enable,
        disable: disable,
        reset: reset
    };
});
