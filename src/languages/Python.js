define(function (require, exports, module) {
    "use strict";

    function _getVisibilityClass(name, type) {
        var visClass = "outline-entry-";
        if (type === "class") {
            visClass += "class";
        } else if (name.indexOf("__") === 0) {
            visClass += "private";
        } else if (name.indexOf("_") === 0) {
            visClass += "protected";
        } else {
            visClass += "public";
        }
        return visClass;
    }

    function _createListEntry(name, type, args, isIndented) {
        var $elements = [];
        if (isIndented) {
            var $indentation = $(document.createElement("span"));
            $indentation.addClass("outline-entry-indent");
            $indentation.text("·");
            $elements.push($indentation);
        }
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
            classes: "outline-entry-python outline-entry-icon " + _getVisibilityClass(name, type),
            $html: $elements
        };
    }

    /**
     * Create the entry list of functions language dependent.
     * @param   {Array}   text          Documents text with normalized line endings.
     * @param   {Boolean} showArguments args Preference.
     * @returns {Array}   List of outline entries.
     */
    function getOutlineList(text, showArguments) {
        var lines = text.split("\n");
        var regex = /^([ \t]*)(class|def) (\w+)(\([\w, ]*\))?:$/g;
        var result = [];
        lines.forEach(function (line, index) {
            var match = regex.exec(line);
            while (match !== null) {
                var isIndented = Boolean(match[1]);
                var type = match[2];
                var name = match[3];
                var args = showArguments ? (match[4] || "").trim() : "";
                var entry = _createListEntry(name, type, args, isIndented);
                entry.line = index;
                entry.ch = line.length;
                result.push(entry);
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
