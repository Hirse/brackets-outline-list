/* global define, brackets */

define(function (require, exports, module) {
    "use strict";

    var Editor = brackets.getModule("editor/Editor").Editor;

    function _createListEntry(namespace, name, type, args, indent) {
        var $elements = [];
        if (indent) {
            var $indentation = $(document.createElement("span"));
            $indentation.addClass("outline-entry-indent");
            var interpunct = "";
            for (var i = 0; i < indent; i++) {
                interpunct += "·";
            }
            $indentation.text(interpunct);
            $elements.push($indentation);
        }
        if (namespace) {
            var $namespace = $(document.createElement("span"));
            $namespace.addClass("outline-entry-xml-namespace");
            $namespace.text(namespace);
            $elements.push($namespace);
        }
        var $name = $(document.createElement("span"));
        $name.addClass("outline-entry-name");
        $name.text(name);
        $elements.push($name);
        if (type && args) {
            var typechar = type == "id" ? "#" : ".";
            var $arguments = $(document.createElement("span"));
            $arguments.addClass("outline-entry-xml-" + type);
            $arguments.text(" " + typechar + args.replace(/\s+/g, " " + typechar));
            $elements.push($arguments);
        }
        return {
            name: name,
            classes: "outline-entry-xml",
            $html: $elements
        };
    }

    function _getIndentationLevel(whitespace) {
        if (!whitespace) {
            return 0;
        }
        var indentSize = Editor.getUseTabChar() ? Editor.getTabSize() : Editor.getSpaceUnits();
        var tmpSpaces = "";
        for (var i = 0; i < indentSize; i++) {
            tmpSpaces += " ";
        }
        whitespace = whitespace.replace(/\t/g, tmpSpaces);
        return (whitespace.length / indentSize) | 0;
    }

    /**
     * Create the entry list of functions language dependent.
     * @param   {Array}   lines         Array that contains the lines of text.
     * @param   {Boolean} showArguments args Preference.
     * @returns {Array}   List of outline entries.
     */
    function getOutlineList(lines, showArguments) {
        var regex = /^(\s*)<([\w]+:)?([\w.:-]+)(?:[^>]*?(id|class)=["']([\w- ]+)["'])?/g;
        var result = [];
        lines.forEach(function (line, index) {
            var match = regex.exec(line);
            while (match !== null) {
                var whitespace = match[1];
                var namespace = showArguments ? (match[2] || "").trim() : "";
                var name = match[3].trim();
                var type = (match[4] || "").trim();
                var args = showArguments ? (match[5] || "").trim() : "";
                var entry = _createListEntry(namespace, name, type, args, _getIndentationLevel(whitespace));
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
