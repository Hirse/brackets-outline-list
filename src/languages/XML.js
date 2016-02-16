define(function (require, exports, module) {
    "use strict";

    var Editor = brackets.getModule("editor/Editor").Editor;

    function _createListEntry(namespace, name, type, args, indent) {
        var $elements = [];
        if (indent) {
            var $indentation = $(document.createElement("span"));
            var interpunct = "";
            for (var i = 0; i < indent; i++) {
                interpunct += "·";
            }
            $indentation.addClass("outline-entry-indent open")
                .text(interpunct)
                .attr("data-indent", indent)
                .click(function(){
                    // Collapse the child nodes when this node is clicked.
                    var indentElementParent = $(this).parent();
                    var nextParent = indentElementParent.next();
                    // Look at all subsequent nodes with a greater indent than the current node
                    // to see if they should be hidden or shown.
                    while (Number(nextParent.children(".outline-entry-indent").attr("data-indent")) > indent ){
                        if(nextParent.attr("data-closed-by") === indentElementParent[0].id){
                            nextParent.removeAttr("data-closed-by");
                            indentElementParent.children(".outline-entry-indent.closed").addClass("open").removeClass("closed");
                            nextParent.show();
                        } else if(nextParent.attr("data-closed-by") === undefined) {
                            nextParent.attr("data-closed-by", indentElementParent[0].id);
                            indentElementParent.children(".outline-entry-indent.open").addClass("closed").removeClass("open");
                            nextParent.hide();
                        }
                        nextParent = nextParent.next();
                    }
                });
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
				return whitespace.length;
    }

    /**
     * Create the entry list of functions language dependent.
     * @param   {Array}   text          Documents text with normalized line endings.
     * @param   {Boolean} showArguments args Preference.
     * @returns {Array}   List of outline entries.
     */
    function getOutlineList(text, showArguments) {
        var lines = text.split("\n");
        var regex = /^(\s*)<([\w]+:)?([\w.:-]+)(?:[^>]*?(id|class)=["']([\w- ]+)["'])?/g;
        var result = [];
        var idCounter = 0;
        lines.forEach(function (line, index) {
            var match = regex.exec(line);
            while (match !== null) {
                idCounter = idCounter + 1;
                var whitespace = match[1];
                var namespace = showArguments ? (match[2] || "").trim() : "";
                var name = match[3].trim();
                var type = (match[4] || "").trim();
                var args = showArguments ? (match[5] || "").trim() : "";
                var entry = _createListEntry(namespace, name, type, args, _getIndentationLevel(whitespace));
                entry.line = index;
                entry.ch = line.length;
                // Add an id so the collapse can mark the collapsed nodes and so control
                // what can reopen them.
                entry.id = "ListEntry" + idCounter.toString();
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
