define(function Ruby(require, exports, module) {
    "use strict";

    /**
     * Create the HTML list entry.
     * @private
     * @param   {string} name List entry name.
     * @param   {string} args Arguments as single string.
     * @param   {string} vis  Visibility modifier.
     * @param   {number} line Line number.
     * @param   {number} ch   Character number.
     * @returns {object} Entry object with an $html property.
     */
    function _createListEntry(name, args, vis, line, ch) {
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
            classes: "outline-entry-ruby outline-entry-icon outline-entry-" + vis,
            $html: $elements
        };
    }

    /**
     * Create the entry list of functions language dependent.
     * @param   {string}   text Documents text with normalized line endings.
     * @returns {object[]} List of outline entries.
     */
    function getOutlineList(text) {
        var lines = text.replace(/\)((?:[^\S\n]*\n)+)\s*\{/g, "){$1").split("\n");
        var regexMethod = /\s*def\s+(\w*[.\w*]+\??)\s*(\([\w,\s,$,_="]*\))?/g;
        var regexMethodClass = /\s*(class\s+<<\s+self)\s*/g;
        var regexMethodPrivate = /\s*private\s*/g;
        var result = [];
        var isClassMethod = false;
        var isPrivateMethod = false;
        lines.forEach(function (line, index) {
            var matchMethodClass = regexMethodClass.exec(line);
            if (matchMethodClass !== null) {
                isClassMethod = true;
            }

            var matchMethodPrivate = regexMethodPrivate.exec(line);
            if (matchMethodPrivate !== null) {
                isPrivateMethod = true;
            }

            var matchMethod = regexMethod.exec(line);
            if (matchMethod !== null) {
                var name = matchMethod[1].trim();
                var args = matchMethod[2] || "";
                var vis = "public";
                if (isClassMethod || name.indexOf("self.") === 0) {
                    if (name.indexOf("self.") === 0) {
                        name = name.slice(5);
                    }
                    if (name[0] === "_") {
                        vis = "class-method-false-private";
                    } else {
                        vis = "class-method";
                    }
                } else if (isPrivateMethod) {
                    vis = "private";
                } else if (name[0] === "_") {
                    vis = "false-private";
                }

                if (name.length !== 0) {
                    result.push(_createListEntry(name, args, vis, index, line.length));
                }
            }
        });
        return result;
    }

    /**
     * Compare two list entries.
     * @param   {object} a First list entry object.
     * @param   {object} b Second list entry object.
     * @returns {number} Comparison result.
     */
    function compare(a, b) {
        if (a > b) {
            return 1;
        }
        if (a < b) {
            return -1;
        }
        return 0;
    }

    module.exports = {
        getOutlineList: getOutlineList,
        compare: compare
    };
});
