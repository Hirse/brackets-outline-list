/* eslint-disable no-use-before-define */
define(function (require, exports, module) {
    "use strict";

    /* beautify preserve:start *//* eslint-disable no-multi-spaces */
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
    /* eslint-enable no-multi-spaces *//* beautify preserve:end */

    ExtensionUtils.loadStyleSheet(module, "styles/styles.css");

    /** @const {string} Prefix for commands. */
    var PREFIX = "hirse.outline";

    /* beautify preserve:start *//* eslint-disable key-spacing */
    var languages = {
        JavaScript:             require("src/languages/JavaScript"),
        Haxe:                   require("src/languages/Haxe"),
        CoffeeScript:           require("src/languages/CoffeeScript"),
        CSS:                    require("src/languages/CSS"),
        SCSS:                   require("src/languages/CSS"),
        LESS:                   require("src/languages/CSS"),
        Stylus:                 require("src/languages/Stylus"),
        PHP:                    require("src/languages/PHP"),
        Ruby:                   require("src/languages/Ruby"),
        Python:                 require("src/languages/Python"),
        Markdown:               require("src/languages/Markdown"),
        "Markdown (GitHub)":    require("src/languages/Markdown"),
        XML:                    require("src/languages/XML"),
        HTML:                   require("src/languages/XML"),
        "Embedded Ruby":        require("src/languages/XML"),
        SVG:                    require("src/languages/XML"),
        Jade:                   require("src/languages/Jade")
    };
    /* eslint-enable key-spacing *//* beautify preserve:end */

    /**
     * Render the outline list template and assign event handlers.
     * @returns {jQuery} jQuery object of the template.
     */
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

    /**
     * Go to the line and character of the selected entry.
     * @param {object} event Event with line and ch as data.
     */
    function goToLine(event) {
        var currentEditor = EditorManager.getActiveEditor();
        currentEditor.setCursorPos(event.data.line, event.data.ch, true);
        currentEditor.focus();
    }

    /**
     * Update the outline when the document has changed.
     * If the current document is invalid or of a language that is unsupported, the outline will be hidden.
     */
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

        var list = lang.getOutlineList(doc.getText(), prefs.get("args"), prefs.get("unnamed"));

        if (prefs.get("sort") && lang.compare) {
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

    /**
     * Handler for a horizontal resize of the outline list.
     */
    function onResize() {
        var toolbarPx = $("#main-toolbar:visible").width() || 0;
        $(".content").css("right", ($("#outline").width() || 0) + toolbarPx + "px");
    }

    /**
     * Show the outline. The position is depending on the preferences.
     */
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

    /**
     * Hide the outline and remove if it once the hinding is complete.
     * @param {function} onHideCompleted Callback for hinding complete.
     */
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

    /**
     * Enable outline.
     * Set the toolbar button style, attach event listeners, and update the outline.
     */
    function enableOutline() {
        $("#outline-toolbar-icon").addClass("enabled");
        EditorManager.on("activeEditorChange", updateOutline);
        DocumentManager.on("documentSaved", updateOutline);
        updateOutline();
    }

    /**
     * Disable the outline.
     * Hide the outline, set the toolbar button style, and detach the event listeners.
     */
    function disableOutline() {
        hideOutline();
        $("#outline-toolbar-icon").removeClass("enabled");
        EditorManager.off("activeEditorChange", updateOutline);
        DocumentManager.off("documentSaved", updateOutline);
    }

    /**
     * Toggle the outline.
     */
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
        var commandName = PREFIX + "." + key;
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
