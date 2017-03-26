define(function JavaScript(require, exports, module) {
    "use strict";

    var Parser = require("src/lexers/JSParser");

    /**
     * Create the HTML list entry.
     * @private
     * @param   {string} name  List entry name.
     * @param   {string} args  Arguments as single string.
     * @param   {string} type  Function type.
     * @param   {string} level Function level.
     * @param   {number} line  Line number.
     * @param   {number} ch    Character number.
     * @returns {object} Entry object with an $html property.
     */
    function _createListEntry(name, args, type, level, line, ch) {
        var $elements = [];

        var $indentation = $(document.createElement("span"));
        $indentation.addClass("outline-entry-indent");
        var interpunct = "";
        for (var i = 0; i < level; i++) {
            interpunct += "·";
        }
        $indentation.text(interpunct);
        $elements.push($indentation);

        var $name = $(document.createElement("span"));
        $name.addClass("outline-entry-name");
        $name.text(name);
        $elements.push($name);

        var $arguments = $(document.createElement("span"));
        $arguments.addClass("outline-entry-arg");
        $arguments.text(args);
        $elements.push($arguments);

        return {
            name: name,
            line: line,
            ch: ch,
            classes: "outline-entry-js outline-entry-icon outline-entry-" + type,
            $html: $elements
        };
    }

    /**
     * Create the entry list of functions language dependent.
     * @param   {string}   text Documents text with normalized line endings.
     * @returns {object[]} List of outline entries.
     */
    function getOutlineList(text) {
        return Parser.parse(text).map(function (it) {
            return _createListEntry(
                it.name,
                "(" + it.args.join(", ") + ")",
                it.type,
                it.level,
                it.line - 1,
                0
            );
        });
    }

    /**
     * Compare two list entries.
     * @param   {object} a First list entry object.
     * @param   {object} b Second list entry object.
     * @returns {number} Comparison result.
     */
    function compare(a, b) {
        if (b === Parser.UNNAMED_PLACEHOLDER) {
            return -1;
        }
        if (a === Parser.UNNAMED_PLACEHOLDER) {
            return 1;
        }
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
