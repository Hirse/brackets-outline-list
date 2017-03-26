define(function Stylus(require, exports, module) {
    "use strict";

    /**
     * Get the type class based on the the function name.
     * @private
     * @param   {string} name List entry name.
     * @returns {string} CSS type classes.
     */
    function _getTypeClass(name) {
        var classes = {
            "#": "id",
            ".": "class",
            "@": "at-rules",
            "[": "attribute"
        };
        return " outline-entry-stylus-" + (classes[name[0]] || "tag");
    }

    /**
     * Create the HTML list entry.
     * @private
     * @param   {string} name List entry name.
     * @param   {string} args Arguments as single string.
     * @returns {object} Entry object with an $html property.
     */
    function _createListEntry(name, args) {
        var $elements = [];
        var $name = $(document.createElement("span"));
        $name.addClass("outline-entry-name");
        $name.text(name);
        $elements.push($name);
        if (args) {
            var $arguments = $(document.createElement("span"));
            $arguments.addClass("outline-entry-stylus-args");
            $arguments.text(args);
            $elements.push($arguments);
        }
        return {
            name: name,
            classes: "outline-entry-css outline-entry-icon" + _getTypeClass(name),
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
        var regex = /^(@?[\w-.#]+[\w-.# ]*)(\(.*?\))?/;
        var result = [];
        lines.forEach(function (line, index) {
            var match = line.match(regex);
            if (match) {
                var name = match[1].trim();
                var args = (match[2] || "").trim();
                var entry = _createListEntry(name, args);
                entry.line = index;
                entry.ch = line.length;
                result.push(entry);
            }
        });
        return result;
    }

    module.exports = {
        getOutlineList: getOutlineList
    };
});
