/* global define, brackets */

define(function (require, exports, module) {
    "use strict";

    var Editor = brackets.getModule("editor/Editor").Editor;

    function _createListEntry(name, type, args, indent) {
        var $elements = [];
        var $name = $(document.createElement("span"));
        $name.addClass("outline-entry-xml-name");
        $name.text(name);
        if (indent) {
            $name.addClass("outline-entry-xml-indent");
            var interpunct = "";
            for (var i = 0; i < indent; i++) {
                interpunct += "·";
            }
            $name.attr("data-indent", interpunct);
        }
        $elements.push($name);
        if (type && args) {
            var typechar = type == "id" ? "#" : ".";
            var $arguments = $(document.createElement("span"));
            $arguments.addClass("outline-entry-xml-" + type);
            $arguments.text(" " + typechar + args);
            $elements.push($arguments);
        }
        return {
            name: name,
            classes: "outline-entry-xml",
            $html: $elements
        };
    }

    function _getIndentationLevel(whitespace) {
        if (whitespace === undefined) {
            return 0;
        }
        var indentSize = Editor.getUseTabChar() ? Editor.getTabSize() : Editor.getSpaceUnits();
        var tmpSpaces = "";
        for (var i = 0; i < indentSize; i++) {
            tmpSpaces += " ";
        }
        whitespace.replace(/\t/, tmpSpaces);
        return (whitespace.length / indentSize) | 0;
    }

    /**
     * Create the entry list of functions language dependent.
     * @param   {Array}   lines         Array that contains the lines of text.
     * @param   {Boolean} showArguments args Preference.
     * @returns {Array}   List of outline entries.
     */
    function getOutlineList(lines, showArguments) {
        var regex;
        if (showArguments) {
            regex = /^(\s*)<(\w+)[ (>)](.*(id|class)=[""]([\w- ]+)[""])?/g;
        } else {
            regex = /^(\s*)<(\w+)[ (>)]/g;
        }
        var result = [];
        lines.forEach(function (line, index) {
            var match = regex.exec(line);
            while (match !== null) {
                var whitespace = match[1];
                var name = match[2].trim();
                var type = (match[4] || "").trim();
                var args = (match[5] || "").trim();
                var entry = _createListEntry(name, type, args, _getIndentationLevel(whitespace));
                entry.line = index;
                entry.ch = line.length;
                result.push(entry);
                match = regex.exec(line);
            }
        });
        return result;
    }

    module.exports = {
        getOutlineList: getOutlineList
    };
});
