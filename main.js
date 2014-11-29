/* global define, brackets */

define(function (require, exports, module) {
    "use strict";

    var _                   = brackets.getModule("thirdparty/lodash");
    var CommmandManager     = brackets.getModule("command/CommandManager");
    var Menus               = brackets.getModule("command/Menus");
    var DocumentManager     = brackets.getModule("document/DocumentManager");
    var EditorManager       = brackets.getModule("editor/EditorManager");
    var PreferencesManager  = brackets.getModule("preferences/PreferencesManager");
    var ExtensionUtils      = brackets.getModule("utils/ExtensionUtils");
    var Resizer             = brackets.getModule("utils/Resizer");

    var Strings             = require("strings");

    ExtensionUtils.loadStyleSheet(module, "styles/styles.css");

    var prefix = "hirse.outline";
    var prefs = PreferencesManager.getExtensionPrefs(prefix);
    var languages = {
        JavaScript: require("src/languages/JavaScript"),
        CSS: require("src/languages/CSS"),
        SCSS: require("src/languages/CSS"),
        LESS: require("src/languages/CSS"),
        PHP: require("src/languages/PHP")
    };

    function goToLine(event) {
        var currentEditor = EditorManager.getActiveEditor();
        currentEditor.setCursorPos(event.data.line, event.data.ch, true);
        currentEditor.focus();
    }

    function updateOutline() {
        var doc = DocumentManager.getCurrentDocument();

        $("#outline-list ul").empty();

        if (doc === null) {
            return;
        }

        var lang = languages[doc.getLanguage().getName()];
        if (!lang) {
            return;
        }
        var lines = doc.getText(false).split("\n");
        var list = lang.getOutlineList(lines, prefs.get("args"), prefs.get("unnamed"));

        if (prefs.get("sort")) {
            list.sort();
        }

        list.forEach(function (entry) {
            var $entry = $(document.createElement("li"));
            $entry.addClass("outline-entry");
            $entry.addClass(entry.classes);
            $entry.append(entry.$html);
            $entry.click({
                line: entry.line,
                ch: entry.ch
            }, goToLine);
            $("#outline-list ul").append($entry);
        });
    }

    function loadOutline() {
        var sidebar = prefs.get("sidebar");

        var $outline = $(document.createElement("div"));
        $outline.attr("id", "outline");
        $outline.addClass(function () {
            return sidebar ? "outline-sidebar" : "outline-main quiet-scrollbars";
        });

        var $outlineHeader = $(document.createElement("div"));
        $outlineHeader.attr("id", "outline-header");
        $outlineHeader.text(Strings.HEADER_TITLE);

        var $outlineList = $(document.createElement("div"));
        $outlineList.attr("id", "outline-list");
        $outlineList.append($(document.createElement("ul")));

        $outline.append($outlineHeader, $outlineList);

        $("#outline-toolbar-icon").addClass("enabled");

        if (sidebar) {
            $("#sidebar").append($outline);
            $(".content").css("right", "30px");
            Resizer.makeResizable($outline, "vert", "top", 75);
        } else {
            $(".main-view").append($outline);
            Resizer.makeResizable($outline, "horz", "left", 150);
            var onResize = function () {
                $(".content").css("right", $outline.width() + 30 + "px");
            };
            onResize();
            $outline.on("panelResizeUpdate", onResize);
        }

        $(EditorManager).on("activeEditorChange", updateOutline);
        $(DocumentManager).on("documentSaved", updateOutline);

        updateOutline();
    }

    function removeOutline() {
        $("#outline").remove();
        $(".content").css("right", "30px");
        $("#outline-toolbar-icon").removeClass("enabled");
        $(EditorManager).off("activeEditorChange");
        $(DocumentManager).off("documentSaved");
    }

    function togglePref(key) {
        var state = prefs.get(key);
        prefs.set(key, !state);
        prefs.save();
        return !state;
    }

    function toggleEnabled() {
        if (togglePref("enabled")) {
            loadOutline();
        } else {
            removeOutline();
        }
    }

    function applyCommand(key, action) {
        var command = CommmandManager.get(prefix + "." + key);
        var checked = togglePref(key);
        command.setChecked(checked);
        if (prefs.get("enabled")) {
            action();
        }
    }

    var menu = Menus.getMenu(Menus.AppMenuBar.VIEW_MENU);
    var defaultPreferences = {
        enabled: {
            type: "boolean",
            value: false,
            icon: true
        }, unnamed: {
            type: "boolean",
            value: true,
            commandAction: updateOutline
        }, args: {
            type: "boolean",
            value: true,
            commandAction: updateOutline
        }, sidebar: {
            type: "boolean",
            value: true,
            commandAction: function () {
                removeOutline();
                loadOutline();
            }
        }, sort: {
            type: "boolean",
            value: true,
            commandAction: updateOutline
        }
    };

    menu.addMenuDivider();

    _.each(defaultPreferences, function (definition, key) {
        prefs.definePreference(key, definition.type, definition.value);
        if (definition.commandAction) {
            var commandName = prefix + "." + key;
            var command = CommmandManager.register(Strings["COMMAND_" + key.toUpperCase()], commandName, function () {
                applyCommand(key, definition.commandAction);
            });
            command.setChecked(prefs.get(key));
            menu.addMenuItem(commandName);
        }
    });
    prefs.save();

    $(document.createElement("a"))
        .attr("id", "outline-toolbar-icon")
        .attr("href", "#")
        .attr("title", Strings.TOOLBAR_ICON_TOOLTIP)
        .on("click", toggleEnabled)
        .appendTo($("#main-toolbar .buttons"));

    if (prefs.get("enabled")) {
        loadOutline();
    }
});
