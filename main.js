/* global define, brackets, Mustache */

define(function (require, exports, module) {
    "use strict";

    var CommmandManager = brackets.getModule("command/CommandManager");
    var Menus           = brackets.getModule("command/Menus");
    var DocumentManager = brackets.getModule("document/DocumentManager");
    var EditorManager   = brackets.getModule("editor/EditorManager");
    var Resizer         = brackets.getModule("utils/Resizer");
    var AppInit         = brackets.getModule("utils/AppInit");
    var ExtensionUtils  = brackets.getModule("utils/ExtensionUtils");
    var _               = brackets.getModule("thirdparty/lodash");

    var Strings         = require("strings");
    var prefs           = require("src/Preferences");
    var ListTemplate    = require("text!templates/outline.html");

    ExtensionUtils.loadStyleSheet(module, "styles/styles.css");

    var prefix = "hirse.outline";

    var languages = {
        JavaScript:             require("src/languages/JavaScript"),
        CoffeeScript:           require("src/languages/CoffeeScript"),
        CSS:                    require("src/languages/CSS"),
        SCSS:                   require("src/languages/CSS"),
        LESS:                   require("src/languages/CSS"),
        PHP:                    require("src/languages/PHP"),
        Markdown:               require("src/languages/Markdown"),
        "Markdown (GitHub)":    require("src/languages/Markdown"),
        XML:                    require("src/languages/XML"),
        HTML:                   require("src/languages/XML"),
        SVG:                    require("src/languages/XML")
    };

    var editor_lines = 0;

    var onKeyActivity = function ($event, editor, event) {
      selectCurrentFunction(editor);
    }
    
    var onCursorActivity = function ($event, editor) {
      selectCurrentFunction(editor);
    }
    
    function selectCurrentFunction(editor) {
      var pos = editor.getCursorPos();
      
      if (editor_lines != editor.getLastVisibleLine())
      {
        console.log('changed');
        createList();
      }
      editor_lines = editor.getLastVisibleLine();

      var remove_entries = $("#outline-list ul li");
      remove_entries.removeClass('active');
      
      var entry = $("#outline-list ul li").filter(function() {
        var id = $(this)[0].id;
        var splitted = id.split('_');
        var line_start = splitted[splitted.length-2];
        var line_eind = splitted[splitted.length-1];
        return line_start <= pos.line && line_eind >= pos.line;
      });
      entry.addClass('active');
    }
  
    function getOutline() {
        var $outline = Mustache.render(ListTemplate, {
            Strings: Strings
        });
        $outline = $($outline);

        $outline.on("click", "#outline-close", toggleEnabled);
        $outline.on("click", "#outline-move", function () {
            hideOutline(function () {
                prefs.togglePref("sidebar");
                updateOutline();
            });
        });
        return $outline;
    }

    function goToLine(event) {
        var currentEditor = EditorManager.getActiveEditor();
        currentEditor.setCursorPos(event.data.line, event.data.ch, true);
        currentEditor.focus();
    }

    function updateOutline() {
      
        var currentEditor = EditorManager.getActiveEditor();
        $(currentEditor).on('keyup', onKeyActivity);
        $(currentEditor).on('cursorActivity', onCursorActivity);
        $(currentEditor).on('cursorActivity', onCursorActivity);
      
        showOutline();

        createList();
    }
  
    function createList() { 
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

        var lines = doc.getText(false).split("\n");
        var list = lang.getOutlineList(lines, prefs.get("args"), prefs.get("unnamed"));

        if (prefs.get("sort") && lang.compare) {
            list.sort(lang.compare);
        }

        list.reverse();

        var last_line = 999999999;
        list.forEach(function (entry) {
            entry.end_line = last_line;
            last_line = entry.line - 1;
        });

        list.reverse();
      
        $("#outline-list ul li").remove();
        list.forEach(function (entry) {
            var $entry = $(document.createElement("li"));
            $entry.addClass("outline-entry");
            $entry.addClass(entry.classes);
            $entry.append(entry.$html);
            $entry[0].id = 'outline_line_' + entry.line + '_' + entry.end_line;
            $entry.click({
                line: entry.line,
                ch: entry.ch
            }, goToLine);
            $("#outline-list ul").append($entry);
            last_line = entry.line;
        });
    }

    function onResize() {
        var toolbarPx = $("#main-toolbar:visible").width() || 0;
        $(".content").css("right", ($("#outline").width() || 0) + toolbarPx + "px");
    }

    function showOutline() {
        if ($("#outline").length) {
            $("#outline-list ul").empty();
            return;
        }

        var $outline = getOutline();
        if (prefs.get("sidebar")) {
            $("#sidebar").append($outline);
            $("#outline").addClass("outline-sidebar");
            Resizer.makeResizable($outline, "vert", "top", 75);
        } else {
            var toolbarPx = $("#main-toolbar:visible").width() || 0;
            $(".main-view").append($outline);
            $("#outline").css("right", toolbarPx + "px");
            $("#outline").addClass("outline-main quiet-scrollbars");
            Resizer.makeResizable($outline, "horz", "left", 150);
            $outline.on("panelResizeUpdate", onResize);
            onResize();
        }
        Menus.ContextMenu.assignContextMenuToSelector("#outline-settings", settingsMenu);
    }

    function hideOutline(onHideCompleted) {
        if (prefs.get("sidebar")) {
            $("#outline").slideUp(function () {
                $(this).remove();
                onResize();
                if (onHideCompleted) {
                    onHideCompleted();
                }
            });
        } else {
            $("#outline").remove();
            onResize();
            if (onHideCompleted) {
                onHideCompleted();
            }
        }
    }

    function enableOutline() {
        $("#outline-toolbar-icon").addClass("enabled");
        EditorManager.on("activeEditorChange", updateOutline);
        DocumentManager.on("documentSaved", updateOutline);
      
        updateOutline();
    }

    function disableOutline() {
        hideOutline();
        $("#outline-toolbar-icon").removeClass("enabled");
        EditorManager.off("activeEditorChange", updateOutline);
        DocumentManager.off("documentSaved", updateOutline);
    }

    function toggleEnabled() {
        if (prefs.togglePref("enabled")) {
            enableOutline();
        } else {
            disableOutline();
        }
    }


    /* Create Settings Context Menu */
    var settingsMenu = Menus.registerContextMenu("hirse-outline-context-menu");
    _.each(prefs.getSettings(), function (status, key) {
        var commandName = prefix + "." + key;
        var commandString = Strings["COMMAND_" + key.toUpperCase()];
        var command = CommmandManager.register(commandString, commandName, function () {
            var checked = prefs.togglePref(commandName.split(".")[2]);
            command.setChecked(checked);
            updateOutline();
        });
        command.setChecked(status);
        settingsMenu.addMenuItem(command);
    });

    /* Create Toolbar Icon */
    $(document.createElement("a"))
        .attr("id", "outline-toolbar-icon")
        .attr("href", "#")
        .attr("title", Strings.TOOLBAR_ICON_TOOLTIP)
        .on("click", toggleEnabled)
        .appendTo($("#main-toolbar .buttons"));

    AppInit.appReady(onResize);
    if (prefs.get("enabled")) {
        enableOutline();
    }
});