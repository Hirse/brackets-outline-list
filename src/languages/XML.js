define(function XML(require, exports, module) {
    "use strict";

    var Parser = require("src/lexers/XMLParser");

    /**
     * Create the HTML list entry.
     * @private
     * @param   {string}   namespace List entry namespace.
     * @param   {string}   name      List entry name.
     * @param   {string}   id        List entry id.
     * @param   {string[]} classes   List entry classes.
     * @param   {number}   indent    Indentation level.
     * @returns {object}   Entry object with an $html property.
     */
    function _createListEntry(namespace, name, id, classes, indent) {
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
            $namespace.text(namespace + ":");
            $elements.push($namespace);
        }
        var $name = $(document.createElement("span"));
        $name.addClass("outline-entry-name");
        $name.text(name);
        $elements.push($name);
        var argumentsText = "";
        if (id) {
            argumentsText += " #" + id;
        }
        if (classes.length) {
            argumentsText += " ." + classes.join(".");
        }
        if (argumentsText) {
            var $arguments = $(document.createElement("span"));
            $arguments.addClass("outline-entry-xml-attributes");
            $arguments.text(argumentsText);
            $elements.push($arguments);
        }
        return {
            name: name,
            classes: "outline-entry-xml",
            $html: $elements
        };
    }

    /**
     * Create the entry list of functions language dependent.
     * @param   {string}            text Documents text with normalized line endings.
     * @returns {Promise<object[]>} Promise returning a list of outline entries.
     */
    function getOutlineList(text) {
        return Parser.parse(text).then(function (results) {
            return results.map(function (result) {
                var entry = _createListEntry(result.namespace, result.name, result.id, result.class, result.level);
                entry.line = result.line;
                entry.ch = result.ch;
                return entry;
            });
        });
    }

    module.exports = {
        getOutlineList: getOutlineList
    };
});
