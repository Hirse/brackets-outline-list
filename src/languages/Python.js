define(function Python(require, exports, module) {
    "use strict";

    /**
     * Get the visibility class based on the function name and type.
     * @private
     * @param   {string} name List entry name.
     * @param   {string} type List entry type.
     * @returns {string} CSS visibility class.
     */
    function _getVisibilityClass(name, type) {
        var visClass = "outline-entry-";
        if (type === "class") {
            visClass += "class";
        } else if (name.indexOf("__") === 0) {
            visClass += "private";
        } else if (name.indexOf("_") === 0) {
            visClass += "protected";
        } else {
            visClass += "public";
        }
        return visClass;
    }

    /**
     * Create the HTML list entry.
     * @private
     * @param   {string}  name       List entry name.
     * @param   {string}  type       List entry type.
     * @param   {string}  args       Arguments as single string.
     * @param   {boolean} isIndented Flag if the entry is indented.
     * @returns {object}  Entry object with an $html property.
     */
    function _createListEntry(name, type, args, isIndented) {
        var $elements = [];
        if (isIndented) {
            var $indentation = $(document.createElement("span"));
            $indentation.addClass("outline-entry-indent");
            $indentation.text("·");
            $elements.push($indentation);
        }
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
            classes: "outline-entry-python outline-entry-icon " + _getVisibilityClass(name, type),
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
        var regex = /^([ \t]*)(class|def) +(\w+) *(\([\w, =]*\))?:$/g;
        var result = [];
        lines.forEach(function (line, index) {
            var match = regex.exec(line);
            while (match !== null) {
                var isIndented = Boolean(match[1]);
                var type = match[2];
                var name = match[3];
                var args = (match[4] || "").trim();
                var entry = _createListEntry(name, type, args, isIndented);
                entry.line = index;
                entry.ch = line.length;
                result.push(entry);
                match = regex.exec(line);
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
