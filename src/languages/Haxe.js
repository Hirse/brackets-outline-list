define(function (require, exports, module) {
    "use strict";

    var unnamedPlaceholder = "function";

    function _getVisibilityClass(name, type, isPrivate, isStatic, isRegion) {
        var visClass = "";
        if (isRegion) {
            visClass += " outline-entry-region";
        }
        else {
            if (isStatic) {
                visClass = " outline-entry-static";
            }
            if (name === unnamedPlaceholder) {
                visClass += " outline-entry-unnamed";
            }
            else {
                visClass += " outline-entry-" + (isPrivate ? "private" : "public");
            }
            if (type!="") {
                visClass += " outline-entry-class";
            }
        }
        return visClass;
    }

    function _createListEntry(name, type, isPrivate, isStatic, isRegion, args, line, ch) {
        var $elements = [];
        var $name = $(document.createElement("span"));
        $name.addClass("outline-entry-name");
//        $name.text(type==""?name:type+" " +name);
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
            classes: "outline-entry-hx outline-entry-icon" + _getVisibilityClass(name, type, isPrivate, isStatic, isRegion),
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
        var regex = /(?:([\w$]+)\s*[=:]\s*)?\s*(?:(public|private)?\s+)?\s*(?:(static)?\s+)?\s*(?:function(?:\s+(?:&\s*)?([\w]+(?:\s*\<.*\>)?))?\s*(\(.*\))|(?:(class|interface|typedef)\s+)\s*([\w]+(?:\s*\<.*\>)?))|\/\/\s*(region)\s*(.*)/g;
        var result = [];
        lines.forEach(function (line, index) {
            var match = regex.exec(line);
            while (match !== null) {
                var name = (match[1] || match[4] || match[7] || match[9] || "").trim();
                var isRegion = match[8] === "region";
                var isStatic = match[3] === "static";
                var isPrivate = !(match[2] === "public");
                var type = (match[6] || "").trim();
                var args = showArguments&&match[5] ? _surroundArgs(match[5]) : "";
                match = regex.exec(line);
                if (name.length === 0) {
                    if (showUnnamed) {
                        name = unnamedPlaceholder;
                    } else {
                        continue;
                    }
                }
                result.push(_createListEntry(name, type, isPrivate, isStatic, isRegion, args, index, line.length));
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
