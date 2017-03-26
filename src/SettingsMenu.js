define(function SettingsMenu(require, exports, module) {
    "use strict";

    /* beautify preserve:start *//* eslint-disable no-multi-spaces */
    var CommmandManager = brackets.getModule("command/CommandManager");
    var Menus           = brackets.getModule("command/Menus");

    var Strings         = require("strings");
    var prefs           = require("src/Preferences");
    /* eslint-enable no-multi-spaces *//* beautify preserve:end */

    /** @const {string} Prefix for commands. */
    var PREFIX = "hirse.outline";

    var settingsMenu = Menus.registerContextMenu("hirse-outline-context-menu");

    prefs.getSettings().forEach(function (setting) {
        var commandName = PREFIX + "." + setting.id;
        var commandString = Strings["COMMAND_" + setting.id.toUpperCase()];
        var command = CommmandManager.register(commandString, commandName, function () {
            var checked = prefs.togglePref(commandName.split(".")[2]);
            command.setChecked(checked);
        });
        command.setChecked(setting.value);
        settingsMenu.addMenuItem(command);
    });

    /**
     * Associate the settings context menu to a DOM element.
     * @param {string} selector Selector for jQuery.
     */
    function assignToSelector(selector) {
        Menus.ContextMenu.assignContextMenuToSelector(selector, settingsMenu);
    }

    module.exports = {
        assignToSelector: assignToSelector
    };
});
