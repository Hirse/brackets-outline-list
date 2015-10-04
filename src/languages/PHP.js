define(function (require, exports, module) {
    "use strict";

    var defaultVisibilty = "public";
    var unnamedPlaceholder = "function";

    function createListEntry(name, args, vis, isStatic, line, ch) {
        var $elements = [];
        var $name = $(document.createElement("span"));
        $name.addClass("outline-entry-name");
        $name.text(name);
        $elements.push($name);
        var $arguments = $(document.createElement("span"));
        $arguments.addClass("outline-entry-arg");
        $arguments.text(args);
        $elements.push($arguments);
        var classes = "outline-entry-php outline-entry-icon outline-entry-" + vis;
        if (isStatic) {
            classes += " outline-entry-static";
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
     * @param   {Array}   text          Documents text with normalized line endings.
     * @param   {Boolean} showArguments args Preference.
     * @param   {Boolean} showUnnamed   unnamed Preference.
     * @returns {Array}   List of outline entries.
     */
    function getOutlineList(text, showArguments, showUnnamed) {
        var lines = text.split("\n");
        var regex = /(?:([\w$]+)\s*[=:]\s*)?(public|protected|private)?\s*(static)?\s*function(?:\s+(?:&\s*)?([\w]+))?\s*(\(.*\))/g;
        var result = [];
        lines.forEach(function (line, index) {
            var match = regex.exec(line);
            while (match !== null) {
                var name = (match[1] || match[4] || "").trim();
                var vis = match[2] || defaultVisibilty;
                var isStatic = match[3] === "static";
                var args = showArguments ? match[5] : "";
                match = regex.exec(line);
                if (name.length === 0) {
                    if (showUnnamed) {
                        name = unnamedPlaceholder;
                        vis = "unnamed";
                    } else {
                        continue;
                    }
                }
                result.push(createListEntry(name, args, vis, isStatic, index, line.length));
            }
        });
        return result;
    }

    function compare(a, b) {
        if (b.name === unnamedPlaceholder) {
            return 1;
        }
        if (a.name === unnamedPlaceholder) {
            return -1;
        }
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
