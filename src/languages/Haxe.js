define(function (require, exports, module) {
    "use strict";

    /** @const {string} Placeholder for unnamed functions. */
    var UNNAMED_PLACEHOLDER = "function";

    /**
     * Get the visibility class based on the function name.
     * @private
     * @param   {string}  name      List entry name.
     * @param   {string}  type      List entry type.
     * @param   {boolean} isPrivate Flag if the entry is private.
     * @param   {boolean} isStatic  Flag if the entry is private.
     * @param   {boolean} isRegion  Flag if the entry is a region.
     * @returns {string}  CSS visibility class.
     */
    function _getVisibilityClass(name, type, isPrivate, isStatic, isRegion) {
        var visClass = "";
        if (isRegion) {
            visClass += " outline-entry-region";
        } else {
            if (isStatic) {
                visClass = " outline-entry-static";
            }
            if (name === UNNAMED_PLACEHOLDER) {
                visClass += " outline-entry-unnamed";
            } else {
                visClass += " outline-entry-" + (isPrivate ? "private" : "public");
            }
            if (type !== "") {
                visClass += " outline-entry-class";
            }
        }
        return visClass;
    }

    /**
     * Create the HTML list entry.
     * @private
     * @param   {string}  name      List entry name.
     * @param   {string}  type      List entry type.
     * @param   {boolean} isPrivate Flag if the entry is private.
     * @param   {boolean} isStatic  Flag if the entry is private.
     * @param   {boolean} isRegion  Flag if the entry is a region.
     * @param   {string}  args      Arguments as single string.
     * @param   {number}  line      Line number.
     * @param   {number}  ch        Character number.
     * @returns {object}  Entry object with an $html property.
     */
    function _createListEntry(name, type, isPrivate, isStatic, isRegion, args, line, ch) {
        var $elements = [];
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
            classes: "outline-entry-hx outline-entry-icon" + _getVisibilityClass(name, type, isPrivate, isStatic, isRegion),
            $html: $elements
        };
    }

    /**
     * Add surrouding parens to the arguments if missing.
     * @private
     * @param   {string} args String of arguments.
     * @returns {string} String of arguments with parens.
     */
    function _surroundArgs(args) {
        if (args[0] !== "(") {
            args = "(" + args + ")";
        }
        return args;
    }

    /**
     * Create the entry list of functions language dependent.
     * @param   {string}   text Documents text with normalized line endings.
     * @returns {object[]} List of outline entries.
     */
    function getOutlineList(text) {
        var lines = text.replace(/\)((?:[^\S\n]*\n)+)\s*\{/g, "){$1").split("\n");
        var regex = /(?:([\w$]+)\s*[=:]\s*)?\s*(?:(public|private)?\s+)?\s*(?:(static)?\s+)?\s*(?:function(?:\s+(?:&\s*)?([\w]+(?:\s*<.*>)?))?\s*(\(.*\))|(?:(class|interface|typedef)\s+)\s*([\w]+(?:\s*<.*>)?))|\/\/\s*(region)\s*(.*)/g;
        var result = [];
        lines.forEach(function (line, index) {
            var match = regex.exec(line);
            while (match !== null) {
                var name = (match[1] || match[4] || match[7] || match[9] || "").trim();
                var isRegion = match[8] === "region";
                var isStatic = match[3] === "static";
                var isPrivate = !(match[2] === "public");
                var type = (match[6] || "").trim();
                var args = match[5] ? _surroundArgs(match[5]) : "()";
                match = regex.exec(line);
                if (name.length === 0) {
                    name = UNNAMED_PLACEHOLDER;
                }
                result.push(_createListEntry(name, type, isPrivate, isStatic, isRegion, args, index, line.length));
            }
        });
        return result;
    }

    /**
     * Compare two list entries.
     * @param   {object} a First list entry object.
     * @param   {object} b Second list entry object.
     * @returns {number} Comparison result.
     */
    function compare(a, b) {
        if (b === UNNAMED_PLACEHOLDER) {
            return -1;
        }
        if (a === UNNAMED_PLACEHOLDER) {
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
