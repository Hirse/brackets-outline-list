/* global define */

define(function (require, exports, module) {
    "use strict";

    function _getLevelClass(level) {
        return " outline-entry-md-" + level.length;
    }

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
     * @param   {Array}   lines         Array that contains the lines of text.
     * @returns {Array}   List of outline entries.
     */
    function getOutlineList(lines) {
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

    function compare(a, b) {
        if (b.name === "function") {
            return -1;
        }
        if (a.name === "function") {
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
