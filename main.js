define(function (require, exports, module) {
    "use strict";

    /* beautify preserve:start *//* eslint-disable no-multi-spaces */
    var DocumentManager    = brackets.getModule("document/DocumentManager");
    var EditorManager      = brackets.getModule("editor/EditorManager");
    var PreferencesManager = brackets.getModule("preferences/PreferencesManager");
    var ExtensionUtils     = brackets.getModule("utils/ExtensionUtils");
    var CommandManager     = brackets.getModule("command/CommandManager");
    var Menus              = brackets.getModule("command/Menus");

    var prefs              = require("src/Preferences");
    var OutlineManager     = require("src/OutlineManager");
    var ToolbarButton      = require("src/ToolbarButton");
    /* eslint-enable no-multi-spaces *//* beautify preserve:end */

    ExtensionUtils.loadStyleSheet(module, "styles/styles.css");

    /* beautify preserve:start *//* eslint-disable key-spacing */
    var languageMapping = {
        JavaScript:          "JavaScript",
        JSX:                 "JavaScript",
        Haxe:                "Haxe",
        CoffeeScript:        "CoffeeScript",
        CSS:                 "CSS",
        SCSS:                "CSS",
        LESS:                "CSS",
        Stylus:              "Stylus",
        PHP:                 "PHP",
        Ruby:                "Ruby",
        Python:              "Python",
        Markdown:            "Markdown",
        "Markdown (GitHub)": "Markdown",
        XML:                 "XML",
        HTML:                "XML",
        "Embedded Ruby":     "XML",
        SVG:                 "XML",
        Jade:                "Jade"
    };
    /* eslint-enable key-spacing *//* beautify preserve:end */

    /* beautify preserve:start *//* eslint-disable no-multi-spaces */
    var COMMAND_AUTOHIDE   = "outline.autohide";
    var MENU_ITEM_AUTOHIDE = "Outline List Autohide";
    /* eslint-enable no-multi-spaces *//* beautify preserve:end */

    /**
     * Check if the outline is available for the given document.
     * @param   {Document} document Document taken from the editor.
     * @returns {boolean}  True, if an outline is available.
     */
    function isOutlineAvailable(document) {
        return document && document.getLanguage().getName() in languageMapping;
    }

    /**
     * Handler for editor changed.
     * Update and show or hide the outline based on availability.
     * The update is trigger with a short delay to prevent missclicking on the File Tree.
     */
    function handleEditorChange() {
        window.setTimeout(function () {
            var document = DocumentManager.getCurrentDocument();
            if (isOutlineAvailable(document)) {
                OutlineManager.setOutlineProvider(languageMapping[document.getLanguage().getName()]);
                OutlineManager.updateOutline(document.getText());
                OutlineManager.showOutline();
            } else {
                OutlineManager.hideOutline();
            }
        }, 100);
    }

    /**
     * Handler for document saved.
     * Update the outline with the new text.
     */
    function handleDocumentSave() {
        OutlineManager.updateOutline(DocumentManager.getCurrentDocument().getText());
    }

    /**
     * Handler for enabled changed.
     * If the outline just got enbaled, set the outline provider, update the outline, and show it.
     * If it is not available or got disabled, hide the outline.
     */
    function handleEnabledChange() {
        ToolbarButton.setEnabled(prefs.get("enabled"));
        if (prefs.get("enabled")) {
            EditorManager.on("activeEditorChange.outline-list", handleEditorChange);
            DocumentManager.on("documentSaved.outline-list", handleDocumentSave);
            var document = DocumentManager.getCurrentDocument();
            if (isOutlineAvailable(document)) {
                OutlineManager.setOutlineProvider(languageMapping[document.getLanguage().getName()]);
                OutlineManager.updateOutline(document.getText());
                OutlineManager.showOutline();
                if (prefs.get("autohide")) {
                    OutlineManager.enableAutohide();
                }
            }
        } else {
            EditorManager.off("activeEditorChange.outline-list", handleEditorChange);
            DocumentManager.off("documentSaved.outline-list", handleDocumentSave);
            OutlineManager.hideOutline();
            if (prefs.get("autohide")) {
                OutlineManager.enableAutohide(false);
            }
        }
    }

    /**
     * Change the position of the outline.
     */
    function handleSidebarChange() {
        if (prefs.get("autohide")) {
            OutlineManager.enableAutohide(false);
        }
        if (prefs.get("sidebar")) {
            OutlineManager.setPosition(OutlineManager.POSITION_SIDEBAR);
        } else {
            OutlineManager.setPosition(OutlineManager.POSITION_TOOLBAR);
        }
        if (prefs.get("autohide")) {
            OutlineManager.enableAutohide();
        }
    }

    /**
     * Handler for ToolbarButton.
     * Enable or disable the outline.
     */
    function handleButtonClick() {
        prefs.togglePref("enabled");
    }

    /**
     * Go to the line and character of the selected entry.
     * @param {object} event Event with line and ch as properties.
     */
    function handleSelect(event) {
        var currentEditor = EditorManager.getActiveEditor();
        currentEditor.setCursorPos(event.line, event.ch, true);
        currentEditor.focus();
    }

    function handleAutohideChange() {
        if (prefs.get("autohide")) {
            OutlineManager.enableAutohide();
            if (prefs.get("enabled")) {
                OutlineManager.hideOutline();
                if (!prefs.get("sidebar")) {
                    OutlineManager.showPlaceHolder();
                }
            }
        } else {
            OutlineManager.enableAutohide(false);
            if (prefs.get("enabled")) {
                OutlineManager.showOutline();
            }
        }
    }

    function toggleAutohide() {
        var state = prefs.togglePref("autohide");
        CommandManager.get(COMMAND_AUTOHIDE).setChecked(state);
    }

    prefs.onChange("autohide", handleAutohideChange);

    prefs.onChange("enabled", handleEnabledChange);

    prefs.onChange("sidebar", handleSidebarChange);

    // Update the position if the no-distractions/pure-code mode is turned on
    PreferencesManager.on("change", "noDistractions", function () {
        if (!prefs.get("sidebar")) {
            OutlineManager.setPosition(OutlineManager.POSITION_TOOLBAR);
        }
    });

    ToolbarButton.onClick(handleButtonClick);

    OutlineManager.onSelect(handleSelect);

    CommandManager.register(MENU_ITEM_AUTOHIDE, COMMAND_AUTOHIDE, toggleAutohide);

    var menu = Menus.getMenu(Menus.AppMenuBar.VIEW_MENU);
    menu.addMenuItem(COMMAND_AUTOHIDE);

    CommandManager.get(COMMAND_AUTOHIDE).setChecked(prefs.get("autohide"));
});
