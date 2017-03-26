define(function Jade(require, exports, module) {
    "use strict";

    var Editor = brackets.getModule("editor/Editor").Editor;

    /**
     * Create the HTML list entry.
     * @private
     * @param   {string} name   List entry name.
     * @param   {number} indent Indentation level.
     * @returns {object} Entry object with an $html property.
     */
    function _createListEntry(name, indent) {
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
        var $name = $(document.createElement("span"));
        $name.addClass("outline-entry-name");
        $name.text(name);
        $elements.push($name);
        return {
            name: name,
            classes: "outline-entry-xml",
            $html: $elements
        };
    }

    /**
     * Get indentation level based on Editor settings.
     * @private
     * @param   {string} whitespace Actual whitespace in the beginning of a line.
     * @returns {number} Indentation level.
     */
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
        return whitespace.length / indentSize | 0;
    }

    /**
     * Create the entry list of functions language dependent.
     * @param   {string}   text Documents text with normalized line endings.
     * @returns {object[]} List of outline entries.
     */
    function getOutlineList(text) {
        var lines = text.split("\n");
        var regex = /^(\s*)([\w#]+).*?([.({])?$/;
        var result = [];
        var skip = false;
        var previousIndentationLevel = 0;
        lines.forEach(function (line, index) {
            var match = line.match(regex);
            if (match) {
                var indentationLevel = _getIndentationLevel(match[1]);
                var name = match[2];
                skip &= indentationLevel > previousIndentationLevel;
                if (!skip) {
                    var entry = _createListEntry(name, indentationLevel);
                    entry.line = index;
                    entry.ch = line.length;
                    result.push(entry);
                    skip = Boolean(match[3]);
                    previousIndentationLevel = indentationLevel;
                }
            }
        });
        return result;
    }

    module.exports = {
        getOutlineList: getOutlineList
    };
});
