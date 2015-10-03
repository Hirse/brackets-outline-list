define(function (require, exports, module) {
    "use strict";

    var unnamedPlaceholder = "function";
    var constructor = "new";

    function _getVisibilityClass(name, isPrivate, isStatic, isRegion) {
        var visClass = "";
        if (isStatic) {
            visClass = " outline-entry-static";
        }
        
        if (name === unnamedPlaceholder) {
            visClass += " outline-entry-unnamed";
        }
        else if (name === constructor) {
            console.log(name);
            visClass += " outline-entry-constructor";
        } else if (isRegion) {
            visClass += " outline-entry-region";
        } else {
            visClass += " outline-entry-" + (isPrivate ? "private" : "public");
        }
        return visClass;
    }

    function _createListEntry(name, isPrivate, isStatic, isRegion, args, line, ch) {
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
            classes: "outline-entry-hx outline-entry-icon" + _getVisibilityClass(name, isPrivate, isStatic, isRegion),
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
        var regex = /(?:([\w$]+)\s*[=:]\s*)?(override)?\s*(public|private)?\s*(static)?\s*function(?:\s+(?:&\s*)?([\w]+))?\s*(\(.*\))|\/\/\s*(region)\s*(.*)/g;
        var result = [];
        lines.forEach(function (line, index) {
            var match = regex.exec(line);
            while (match !== null) {
                var name = (match[5] || match[8] || match[10] || "").trim();
                var isRegion = match[9] === "region";
                var isStatic = match[4] === "static";
                var isPrivate = !(match[3] === "public");
                var args = showArguments&&!isRegion ? _surroundArgs(match[6]) : "";
                match = regex.exec(line);
                if (name.length === 0) {
                    if (showUnnamed) {
                        name = unnamedPlaceholder;
                    } else {
                        continue;
                    }
                }
                result.push(_createListEntry(name, isPrivate, isStatic, isRegion, args, index, line.length));
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
