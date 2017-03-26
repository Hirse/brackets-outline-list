define(function ToolbarButton(require, exports, module) {
    "use strict";

    var Strings = require("strings");

    var listeners = [];

    var $button = $(document.createElement("a"))
        .attr("id", "outline-toolbar-icon")
        .attr("href", "#")
        .attr("title", Strings.TOOLBAR_ICON_TOOLTIP)
        .on("click", function () {
            listeners.forEach(function (callback) {
                callback($button.hasClass("enabled"));
            });
        })
        .appendTo($("#main-toolbar .buttons"));

    /**
     * Add a listener to be called when the button is clicked.
     * @param {function} callback Listener function.
     */
    function onClick(callback) {
        listeners.push(callback);
    }

    /**
     * Set the enabled state of the button.
     * When enabled, the button is blue.
     * @param {boolean} isEnabled True, if enabled.
     */
    function setEnabled(isEnabled) {
        $button.toggleClass("enabled", isEnabled);
    }

    module.exports = {
        onClick: onClick,
        setEnabled: setEnabled
    };
});
