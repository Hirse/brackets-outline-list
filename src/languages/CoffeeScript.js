define(function CoffeeScript(require, exports, module) {
    "use strict";

    /** @const {string} Placeholder for unnamed functions. */
    var UNNAMED_PLACEHOLDER = "→";

    /**
     * Get the visibility class based on the function name.
     * @private
     * @param   {string} name List entry name.
     * @returns {string} CSS visibility class.
     */
    function _getVisibilityClass(name) {
        if (name === UNNAMED_PLACEHOLDER) {
            return " outline-entry-unnamed";
        }
        return " outline-entry-" + (name[0] === "_" ? "private" : "public");
    }

    /**
     * Create the HTML list entry.
     * @private
     * @param   {string} name List entry name.
     * @param   {string} args Arguments as single string.
     * @param   {number} line Line number.
     * @param   {number} ch   Character number.
     * @returns {object} Entry object with an $html property.
     */
    function _createListEntry(name, args, line, ch) {
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
            classes: "outline-entry-coffee outline-entry-icon" + _getVisibilityClass(name),
            $html: $elements
        };
    }

    /**
     * Create the entry list of functions language dependent.
     * @param   {string}   text Documents text with normalized line endings.
     * @returns {object[]} List of outline entries.
     */
    function getOutlineList(text) {
        var lines = text.split("\n");
        var regex = /(([\w$]*)?\s*(?:=|:))?\s*(\([\w$@,.'"= ]*\))?\s*(?:->|=>)/g;
        var result = [];
        lines.forEach(function (line, index) {
            var match = regex.exec(line);
            while (match !== null) {
                var name = (match[2] || "").trim();
                var args = match[3] || "()";
                match = regex.exec(line);
                if (name.length === 0) {
                    name = UNNAMED_PLACEHOLDER;
                }
                result.push(_createListEntry(name, args, index, line.length));
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
