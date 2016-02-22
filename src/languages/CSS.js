define(function (require, exports, module) {
    "use strict";

    /**
     * Get the type class based on the entry name.
     * @private
     * @param   {string} name List entry name.
     * @returns {string} CSS type class.
     */
    function _getTypeClass(name) {
        var classes = {
            "#": "id",
            ".": "class",
            "@": "at-rules",
            "[": "attribute"
        };
        return " outline-entry-css-" + (classes[name[0]] || "tag");
    }

    /**
     * Create the HTML list entry.
     * @private
     * @param   {string} name List entry name.
     * @param   {number} line Line number.
     * @param   {number} ch   Character number
     * @returns {object} Entry object with an $html property.
     */
    function _createListEntry(name, line, ch) {
        var $elements = [];
        var $name = $(document.createElement("span"));
        var typeClass = _getTypeClass(name);
        $name.addClass("outline-entry-name");
        $name.text(name);
        $elements.push($name);
        return {
            name: name,
            line: line,
            ch: ch,
            classes: "outline-entry-css outline-entry-icon" + typeClass,
            $html: $elements
        };
    }

    /**
     * Create the entry list of functions language dependent.
     * @param   {string}   text Documents text with normalized line endings.
     * @returns {object[]} List of outline entries.
     */
    function getOutlineList(text) {
        var lines = text.replace(/(\n*)\{/g, "{$1").split("\n");
        var regex = /([^\r\n,{}]+)((?=[^}]*\{)|\s*\{)/g;
        var result = [];
        lines.forEach(function (line, index) {
            if (line.length > 1000) {
                return;
            }
            var match = regex.exec(line);
            while (match !== null) {
                var name = match[1].trim();
                result.push(_createListEntry(name, index, line.length));
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
