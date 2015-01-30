define(function (require, exports, module) {
    "use strict";

    var unnamedPlaceholder = "→";

    function _getVisibilityClass(name) {
        if (name === unnamedPlaceholder) {
            return " outline-entry-coffee-unnamed";
        }
        return " outline-entry-coffee-" + (name[0] === "_" ? "private" : "public");
    }

    function _createListEntry(name, args, line, ch) {
        var $elements = [];
        var $name = $(document.createElement("span"));
        $name.addClass("outline-entry-coffee-name");
        $name.text(name);
        $elements.push($name);
        var $arguments = $(document.createElement("span"));
        $arguments.addClass("outline-entry-coffee-arg");
        $arguments.text(args);
        $elements.push($arguments);
        return {
            name: name,
            line: line,
            ch: ch,
            classes: "outline-entry-coffee outline-entry-icon" + _getVisibilityClass(name),
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
        var regex = /(([\w\$]*)?\s*(?:=|:))?\s*(\([\w\$@,.'"= ]*\))?\s*(?:->|=>)/g;
        var result = [];
        lines.forEach(function (line, index) {
            var match = regex.exec(line);
            while (match !== null) {
                var name = (match[2] || "").trim();
                var args = showArguments ? (match[3] || "()") : "";
                match = regex.exec(line);
                if (name.length === 0) {
                    if (showUnnamed) {
                        name = unnamedPlaceholder;
                    } else {
                        continue;
                    }
                }
                result.push(_createListEntry(name, args, index, line.length));
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
