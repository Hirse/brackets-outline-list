define(function (require, exports, module) {
    "use strict";

    var Lexer = require("src/lexers/PHPLexer");

    var unnamedPlaceholder = "function";

    function createListEntry(name, args, vis, isStatic, line, ch) {
        var $elements = [];
        var $name = $(document.createElement("span"));
        $name.addClass("outline-entry-name");
        $name.text(name);
        $elements.push($name);
        var $arguments = $(document.createElement("span"));
        $arguments.addClass("outline-entry-arg");
        $arguments.text(args);
        $elements.push($arguments);
        var classes = "outline-entry-php outline-entry-icon outline-entry-" + vis;
        if (isStatic) {
            classes += " outline-entry-static";
        }
        return {
            name: name,
            line: line,
            ch: ch,
            classes: classes,
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
        return Lexer.parse(text)
            // ignore the classes definition.
            .filter(function (it) {
                return it.type === "function";
            })
            // map code structure to html item.
            .map(function (it) {
                return createListEntry(
                    it.name,
                    showArguments ? "(" + it.args.join(", ") + ")" : "",
                    it.modifier,
                    it.isStatic,
                    it.line,
                    0
                );
            });
    }

    function compare(a, b) {
        if (b.name === unnamedPlaceholder) {
            return 1;
        }
        if (a.name === unnamedPlaceholder) {
            return -1;
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
