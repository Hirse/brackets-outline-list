define(function Markdown(require, exports, module) {
    "use strict";

    /**
     * Get the modifier class based on the entry level.
     * @private
     * @param   {string} level String with one # for each level.
     * @returns {string} CSS level class.
     */
    function _getLevelClass(level) {
        return " outline-entry-md-" + level.length;
    }

    /**
     * Create the HTML list entry.
     * @private
     * @param   {string} name  List entry name.
     * @param   {string} level String with one # for each level.
     * @param   {number} line  Line number.
     * @param   {number} ch    Character number.
     * @returns {object} Entry object with an $html property.
     */
    function _createListEntry(name, level, line, ch) {
        var $elements = [];
        var $name = $(document.createElement("span"));
        $name.addClass("outline-entry-name");
        $name.text(name);
        $elements.push($name);
        return {
            name: name,
            line: line,
            ch: ch,
            classes: "outline-entry-md" + _getLevelClass(level),
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
        var regex = /^(#+)\s*(.+)/g;
        var result = [];
        lines.forEach(function (line, index) {
            var match = regex.exec(line);
            while (match !== null) {
                var name = (match[2] || match[3]).trim();
                var level = (match[1] || match[4]).trim();
                match = regex.exec(line);
                result.push(_createListEntry(name, level, index, line.length));
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
