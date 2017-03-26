define(function PHP(require, exports, module) {
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
     * @param   {number}  level    Indentation level.
     * @param   {boolean} isClass  Flag if entry is class.
     * @param   {boolean} isStatic Flag if entry is static.
     * @param   {number}  line     Line number.
     * @param   {number}  ch       Character number.
     * @returns {object}  Entry object with an $html property.
     */
    function _createListEntry(name, args, vis, level, isClass, isStatic, line, ch) {
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
        var classes = "outline-entry-php outline-entry-icon";
        if (isStatic) {
            classes += " outline-entry-static";
        }
        if (isClass) {
            classes += " outline-entry-class";
        } else {
            classes += " outline-entry-" + vis;
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
            // map code structure to html item.
            .map(function (it) {
                var isClass = true;
                // show arguments parenthesis only for functions
                var argsToggle = "";
                if (it.type === "function") {
                    argsToggle = "(" + it.args.join(", ") + ")";
                    isClass = false;
                }
                return _createListEntry(
                    it.name,
                    argsToggle,
                    it.modifier,
                    it.level,
                    isClass,
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
