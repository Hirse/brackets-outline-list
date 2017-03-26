define(function OutlineManager(require, exports, module) {
    "use strict";

    /* beautify preserve:start *//* eslint-disable no-multi-spaces */
    var Mustache     = brackets.getModule("thirdparty/mustache/mustache");
    var Resizer      = brackets.getModule("utils/Resizer");

    var Promise      = require("thirdparty/promise");
    var Strings      = require("strings");
    var prefs        = require("src/Preferences");
    var SettingsMenu = require("src/SettingsMenu");
    var ListTemplate = require("text!templates/outline.html");
    /* eslint-enable no-multi-spaces *//* beautify preserve:end */

    /** @const {number} Position for sidebar */
    var POSITION_SIDEBAR = 0;
    /** @const {number} Position for main window. */
    var POSITION_TOOLBAR = 1;

    /* beautify preserve:start *//* eslint-disable key-spacing */
    var outlineProviders = {
        JavaScript:   require("src/languages/JavaScript"),
        Haxe:         require("src/languages/Haxe"),
        CoffeeScript: require("src/languages/CoffeeScript"),
        CSS:          require("src/languages/CSS"),
        Stylus:       require("src/languages/Stylus"),
        PHP:          require("src/languages/PHP"),
        Ruby:         require("src/languages/Ruby"),
        Python:       require("src/languages/Python"),
        Markdown:     require("src/languages/Markdown"),
        XML:          require("src/languages/XML"),
        Jade:         require("src/languages/Jade")
    };
    /* eslint-enable key-spacing *//* beautify preserve:end */

    var listeners = [];
    var outlineProvider;
    var isVisible = false;
    var position = prefs.get("sidebar") ? POSITION_SIDEBAR : POSITION_TOOLBAR;
    var settingsMenuAssigned = false;

    var $outline = $(Mustache.render(ListTemplate, {
        Strings: Strings
    }));
    $outline.on("click", "#outline-close", function () {
        prefs.togglePref("enabled");
    });
    $outline.on("click", "#outline-move", function () {
        prefs.togglePref("sidebar");
    });

    prefs.onChange("args", function () {
        $outline.find("ul").toggleClass("outline-hide-args", !prefs.get("args"));
    });

    prefs.onChange("indent", function () {
        $outline.find("ul").toggleClass("outline-hide-indent", !prefs.get("indent"));
    });

    prefs.onChange("unnamed", function () {
        $outline.find("ul").toggleClass("outline-hide-unnamed", !prefs.get("unnamed"));
    });

    prefs.onChange("sort", function () {
        if (outlineProvider && outlineProvider.compare) {
            if (prefs.get("sort")) {
                $outline.find(".outline-entry").sort(function (entryA, entryB) {
                    return outlineProvider.compare($(entryA).data("name"), $(entryB).data("name"));
                }).appendTo($outline.find("ul"));
            } else {
                $outline.find(".outline-entry").sort(function (entryA, entryB) {
                    return $(entryA).data("index") - $(entryB).data("index");
                }).appendTo($outline.find("ul"));
            }
        }
    });

    /**
     * Handler for a horizontal resize of the outline list.
     */
    function resize() {
        var toolbarPx = $("#main-toolbar:visible").width() || 0;
        $(".content").css("right", ($("#outline").width() || 0) + toolbarPx + "px");
    }

    /**
     * Add a listener to be called when an entry is selected.
     * @param {function} callback Listener function.
     */
    function onSelect(callback) {
        listeners.push(callback);
    }

    /**
     * Set the outline provider.
     * Does not update the outline.
     * @param {string} outlineProviderName Name of the outline provider.
     */
    function setOutlineProvider(outlineProviderName) {
        outlineProvider = outlineProviders[outlineProviderName];
    }

    /**
     * Update the outline.
     * Get the outline from the set outline provider and update the HTML.
     * Sort the entries if sorting is enabled.
     * @param {string} text Code to generate outline for.
     */
    function updateOutline(text) {
        var $ul = $outline.find("ul");
        $ul.empty();
        var promise;
        try {
            promise = outlineProvider.getOutlineList(text);
            if (!(promise instanceof Promise)) {
                promise = Promise.resolve(promise);
            }
        } catch (error) {
            promise = Promise.reject(error);
        }
        promise.then(function (list) {
            list = list.map(function (entry, index) {
                var $entry = $(document.createElement("li"));
                $entry.addClass("outline-entry " + entry.classes);
                $entry.data("index", index);
                $entry.data("name", entry.name);
                $entry.append(entry.$html);
                $entry.click(function () {
                    listeners.forEach(function (callback) {
                        callback({
                            line: entry.line,
                            ch: entry.ch
                        });
                    });
                });
                return $entry;
            });
            if (outlineProvider.compare && prefs.get("sort")) {
                list.sort(function (entryA, entryB) {
                    return outlineProvider.compare(entryA.data("name"), entryB.data("name"));
                });
            }
            $ul.append(list);
        }).catch(function (error) {
            if (error.message === "SyntaxError") {
                var $li = $(document.createElement("li"));
                $li.addClass("outline-message");
                $li.append(Strings.MESSAGE_SYNTAX_ERROR);
                $ul.append($li);
            }
        });
    }

    /**
     * Show the outline if it is not yet visible.
     * The position is depending on the preferences.
     */
    function showOutline() {
        if (!isVisible) {
            if (position === POSITION_SIDEBAR) {
                $("#sidebar").append($outline);
                $outline.addClass("outline-sidebar");
                Resizer.makeResizable($outline, "vert", "top", 75);
            } else {
                var toolbarPx = $("#main-toolbar:visible").width() || 0;
                $(".main-view").append($outline);
                $outline.css("right", toolbarPx + "px");
                $outline.addClass("outline-main quiet-scrollbars");
                Resizer.makeResizable($outline, "horz", "left", 150);
                $outline.on("panelResizeUpdate.outline-list", resize);
                resize();
            }
            if (!settingsMenuAssigned) {
                SettingsMenu.assignToSelector("#outline-settings");
                settingsMenuAssigned = true;
            }
            isVisible = true;
        }
    }

    /**
     * Hide the outline.
     * Detach the jQuery Element and clean it for re-use.
     */
    function hideOutline() {
        if (isVisible) {
            isVisible = false;
            $outline.detach();
            $outline.css("display", "");
            $outline.css("height", "");
            $outline.css("right", "");
            $outline.css("width", "");
            $outline.removeClass("outline-sidebar outline-main quiet-scrollbars");
            $outline.off("panelResizeUpdate.outline-list", resize);
            Resizer.removeSizable($outline);
            if (position === POSITION_TOOLBAR) {
                resize();
            }
        }
    }

    /**
     * Set the position of the outline.
     * Hides and shows the outline again if it was visible.
     * @param {number} newPosition Position as number.
     */
    function setPosition(newPosition) {
        if (isVisible) {
            hideOutline();
            position = newPosition;
            showOutline();
        } else {
            position = newPosition;
        }
    }

    module.exports = {
        onSelect: onSelect,
        setOutlineProvider: setOutlineProvider,
        setPosition: setPosition,
        updateOutline: updateOutline,
        showOutline: showOutline,
        hideOutline: hideOutline,
        POSITION_SIDEBAR: POSITION_SIDEBAR,
        POSITION_TOOLBAR: POSITION_TOOLBAR
    };
});
