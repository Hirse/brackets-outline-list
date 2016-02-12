define(function (require, exports, module) {
    "use strict";
  
    var Lexer = require('thirdparty/lex/lexer');

    var defaultVisibilty = "public";
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
    
    function parse(source) {
        var lexer, literal, ns, line, peek, pop, results, state, ignored;
        line = 0;
        ns = [];
        literal = true;
        state = [];
        peek = function(a) {
            if (a.length > 0) {
                return a[a.length - 1];
            }
        };
        pop = function(a) {
            if (a.length > 0) {
                return a.pop();
            }
        }
        results = [];
        ignored = function () {};
        lexer = new Lexer;
        lexer.addRule(/\<\?(php)?/, function() {
            literal = false;
        }).addRule(/\?\>/, function() {
            literal = true;
        }).addRule(/function/, function(w) {
            if (!literal) {
                state.push('function');
                results.push({
                    type: 'function',
                    name: ns.join('::'),
                    args: [],
                    modifier: 'unnamed',
                    isStatic: false,
                    line: line
                });
            }
        }).addRule(/class/, function(w) {
            if (!literal) {
                state.push('class');
                results.push({
                    type: 'class',
                    name: ns.join('::'),
                    args: [],
                    modifier: 'public',
                    isStatic: false,
                    line: line
                });
            }
        }).addRule(/\$[a-zA-Z_]+/, function(w) {
            if (peek(state) === 'args') {
                peek(results).args.push(w);
            }
        }).addRule(/[a-zA-Z_]+/, function(w) {
            var ref;
            if (!literal) {
                switch(peek(state)) {
                    case 'function':
                        ns.push(w);
                        ref = peek(results);
                        if (ns.length > 1) {
                            ref.name += '::' + w;
                        } else {
                            ref.name = w;
                        }
                        ref.modifier = 'public';
                        break;
                    case 'class':
                        ns.push(w);
                        ref = peek(results);
                        ref.name += '::' + w;
                        break;
                }
          }
        }).addRule(/\(/, function () {
            if (peek(state) === 'function') {
                var ref = peek(results);
                if (!ref || ref.type !== 'function') {
                    ns.push(unnamedPlaceholder);
                    results.push({
                        type: 'function',
                        name: ns.join('::'),
                        args: [],
                        modifier: 'unnamed',
                        isStatic: false,
                        line: line
                    });
                }
                state.push('args');
            }
        }).addRule(/\)/, function () {
            if (peek(state) === 'args') {
                state.pop();
            }
        }).addRule(/{/, function(w) {
          var prefix, ref;
          if (!literal) {
            if ((ref = peek(state)) === 'function' || ref === 'class') {
              prefix = state.pop();
              state.push(prefix + ":start");
            } else {
              state.push('start');
            }
          }
        }).addRule(/}/, function(w) {
            var s;
            if (!literal && state.length > 0) {
                s = state.pop().split(':')[0];
                if (s === 'function' || s === 'class') {
                    ns.pop();
                }
            }
        }).addRule(/./, ignored).addRule(/\n/, function () {
            line += 1;
        });
        lexer.setInput(source);
        while (lexer.index < source.length - 1) {
            lexer.lex();
        }
        return results;
    };

    /**
     * Create the entry list of functions language dependent.
     * @param   {Array}   text          Documents text with normalized line endings.
     * @param   {Boolean} showArguments args Preference.
     * @param   {Boolean} showUnnamed   unnamed Preference.
     * @returns {Array}   List of outline entries.
     */
    function getOutlineList(text, showArguments, showUnnamed) {
        return parse(text).filter(function (it) {
            return it.type === 'function';
        }).map(function (it) {
            return createListEntry(
                it.name,
                '(' + it.args.join(',') + ')',
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
