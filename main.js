/* global define, brackets */

define(function (require, exports, module) {
    "use strict";

    var _                   = brackets.getModule("thirdparty/lodash");
    var CommmandManager     = brackets.getModule("command/CommandManager");
    var Menus               = brackets.getModule("command/Menus");
    var DocumentManager     = brackets.getModule("document/DocumentManager");
    var EditorManager       = brackets.getModule("editor/EditorManager");
    var PreferencesManager  = brackets.getModule("preferences/PreferencesManager");
    var AppInit             = brackets.getModule("utils/AppInit");
    var ExtensionUtils      = brackets.getModule("utils/ExtensionUtils");
    var Resizer             = brackets.getModule("utils/Resizer");

    var Strings             = require("strings");

    ExtensionUtils.loadStyleSheet(module, "styles/styles.css");

    var prefix = "hirse.outline";
    var prefs = PreferencesManager.getExtensionPrefs(prefix);

    var languages = {
        JavaScript: require("src/languages/JavaScript"),
        CoffeeScript: require("src/languages/CoffeeScript"),
        CSS:        require("src/languages/CSS"),
        SCSS:       require("src/languages/CSS"),
        LESS:       require("src/languages/CSS"),
        PHP:        require("src/languages/PHP"),
        Markdown:   require("src/languages/Markdown"),
    };

    function goToLine(event) {
        var currentEditor = EditorManager.getActiveEditor();
        currentEditor.setCursorPos(event.data.line, event.data.ch, true);
        currentEditor.focus();
    }

    function updateOutline() {
        var doc = DocumentManager.getCurrentDocument();
        if (!doc) {
            hideOutline();
            return;
        }

        var lang = languages[doc.getLanguage().getName()];
        if (!lang) {
            hideOutline();
            return;
        }

        showOutline();

        var lines = doc.getText(false).split("\n");
        var list = lang.getOutlineList(lines, prefs.get("args"), prefs.get("unnamed"));

        if (prefs.get("sort")) {
            list.sort(lang.compare);
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

    function showOutline() {
        if ($("#outline").length) {
            $("#outline-list ul").empty();
            return;
        }

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

        if (sidebar) {
            $("#sidebar").append($outline);
            Resizer.makeResizable($outline, "vert", "top", 75);
        } else {
            var toolbarPx = $("#main-toolbar:visible").width() || 0;
            $outline.css("right", toolbarPx + "px");
            $(".main-view").append($outline);
            Resizer.makeResizable($outline, "horz", "left", 150);
            var onResize = function () {
                $(".content").css("right", ($outline.width() || 150) + toolbarPx + "px");
            };
            onResize();
            $outline.on("panelResizeUpdate", onResize);
            AppInit.appReady(onResize);
        }
    }

    function hideOutline() {
        $("#outline").remove();
        $(".content").css("right", ($("#main-toolbar:visible").width() || 0) + "px");
    }

    function enableOutline() {
        $("#outline-toolbar-icon").addClass("enabled");
        $(EditorManager).on("activeEditorChange", updateOutline);
        $(DocumentManager).on("documentSaved", updateOutline);
        updateOutline();
    }

    function disableOutline() {
        hideOutline();
        $("#outline-toolbar-icon").removeClass("enabled");
        $(EditorManager).off("activeEditorChange", updateOutline);
        $(DocumentManager).off("documentSaved", updateOutline);
    }

    function togglePref(key) {
        var state = prefs.get(key);
        prefs.set(key, !state);
        prefs.save();
        return !state;
    }

    function toggleEnabled() {
        if (togglePref("enabled")) {
            enableOutline();
        } else {
            disableOutline();
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
                hideOutline();
                updateOutline();
            }
        }, sort: {
            type: "boolean",
            value: false,
            commandAction: updateOutline
        }
    };

    menu.addMenuDivider();

    _.each(defaultPreferences, function (definition, key) {
        prefs.definePreference(key, definition.type, definition.value);
        if (definition.commandAction) {
            var commandName = prefix + "." + key;
            var commandString = Strings["COMMAND_" + key.toUpperCase()];
            var command = CommmandManager.register(commandString, commandName, function () {
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
        enableOutline();
    }
});
