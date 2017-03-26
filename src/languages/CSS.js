define(function CSS(require, exports, module) {
    "use strict";

    var Parser = require("src/lexers/CSSParser");

    /**
     * Create the CSS list entry.
     * @private
     * @param   {string} name  List entry name.
     * @param   {string} type  List entry type.
     * @param   {number} level List entry level.
     * @returns {object} Entry object with an $html property.
     */
    function _createListEntry(name, type, level) {
        var $elements = [];
        if (level) {
            var $indentation = $(document.createElement("span"));
            $indentation.addClass("outline-entry-indent");
            var interpunct = "";
            for (var i = 0; i < level; i++) {
                interpunct += "·";
            }
            $indentation.text(interpunct);
            $elements.push($indentation);
        }
        var $name = $(document.createElement("span"));
        $name.addClass("outline-entry-name");
        $name.text(name);
        $elements.push($name);
        return {
            name: name,
            classes: "outline-entry-css outline-entry-icon outline-entry-css-" + type,
            $html: $elements
        };
    }

    /**
     * Create the entry list of functions language dependent.
     * @param   {string}   text Documents text with normalized line endings.
     * @returns {object[]} List of outline entries.
     */
    function getOutlineList(text) {
        return Parser.parse(text).map(function (result) {
            var entry = _createListEntry(result.name, result.type, result.level);
            entry.line = result.line;
            entry.ch = result.ch;
            return entry;
        });
    }

    /**
     * Compare two list entries.
     * @param   {object} a First list entry object.
     * @param   {object} b Second list entry object.
     * @returns {number} Comparison result.
     */
    function compare(a, b) {
        if (a > b) {
            return 1;
        }
        if (a < b) {
            return -1;
        }
        return 0;
    }

    module.exports = {
        getOutlineList: getOutlineList,
        compare: compare
    };
});
