define(function (require, exports, module) {
    "use strict";

    var Lexer = require("src/lexers/PHPLexer");

    /** @const {string} Placeholder for unnamed functions. */
    var UNNAMED_PLACEHOLDER = "function";

    /**
     * Create the HTML list entry.
     * @private
     * @param   {string}  name     List entry name.
     * @param   {string}  args     Arguments as single string.
     * @param   {string}  vis      Visibility modifier.
     * @param   {boolean} isStatic Flag if entry is static.
     * @param   {number}  line     Line number.
     * @param   {number}  ch       Character number.
     * @returns {object}  Entry object with an $html property.
     */
    function _createListEntry(name, args, vis, isStatic, line, ch) {
        var $elements = [];
        var $name = $(document.createElement("span"));
        $name.addClass("outline-entry-name");
        $name.text(name);
        $elements.push($name);
        var $arguments = $(document.createElement("span"));
        $arguments.addClass("outline-entry-arg");
        $arguments.text(args);
        $elements.push($arguments);
        var classes = "outline-entry-php outline-entry-icon outline-entry-" + vis;
        if (isStatic) {
            classes += " outline-entry-static";
        }
        return {
            name: name,
            line: line,
            ch: ch,
            classes: classes,
            $html: $elements
        };
    }

    /**
     * Create the entry list of functions language dependent.
     * @param   {string}   text Documents text with normalized line endings.
     * @returns {object[]} List of outline entries.
     */
    function getOutlineList(text) {
        return Lexer.parse(text)
            // ignore the classes definition.
            .filter(function (it) {
                return it.type === "function";
            })
            // map code structure to html item.
            .map(function (it) {
                return _createListEntry(
                    it.name,
                    "(" + it.args.join(", ") + ")",
                    it.modifier,
                    it.isStatic,
                    it.line,
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
        if (b === UNNAMED_PLACEHOLDER) {
            return 1;
        }
        if (a === UNNAMED_PLACEHOLDER) {
            return -1;
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
