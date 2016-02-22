define(function (require, exports, module) {
    "use strict";

    /** @const {string} Placeholder for unnamed functions. */
    var UNNAMED_PLACEHOLDER = "function";

    /**
     * Get the visibility class based on the function name.
     * @private
     * @param   {string}  name        List entry name.
     * @param   {boolean} isGenerator Flag if the entry represents a generator function.
     * @returns {string}  CSS visibility class.
     */
    function _getVisibilityClass(name, isGenerator) {
        var visClass = "";
        if (isGenerator) {
            visClass = " outline-entry-generator";
        }
        if (name === UNNAMED_PLACEHOLDER) {
            visClass += " outline-entry-unnamed";
        } else {
            visClass += " outline-entry-" + (name[0] === "_" ? "private" : "public");
        }
        return visClass;
    }

    /**
     * Create the HTML list entry.
     * @private
     * @param   {string}  name        List entry name.
     * @param   {boolean} isGenerator Flag if the entry represents a generator function.
     * @param   {string}  args        Arguments as single string.
     * @param   {number}  line        Line number.
     * @param   {number}  ch          Character number.
     * @returns {object}  Entry object with an $html property.
     */
    function _createListEntry(name, isGenerator, args, line, ch) {
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
            classes: "outline-entry-js outline-entry-icon" + _getVisibilityClass(name, isGenerator),
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
     * @param   {string}   text          Documents text with normalized line endings.
     * @param   {boolean}  showArguments args Preference.
     * @param   {boolean}  showUnnamed   unnamed Preference.
     * @returns {object[]} List of outline entries.
     */
    function getOutlineList(text, showArguments, showUnnamed) {
        var lines = text.replace(/\)((?:[^\S\n]*\n)+)\s*\{/g, "){$1").split("\n");
        var regex = /(?:(?:([\w$]+)\s*[=:]\s*)?\bfunction(\*)?(\s+[\w$]+)?\s*(\([\w$,\s]*\))|(\([\w$,\s]*\)|[\w$]+)\s*=>)/g;
        var result = [];
        lines.forEach(function (line, index) {
            var match = regex.exec(line);
            while (match !== null) {
                var name = (match[1] || match[3] || "").trim();
                var isGenerator = match[2] === "*";
                var args = showArguments ? _surroundArgs(match[4] || match[5]) : "";
                match = regex.exec(line);
                if (name.length === 0) {
                    if (showUnnamed) {
                        name = UNNAMED_PLACEHOLDER;
                    } else {
                        continue;
                    }
                }
                result.push(_createListEntry(name, isGenerator, args, index, line.length));
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
        if (b.name === UNNAMED_PLACEHOLDER) {
            return -1;
        }
        if (a.name === UNNAMED_PLACEHOLDER) {
            return 1;
        }
        if (a.name > b.name) {
            return 1;
        }
        if (a.name < b.name) {
            return -1;
        }
        return 0;
    }

    module.exports = {
        getOutlineList: getOutlineList,
        compare: compare
    };
});
