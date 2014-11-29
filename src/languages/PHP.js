/* global define */

define(function (require, exports, module) {
    "use strict";

    function createListEntry(name, args, line, ch) {
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
            classes: "outline-entry-php",
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
        var regex;
        if (showArguments) {
            regex = /((\w*)\s*[=:]\s*)?function(\s*|\s+\w*\s*)(\([\w,\s$='"]*\))/g;
        } else {
            regex = /((\w*)\s*[=:]\s*)?function(\s*|\s+\w*\s*)()\(/g;
        }
        var result = [];
        lines.forEach(function (line, index) {
            var match = regex.exec(line);
            while (match !== null) {
                var name = (match[3].trim() || match[2] || "").trim();
                var args = (match[4] || "");
                match = regex.exec(line);
                if (name.length === 0) {
                    if (showUnnamed) {
                        name = "function";
                    } else {
                        continue;
                    }
                }
                result.push(createListEntry(name, args, index, line.length));
            }
        });
        return result;
    }

    module.exports = {
        getOutlineList: getOutlineList
    };
});
