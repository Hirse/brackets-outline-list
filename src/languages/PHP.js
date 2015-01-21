/* global define */

define(function (require, exports, module) {
    "use strict";

    var defaultVisibilty = "public";
    var unnamedPlaceholder = "function";

    function createListEntry(name, args, vis, line, ch) {
        var $elements = [];
        var $name = $(document.createElement("span"));
        $name.text(name);
        $elements.push($name);
        var $arguments = $(document.createElement("span"));
        $arguments.addClass("outline-entry-php-arg");
        $arguments.text(args);
        $elements.push($arguments);
        return {
            name: name,
            line: line,
            ch: ch,
            classes: "outline-entry-php outline-entry-icon outline-entry-php-" + vis,
            $html: $elements
        };
    }

    /**
     * Create the entry list of functions language dependent.
     * @param   {Array}   lines         Array that contains the lines of text.
     * @param   {Boolean} showArguments args Preference.
     * @param   {Boolean} showUnnamed   unnamed Preference.
     * @returns {Array}   List of outline entries.
     */
    function getOutlineList(lines, showArguments, showUnnamed) {
        var regex = /((\w*)\s*[=:]\s*)?((public|protected|private)\s*)?function(\s*|\s+\w*\s*)(\([\w,\s&$='"\\()]*\))/g;
        var result = [];
        lines.forEach(function (line, index) {
            var match = regex.exec(line);
            while (match !== null) {
                var vis = match[4] || defaultVisibilty;
                var name = (match[5] || "").trim();
                var args = showArguments ? match[6] : "";
                match = regex.exec(line);
                if (name.length === 0) {
                    if (showUnnamed) {
                        name = unnamedPlaceholder;
                        vis = "unnamed";
                    } else {
                        continue;
                    }
                }
                result.push(createListEntry(name, args, vis, index, line.length));
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
