define(function (require, exports, module) {
    "use strict";

    function _getTypeClass(name) {
        var classes = {
            "#": "id",
            ".": "class",
            "@": "at-rules",
            "[": "attribute"
        };
        return " outline-entry-css-" + (classes[name[0]] || "tag");
    }

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
     * @param   {Array} text Documents text with normalized line endings.
     * @returns {Array} List of outline entries.
     */
    function getOutlineList(text) {
        var lines = text.replace(/(\n*)\{/g, "{$1").split("\n");
        var regex =  /([^\r\n,{}]+)((?=[^}]*\{)|\s*\{)/g;
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

    function compare(a, b) {
        if (a.name.toLowerCase() > b.name.toLowerCase()) {
            return 1;
        }
        if (a.name.toLowerCase() < b.name.toLowerCase()) {
            return -1;
        }
        return 0;
    }

    module.exports = {
        getOutlineList: getOutlineList,
        compare: compare
    };
});
