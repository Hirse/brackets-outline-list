define(function (require, exports, module) {
    "use strict";

    var unnamedPlaceholder = "function";

    function _getVisibilityClass(name, isGenerator) {
        var visClass = "";
        if (isGenerator) {
            visClass = " outline-entry-generator";
        }
        if (name === unnamedPlaceholder) {
            visClass += " outline-entry-unnamed";
        } else {
            visClass += " outline-entry-" + (name[0] === "_" ? "private" : "public");
        }
        return visClass;
    }

    function _createListEntry(name, isGenerator, args, line, ch) {
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
            classes: "outline-entry-js outline-entry-icon" + _getVisibilityClass(name, isGenerator),
            $html: $elements
        };
    }

    function _surroundArgs(args) {
        if (args[0] !== "(") {
            args = "(" + args + ")";
        }
        return args;
    }

    /**
     * Create the entry list of functions language dependent.
     * @param   {Array}   text          Documents text with normalized line endings.
     * @param   {Boolean} showArguments args Preference.
     * @param   {Boolean} showUnnamed   unnamed Preference.
     * @returns {Array}   List of outline entries.
     */
    function getOutlineList(text, showArguments, showUnnamed) {
        var lines = text.replace(/\)((?:[^\S\n]*\n)+)\s*\{/g, "){$1").split("\n");
        var regex = /(?:(?:([\w$]+)\s*[=:]\s*)?\bfunction(\*)?(\s+[\w$]+)?\s*(\([\w$,\s]*\))|(\([\w$,\s]*\)|[\w$]+)\s*=>)/g;
        var result = [];
        lines.forEach(function (line, index) {
            var match = regex.exec(line);
            while (match !== null) {
                var name = (match[1] || match[3] || "").trim();
                var isGenerator = match[2] === "*";
                var args = showArguments ? _surroundArgs(match[4] || match[5]) : "";
                match = regex.exec(line);
                if (name.length === 0) {
                    if (showUnnamed) {
                        name = unnamedPlaceholder;
                    } else {
                        continue;
                    }
                }
                result.push(_createListEntry(name, isGenerator, args, index, line.length));
            }
        });
        return result;
    }

    function compare(a, b) {
        if (b.name === unnamedPlaceholder) {
            return -1;
        }
        if (a.name === unnamedPlaceholder) {
            return 1;
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
