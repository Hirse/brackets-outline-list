/*!
 * Esprima version 3.3.2
 * https://github.com/eslint/espree/releases/tag/v3.3.2
 * Copyright jQuery Foundation and other contributors, https://jquery.org/
 */
!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.espree=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var XHTMLEntities = require('./xhtml');

var hexNumber = /^[\da-fA-F]+$/;
var decimalNumber = /^\d+$/;

module.exports = function(acorn) {
  var tt = acorn.tokTypes;
  var tc = acorn.tokContexts;

  tc.j_oTag = new acorn.TokContext('<tag', false);
  tc.j_cTag = new acorn.TokContext('</tag', false);
  tc.j_expr = new acorn.TokContext('<tag>...</tag>', true, true);

  tt.jsxName = new acorn.TokenType('jsxName');
  tt.jsxText = new acorn.TokenType('jsxText', {beforeExpr: true});
  tt.jsxTagStart = new acorn.TokenType('jsxTagStart');
  tt.jsxTagEnd = new acorn.TokenType('jsxTagEnd');

  tt.jsxTagStart.updateContext = function() {
    this.context.push(tc.j_expr); // treat as beginning of JSX expression
    this.context.push(tc.j_oTag); // start opening tag context
    this.exprAllowed = false;
  };
  tt.jsxTagEnd.updateContext = function(prevType) {
    var out = this.context.pop();
    if (out === tc.j_oTag && prevType === tt.slash || out === tc.j_cTag) {
      this.context.pop();
      this.exprAllowed = this.curContext() === tc.j_expr;
    } else {
      this.exprAllowed = true;
    }
  };

  var pp = acorn.Parser.prototype;

  // Reads inline JSX contents token.

  pp.jsx_readToken = function() {
    var out = '', chunkStart = this.pos;
    for (;;) {
      if (this.pos >= this.input.length)
        this.raise(this.start, 'Unterminated JSX contents');
      var ch = this.input.charCodeAt(this.pos);

      switch (ch) {
      case 60: // '<'
      case 123: // '{'
        if (this.pos === this.start) {
          if (ch === 60 && this.exprAllowed) {
            ++this.pos;
            return this.finishToken(tt.jsxTagStart);
          }
          return this.getTokenFromCode(ch);
        }
        out += this.input.slice(chunkStart, this.pos);
        return this.finishToken(tt.jsxText, out);

      case 38: // '&'
        out += this.input.slice(chunkStart, this.pos);
        out += this.jsx_readEntity();
        chunkStart = this.pos;
        break;

      default:
        if (acorn.isNewLine(ch)) {
          out += this.input.slice(chunkStart, this.pos);
          out += this.jsx_readNewLine(true);
          chunkStart = this.pos;
        } else {
          ++this.pos;
        }
      }
    }
  };

  pp.jsx_readNewLine = function(normalizeCRLF) {
    var ch = this.input.charCodeAt(this.pos);
    var out;
    ++this.pos;
    if (ch === 13 && this.input.charCodeAt(this.pos) === 10) {
      ++this.pos;
      out = normalizeCRLF ? '\n' : '\r\n';
    } else {
      out = String.fromCharCode(ch);
    }
    if (this.options.locations) {
      ++this.curLine;
      this.lineStart = this.pos;
    }

    return out;
  };

  pp.jsx_readString = function(quote) {
    var out = '', chunkStart = ++this.pos;
    for (;;) {
      if (this.pos >= this.input.length)
        this.raise(this.start, 'Unterminated string constant');
      var ch = this.input.charCodeAt(this.pos);
      if (ch === quote) break;
      if (ch === 38) { // '&'
        out += this.input.slice(chunkStart, this.pos);
        out += this.jsx_readEntity();
        chunkStart = this.pos;
      } else if (acorn.isNewLine(ch)) {
        out += this.input.slice(chunkStart, this.pos);
        out += this.jsx_readNewLine(false);
        chunkStart = this.pos;
      } else {
        ++this.pos;
      }
    }
    out += this.input.slice(chunkStart, this.pos++);
    return this.finishToken(tt.string, out);
  };

  pp.jsx_readEntity = function() {
    var str = '', count = 0, entity;
    var ch = this.input[this.pos];
    if (ch !== '&')
      this.raise(this.pos, 'Entity must start with an ampersand');
    var startPos = ++this.pos;
    while (this.pos < this.input.length && count++ < 10) {
      ch = this.input[this.pos++];
      if (ch === ';') {
        if (str[0] === '#') {
          if (str[1] === 'x') {
            str = str.substr(2);
            if (hexNumber.test(str))
              entity = String.fromCharCode(parseInt(str, 16));
          } else {
            str = str.substr(1);
            if (decimalNumber.test(str))
              entity = String.fromCharCode(parseInt(str, 10));
          }
        } else {
          entity = XHTMLEntities[str];
        }
        break;
      }
      str += ch;
    }
    if (!entity) {
      this.pos = startPos;
      return '&';
    }
    return entity;
  };


  // Read a JSX identifier (valid tag or attribute name).
  //
  // Optimized version since JSX identifiers can't contain
  // escape characters and so can be read as single slice.
  // Also assumes that first character was already checked
  // by isIdentifierStart in readToken.

  pp.jsx_readWord = function() {
    var ch, start = this.pos;
    do {
      ch = this.input.charCodeAt(++this.pos);
    } while (acorn.isIdentifierChar(ch) || ch === 45); // '-'
    return this.finishToken(tt.jsxName, this.input.slice(start, this.pos));
  };

  // Transforms JSX element name to string.

  function getQualifiedJSXName(object) {
    if (object.type === 'JSXIdentifier')
      return object.name;

    if (object.type === 'JSXNamespacedName')
      return object.namespace.name + ':' + object.name.name;

    if (object.type === 'JSXMemberExpression')
      return getQualifiedJSXName(object.object) + '.' +
      getQualifiedJSXName(object.property);
  }

  // Parse next token as JSX identifier

  pp.jsx_parseIdentifier = function() {
    var node = this.startNode();
    if (this.type === tt.jsxName)
      node.name = this.value;
    else if (this.type.keyword)
      node.name = this.type.keyword;
    else
      this.unexpected();
    this.next();
    return this.finishNode(node, 'JSXIdentifier');
  };

  // Parse namespaced identifier.

  pp.jsx_parseNamespacedName = function() {
    var startPos = this.start, startLoc = this.startLoc;
    var name = this.jsx_parseIdentifier();
    if (!this.options.plugins.jsx.allowNamespaces || !this.eat(tt.colon)) return name;
    var node = this.startNodeAt(startPos, startLoc);
    node.namespace = name;
    node.name = this.jsx_parseIdentifier();
    return this.finishNode(node, 'JSXNamespacedName');
  };

  // Parses element name in any form - namespaced, member
  // or single identifier.

  pp.jsx_parseElementName = function() {
    var startPos = this.start, startLoc = this.startLoc;
    var node = this.jsx_parseNamespacedName();
    if (this.type === tt.dot && node.type === 'JSXNamespacedName' && !this.options.plugins.jsx.allowNamespacedObjects) {
      this.unexpected();
    }
    while (this.eat(tt.dot)) {
      var newNode = this.startNodeAt(startPos, startLoc);
      newNode.object = node;
      newNode.property = this.jsx_parseIdentifier();
      node = this.finishNode(newNode, 'JSXMemberExpression');
    }
    return node;
  };

  // Parses any type of JSX attribute value.

  pp.jsx_parseAttributeValue = function() {
    switch (this.type) {
    case tt.braceL:
      var node = this.jsx_parseExpressionContainer();
      if (node.expression.type === 'JSXEmptyExpression')
        this.raise(node.start, 'JSX attributes must only be assigned a non-empty expression');
      return node;

    case tt.jsxTagStart:
    case tt.string:
      return this.parseExprAtom();

    default:
      this.raise(this.start, 'JSX value should be either an expression or a quoted JSX text');
    }
  };

  // JSXEmptyExpression is unique type since it doesn't actually parse anything,
  // and so it should start at the end of last read token (left brace) and finish
  // at the beginning of the next one (right brace).

  pp.jsx_parseEmptyExpression = function() {
    var node = this.startNodeAt(this.lastTokEnd, this.lastTokEndLoc);
    return this.finishNodeAt(node, 'JSXEmptyExpression', this.start, this.startLoc);
  };

  // Parses JSX expression enclosed into curly brackets.


  pp.jsx_parseExpressionContainer = function() {
    var node = this.startNode();
    this.next();
    node.expression = this.type === tt.braceR
      ? this.jsx_parseEmptyExpression()
      : this.parseExpression();
    this.expect(tt.braceR);
    return this.finishNode(node, 'JSXExpressionContainer');
  };

  // Parses following JSX attribute name-value pair.

  pp.jsx_parseAttribute = function() {
    var node = this.startNode();
    if (this.eat(tt.braceL)) {
      this.expect(tt.ellipsis);
      node.argument = this.parseMaybeAssign();
      this.expect(tt.braceR);
      return this.finishNode(node, 'JSXSpreadAttribute');
    }
    node.name = this.jsx_parseNamespacedName();
    node.value = this.eat(tt.eq) ? this.jsx_parseAttributeValue() : null;
    return this.finishNode(node, 'JSXAttribute');
  };

  // Parses JSX opening tag starting after '<'.

  pp.jsx_parseOpeningElementAt = function(startPos, startLoc) {
    var node = this.startNodeAt(startPos, startLoc);
    node.attributes = [];
    node.name = this.jsx_parseElementName();
    while (this.type !== tt.slash && this.type !== tt.jsxTagEnd)
      node.attributes.push(this.jsx_parseAttribute());
    node.selfClosing = this.eat(tt.slash);
    this.expect(tt.jsxTagEnd);
    return this.finishNode(node, 'JSXOpeningElement');
  };

  // Parses JSX closing tag starting after '</'.

  pp.jsx_parseClosingElementAt = function(startPos, startLoc) {
    var node = this.startNodeAt(startPos, startLoc);
    node.name = this.jsx_parseElementName();
    this.expect(tt.jsxTagEnd);
    return this.finishNode(node, 'JSXClosingElement');
  };

  // Parses entire JSX element, including it's opening tag
  // (starting after '<'), attributes, contents and closing tag.

  pp.jsx_parseElementAt = function(startPos, startLoc) {
    var node = this.startNodeAt(startPos, startLoc);
    var children = [];
    var openingElement = this.jsx_parseOpeningElementAt(startPos, startLoc);
    var closingElement = null;

    if (!openingElement.selfClosing) {
      contents: for (;;) {
        switch (this.type) {
        case tt.jsxTagStart:
          startPos = this.start; startLoc = this.startLoc;
          this.next();
          if (this.eat(tt.slash)) {
            closingElement = this.jsx_parseClosingElementAt(startPos, startLoc);
            break contents;
          }
          children.push(this.jsx_parseElementAt(startPos, startLoc));
          break;

        case tt.jsxText:
          children.push(this.parseExprAtom());
          break;

        case tt.braceL:
          children.push(this.jsx_parseExpressionContainer());
          break;

        default:
          this.unexpected();
        }
      }
      if (getQualifiedJSXName(closingElement.name) !== getQualifiedJSXName(openingElement.name)) {
        this.raise(
          closingElement.start,
          'Expected corresponding JSX closing tag for <' + getQualifiedJSXName(openingElement.name) + '>');
      }
    }

    node.openingElement = openingElement;
    node.closingElement = closingElement;
    node.children = children;
    if (this.type === tt.relational && this.value === "<") {
      this.raise(this.start, "Adjacent JSX elements must be wrapped in an enclosing tag");
    }
    return this.finishNode(node, 'JSXElement');
  };

  // Parses entire JSX element from current position.

  pp.jsx_parseElement = function() {
    var startPos = this.start, startLoc = this.startLoc;
    this.next();
    return this.jsx_parseElementAt(startPos, startLoc);
  };

  acorn.plugins.jsx = function(instance, opts) {
    if (!opts) {
      return;
    }

    if (typeof opts !== 'object') {
      opts = {};
    }

    instance.options.plugins.jsx = {
      allowNamespaces: opts.allowNamespaces !== false,
      allowNamespacedObjects: !!opts.allowNamespacedObjects
    };

    instance.extend('parseExprAtom', function(inner) {
      return function(refShortHandDefaultPos) {
        if (this.type === tt.jsxText)
          return this.parseLiteral(this.value);
        else if (this.type === tt.jsxTagStart)
          return this.jsx_parseElement();
        else
          return inner.call(this, refShortHandDefaultPos);
      };
    });

    instance.extend('readToken', function(inner) {
      return function(code) {
        var context = this.curContext();

        if (context === tc.j_expr) return this.jsx_readToken();

        if (context === tc.j_oTag || context === tc.j_cTag) {
          if (acorn.isIdentifierStart(code)) return this.jsx_readWord();

          if (code == 62) {
            ++this.pos;
            return this.finishToken(tt.jsxTagEnd);
          }

          if ((code === 34 || code === 39) && context == tc.j_oTag)
            return this.jsx_readString(code);
        }

        if (code === 60 && this.exprAllowed) {
          ++this.pos;
          return this.finishToken(tt.jsxTagStart);
        }
        return inner.call(this, code);
      };
    });

    instance.extend('updateContext', function(inner) {
      return function(prevType) {
        if (this.type == tt.braceL) {
          var curContext = this.curContext();
          if (curContext == tc.j_oTag) this.context.push(tc.b_expr);
          else if (curContext == tc.j_expr) this.context.push(tc.b_tmpl);
          else inner.call(this, prevType);
          this.exprAllowed = true;
        } else if (this.type === tt.slash && prevType === tt.jsxTagStart) {
          this.context.length -= 2; // do not consider JSX expr -> JSX open tag -> ... anymore
          this.context.push(tc.j_cTag); // reconsider as closing tag context
          this.exprAllowed = false;
        } else {
          return inner.call(this, prevType);
        }
      };
    });
  };

  return acorn;
};

},{"./xhtml":2}],2:[function(require,module,exports){
module.exports = {
  quot: '\u0022',
  amp: '&',
  apos: '\u0027',
  lt: '<',
  gt: '>',
  nbsp: '\u00A0',
  iexcl: '\u00A1',
  cent: '\u00A2',
  pound: '\u00A3',
  curren: '\u00A4',
  yen: '\u00A5',
  brvbar: '\u00A6',
  sect: '\u00A7',
  uml: '\u00A8',
  copy: '\u00A9',
  ordf: '\u00AA',
  laquo: '\u00AB',
  not: '\u00AC',
  shy: '\u00AD',
  reg: '\u00AE',
  macr: '\u00AF',
  deg: '\u00B0',
  plusmn: '\u00B1',
  sup2: '\u00B2',
  sup3: '\u00B3',
  acute: '\u00B4',
  micro: '\u00B5',
  para: '\u00B6',
  middot: '\u00B7',
  cedil: '\u00B8',
  sup1: '\u00B9',
  ordm: '\u00BA',
  raquo: '\u00BB',
  frac14: '\u00BC',
  frac12: '\u00BD',
  frac34: '\u00BE',
  iquest: '\u00BF',
  Agrave: '\u00C0',
  Aacute: '\u00C1',
  Acirc: '\u00C2',
  Atilde: '\u00C3',
  Auml: '\u00C4',
  Aring: '\u00C5',
  AElig: '\u00C6',
  Ccedil: '\u00C7',
  Egrave: '\u00C8',
  Eacute: '\u00C9',
  Ecirc: '\u00CA',
  Euml: '\u00CB',
  Igrave: '\u00CC',
  Iacute: '\u00CD',
  Icirc: '\u00CE',
  Iuml: '\u00CF',
  ETH: '\u00D0',
  Ntilde: '\u00D1',
  Ograve: '\u00D2',
  Oacute: '\u00D3',
  Ocirc: '\u00D4',
  Otilde: '\u00D5',
  Ouml: '\u00D6',
  times: '\u00D7',
  Oslash: '\u00D8',
  Ugrave: '\u00D9',
  Uacute: '\u00DA',
  Ucirc: '\u00DB',
  Uuml: '\u00DC',
  Yacute: '\u00DD',
  THORN: '\u00DE',
  szlig: '\u00DF',
  agrave: '\u00E0',
  aacute: '\u00E1',
  acirc: '\u00E2',
  atilde: '\u00E3',
  auml: '\u00E4',
  aring: '\u00E5',
  aelig: '\u00E6',
  ccedil: '\u00E7',
  egrave: '\u00E8',
  eacute: '\u00E9',
  ecirc: '\u00EA',
  euml: '\u00EB',
  igrave: '\u00EC',
  iacute: '\u00ED',
  icirc: '\u00EE',
  iuml: '\u00EF',
  eth: '\u00F0',
  ntilde: '\u00F1',
  ograve: '\u00F2',
  oacute: '\u00F3',
  ocirc: '\u00F4',
  otilde: '\u00F5',
  ouml: '\u00F6',
  divide: '\u00F7',
  oslash: '\u00F8',
  ugrave: '\u00F9',
  uacute: '\u00FA',
  ucirc: '\u00FB',
  uuml: '\u00FC',
  yacute: '\u00FD',
  thorn: '\u00FE',
  yuml: '\u00FF',
  OElig: '\u0152',
  oelig: '\u0153',
  Scaron: '\u0160',
  scaron: '\u0161',
  Yuml: '\u0178',
  fnof: '\u0192',
  circ: '\u02C6',
  tilde: '\u02DC',
  Alpha: '\u0391',
  Beta: '\u0392',
  Gamma: '\u0393',
  Delta: '\u0394',
  Epsilon: '\u0395',
  Zeta: '\u0396',
  Eta: '\u0397',
  Theta: '\u0398',
  Iota: '\u0399',
  Kappa: '\u039A',
  Lambda: '\u039B',
  Mu: '\u039C',
  Nu: '\u039D',
  Xi: '\u039E',
  Omicron: '\u039F',
  Pi: '\u03A0',
  Rho: '\u03A1',
  Sigma: '\u03A3',
  Tau: '\u03A4',
  Upsilon: '\u03A5',
  Phi: '\u03A6',
  Chi: '\u03A7',
  Psi: '\u03A8',
  Omega: '\u03A9',
  alpha: '\u03B1',
  beta: '\u03B2',
  gamma: '\u03B3',
  delta: '\u03B4',
  epsilon: '\u03B5',
  zeta: '\u03B6',
  eta: '\u03B7',
  theta: '\u03B8',
  iota: '\u03B9',
  kappa: '\u03BA',
  lambda: '\u03BB',
  mu: '\u03BC',
  nu: '\u03BD',
  xi: '\u03BE',
  omicron: '\u03BF',
  pi: '\u03C0',
  rho: '\u03C1',
  sigmaf: '\u03C2',
  sigma: '\u03C3',
  tau: '\u03C4',
  upsilon: '\u03C5',
  phi: '\u03C6',
  chi: '\u03C7',
  psi: '\u03C8',
  omega: '\u03C9',
  thetasym: '\u03D1',
  upsih: '\u03D2',
  piv: '\u03D6',
  ensp: '\u2002',
  emsp: '\u2003',
  thinsp: '\u2009',
  zwnj: '\u200C',
  zwj: '\u200D',
  lrm: '\u200E',
  rlm: '\u200F',
  ndash: '\u2013',
  mdash: '\u2014',
  lsquo: '\u2018',
  rsquo: '\u2019',
  sbquo: '\u201A',
  ldquo: '\u201C',
  rdquo: '\u201D',
  bdquo: '\u201E',
  dagger: '\u2020',
  Dagger: '\u2021',
  bull: '\u2022',
  hellip: '\u2026',
  permil: '\u2030',
  prime: '\u2032',
  Prime: '\u2033',
  lsaquo: '\u2039',
  rsaquo: '\u203A',
  oline: '\u203E',
  frasl: '\u2044',
  euro: '\u20AC',
  image: '\u2111',
  weierp: '\u2118',
  real: '\u211C',
  trade: '\u2122',
  alefsym: '\u2135',
  larr: '\u2190',
  uarr: '\u2191',
  rarr: '\u2192',
  darr: '\u2193',
  harr: '\u2194',
  crarr: '\u21B5',
  lArr: '\u21D0',
  uArr: '\u21D1',
  rArr: '\u21D2',
  dArr: '\u21D3',
  hArr: '\u21D4',
  forall: '\u2200',
  part: '\u2202',
  exist: '\u2203',
  empty: '\u2205',
  nabla: '\u2207',
  isin: '\u2208',
  notin: '\u2209',
  ni: '\u220B',
  prod: '\u220F',
  sum: '\u2211',
  minus: '\u2212',
  lowast: '\u2217',
  radic: '\u221A',
  prop: '\u221D',
  infin: '\u221E',
  ang: '\u2220',
  and: '\u2227',
  or: '\u2228',
  cap: '\u2229',
  cup: '\u222A',
  'int': '\u222B',
  there4: '\u2234',
  sim: '\u223C',
  cong: '\u2245',
  asymp: '\u2248',
  ne: '\u2260',
  equiv: '\u2261',
  le: '\u2264',
  ge: '\u2265',
  sub: '\u2282',
  sup: '\u2283',
  nsub: '\u2284',
  sube: '\u2286',
  supe: '\u2287',
  oplus: '\u2295',
  otimes: '\u2297',
  perp: '\u22A5',
  sdot: '\u22C5',
  lceil: '\u2308',
  rceil: '\u2309',
  lfloor: '\u230A',
  rfloor: '\u230B',
  lang: '\u2329',
  rang: '\u232A',
  loz: '\u25CA',
  spades: '\u2660',
  clubs: '\u2663',
  hearts: '\u2665',
  diams: '\u2666'
};

},{}],3:[function(require,module,exports){
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (factory((global.acorn = global.acorn || {})));
}(this, function (exports) { 'use strict';

  // Reserved word lists for various dialects of the language

  var reservedWords = {
    3: "abstract boolean byte char class double enum export extends final float goto implements import int interface long native package private protected public short static super synchronized throws transient volatile",
    5: "class enum extends super const export import",
    6: "enum",
    strict: "implements interface let package private protected public static yield",
    strictBind: "eval arguments"
  }

  // And the keywords

  var ecma5AndLessKeywords = "break case catch continue debugger default do else finally for function if return switch throw try var while with null true false instanceof typeof void delete new in this"

  var keywords = {
    5: ecma5AndLessKeywords,
    6: ecma5AndLessKeywords + " const class extends export import super"
  }

  // ## Character categories

  // Big ugly regular expressions that match characters in the
  // whitespace, identifier, and identifier-start categories. These
  // are only applied when a character is found to actually have a
  // code point above 128.
  // Generated by `bin/generate-identifier-regex.js`.

  var nonASCIIidentifierStartChars = "\xaa\xb5\xba\xc0-\xd6\xd8-\xf6\xf8-\u02c1\u02c6-\u02d1\u02e0-\u02e4\u02ec\u02ee\u0370-\u0374\u0376\u0377\u037a-\u037d\u037f\u0386\u0388-\u038a\u038c\u038e-\u03a1\u03a3-\u03f5\u03f7-\u0481\u048a-\u052f\u0531-\u0556\u0559\u0561-\u0587\u05d0-\u05ea\u05f0-\u05f2\u0620-\u064a\u066e\u066f\u0671-\u06d3\u06d5\u06e5\u06e6\u06ee\u06ef\u06fa-\u06fc\u06ff\u0710\u0712-\u072f\u074d-\u07a5\u07b1\u07ca-\u07ea\u07f4\u07f5\u07fa\u0800-\u0815\u081a\u0824\u0828\u0840-\u0858\u08a0-\u08b4\u08b6-\u08bd\u0904-\u0939\u093d\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098c\u098f\u0990\u0993-\u09a8\u09aa-\u09b0\u09b2\u09b6-\u09b9\u09bd\u09ce\u09dc\u09dd\u09df-\u09e1\u09f0\u09f1\u0a05-\u0a0a\u0a0f\u0a10\u0a13-\u0a28\u0a2a-\u0a30\u0a32\u0a33\u0a35\u0a36\u0a38\u0a39\u0a59-\u0a5c\u0a5e\u0a72-\u0a74\u0a85-\u0a8d\u0a8f-\u0a91\u0a93-\u0aa8\u0aaa-\u0ab0\u0ab2\u0ab3\u0ab5-\u0ab9\u0abd\u0ad0\u0ae0\u0ae1\u0af9\u0b05-\u0b0c\u0b0f\u0b10\u0b13-\u0b28\u0b2a-\u0b30\u0b32\u0b33\u0b35-\u0b39\u0b3d\u0b5c\u0b5d\u0b5f-\u0b61\u0b71\u0b83\u0b85-\u0b8a\u0b8e-\u0b90\u0b92-\u0b95\u0b99\u0b9a\u0b9c\u0b9e\u0b9f\u0ba3\u0ba4\u0ba8-\u0baa\u0bae-\u0bb9\u0bd0\u0c05-\u0c0c\u0c0e-\u0c10\u0c12-\u0c28\u0c2a-\u0c39\u0c3d\u0c58-\u0c5a\u0c60\u0c61\u0c80\u0c85-\u0c8c\u0c8e-\u0c90\u0c92-\u0ca8\u0caa-\u0cb3\u0cb5-\u0cb9\u0cbd\u0cde\u0ce0\u0ce1\u0cf1\u0cf2\u0d05-\u0d0c\u0d0e-\u0d10\u0d12-\u0d3a\u0d3d\u0d4e\u0d54-\u0d56\u0d5f-\u0d61\u0d7a-\u0d7f\u0d85-\u0d96\u0d9a-\u0db1\u0db3-\u0dbb\u0dbd\u0dc0-\u0dc6\u0e01-\u0e30\u0e32\u0e33\u0e40-\u0e46\u0e81\u0e82\u0e84\u0e87\u0e88\u0e8a\u0e8d\u0e94-\u0e97\u0e99-\u0e9f\u0ea1-\u0ea3\u0ea5\u0ea7\u0eaa\u0eab\u0ead-\u0eb0\u0eb2\u0eb3\u0ebd\u0ec0-\u0ec4\u0ec6\u0edc-\u0edf\u0f00\u0f40-\u0f47\u0f49-\u0f6c\u0f88-\u0f8c\u1000-\u102a\u103f\u1050-\u1055\u105a-\u105d\u1061\u1065\u1066\u106e-\u1070\u1075-\u1081\u108e\u10a0-\u10c5\u10c7\u10cd\u10d0-\u10fa\u10fc-\u1248\u124a-\u124d\u1250-\u1256\u1258\u125a-\u125d\u1260-\u1288\u128a-\u128d\u1290-\u12b0\u12b2-\u12b5\u12b8-\u12be\u12c0\u12c2-\u12c5\u12c8-\u12d6\u12d8-\u1310\u1312-\u1315\u1318-\u135a\u1380-\u138f\u13a0-\u13f5\u13f8-\u13fd\u1401-\u166c\u166f-\u167f\u1681-\u169a\u16a0-\u16ea\u16ee-\u16f8\u1700-\u170c\u170e-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176c\u176e-\u1770\u1780-\u17b3\u17d7\u17dc\u1820-\u1877\u1880-\u18a8\u18aa\u18b0-\u18f5\u1900-\u191e\u1950-\u196d\u1970-\u1974\u1980-\u19ab\u19b0-\u19c9\u1a00-\u1a16\u1a20-\u1a54\u1aa7\u1b05-\u1b33\u1b45-\u1b4b\u1b83-\u1ba0\u1bae\u1baf\u1bba-\u1be5\u1c00-\u1c23\u1c4d-\u1c4f\u1c5a-\u1c7d\u1c80-\u1c88\u1ce9-\u1cec\u1cee-\u1cf1\u1cf5\u1cf6\u1d00-\u1dbf\u1e00-\u1f15\u1f18-\u1f1d\u1f20-\u1f45\u1f48-\u1f4d\u1f50-\u1f57\u1f59\u1f5b\u1f5d\u1f5f-\u1f7d\u1f80-\u1fb4\u1fb6-\u1fbc\u1fbe\u1fc2-\u1fc4\u1fc6-\u1fcc\u1fd0-\u1fd3\u1fd6-\u1fdb\u1fe0-\u1fec\u1ff2-\u1ff4\u1ff6-\u1ffc\u2071\u207f\u2090-\u209c\u2102\u2107\u210a-\u2113\u2115\u2118-\u211d\u2124\u2126\u2128\u212a-\u2139\u213c-\u213f\u2145-\u2149\u214e\u2160-\u2188\u2c00-\u2c2e\u2c30-\u2c5e\u2c60-\u2ce4\u2ceb-\u2cee\u2cf2\u2cf3\u2d00-\u2d25\u2d27\u2d2d\u2d30-\u2d67\u2d6f\u2d80-\u2d96\u2da0-\u2da6\u2da8-\u2dae\u2db0-\u2db6\u2db8-\u2dbe\u2dc0-\u2dc6\u2dc8-\u2dce\u2dd0-\u2dd6\u2dd8-\u2dde\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303c\u3041-\u3096\u309b-\u309f\u30a1-\u30fa\u30fc-\u30ff\u3105-\u312d\u3131-\u318e\u31a0-\u31ba\u31f0-\u31ff\u3400-\u4db5\u4e00-\u9fd5\ua000-\ua48c\ua4d0-\ua4fd\ua500-\ua60c\ua610-\ua61f\ua62a\ua62b\ua640-\ua66e\ua67f-\ua69d\ua6a0-\ua6ef\ua717-\ua71f\ua722-\ua788\ua78b-\ua7ae\ua7b0-\ua7b7\ua7f7-\ua801\ua803-\ua805\ua807-\ua80a\ua80c-\ua822\ua840-\ua873\ua882-\ua8b3\ua8f2-\ua8f7\ua8fb\ua8fd\ua90a-\ua925\ua930-\ua946\ua960-\ua97c\ua984-\ua9b2\ua9cf\ua9e0-\ua9e4\ua9e6-\ua9ef\ua9fa-\ua9fe\uaa00-\uaa28\uaa40-\uaa42\uaa44-\uaa4b\uaa60-\uaa76\uaa7a\uaa7e-\uaaaf\uaab1\uaab5\uaab6\uaab9-\uaabd\uaac0\uaac2\uaadb-\uaadd\uaae0-\uaaea\uaaf2-\uaaf4\uab01-\uab06\uab09-\uab0e\uab11-\uab16\uab20-\uab26\uab28-\uab2e\uab30-\uab5a\uab5c-\uab65\uab70-\uabe2\uac00-\ud7a3\ud7b0-\ud7c6\ud7cb-\ud7fb\uf900-\ufa6d\ufa70-\ufad9\ufb00-\ufb06\ufb13-\ufb17\ufb1d\ufb1f-\ufb28\ufb2a-\ufb36\ufb38-\ufb3c\ufb3e\ufb40\ufb41\ufb43\ufb44\ufb46-\ufbb1\ufbd3-\ufd3d\ufd50-\ufd8f\ufd92-\ufdc7\ufdf0-\ufdfb\ufe70-\ufe74\ufe76-\ufefc\uff21-\uff3a\uff41-\uff5a\uff66-\uffbe\uffc2-\uffc7\uffca-\uffcf\uffd2-\uffd7\uffda-\uffdc"
  var nonASCIIidentifierChars = "\u200c\u200d\xb7\u0300-\u036f\u0387\u0483-\u0487\u0591-\u05bd\u05bf\u05c1\u05c2\u05c4\u05c5\u05c7\u0610-\u061a\u064b-\u0669\u0670\u06d6-\u06dc\u06df-\u06e4\u06e7\u06e8\u06ea-\u06ed\u06f0-\u06f9\u0711\u0730-\u074a\u07a6-\u07b0\u07c0-\u07c9\u07eb-\u07f3\u0816-\u0819\u081b-\u0823\u0825-\u0827\u0829-\u082d\u0859-\u085b\u08d4-\u08e1\u08e3-\u0903\u093a-\u093c\u093e-\u094f\u0951-\u0957\u0962\u0963\u0966-\u096f\u0981-\u0983\u09bc\u09be-\u09c4\u09c7\u09c8\u09cb-\u09cd\u09d7\u09e2\u09e3\u09e6-\u09ef\u0a01-\u0a03\u0a3c\u0a3e-\u0a42\u0a47\u0a48\u0a4b-\u0a4d\u0a51\u0a66-\u0a71\u0a75\u0a81-\u0a83\u0abc\u0abe-\u0ac5\u0ac7-\u0ac9\u0acb-\u0acd\u0ae2\u0ae3\u0ae6-\u0aef\u0b01-\u0b03\u0b3c\u0b3e-\u0b44\u0b47\u0b48\u0b4b-\u0b4d\u0b56\u0b57\u0b62\u0b63\u0b66-\u0b6f\u0b82\u0bbe-\u0bc2\u0bc6-\u0bc8\u0bca-\u0bcd\u0bd7\u0be6-\u0bef\u0c00-\u0c03\u0c3e-\u0c44\u0c46-\u0c48\u0c4a-\u0c4d\u0c55\u0c56\u0c62\u0c63\u0c66-\u0c6f\u0c81-\u0c83\u0cbc\u0cbe-\u0cc4\u0cc6-\u0cc8\u0cca-\u0ccd\u0cd5\u0cd6\u0ce2\u0ce3\u0ce6-\u0cef\u0d01-\u0d03\u0d3e-\u0d44\u0d46-\u0d48\u0d4a-\u0d4d\u0d57\u0d62\u0d63\u0d66-\u0d6f\u0d82\u0d83\u0dca\u0dcf-\u0dd4\u0dd6\u0dd8-\u0ddf\u0de6-\u0def\u0df2\u0df3\u0e31\u0e34-\u0e3a\u0e47-\u0e4e\u0e50-\u0e59\u0eb1\u0eb4-\u0eb9\u0ebb\u0ebc\u0ec8-\u0ecd\u0ed0-\u0ed9\u0f18\u0f19\u0f20-\u0f29\u0f35\u0f37\u0f39\u0f3e\u0f3f\u0f71-\u0f84\u0f86\u0f87\u0f8d-\u0f97\u0f99-\u0fbc\u0fc6\u102b-\u103e\u1040-\u1049\u1056-\u1059\u105e-\u1060\u1062-\u1064\u1067-\u106d\u1071-\u1074\u1082-\u108d\u108f-\u109d\u135d-\u135f\u1369-\u1371\u1712-\u1714\u1732-\u1734\u1752\u1753\u1772\u1773\u17b4-\u17d3\u17dd\u17e0-\u17e9\u180b-\u180d\u1810-\u1819\u18a9\u1920-\u192b\u1930-\u193b\u1946-\u194f\u19d0-\u19da\u1a17-\u1a1b\u1a55-\u1a5e\u1a60-\u1a7c\u1a7f-\u1a89\u1a90-\u1a99\u1ab0-\u1abd\u1b00-\u1b04\u1b34-\u1b44\u1b50-\u1b59\u1b6b-\u1b73\u1b80-\u1b82\u1ba1-\u1bad\u1bb0-\u1bb9\u1be6-\u1bf3\u1c24-\u1c37\u1c40-\u1c49\u1c50-\u1c59\u1cd0-\u1cd2\u1cd4-\u1ce8\u1ced\u1cf2-\u1cf4\u1cf8\u1cf9\u1dc0-\u1df5\u1dfb-\u1dff\u203f\u2040\u2054\u20d0-\u20dc\u20e1\u20e5-\u20f0\u2cef-\u2cf1\u2d7f\u2de0-\u2dff\u302a-\u302f\u3099\u309a\ua620-\ua629\ua66f\ua674-\ua67d\ua69e\ua69f\ua6f0\ua6f1\ua802\ua806\ua80b\ua823-\ua827\ua880\ua881\ua8b4-\ua8c5\ua8d0-\ua8d9\ua8e0-\ua8f1\ua900-\ua909\ua926-\ua92d\ua947-\ua953\ua980-\ua983\ua9b3-\ua9c0\ua9d0-\ua9d9\ua9e5\ua9f0-\ua9f9\uaa29-\uaa36\uaa43\uaa4c\uaa4d\uaa50-\uaa59\uaa7b-\uaa7d\uaab0\uaab2-\uaab4\uaab7\uaab8\uaabe\uaabf\uaac1\uaaeb-\uaaef\uaaf5\uaaf6\uabe3-\uabea\uabec\uabed\uabf0-\uabf9\ufb1e\ufe00-\ufe0f\ufe20-\ufe2f\ufe33\ufe34\ufe4d-\ufe4f\uff10-\uff19\uff3f"

  var nonASCIIidentifierStart = new RegExp("[" + nonASCIIidentifierStartChars + "]")
  var nonASCIIidentifier = new RegExp("[" + nonASCIIidentifierStartChars + nonASCIIidentifierChars + "]")

  nonASCIIidentifierStartChars = nonASCIIidentifierChars = null

  // These are a run-length and offset encoded representation of the
  // >0xffff code points that are a valid part of identifiers. The
  // offset starts at 0x10000, and each pair of numbers represents an
  // offset to the next range, and then a size of the range. They were
  // generated by bin/generate-identifier-regex.js
  var astralIdentifierStartCodes = [0,11,2,25,2,18,2,1,2,14,3,13,35,122,70,52,268,28,4,48,48,31,17,26,6,37,11,29,3,35,5,7,2,4,43,157,19,35,5,35,5,39,9,51,157,310,10,21,11,7,153,5,3,0,2,43,2,1,4,0,3,22,11,22,10,30,66,18,2,1,11,21,11,25,71,55,7,1,65,0,16,3,2,2,2,26,45,28,4,28,36,7,2,27,28,53,11,21,11,18,14,17,111,72,56,50,14,50,785,52,76,44,33,24,27,35,42,34,4,0,13,47,15,3,22,0,2,0,36,17,2,24,85,6,2,0,2,3,2,14,2,9,8,46,39,7,3,1,3,21,2,6,2,1,2,4,4,0,19,0,13,4,159,52,19,3,54,47,21,1,2,0,185,46,42,3,37,47,21,0,60,42,86,25,391,63,32,0,449,56,264,8,2,36,18,0,50,29,881,921,103,110,18,195,2749,1070,4050,582,8634,568,8,30,114,29,19,47,17,3,32,20,6,18,881,68,12,0,67,12,65,0,32,6124,20,754,9486,1,3071,106,6,12,4,8,8,9,5991,84,2,70,2,1,3,0,3,1,3,3,2,11,2,0,2,6,2,64,2,3,3,7,2,6,2,27,2,3,2,4,2,0,4,6,2,339,3,24,2,24,2,30,2,24,2,30,2,24,2,30,2,24,2,30,2,24,2,7,4149,196,60,67,1213,3,2,26,2,1,2,0,3,0,2,9,2,3,2,0,2,0,7,0,5,0,2,0,2,0,2,2,2,1,2,0,3,0,2,0,2,0,2,0,2,0,2,1,2,0,3,3,2,6,2,3,2,3,2,0,2,9,2,16,6,2,2,4,2,16,4421,42710,42,4148,12,221,3,5761,10591,541]
  var astralIdentifierCodes = [509,0,227,0,150,4,294,9,1368,2,2,1,6,3,41,2,5,0,166,1,1306,2,54,14,32,9,16,3,46,10,54,9,7,2,37,13,2,9,52,0,13,2,49,13,10,2,4,9,83,11,7,0,161,11,6,9,7,3,57,0,2,6,3,1,3,2,10,0,11,1,3,6,4,4,193,17,10,9,87,19,13,9,214,6,3,8,28,1,83,16,16,9,82,12,9,9,84,14,5,9,423,9,838,7,2,7,17,9,57,21,2,13,19882,9,135,4,60,6,26,9,1016,45,17,3,19723,1,5319,4,4,5,9,7,3,6,31,3,149,2,1418,49,513,54,5,49,9,0,15,0,23,4,2,14,1361,6,2,16,3,6,2,1,2,4,2214,6,110,6,6,9,792487,239]

  // This has a complexity linear to the value of the code. The
  // assumption is that looking up astral identifier characters is
  // rare.
  function isInAstralSet(code, set) {
    var pos = 0x10000
    for (var i = 0; i < set.length; i += 2) {
      pos += set[i]
      if (pos > code) return false
      pos += set[i + 1]
      if (pos >= code) return true
    }
  }

  // Test whether a given character code starts an identifier.

  function isIdentifierStart(code, astral) {
    if (code < 65) return code === 36
    if (code < 91) return true
    if (code < 97) return code === 95
    if (code < 123) return true
    if (code <= 0xffff) return code >= 0xaa && nonASCIIidentifierStart.test(String.fromCharCode(code))
    if (astral === false) return false
    return isInAstralSet(code, astralIdentifierStartCodes)
  }

  // Test whether a given character is part of an identifier.

  function isIdentifierChar(code, astral) {
    if (code < 48) return code === 36
    if (code < 58) return true
    if (code < 65) return false
    if (code < 91) return true
    if (code < 97) return code === 95
    if (code < 123) return true
    if (code <= 0xffff) return code >= 0xaa && nonASCIIidentifier.test(String.fromCharCode(code))
    if (astral === false) return false
    return isInAstralSet(code, astralIdentifierStartCodes) || isInAstralSet(code, astralIdentifierCodes)
  }

  // ## Token types

  // The assignment of fine-grained, information-carrying type objects
  // allows the tokenizer to store the information it has about a
  // token in a way that is very cheap for the parser to look up.

  // All token type variables start with an underscore, to make them
  // easy to recognize.

  // The `beforeExpr` property is used to disambiguate between regular
  // expressions and divisions. It is set on all token types that can
  // be followed by an expression (thus, a slash after them would be a
  // regular expression).
  //
  // The `startsExpr` property is used to check if the token ends a
  // `yield` expression. It is set on all token types that either can
  // directly start an expression (like a quotation mark) or can
  // continue an expression (like the body of a string).
  //
  // `isLoop` marks a keyword as starting a loop, which is important
  // to know when parsing a label, in order to allow or disallow
  // continue jumps to that label.

  var TokenType = function TokenType(label, conf) {
    if ( conf === void 0 ) conf = {};

    this.label = label
    this.keyword = conf.keyword
    this.beforeExpr = !!conf.beforeExpr
    this.startsExpr = !!conf.startsExpr
    this.isLoop = !!conf.isLoop
    this.isAssign = !!conf.isAssign
    this.prefix = !!conf.prefix
    this.postfix = !!conf.postfix
    this.binop = conf.binop || null
    this.updateContext = null
  };

  function binop(name, prec) {
    return new TokenType(name, {beforeExpr: true, binop: prec})
  }
  var beforeExpr = {beforeExpr: true};
  var startsExpr = {startsExpr: true};
  // Map keyword names to token types.

  var keywordTypes = {}

  // Succinct definitions of keyword token types
  function kw(name, options) {
    if ( options === void 0 ) options = {};

    options.keyword = name
    return keywordTypes[name] = new TokenType(name, options)
  }

  var tt = {
    num: new TokenType("num", startsExpr),
    regexp: new TokenType("regexp", startsExpr),
    string: new TokenType("string", startsExpr),
    name: new TokenType("name", startsExpr),
    eof: new TokenType("eof"),

    // Punctuation token types.
    bracketL: new TokenType("[", {beforeExpr: true, startsExpr: true}),
    bracketR: new TokenType("]"),
    braceL: new TokenType("{", {beforeExpr: true, startsExpr: true}),
    braceR: new TokenType("}"),
    parenL: new TokenType("(", {beforeExpr: true, startsExpr: true}),
    parenR: new TokenType(")"),
    comma: new TokenType(",", beforeExpr),
    semi: new TokenType(";", beforeExpr),
    colon: new TokenType(":", beforeExpr),
    dot: new TokenType("."),
    question: new TokenType("?", beforeExpr),
    arrow: new TokenType("=>", beforeExpr),
    template: new TokenType("template"),
    ellipsis: new TokenType("...", beforeExpr),
    backQuote: new TokenType("`", startsExpr),
    dollarBraceL: new TokenType("${", {beforeExpr: true, startsExpr: true}),

    // Operators. These carry several kinds of properties to help the
    // parser use them properly (the presence of these properties is
    // what categorizes them as operators).
    //
    // `binop`, when present, specifies that this operator is a binary
    // operator, and will refer to its precedence.
    //
    // `prefix` and `postfix` mark the operator as a prefix or postfix
    // unary operator.
    //
    // `isAssign` marks all of `=`, `+=`, `-=` etcetera, which act as
    // binary operators with a very low precedence, that should result
    // in AssignmentExpression nodes.

    eq: new TokenType("=", {beforeExpr: true, isAssign: true}),
    assign: new TokenType("_=", {beforeExpr: true, isAssign: true}),
    incDec: new TokenType("++/--", {prefix: true, postfix: true, startsExpr: true}),
    prefix: new TokenType("prefix", {beforeExpr: true, prefix: true, startsExpr: true}),
    logicalOR: binop("||", 1),
    logicalAND: binop("&&", 2),
    bitwiseOR: binop("|", 3),
    bitwiseXOR: binop("^", 4),
    bitwiseAND: binop("&", 5),
    equality: binop("==/!=", 6),
    relational: binop("</>", 7),
    bitShift: binop("<</>>", 8),
    plusMin: new TokenType("+/-", {beforeExpr: true, binop: 9, prefix: true, startsExpr: true}),
    modulo: binop("%", 10),
    star: binop("*", 10),
    slash: binop("/", 10),
    starstar: new TokenType("**", {beforeExpr: true}),

    // Keyword token types.
    _break: kw("break"),
    _case: kw("case", beforeExpr),
    _catch: kw("catch"),
    _continue: kw("continue"),
    _debugger: kw("debugger"),
    _default: kw("default", beforeExpr),
    _do: kw("do", {isLoop: true, beforeExpr: true}),
    _else: kw("else", beforeExpr),
    _finally: kw("finally"),
    _for: kw("for", {isLoop: true}),
    _function: kw("function", startsExpr),
    _if: kw("if"),
    _return: kw("return", beforeExpr),
    _switch: kw("switch"),
    _throw: kw("throw", beforeExpr),
    _try: kw("try"),
    _var: kw("var"),
    _const: kw("const"),
    _while: kw("while", {isLoop: true}),
    _with: kw("with"),
    _new: kw("new", {beforeExpr: true, startsExpr: true}),
    _this: kw("this", startsExpr),
    _super: kw("super", startsExpr),
    _class: kw("class"),
    _extends: kw("extends", beforeExpr),
    _export: kw("export"),
    _import: kw("import"),
    _null: kw("null", startsExpr),
    _true: kw("true", startsExpr),
    _false: kw("false", startsExpr),
    _in: kw("in", {beforeExpr: true, binop: 7}),
    _instanceof: kw("instanceof", {beforeExpr: true, binop: 7}),
    _typeof: kw("typeof", {beforeExpr: true, prefix: true, startsExpr: true}),
    _void: kw("void", {beforeExpr: true, prefix: true, startsExpr: true}),
    _delete: kw("delete", {beforeExpr: true, prefix: true, startsExpr: true})
  }

  // Matches a whole line break (where CRLF is considered a single
  // line break). Used to count lines.

  var lineBreak = /\r\n?|\n|\u2028|\u2029/
  var lineBreakG = new RegExp(lineBreak.source, "g")

  function isNewLine(code) {
    return code === 10 || code === 13 || code === 0x2028 || code === 0x2029
  }

  var nonASCIIwhitespace = /[\u1680\u180e\u2000-\u200a\u202f\u205f\u3000\ufeff]/

  var skipWhiteSpace = /(?:\s|\/\/.*|\/\*[^]*?\*\/)*/g

  function isArray(obj) {
    return Object.prototype.toString.call(obj) === "[object Array]"
  }

  // Checks if an object has a property.

  function has(obj, propName) {
    return Object.prototype.hasOwnProperty.call(obj, propName)
  }

  // These are used when `options.locations` is on, for the
  // `startLoc` and `endLoc` properties.

  var Position = function Position(line, col) {
    this.line = line
    this.column = col
  };

  Position.prototype.offset = function offset (n) {
    return new Position(this.line, this.column + n)
  };

  var SourceLocation = function SourceLocation(p, start, end) {
    this.start = start
    this.end = end
    if (p.sourceFile !== null) this.source = p.sourceFile
  };

  // The `getLineInfo` function is mostly useful when the
  // `locations` option is off (for performance reasons) and you
  // want to find the line/column position for a given character
  // offset. `input` should be the code string that the offset refers
  // into.

  function getLineInfo(input, offset) {
    for (var line = 1, cur = 0;;) {
      lineBreakG.lastIndex = cur
      var match = lineBreakG.exec(input)
      if (match && match.index < offset) {
        ++line
        cur = match.index + match[0].length
      } else {
        return new Position(line, offset - cur)
      }
    }
  }

  // A second optional argument can be given to further configure
  // the parser process. These options are recognized:

  var defaultOptions = {
    // `ecmaVersion` indicates the ECMAScript version to parse. Must
    // be either 3, 5, 6 (2015), 7 (2016), or 8 (2017). This influences support
    // for strict mode, the set of reserved words, and support for
    // new syntax features. The default is 7.
    ecmaVersion: 7,
    // `sourceType` indicates the mode the code should be parsed in.
    // Can be either `"script"` or `"module"`. This influences global
    // strict mode and parsing of `import` and `export` declarations.
    sourceType: "script",
    // `onInsertedSemicolon` can be a callback that will be called
    // when a semicolon is automatically inserted. It will be passed
    // th position of the comma as an offset, and if `locations` is
    // enabled, it is given the location as a `{line, column}` object
    // as second argument.
    onInsertedSemicolon: null,
    // `onTrailingComma` is similar to `onInsertedSemicolon`, but for
    // trailing commas.
    onTrailingComma: null,
    // By default, reserved words are only enforced if ecmaVersion >= 5.
    // Set `allowReserved` to a boolean value to explicitly turn this on
    // an off. When this option has the value "never", reserved words
    // and keywords can also not be used as property names.
    allowReserved: null,
    // When enabled, a return at the top level is not considered an
    // error.
    allowReturnOutsideFunction: false,
    // When enabled, import/export statements are not constrained to
    // appearing at the top of the program.
    allowImportExportEverywhere: false,
    // When enabled, hashbang directive in the beginning of file
    // is allowed and treated as a line comment.
    allowHashBang: false,
    // When `locations` is on, `loc` properties holding objects with
    // `start` and `end` properties in `{line, column}` form (with
    // line being 1-based and column 0-based) will be attached to the
    // nodes.
    locations: false,
    // A function can be passed as `onToken` option, which will
    // cause Acorn to call that function with object in the same
    // format as tokens returned from `tokenizer().getToken()`. Note
    // that you are not allowed to call the parser from the
    // callback—that will corrupt its internal state.
    onToken: null,
    // A function can be passed as `onComment` option, which will
    // cause Acorn to call that function with `(block, text, start,
    // end)` parameters whenever a comment is skipped. `block` is a
    // boolean indicating whether this is a block (`/* */`) comment,
    // `text` is the content of the comment, and `start` and `end` are
    // character offsets that denote the start and end of the comment.
    // When the `locations` option is on, two more parameters are
    // passed, the full `{line, column}` locations of the start and
    // end of the comments. Note that you are not allowed to call the
    // parser from the callback—that will corrupt its internal state.
    onComment: null,
    // Nodes have their start and end characters offsets recorded in
    // `start` and `end` properties (directly on the node, rather than
    // the `loc` object, which holds line/column data. To also add a
    // [semi-standardized][range] `range` property holding a `[start,
    // end]` array with the same numbers, set the `ranges` option to
    // `true`.
    //
    // [range]: https://bugzilla.mozilla.org/show_bug.cgi?id=745678
    ranges: false,
    // It is possible to parse multiple files into a single AST by
    // passing the tree produced by parsing the first file as
    // `program` option in subsequent parses. This will add the
    // toplevel forms of the parsed file to the `Program` (top) node
    // of an existing parse tree.
    program: null,
    // When `locations` is on, you can pass this to record the source
    // file in every node's `loc` object.
    sourceFile: null,
    // This value, if given, is stored in every node, whether
    // `locations` is on or off.
    directSourceFile: null,
    // When enabled, parenthesized expressions are represented by
    // (non-standard) ParenthesizedExpression nodes
    preserveParens: false,
    plugins: {}
  }

  // Interpret and default an options object

  function getOptions(opts) {
    var options = {}

    for (var opt in defaultOptions)
      options[opt] = opts && has(opts, opt) ? opts[opt] : defaultOptions[opt]

    if (options.ecmaVersion >= 2015)
      options.ecmaVersion -= 2009

    if (options.allowReserved == null)
      options.allowReserved = options.ecmaVersion < 5

    if (isArray(options.onToken)) {
      var tokens = options.onToken
      options.onToken = function (token) { return tokens.push(token); }
    }
    if (isArray(options.onComment))
      options.onComment = pushComment(options, options.onComment)

    return options
  }

  function pushComment(options, array) {
    return function (block, text, start, end, startLoc, endLoc) {
      var comment = {
        type: block ? 'Block' : 'Line',
        value: text,
        start: start,
        end: end
      }
      if (options.locations)
        comment.loc = new SourceLocation(this, startLoc, endLoc)
      if (options.ranges)
        comment.range = [start, end]
      array.push(comment)
    }
  }

  // Registered plugins
  var plugins = {}

  function keywordRegexp(words) {
    return new RegExp("^(" + words.replace(/ /g, "|") + ")$")
  }

  var Parser = function Parser(options, input, startPos) {
    this.options = options = getOptions(options)
    this.sourceFile = options.sourceFile
    this.keywords = keywordRegexp(keywords[options.ecmaVersion >= 6 ? 6 : 5])
    var reserved = ""
    if (!options.allowReserved) {
      for (var v = options.ecmaVersion;; v--)
        if (reserved = reservedWords[v]) break
      if (options.sourceType == "module") reserved += " await"
    }
    this.reservedWords = keywordRegexp(reserved)
    var reservedStrict = (reserved ? reserved + " " : "") + reservedWords.strict
    this.reservedWordsStrict = keywordRegexp(reservedStrict)
    this.reservedWordsStrictBind = keywordRegexp(reservedStrict + " " + reservedWords.strictBind)
    this.input = String(input)

    // Used to signal to callers of `readWord1` whether the word
    // contained any escape sequences. This is needed because words with
    // escape sequences must not be interpreted as keywords.
    this.containsEsc = false

    // Load plugins
    this.loadPlugins(options.plugins)

    // Set up token state

    // The current position of the tokenizer in the input.
    if (startPos) {
      this.pos = startPos
      this.lineStart = this.input.lastIndexOf("\n", startPos - 1) + 1
      this.curLine = this.input.slice(0, this.lineStart).split(lineBreak).length
    } else {
      this.pos = this.lineStart = 0
      this.curLine = 1
    }

    // Properties of the current token:
    // Its type
    this.type = tt.eof
    // For tokens that include more information than their type, the value
    this.value = null
    // Its start and end offset
    this.start = this.end = this.pos
    // And, if locations are used, the {line, column} object
    // corresponding to those offsets
    this.startLoc = this.endLoc = this.curPosition()

    // Position information for the previous token
    this.lastTokEndLoc = this.lastTokStartLoc = null
    this.lastTokStart = this.lastTokEnd = this.pos

    // The context stack is used to superficially track syntactic
    // context to predict whether a regular expression is allowed in a
    // given position.
    this.context = this.initialContext()
    this.exprAllowed = true

    // Figure out if it's a module code.
    this.strict = this.inModule = options.sourceType === "module"

    // Used to signify the start of a potential arrow function
    this.potentialArrowAt = -1

    // Flags to track whether we are in a function, a generator, an async function.
    this.inFunction = this.inGenerator = this.inAsync = false
    // Positions to delayed-check that yield/await does not exist in default parameters.
    this.yieldPos = this.awaitPos = 0
    // Labels in scope.
    this.labels = []

    // If enabled, skip leading hashbang line.
    if (this.pos === 0 && options.allowHashBang && this.input.slice(0, 2) === '#!')
      this.skipLineComment(2)
  };

  // DEPRECATED Kept for backwards compatibility until 3.0 in case a plugin uses them
  Parser.prototype.isKeyword = function isKeyword (word) { return this.keywords.test(word) };
  Parser.prototype.isReservedWord = function isReservedWord (word) { return this.reservedWords.test(word) };

  Parser.prototype.extend = function extend (name, f) {
    this[name] = f(this[name])
  };

  Parser.prototype.loadPlugins = function loadPlugins (pluginConfigs) {
      var this$1 = this;

    for (var name in pluginConfigs) {
      var plugin = plugins[name]
      if (!plugin) throw new Error("Plugin '" + name + "' not found")
      plugin(this$1, pluginConfigs[name])
    }
  };

  Parser.prototype.parse = function parse () {
    var node = this.options.program || this.startNode()
    this.nextToken()
    return this.parseTopLevel(node)
  };

  var pp = Parser.prototype

  // ## Parser utilities

  // Test whether a statement node is the string literal `"use strict"`.

  pp.isUseStrict = function(stmt) {
    return this.options.ecmaVersion >= 5 && stmt.type === "ExpressionStatement" &&
      stmt.expression.type === "Literal" &&
      stmt.expression.raw.slice(1, -1) === "use strict"
  }

  // Predicate that tests whether the next token is of the given
  // type, and if yes, consumes it as a side effect.

  pp.eat = function(type) {
    if (this.type === type) {
      this.next()
      return true
    } else {
      return false
    }
  }

  // Tests whether parsed token is a contextual keyword.

  pp.isContextual = function(name) {
    return this.type === tt.name && this.value === name
  }

  // Consumes contextual keyword if possible.

  pp.eatContextual = function(name) {
    return this.value === name && this.eat(tt.name)
  }

  // Asserts that following token is given contextual keyword.

  pp.expectContextual = function(name) {
    if (!this.eatContextual(name)) this.unexpected()
  }

  // Test whether a semicolon can be inserted at the current position.

  pp.canInsertSemicolon = function() {
    return this.type === tt.eof ||
      this.type === tt.braceR ||
      lineBreak.test(this.input.slice(this.lastTokEnd, this.start))
  }

  pp.insertSemicolon = function() {
    if (this.canInsertSemicolon()) {
      if (this.options.onInsertedSemicolon)
        this.options.onInsertedSemicolon(this.lastTokEnd, this.lastTokEndLoc)
      return true
    }
  }

  // Consume a semicolon, or, failing that, see if we are allowed to
  // pretend that there is a semicolon at this position.

  pp.semicolon = function() {
    if (!this.eat(tt.semi) && !this.insertSemicolon()) this.unexpected()
  }

  pp.afterTrailingComma = function(tokType, notNext) {
    if (this.type == tokType) {
      if (this.options.onTrailingComma)
        this.options.onTrailingComma(this.lastTokStart, this.lastTokStartLoc)
      if (!notNext)
        this.next()
      return true
    }
  }

  // Expect a token of a given type. If found, consume it, otherwise,
  // raise an unexpected token error.

  pp.expect = function(type) {
    this.eat(type) || this.unexpected()
  }

  // Raise an unexpected token error.

  pp.unexpected = function(pos) {
    this.raise(pos != null ? pos : this.start, "Unexpected token")
  }

  var DestructuringErrors = function DestructuringErrors() {
    this.shorthandAssign = 0
    this.trailingComma = 0
  };

  pp.checkPatternErrors = function(refDestructuringErrors, andThrow) {
    var trailing = refDestructuringErrors && refDestructuringErrors.trailingComma
    if (!andThrow) return !!trailing
    if (trailing) this.raise(trailing, "Comma is not permitted after the rest element")
  }

  pp.checkExpressionErrors = function(refDestructuringErrors, andThrow) {
    var pos = refDestructuringErrors && refDestructuringErrors.shorthandAssign
    if (!andThrow) return !!pos
    if (pos) this.raise(pos, "Shorthand property assignments are valid only in destructuring patterns")
  }

  pp.checkYieldAwaitInDefaultParams = function() {
    if (this.yieldPos && (!this.awaitPos || this.yieldPos < this.awaitPos))
      this.raise(this.yieldPos, "Yield expression cannot be a default value")
    if (this.awaitPos)
      this.raise(this.awaitPos, "Await expression cannot be a default value")
  }

  var pp$1 = Parser.prototype

  // ### Statement parsing

  // Parse a program. Initializes the parser, reads any number of
  // statements, and wraps them in a Program node.  Optionally takes a
  // `program` argument.  If present, the statements will be appended
  // to its body instead of creating a new node.

  pp$1.parseTopLevel = function(node) {
    var this$1 = this;

    var first = true, exports = {}
    if (!node.body) node.body = []
    while (this.type !== tt.eof) {
      var stmt = this$1.parseStatement(true, true, exports)
      node.body.push(stmt)
      if (first) {
        if (this$1.isUseStrict(stmt)) this$1.setStrict(true)
        first = false
      }
    }
    this.next()
    if (this.options.ecmaVersion >= 6) {
      node.sourceType = this.options.sourceType
    }
    return this.finishNode(node, "Program")
  }

  var loopLabel = {kind: "loop"};
  var switchLabel = {kind: "switch"};
  pp$1.isLet = function() {
    if (this.type !== tt.name || this.options.ecmaVersion < 6 || this.value != "let") return false
    skipWhiteSpace.lastIndex = this.pos
    var skip = skipWhiteSpace.exec(this.input)
    var next = this.pos + skip[0].length, nextCh = this.input.charCodeAt(next)
    if (nextCh === 91 || nextCh == 123) return true // '{' and '['
    if (isIdentifierStart(nextCh, true)) {
      for (var pos = next + 1; isIdentifierChar(this.input.charCodeAt(pos), true); ++pos) {}
      var ident = this.input.slice(next, pos)
      if (!this.isKeyword(ident)) return true
    }
    return false
  }

  // check 'async [no LineTerminator here] function'
  // - 'async /*foo*/ function' is OK.
  // - 'async /*\n*/ function' is invalid.
  pp$1.isAsyncFunction = function() {
    if (this.type !== tt.name || this.options.ecmaVersion < 8 || this.value != "async")
      return false

    skipWhiteSpace.lastIndex = this.pos
    var skip = skipWhiteSpace.exec(this.input)
    var next = this.pos + skip[0].length
    return !lineBreak.test(this.input.slice(this.pos, next)) &&
      this.input.slice(next, next + 8) === "function" &&
      (next + 8 == this.input.length || !isIdentifierChar(this.input.charAt(next + 8)))
  }

  // Parse a single statement.
  //
  // If expecting a statement and finding a slash operator, parse a
  // regular expression literal. This is to handle cases like
  // `if (foo) /blah/.exec(foo)`, where looking at the previous token
  // does not help.

  pp$1.parseStatement = function(declaration, topLevel, exports) {
    var starttype = this.type, node = this.startNode(), kind

    if (this.isLet()) {
      starttype = tt._var
      kind = "let"
    }

    // Most types of statements are recognized by the keyword they
    // start with. Many are trivial to parse, some require a bit of
    // complexity.

    switch (starttype) {
    case tt._break: case tt._continue: return this.parseBreakContinueStatement(node, starttype.keyword)
    case tt._debugger: return this.parseDebuggerStatement(node)
    case tt._do: return this.parseDoStatement(node)
    case tt._for: return this.parseForStatement(node)
    case tt._function:
      if (!declaration && this.options.ecmaVersion >= 6) this.unexpected()
      return this.parseFunctionStatement(node, false)
    case tt._class:
      if (!declaration) this.unexpected()
      return this.parseClass(node, true)
    case tt._if: return this.parseIfStatement(node)
    case tt._return: return this.parseReturnStatement(node)
    case tt._switch: return this.parseSwitchStatement(node)
    case tt._throw: return this.parseThrowStatement(node)
    case tt._try: return this.parseTryStatement(node)
    case tt._const: case tt._var:
      kind = kind || this.value
      if (!declaration && kind != "var") this.unexpected()
      return this.parseVarStatement(node, kind)
    case tt._while: return this.parseWhileStatement(node)
    case tt._with: return this.parseWithStatement(node)
    case tt.braceL: return this.parseBlock()
    case tt.semi: return this.parseEmptyStatement(node)
    case tt._export:
    case tt._import:
      if (!this.options.allowImportExportEverywhere) {
        if (!topLevel)
          this.raise(this.start, "'import' and 'export' may only appear at the top level")
        if (!this.inModule)
          this.raise(this.start, "'import' and 'export' may appear only with 'sourceType: module'")
      }
      return starttype === tt._import ? this.parseImport(node) : this.parseExport(node, exports)

      // If the statement does not start with a statement keyword or a
      // brace, it's an ExpressionStatement or LabeledStatement. We
      // simply start parsing an expression, and afterwards, if the
      // next token is a colon and the expression was a simple
      // Identifier node, we switch to interpreting it as a label.
    default:
      if (this.isAsyncFunction() && declaration) {
        this.next()
        return this.parseFunctionStatement(node, true)
      }

      var maybeName = this.value, expr = this.parseExpression()
      if (starttype === tt.name && expr.type === "Identifier" && this.eat(tt.colon))
        return this.parseLabeledStatement(node, maybeName, expr)
      else return this.parseExpressionStatement(node, expr)
    }
  }

  pp$1.parseBreakContinueStatement = function(node, keyword) {
    var this$1 = this;

    var isBreak = keyword == "break"
    this.next()
    if (this.eat(tt.semi) || this.insertSemicolon()) node.label = null
    else if (this.type !== tt.name) this.unexpected()
    else {
      node.label = this.parseIdent()
      this.semicolon()
    }

    // Verify that there is an actual destination to break or
    // continue to.
    for (var i = 0; i < this.labels.length; ++i) {
      var lab = this$1.labels[i]
      if (node.label == null || lab.name === node.label.name) {
        if (lab.kind != null && (isBreak || lab.kind === "loop")) break
        if (node.label && isBreak) break
      }
    }
    if (i === this.labels.length) this.raise(node.start, "Unsyntactic " + keyword)
    return this.finishNode(node, isBreak ? "BreakStatement" : "ContinueStatement")
  }

  pp$1.parseDebuggerStatement = function(node) {
    this.next()
    this.semicolon()
    return this.finishNode(node, "DebuggerStatement")
  }

  pp$1.parseDoStatement = function(node) {
    this.next()
    this.labels.push(loopLabel)
    node.body = this.parseStatement(false)
    this.labels.pop()
    this.expect(tt._while)
    node.test = this.parseParenExpression()
    if (this.options.ecmaVersion >= 6)
      this.eat(tt.semi)
    else
      this.semicolon()
    return this.finishNode(node, "DoWhileStatement")
  }

  // Disambiguating between a `for` and a `for`/`in` or `for`/`of`
  // loop is non-trivial. Basically, we have to parse the init `var`
  // statement or expression, disallowing the `in` operator (see
  // the second parameter to `parseExpression`), and then check
  // whether the next token is `in` or `of`. When there is no init
  // part (semicolon immediately after the opening parenthesis), it
  // is a regular `for` loop.

  pp$1.parseForStatement = function(node) {
    this.next()
    this.labels.push(loopLabel)
    this.expect(tt.parenL)
    if (this.type === tt.semi) return this.parseFor(node, null)
    var isLet = this.isLet()
    if (this.type === tt._var || this.type === tt._const || isLet) {
      var init$1 = this.startNode(), kind = isLet ? "let" : this.value
      this.next()
      this.parseVar(init$1, true, kind)
      this.finishNode(init$1, "VariableDeclaration")
      if ((this.type === tt._in || (this.options.ecmaVersion >= 6 && this.isContextual("of"))) && init$1.declarations.length === 1 &&
          !(kind !== "var" && init$1.declarations[0].init))
        return this.parseForIn(node, init$1)
      return this.parseFor(node, init$1)
    }
    var refDestructuringErrors = new DestructuringErrors
    var init = this.parseExpression(true, refDestructuringErrors)
    if (this.type === tt._in || (this.options.ecmaVersion >= 6 && this.isContextual("of"))) {
      this.checkPatternErrors(refDestructuringErrors, true)
      this.toAssignable(init)
      this.checkLVal(init)
      return this.parseForIn(node, init)
    } else {
      this.checkExpressionErrors(refDestructuringErrors, true)
    }
    return this.parseFor(node, init)
  }

  pp$1.parseFunctionStatement = function(node, isAsync) {
    this.next()
    return this.parseFunction(node, true, false, isAsync)
  }

  pp$1.isFunction = function() {
    return this.type === tt._function || this.isAsyncFunction()
  }

  pp$1.parseIfStatement = function(node) {
    this.next()
    node.test = this.parseParenExpression()
    // allow function declarations in branches, but only in non-strict mode
    node.consequent = this.parseStatement(!this.strict && this.isFunction())
    node.alternate = this.eat(tt._else) ? this.parseStatement(!this.strict && this.isFunction()) : null
    return this.finishNode(node, "IfStatement")
  }

  pp$1.parseReturnStatement = function(node) {
    if (!this.inFunction && !this.options.allowReturnOutsideFunction)
      this.raise(this.start, "'return' outside of function")
    this.next()

    // In `return` (and `break`/`continue`), the keywords with
    // optional arguments, we eagerly look for a semicolon or the
    // possibility to insert one.

    if (this.eat(tt.semi) || this.insertSemicolon()) node.argument = null
    else { node.argument = this.parseExpression(); this.semicolon() }
    return this.finishNode(node, "ReturnStatement")
  }

  pp$1.parseSwitchStatement = function(node) {
    var this$1 = this;

    this.next()
    node.discriminant = this.parseParenExpression()
    node.cases = []
    this.expect(tt.braceL)
    this.labels.push(switchLabel)

    // Statements under must be grouped (by label) in SwitchCase
    // nodes. `cur` is used to keep the node that we are currently
    // adding statements to.

    for (var cur, sawDefault = false; this.type != tt.braceR;) {
      if (this$1.type === tt._case || this$1.type === tt._default) {
        var isCase = this$1.type === tt._case
        if (cur) this$1.finishNode(cur, "SwitchCase")
        node.cases.push(cur = this$1.startNode())
        cur.consequent = []
        this$1.next()
        if (isCase) {
          cur.test = this$1.parseExpression()
        } else {
          if (sawDefault) this$1.raiseRecoverable(this$1.lastTokStart, "Multiple default clauses")
          sawDefault = true
          cur.test = null
        }
        this$1.expect(tt.colon)
      } else {
        if (!cur) this$1.unexpected()
        cur.consequent.push(this$1.parseStatement(true))
      }
    }
    if (cur) this.finishNode(cur, "SwitchCase")
    this.next() // Closing brace
    this.labels.pop()
    return this.finishNode(node, "SwitchStatement")
  }

  pp$1.parseThrowStatement = function(node) {
    this.next()
    if (lineBreak.test(this.input.slice(this.lastTokEnd, this.start)))
      this.raise(this.lastTokEnd, "Illegal newline after throw")
    node.argument = this.parseExpression()
    this.semicolon()
    return this.finishNode(node, "ThrowStatement")
  }

  // Reused empty array added for node fields that are always empty.

  var empty = []

  pp$1.parseTryStatement = function(node) {
    this.next()
    node.block = this.parseBlock()
    node.handler = null
    if (this.type === tt._catch) {
      var clause = this.startNode()
      this.next()
      this.expect(tt.parenL)
      clause.param = this.parseBindingAtom()
      this.checkLVal(clause.param, true)
      this.expect(tt.parenR)
      clause.body = this.parseBlock()
      node.handler = this.finishNode(clause, "CatchClause")
    }
    node.finalizer = this.eat(tt._finally) ? this.parseBlock() : null
    if (!node.handler && !node.finalizer)
      this.raise(node.start, "Missing catch or finally clause")
    return this.finishNode(node, "TryStatement")
  }

  pp$1.parseVarStatement = function(node, kind) {
    this.next()
    this.parseVar(node, false, kind)
    this.semicolon()
    return this.finishNode(node, "VariableDeclaration")
  }

  pp$1.parseWhileStatement = function(node) {
    this.next()
    node.test = this.parseParenExpression()
    this.labels.push(loopLabel)
    node.body = this.parseStatement(false)
    this.labels.pop()
    return this.finishNode(node, "WhileStatement")
  }

  pp$1.parseWithStatement = function(node) {
    if (this.strict) this.raise(this.start, "'with' in strict mode")
    this.next()
    node.object = this.parseParenExpression()
    node.body = this.parseStatement(false)
    return this.finishNode(node, "WithStatement")
  }

  pp$1.parseEmptyStatement = function(node) {
    this.next()
    return this.finishNode(node, "EmptyStatement")
  }

  pp$1.parseLabeledStatement = function(node, maybeName, expr) {
    var this$1 = this;

    for (var i = 0; i < this.labels.length; ++i)
      if (this$1.labels[i].name === maybeName) this$1.raise(expr.start, "Label '" + maybeName + "' is already declared")
    var kind = this.type.isLoop ? "loop" : this.type === tt._switch ? "switch" : null
    for (var i$1 = this.labels.length - 1; i$1 >= 0; i$1--) {
      var label = this$1.labels[i$1]
      if (label.statementStart == node.start) {
        label.statementStart = this$1.start
        label.kind = kind
      } else break
    }
    this.labels.push({name: maybeName, kind: kind, statementStart: this.start})
    node.body = this.parseStatement(true)
    this.labels.pop()
    node.label = expr
    return this.finishNode(node, "LabeledStatement")
  }

  pp$1.parseExpressionStatement = function(node, expr) {
    node.expression = expr
    this.semicolon()
    return this.finishNode(node, "ExpressionStatement")
  }

  // Parse a semicolon-enclosed block of statements, handling `"use
  // strict"` declarations when `allowStrict` is true (used for
  // function bodies).

  pp$1.parseBlock = function(allowStrict) {
    var this$1 = this;

    var node = this.startNode(), first = true, oldStrict
    node.body = []
    this.expect(tt.braceL)
    while (!this.eat(tt.braceR)) {
      var stmt = this$1.parseStatement(true)
      node.body.push(stmt)
      if (first && allowStrict && this$1.isUseStrict(stmt)) {
        oldStrict = this$1.strict
        this$1.setStrict(this$1.strict = true)
      }
      first = false
    }
    if (oldStrict === false) this.setStrict(false)
    return this.finishNode(node, "BlockStatement")
  }

  // Parse a regular `for` loop. The disambiguation code in
  // `parseStatement` will already have parsed the init statement or
  // expression.

  pp$1.parseFor = function(node, init) {
    node.init = init
    this.expect(tt.semi)
    node.test = this.type === tt.semi ? null : this.parseExpression()
    this.expect(tt.semi)
    node.update = this.type === tt.parenR ? null : this.parseExpression()
    this.expect(tt.parenR)
    node.body = this.parseStatement(false)
    this.labels.pop()
    return this.finishNode(node, "ForStatement")
  }

  // Parse a `for`/`in` and `for`/`of` loop, which are almost
  // same from parser's perspective.

  pp$1.parseForIn = function(node, init) {
    var type = this.type === tt._in ? "ForInStatement" : "ForOfStatement"
    this.next()
    node.left = init
    node.right = this.parseExpression()
    this.expect(tt.parenR)
    node.body = this.parseStatement(false)
    this.labels.pop()
    return this.finishNode(node, type)
  }

  // Parse a list of variable declarations.

  pp$1.parseVar = function(node, isFor, kind) {
    var this$1 = this;

    node.declarations = []
    node.kind = kind
    for (;;) {
      var decl = this$1.startNode()
      this$1.parseVarId(decl)
      if (this$1.eat(tt.eq)) {
        decl.init = this$1.parseMaybeAssign(isFor)
      } else if (kind === "const" && !(this$1.type === tt._in || (this$1.options.ecmaVersion >= 6 && this$1.isContextual("of")))) {
        this$1.unexpected()
      } else if (decl.id.type != "Identifier" && !(isFor && (this$1.type === tt._in || this$1.isContextual("of")))) {
        this$1.raise(this$1.lastTokEnd, "Complex binding patterns require an initialization value")
      } else {
        decl.init = null
      }
      node.declarations.push(this$1.finishNode(decl, "VariableDeclarator"))
      if (!this$1.eat(tt.comma)) break
    }
    return node
  }

  pp$1.parseVarId = function(decl) {
    decl.id = this.parseBindingAtom()
    this.checkLVal(decl.id, true)
  }

  // Parse a function declaration or literal (depending on the
  // `isStatement` parameter).

  pp$1.parseFunction = function(node, isStatement, allowExpressionBody, isAsync) {
    this.initFunction(node)
    if (this.options.ecmaVersion >= 6 && !isAsync)
      node.generator = this.eat(tt.star)
    if (this.options.ecmaVersion >= 8)
      node.async = !!isAsync

    if (isStatement)
      node.id = this.parseIdent()

    var oldInGen = this.inGenerator, oldInAsync = this.inAsync, oldYieldPos = this.yieldPos, oldAwaitPos = this.awaitPos
    this.inGenerator = node.generator
    this.inAsync = node.async
    this.yieldPos = 0
    this.awaitPos = 0

    if (!isStatement && this.type === tt.name)
      node.id = this.parseIdent()
    this.parseFunctionParams(node)
    this.parseFunctionBody(node, allowExpressionBody)

    this.inGenerator = oldInGen
    this.inAsync = oldInAsync
    this.yieldPos = oldYieldPos
    this.awaitPos = oldAwaitPos
    return this.finishNode(node, isStatement ? "FunctionDeclaration" : "FunctionExpression")
  }

  pp$1.parseFunctionParams = function(node) {
    this.expect(tt.parenL)
    node.params = this.parseBindingList(tt.parenR, false, this.options.ecmaVersion >= 8, true)
    this.checkYieldAwaitInDefaultParams()
  }

  // Parse a class declaration or literal (depending on the
  // `isStatement` parameter).

  pp$1.parseClass = function(node, isStatement) {
    var this$1 = this;

    this.next()
    this.parseClassId(node, isStatement)
    this.parseClassSuper(node)
    var classBody = this.startNode()
    var hadConstructor = false
    classBody.body = []
    this.expect(tt.braceL)
    while (!this.eat(tt.braceR)) {
      if (this$1.eat(tt.semi)) continue
      var method = this$1.startNode()
      var isGenerator = this$1.eat(tt.star)
      var isAsync = false
      var isMaybeStatic = this$1.type === tt.name && this$1.value === "static"
      this$1.parsePropertyName(method)
      method.static = isMaybeStatic && this$1.type !== tt.parenL
      if (method.static) {
        if (isGenerator) this$1.unexpected()
        isGenerator = this$1.eat(tt.star)
        this$1.parsePropertyName(method)
      }
      if (this$1.options.ecmaVersion >= 8 && !isGenerator && !method.computed &&
          method.key.type === "Identifier" && method.key.name === "async" && this$1.type !== tt.parenL &&
          !this$1.canInsertSemicolon()) {
        isAsync = true
        this$1.parsePropertyName(method)
      }
      method.kind = "method"
      var isGetSet = false
      if (!method.computed) {
        var key = method.key;
        if (!isGenerator && !isAsync && key.type === "Identifier" && this$1.type !== tt.parenL && (key.name === "get" || key.name === "set")) {
          isGetSet = true
          method.kind = key.name
          key = this$1.parsePropertyName(method)
        }
        if (!method.static && (key.type === "Identifier" && key.name === "constructor" ||
            key.type === "Literal" && key.value === "constructor")) {
          if (hadConstructor) this$1.raise(key.start, "Duplicate constructor in the same class")
          if (isGetSet) this$1.raise(key.start, "Constructor can't have get/set modifier")
          if (isGenerator) this$1.raise(key.start, "Constructor can't be a generator")
          if (isAsync) this$1.raise(key.start, "Constructor can't be an async method")
          method.kind = "constructor"
          hadConstructor = true
        }
      }
      this$1.parseClassMethod(classBody, method, isGenerator, isAsync)
      if (isGetSet) {
        var paramCount = method.kind === "get" ? 0 : 1
        if (method.value.params.length !== paramCount) {
          var start = method.value.start
          if (method.kind === "get")
            this$1.raiseRecoverable(start, "getter should have no params")
          else
            this$1.raiseRecoverable(start, "setter should have exactly one param")
        } else {
          if (method.kind === "set" && method.value.params[0].type === "RestElement")
            this$1.raiseRecoverable(method.value.params[0].start, "Setter cannot use rest params")
        }
      }
    }
    node.body = this.finishNode(classBody, "ClassBody")
    return this.finishNode(node, isStatement ? "ClassDeclaration" : "ClassExpression")
  }

  pp$1.parseClassMethod = function(classBody, method, isGenerator, isAsync) {
    method.value = this.parseMethod(isGenerator, isAsync)
    classBody.body.push(this.finishNode(method, "MethodDefinition"))
  }

  pp$1.parseClassId = function(node, isStatement) {
    node.id = this.type === tt.name ? this.parseIdent() : isStatement ? this.unexpected() : null
  }

  pp$1.parseClassSuper = function(node) {
    node.superClass = this.eat(tt._extends) ? this.parseExprSubscripts() : null
  }

  // Parses module export declaration.

  pp$1.parseExport = function(node, exports) {
    var this$1 = this;

    this.next()
    // export * from '...'
    if (this.eat(tt.star)) {
      this.expectContextual("from")
      node.source = this.type === tt.string ? this.parseExprAtom() : this.unexpected()
      this.semicolon()
      return this.finishNode(node, "ExportAllDeclaration")
    }
    if (this.eat(tt._default)) { // export default ...
      this.checkExport(exports, "default", this.lastTokStart)
      var parens = this.type == tt.parenL
      var expr = this.parseMaybeAssign()
      var needsSemi = true
      if (!parens && (expr.type == "FunctionExpression" ||
                      expr.type == "ClassExpression")) {
        needsSemi = false
        if (expr.id) {
          expr.type = expr.type == "FunctionExpression"
            ? "FunctionDeclaration"
            : "ClassDeclaration"
        }
      }
      node.declaration = expr
      if (needsSemi) this.semicolon()
      return this.finishNode(node, "ExportDefaultDeclaration")
    }
    // export var|const|let|function|class ...
    if (this.shouldParseExportStatement()) {
      node.declaration = this.parseStatement(true)
      if (node.declaration.type === "VariableDeclaration")
        this.checkVariableExport(exports, node.declaration.declarations)
      else
        this.checkExport(exports, node.declaration.id.name, node.declaration.id.start)
      node.specifiers = []
      node.source = null
    } else { // export { x, y as z } [from '...']
      node.declaration = null
      node.specifiers = this.parseExportSpecifiers(exports)
      if (this.eatContextual("from")) {
        node.source = this.type === tt.string ? this.parseExprAtom() : this.unexpected()
      } else {
        // check for keywords used as local names
        for (var i = 0; i < node.specifiers.length; i++) {
          if (this$1.keywords.test(node.specifiers[i].local.name) || this$1.reservedWords.test(node.specifiers[i].local.name)) {
            this$1.unexpected(node.specifiers[i].local.start)
          }
        }

        node.source = null
      }
      this.semicolon()
    }
    return this.finishNode(node, "ExportNamedDeclaration")
  }

  pp$1.checkExport = function(exports, name, pos) {
    if (!exports) return
    if (Object.prototype.hasOwnProperty.call(exports, name))
      this.raiseRecoverable(pos, "Duplicate export '" + name + "'")
    exports[name] = true
  }

  pp$1.checkPatternExport = function(exports, pat) {
    var this$1 = this;

    var type = pat.type
    if (type == "Identifier")
      this.checkExport(exports, pat.name, pat.start)
    else if (type == "ObjectPattern")
      for (var i = 0; i < pat.properties.length; ++i)
        this$1.checkPatternExport(exports, pat.properties[i].value)
    else if (type == "ArrayPattern")
      for (var i$1 = 0; i$1 < pat.elements.length; ++i$1) {
        var elt = pat.elements[i$1]
        if (elt) this$1.checkPatternExport(exports, elt)
      }
    else if (type == "AssignmentPattern")
      this.checkPatternExport(exports, pat.left)
    else if (type == "ParenthesizedExpression")
      this.checkPatternExport(exports, pat.expression)
  }

  pp$1.checkVariableExport = function(exports, decls) {
    var this$1 = this;

    if (!exports) return
    for (var i = 0; i < decls.length; i++)
      this$1.checkPatternExport(exports, decls[i].id)
  }

  pp$1.shouldParseExportStatement = function() {
    return this.type.keyword || this.isLet() || this.isAsyncFunction()
  }

  // Parses a comma-separated list of module exports.

  pp$1.parseExportSpecifiers = function(exports) {
    var this$1 = this;

    var nodes = [], first = true
    // export { x, y as z } [from '...']
    this.expect(tt.braceL)
    while (!this.eat(tt.braceR)) {
      if (!first) {
        this$1.expect(tt.comma)
        if (this$1.afterTrailingComma(tt.braceR)) break
      } else first = false

      var node = this$1.startNode()
      node.local = this$1.parseIdent(this$1.type === tt._default)
      node.exported = this$1.eatContextual("as") ? this$1.parseIdent(true) : node.local
      this$1.checkExport(exports, node.exported.name, node.exported.start)
      nodes.push(this$1.finishNode(node, "ExportSpecifier"))
    }
    return nodes
  }

  // Parses import declaration.

  pp$1.parseImport = function(node) {
    this.next()
    // import '...'
    if (this.type === tt.string) {
      node.specifiers = empty
      node.source = this.parseExprAtom()
    } else {
      node.specifiers = this.parseImportSpecifiers()
      this.expectContextual("from")
      node.source = this.type === tt.string ? this.parseExprAtom() : this.unexpected()
    }
    this.semicolon()
    return this.finishNode(node, "ImportDeclaration")
  }

  // Parses a comma-separated list of module imports.

  pp$1.parseImportSpecifiers = function() {
    var this$1 = this;

    var nodes = [], first = true
    if (this.type === tt.name) {
      // import defaultObj, { x, y as z } from '...'
      var node = this.startNode()
      node.local = this.parseIdent()
      this.checkLVal(node.local, true)
      nodes.push(this.finishNode(node, "ImportDefaultSpecifier"))
      if (!this.eat(tt.comma)) return nodes
    }
    if (this.type === tt.star) {
      var node$1 = this.startNode()
      this.next()
      this.expectContextual("as")
      node$1.local = this.parseIdent()
      this.checkLVal(node$1.local, true)
      nodes.push(this.finishNode(node$1, "ImportNamespaceSpecifier"))
      return nodes
    }
    this.expect(tt.braceL)
    while (!this.eat(tt.braceR)) {
      if (!first) {
        this$1.expect(tt.comma)
        if (this$1.afterTrailingComma(tt.braceR)) break
      } else first = false

      var node$2 = this$1.startNode()
      node$2.imported = this$1.parseIdent(true)
      if (this$1.eatContextual("as")) {
        node$2.local = this$1.parseIdent()
      } else {
        node$2.local = node$2.imported
        if (this$1.isKeyword(node$2.local.name)) this$1.unexpected(node$2.local.start)
        if (this$1.reservedWordsStrict.test(node$2.local.name)) this$1.raiseRecoverable(node$2.local.start, "The keyword '" + node$2.local.name + "' is reserved")
      }
      this$1.checkLVal(node$2.local, true)
      nodes.push(this$1.finishNode(node$2, "ImportSpecifier"))
    }
    return nodes
  }

  var pp$2 = Parser.prototype

  // Convert existing expression atom to assignable pattern
  // if possible.

  pp$2.toAssignable = function(node, isBinding) {
    var this$1 = this;

    if (this.options.ecmaVersion >= 6 && node) {
      switch (node.type) {
        case "Identifier":
        if (this.inAsync && node.name === "await")
          this.raise(node.start, "Can not use 'await' as identifier inside an async function")
        break

      case "ObjectPattern":
      case "ArrayPattern":
        break

      case "ObjectExpression":
        node.type = "ObjectPattern"
        for (var i = 0; i < node.properties.length; i++) {
          var prop = node.properties[i]
          if (prop.kind !== "init") this$1.raise(prop.key.start, "Object pattern can't contain getter or setter")
          this$1.toAssignable(prop.value, isBinding)
        }
        break

      case "ArrayExpression":
        node.type = "ArrayPattern"
        this.toAssignableList(node.elements, isBinding)
        break

      case "AssignmentExpression":
        if (node.operator === "=") {
          node.type = "AssignmentPattern"
          delete node.operator
          this.toAssignable(node.left, isBinding)
          // falls through to AssignmentPattern
        } else {
          this.raise(node.left.end, "Only '=' operator can be used for specifying default value.")
          break
        }

      case "AssignmentPattern":
        break

      case "ParenthesizedExpression":
        node.expression = this.toAssignable(node.expression, isBinding)
        break

      case "MemberExpression":
        if (!isBinding) break

      default:
        this.raise(node.start, "Assigning to rvalue")
      }
    }
    return node
  }

  // Convert list of expression atoms to binding list.

  pp$2.toAssignableList = function(exprList, isBinding) {
    var this$1 = this;

    var end = exprList.length
    if (end) {
      var last = exprList[end - 1]
      if (last && last.type == "RestElement") {
        --end
      } else if (last && last.type == "SpreadElement") {
        last.type = "RestElement"
        var arg = last.argument
        this.toAssignable(arg, isBinding)
        if (arg.type !== "Identifier" && arg.type !== "MemberExpression" && arg.type !== "ArrayPattern")
          this.unexpected(arg.start)
        --end
      }

      if (isBinding && last && last.type === "RestElement" && last.argument.type !== "Identifier")
        this.unexpected(last.argument.start)
    }
    for (var i = 0; i < end; i++) {
      var elt = exprList[i]
      if (elt) this$1.toAssignable(elt, isBinding)
    }
    return exprList
  }

  // Parses spread element.

  pp$2.parseSpread = function(refDestructuringErrors) {
    var node = this.startNode()
    this.next()
    node.argument = this.parseMaybeAssign(false, refDestructuringErrors)
    return this.finishNode(node, "SpreadElement")
  }

  pp$2.parseRest = function(allowNonIdent) {
    var node = this.startNode()
    this.next()

    // RestElement inside of a function parameter must be an identifier
    if (allowNonIdent) node.argument = this.type === tt.name ? this.parseIdent() : this.unexpected()
    else node.argument = this.type === tt.name || this.type === tt.bracketL ? this.parseBindingAtom() : this.unexpected()

    return this.finishNode(node, "RestElement")
  }

  // Parses lvalue (assignable) atom.

  pp$2.parseBindingAtom = function() {
    if (this.options.ecmaVersion < 6) return this.parseIdent()
    switch (this.type) {
    case tt.name:
      return this.parseIdent()

    case tt.bracketL:
      var node = this.startNode()
      this.next()
      node.elements = this.parseBindingList(tt.bracketR, true, true)
      return this.finishNode(node, "ArrayPattern")

    case tt.braceL:
      return this.parseObj(true)

    default:
      this.unexpected()
    }
  }

  pp$2.parseBindingList = function(close, allowEmpty, allowTrailingComma, allowNonIdent) {
    var this$1 = this;

    var elts = [], first = true
    while (!this.eat(close)) {
      if (first) first = false
      else this$1.expect(tt.comma)
      if (allowEmpty && this$1.type === tt.comma) {
        elts.push(null)
      } else if (allowTrailingComma && this$1.afterTrailingComma(close)) {
        break
      } else if (this$1.type === tt.ellipsis) {
        var rest = this$1.parseRest(allowNonIdent)
        this$1.parseBindingListItem(rest)
        elts.push(rest)
        if (this$1.type === tt.comma) this$1.raise(this$1.start, "Comma is not permitted after the rest element")
        this$1.expect(close)
        break
      } else {
        var elem = this$1.parseMaybeDefault(this$1.start, this$1.startLoc)
        this$1.parseBindingListItem(elem)
        elts.push(elem)
      }
    }
    return elts
  }

  pp$2.parseBindingListItem = function(param) {
    return param
  }

  // Parses assignment pattern around given atom if possible.

  pp$2.parseMaybeDefault = function(startPos, startLoc, left) {
    left = left || this.parseBindingAtom()
    if (this.options.ecmaVersion < 6 || !this.eat(tt.eq)) return left
    var node = this.startNodeAt(startPos, startLoc)
    node.left = left
    node.right = this.parseMaybeAssign()
    return this.finishNode(node, "AssignmentPattern")
  }

  // Verify that a node is an lval — something that can be assigned
  // to.

  pp$2.checkLVal = function(expr, isBinding, checkClashes) {
    var this$1 = this;

    switch (expr.type) {
    case "Identifier":
      if (this.strict && this.reservedWordsStrictBind.test(expr.name))
        this.raiseRecoverable(expr.start, (isBinding ? "Binding " : "Assigning to ") + expr.name + " in strict mode")
      if (checkClashes) {
        if (has(checkClashes, expr.name))
          this.raiseRecoverable(expr.start, "Argument name clash")
        checkClashes[expr.name] = true
      }
      break

    case "MemberExpression":
      if (isBinding) this.raiseRecoverable(expr.start, (isBinding ? "Binding" : "Assigning to") + " member expression")
      break

    case "ObjectPattern":
      for (var i = 0; i < expr.properties.length; i++)
        this$1.checkLVal(expr.properties[i].value, isBinding, checkClashes)
      break

    case "ArrayPattern":
      for (var i$1 = 0; i$1 < expr.elements.length; i$1++) {
        var elem = expr.elements[i$1]
        if (elem) this$1.checkLVal(elem, isBinding, checkClashes)
      }
      break

    case "AssignmentPattern":
      this.checkLVal(expr.left, isBinding, checkClashes)
      break

    case "RestElement":
      this.checkLVal(expr.argument, isBinding, checkClashes)
      break

    case "ParenthesizedExpression":
      this.checkLVal(expr.expression, isBinding, checkClashes)
      break

    default:
      this.raise(expr.start, (isBinding ? "Binding" : "Assigning to") + " rvalue")
    }
  }

  var pp$3 = Parser.prototype

  // Check if property name clashes with already added.
  // Object/class getters and setters are not allowed to clash —
  // either with each other or with an init property — and in
  // strict mode, init properties are also not allowed to be repeated.

  pp$3.checkPropClash = function(prop, propHash) {
    if (this.options.ecmaVersion >= 6 && (prop.computed || prop.method || prop.shorthand))
      return
    var key = prop.key;
    var name
    switch (key.type) {
    case "Identifier": name = key.name; break
    case "Literal": name = String(key.value); break
    default: return
    }
    var kind = prop.kind;
    if (this.options.ecmaVersion >= 6) {
      if (name === "__proto__" && kind === "init") {
        if (propHash.proto) this.raiseRecoverable(key.start, "Redefinition of __proto__ property")
        propHash.proto = true
      }
      return
    }
    name = "$" + name
    var other = propHash[name]
    if (other) {
      var isGetSet = kind !== "init"
      if ((this.strict || isGetSet) && other[kind] || !(isGetSet ^ other.init))
        this.raiseRecoverable(key.start, "Redefinition of property")
    } else {
      other = propHash[name] = {
        init: false,
        get: false,
        set: false
      }
    }
    other[kind] = true
  }

  // ### Expression parsing

  // These nest, from the most general expression type at the top to
  // 'atomic', nondivisible expression types at the bottom. Most of
  // the functions will simply let the function(s) below them parse,
  // and, *if* the syntactic construct they handle is present, wrap
  // the AST node that the inner parser gave them in another node.

  // Parse a full expression. The optional arguments are used to
  // forbid the `in` operator (in for loops initalization expressions)
  // and provide reference for storing '=' operator inside shorthand
  // property assignment in contexts where both object expression
  // and object pattern might appear (so it's possible to raise
  // delayed syntax error at correct position).

  pp$3.parseExpression = function(noIn, refDestructuringErrors) {
    var this$1 = this;

    var startPos = this.start, startLoc = this.startLoc
    var expr = this.parseMaybeAssign(noIn, refDestructuringErrors)
    if (this.type === tt.comma) {
      var node = this.startNodeAt(startPos, startLoc)
      node.expressions = [expr]
      while (this.eat(tt.comma)) node.expressions.push(this$1.parseMaybeAssign(noIn, refDestructuringErrors))
      return this.finishNode(node, "SequenceExpression")
    }
    return expr
  }

  // Parse an assignment expression. This includes applications of
  // operators like `+=`.

  pp$3.parseMaybeAssign = function(noIn, refDestructuringErrors, afterLeftParse) {
    if (this.inGenerator && this.isContextual("yield")) return this.parseYield()

    var ownDestructuringErrors = false
    if (!refDestructuringErrors) {
      refDestructuringErrors = new DestructuringErrors
      ownDestructuringErrors = true
    }
    var startPos = this.start, startLoc = this.startLoc
    if (this.type == tt.parenL || this.type == tt.name)
      this.potentialArrowAt = this.start
    var left = this.parseMaybeConditional(noIn, refDestructuringErrors)
    if (afterLeftParse) left = afterLeftParse.call(this, left, startPos, startLoc)
    if (this.type.isAssign) {
      this.checkPatternErrors(refDestructuringErrors, true)
      if (!ownDestructuringErrors) DestructuringErrors.call(refDestructuringErrors)
      var node = this.startNodeAt(startPos, startLoc)
      node.operator = this.value
      node.left = this.type === tt.eq ? this.toAssignable(left) : left
      refDestructuringErrors.shorthandAssign = 0 // reset because shorthand default was used correctly
      this.checkLVal(left)
      this.next()
      node.right = this.parseMaybeAssign(noIn)
      return this.finishNode(node, "AssignmentExpression")
    } else {
      if (ownDestructuringErrors) this.checkExpressionErrors(refDestructuringErrors, true)
    }
    return left
  }

  // Parse a ternary conditional (`?:`) operator.

  pp$3.parseMaybeConditional = function(noIn, refDestructuringErrors) {
    var startPos = this.start, startLoc = this.startLoc
    var expr = this.parseExprOps(noIn, refDestructuringErrors)
    if (this.checkExpressionErrors(refDestructuringErrors)) return expr
    if (this.eat(tt.question)) {
      var node = this.startNodeAt(startPos, startLoc)
      node.test = expr
      node.consequent = this.parseMaybeAssign()
      this.expect(tt.colon)
      node.alternate = this.parseMaybeAssign(noIn)
      return this.finishNode(node, "ConditionalExpression")
    }
    return expr
  }

  // Start the precedence parser.

  pp$3.parseExprOps = function(noIn, refDestructuringErrors) {
    var startPos = this.start, startLoc = this.startLoc
    var expr = this.parseMaybeUnary(refDestructuringErrors, false)
    if (this.checkExpressionErrors(refDestructuringErrors)) return expr
    return this.parseExprOp(expr, startPos, startLoc, -1, noIn)
  }

  // Parse binary operators with the operator precedence parsing
  // algorithm. `left` is the left-hand side of the operator.
  // `minPrec` provides context that allows the function to stop and
  // defer further parser to one of its callers when it encounters an
  // operator that has a lower precedence than the set it is parsing.

  pp$3.parseExprOp = function(left, leftStartPos, leftStartLoc, minPrec, noIn) {
    var prec = this.type.binop
    if (prec != null && (!noIn || this.type !== tt._in)) {
      if (prec > minPrec) {
        var logical = this.type === tt.logicalOR || this.type === tt.logicalAND
        var op = this.value
        this.next()
        var startPos = this.start, startLoc = this.startLoc
        var right = this.parseExprOp(this.parseMaybeUnary(null, false), startPos, startLoc, prec, noIn)
        var node = this.buildBinary(leftStartPos, leftStartLoc, left, right, op, logical)
        return this.parseExprOp(node, leftStartPos, leftStartLoc, minPrec, noIn)
      }
    }
    return left
  }

  pp$3.buildBinary = function(startPos, startLoc, left, right, op, logical) {
    var node = this.startNodeAt(startPos, startLoc)
    node.left = left
    node.operator = op
    node.right = right
    return this.finishNode(node, logical ? "LogicalExpression" : "BinaryExpression")
  }

  // Parse unary operators, both prefix and postfix.

  pp$3.parseMaybeUnary = function(refDestructuringErrors, sawUnary) {
    var this$1 = this;

    var startPos = this.start, startLoc = this.startLoc, expr
    if (this.inAsync && this.isContextual("await")) {
      expr = this.parseAwait(refDestructuringErrors)
      sawUnary = true
    } else if (this.type.prefix) {
      var node = this.startNode(), update = this.type === tt.incDec
      node.operator = this.value
      node.prefix = true
      this.next()
      node.argument = this.parseMaybeUnary(null, true)
      this.checkExpressionErrors(refDestructuringErrors, true)
      if (update) this.checkLVal(node.argument)
      else if (this.strict && node.operator === "delete" &&
               node.argument.type === "Identifier")
        this.raiseRecoverable(node.start, "Deleting local variable in strict mode")
      else sawUnary = true
      expr = this.finishNode(node, update ? "UpdateExpression" : "UnaryExpression")
    } else {
      expr = this.parseExprSubscripts(refDestructuringErrors)
      if (this.checkExpressionErrors(refDestructuringErrors)) return expr
      while (this.type.postfix && !this.canInsertSemicolon()) {
        var node$1 = this$1.startNodeAt(startPos, startLoc)
        node$1.operator = this$1.value
        node$1.prefix = false
        node$1.argument = expr
        this$1.checkLVal(expr)
        this$1.next()
        expr = this$1.finishNode(node$1, "UpdateExpression")
      }
    }

    if (!sawUnary && this.eat(tt.starstar))
      return this.buildBinary(startPos, startLoc, expr, this.parseMaybeUnary(null, false), "**", false)
    else
      return expr
  }

  // Parse call, dot, and `[]`-subscript expressions.

  pp$3.parseExprSubscripts = function(refDestructuringErrors) {
    var startPos = this.start, startLoc = this.startLoc
    var expr = this.parseExprAtom(refDestructuringErrors)
    var skipArrowSubscripts = expr.type === "ArrowFunctionExpression" && this.input.slice(this.lastTokStart, this.lastTokEnd) !== ")"
    if (this.checkExpressionErrors(refDestructuringErrors) || skipArrowSubscripts) return expr
    return this.parseSubscripts(expr, startPos, startLoc)
  }

  pp$3.parseSubscripts = function(base, startPos, startLoc, noCalls) {
    var this$1 = this;

    for (;;) {
      var maybeAsyncArrow = this$1.options.ecmaVersion >= 8 && base.type === "Identifier" && base.name === "async" && !this$1.canInsertSemicolon()
      if (this$1.eat(tt.dot)) {
        var node = this$1.startNodeAt(startPos, startLoc)
        node.object = base
        node.property = this$1.parseIdent(true)
        node.computed = false
        base = this$1.finishNode(node, "MemberExpression")
      } else if (this$1.eat(tt.bracketL)) {
        var node$1 = this$1.startNodeAt(startPos, startLoc)
        node$1.object = base
        node$1.property = this$1.parseExpression()
        node$1.computed = true
        this$1.expect(tt.bracketR)
        base = this$1.finishNode(node$1, "MemberExpression")
      } else if (!noCalls && this$1.eat(tt.parenL)) {
        var refDestructuringErrors = new DestructuringErrors, oldYieldPos = this$1.yieldPos, oldAwaitPos = this$1.awaitPos
        this$1.yieldPos = 0
        this$1.awaitPos = 0
        var exprList = this$1.parseExprList(tt.parenR, this$1.options.ecmaVersion >= 8, false, refDestructuringErrors)
        if (maybeAsyncArrow && !this$1.canInsertSemicolon() && this$1.eat(tt.arrow)) {
          this$1.checkPatternErrors(refDestructuringErrors, true)
          this$1.checkYieldAwaitInDefaultParams()
          this$1.yieldPos = oldYieldPos
          this$1.awaitPos = oldAwaitPos
          return this$1.parseArrowExpression(this$1.startNodeAt(startPos, startLoc), exprList, true)
        }
        this$1.checkExpressionErrors(refDestructuringErrors, true)
        this$1.yieldPos = oldYieldPos || this$1.yieldPos
        this$1.awaitPos = oldAwaitPos || this$1.awaitPos
        var node$2 = this$1.startNodeAt(startPos, startLoc)
        node$2.callee = base
        node$2.arguments = exprList
        base = this$1.finishNode(node$2, "CallExpression")
      } else if (this$1.type === tt.backQuote) {
        var node$3 = this$1.startNodeAt(startPos, startLoc)
        node$3.tag = base
        node$3.quasi = this$1.parseTemplate()
        base = this$1.finishNode(node$3, "TaggedTemplateExpression")
      } else {
        return base
      }
    }
  }

  // Parse an atomic expression — either a single token that is an
  // expression, an expression started by a keyword like `function` or
  // `new`, or an expression wrapped in punctuation like `()`, `[]`,
  // or `{}`.

  pp$3.parseExprAtom = function(refDestructuringErrors) {
    var node, canBeArrow = this.potentialArrowAt == this.start
    switch (this.type) {
    case tt._super:
      if (!this.inFunction)
        this.raise(this.start, "'super' outside of function or class")

    case tt._this:
      var type = this.type === tt._this ? "ThisExpression" : "Super"
      node = this.startNode()
      this.next()
      return this.finishNode(node, type)

    case tt.name:
      var startPos = this.start, startLoc = this.startLoc
      var id = this.parseIdent(this.type !== tt.name)
      if (this.options.ecmaVersion >= 8 && id.name === "async" && !this.canInsertSemicolon() && this.eat(tt._function))
        return this.parseFunction(this.startNodeAt(startPos, startLoc), false, false, true)
      if (canBeArrow && !this.canInsertSemicolon()) {
        if (this.eat(tt.arrow))
          return this.parseArrowExpression(this.startNodeAt(startPos, startLoc), [id], false)
        if (this.options.ecmaVersion >= 8 && id.name === "async" && this.type === tt.name) {
          id = this.parseIdent()
          if (this.canInsertSemicolon() || !this.eat(tt.arrow))
            this.unexpected()
          return this.parseArrowExpression(this.startNodeAt(startPos, startLoc), [id], true)
        }
      }
      return id

    case tt.regexp:
      var value = this.value
      node = this.parseLiteral(value.value)
      node.regex = {pattern: value.pattern, flags: value.flags}
      return node

    case tt.num: case tt.string:
      return this.parseLiteral(this.value)

    case tt._null: case tt._true: case tt._false:
      node = this.startNode()
      node.value = this.type === tt._null ? null : this.type === tt._true
      node.raw = this.type.keyword
      this.next()
      return this.finishNode(node, "Literal")

    case tt.parenL:
      return this.parseParenAndDistinguishExpression(canBeArrow)

    case tt.bracketL:
      node = this.startNode()
      this.next()
      node.elements = this.parseExprList(tt.bracketR, true, true, refDestructuringErrors)
      return this.finishNode(node, "ArrayExpression")

    case tt.braceL:
      return this.parseObj(false, refDestructuringErrors)

    case tt._function:
      node = this.startNode()
      this.next()
      return this.parseFunction(node, false)

    case tt._class:
      return this.parseClass(this.startNode(), false)

    case tt._new:
      return this.parseNew()

    case tt.backQuote:
      return this.parseTemplate()

    default:
      this.unexpected()
    }
  }

  pp$3.parseLiteral = function(value) {
    var node = this.startNode()
    node.value = value
    node.raw = this.input.slice(this.start, this.end)
    this.next()
    return this.finishNode(node, "Literal")
  }

  pp$3.parseParenExpression = function() {
    this.expect(tt.parenL)
    var val = this.parseExpression()
    this.expect(tt.parenR)
    return val
  }

  pp$3.parseParenAndDistinguishExpression = function(canBeArrow) {
    var this$1 = this;

    var startPos = this.start, startLoc = this.startLoc, val, allowTrailingComma = this.options.ecmaVersion >= 8
    if (this.options.ecmaVersion >= 6) {
      this.next()

      var innerStartPos = this.start, innerStartLoc = this.startLoc
      var exprList = [], first = true, lastIsComma = false
      var refDestructuringErrors = new DestructuringErrors, oldYieldPos = this.yieldPos, oldAwaitPos = this.awaitPos, spreadStart, innerParenStart
      this.yieldPos = 0
      this.awaitPos = 0
      while (this.type !== tt.parenR) {
        first ? first = false : this$1.expect(tt.comma)
        if (allowTrailingComma && this$1.afterTrailingComma(tt.parenR, true)) {
          lastIsComma = true
          break
        } else if (this$1.type === tt.ellipsis) {
          spreadStart = this$1.start
          exprList.push(this$1.parseParenItem(this$1.parseRest()))
          if (this$1.type === tt.comma) this$1.raise(this$1.start, "Comma is not permitted after the rest element")
          break
        } else {
          if (this$1.type === tt.parenL && !innerParenStart) {
            innerParenStart = this$1.start
          }
          exprList.push(this$1.parseMaybeAssign(false, refDestructuringErrors, this$1.parseParenItem))
        }
      }
      var innerEndPos = this.start, innerEndLoc = this.startLoc
      this.expect(tt.parenR)

      if (canBeArrow && !this.canInsertSemicolon() && this.eat(tt.arrow)) {
        this.checkPatternErrors(refDestructuringErrors, true)
        this.checkYieldAwaitInDefaultParams()
        if (innerParenStart) this.unexpected(innerParenStart)
        this.yieldPos = oldYieldPos
        this.awaitPos = oldAwaitPos
        return this.parseParenArrowList(startPos, startLoc, exprList)
      }

      if (!exprList.length || lastIsComma) this.unexpected(this.lastTokStart)
      if (spreadStart) this.unexpected(spreadStart)
      this.checkExpressionErrors(refDestructuringErrors, true)
      this.yieldPos = oldYieldPos || this.yieldPos
      this.awaitPos = oldAwaitPos || this.awaitPos

      if (exprList.length > 1) {
        val = this.startNodeAt(innerStartPos, innerStartLoc)
        val.expressions = exprList
        this.finishNodeAt(val, "SequenceExpression", innerEndPos, innerEndLoc)
      } else {
        val = exprList[0]
      }
    } else {
      val = this.parseParenExpression()
    }

    if (this.options.preserveParens) {
      var par = this.startNodeAt(startPos, startLoc)
      par.expression = val
      return this.finishNode(par, "ParenthesizedExpression")
    } else {
      return val
    }
  }

  pp$3.parseParenItem = function(item) {
    return item
  }

  pp$3.parseParenArrowList = function(startPos, startLoc, exprList) {
    return this.parseArrowExpression(this.startNodeAt(startPos, startLoc), exprList)
  }

  // New's precedence is slightly tricky. It must allow its argument to
  // be a `[]` or dot subscript expression, but not a call — at least,
  // not without wrapping it in parentheses. Thus, it uses the noCalls
  // argument to parseSubscripts to prevent it from consuming the
  // argument list.

  var empty$1 = []

  pp$3.parseNew = function() {
    var node = this.startNode()
    var meta = this.parseIdent(true)
    if (this.options.ecmaVersion >= 6 && this.eat(tt.dot)) {
      node.meta = meta
      node.property = this.parseIdent(true)
      if (node.property.name !== "target")
        this.raiseRecoverable(node.property.start, "The only valid meta property for new is new.target")
      if (!this.inFunction)
        this.raiseRecoverable(node.start, "new.target can only be used in functions")
      return this.finishNode(node, "MetaProperty")
    }
    var startPos = this.start, startLoc = this.startLoc
    node.callee = this.parseSubscripts(this.parseExprAtom(), startPos, startLoc, true)
    if (this.eat(tt.parenL)) node.arguments = this.parseExprList(tt.parenR, this.options.ecmaVersion >= 8, false)
    else node.arguments = empty$1
    return this.finishNode(node, "NewExpression")
  }

  // Parse template expression.

  pp$3.parseTemplateElement = function() {
    var elem = this.startNode()
    elem.value = {
      raw: this.input.slice(this.start, this.end).replace(/\r\n?/g, '\n'),
      cooked: this.value
    }
    this.next()
    elem.tail = this.type === tt.backQuote
    return this.finishNode(elem, "TemplateElement")
  }

  pp$3.parseTemplate = function() {
    var this$1 = this;

    var node = this.startNode()
    this.next()
    node.expressions = []
    var curElt = this.parseTemplateElement()
    node.quasis = [curElt]
    while (!curElt.tail) {
      this$1.expect(tt.dollarBraceL)
      node.expressions.push(this$1.parseExpression())
      this$1.expect(tt.braceR)
      node.quasis.push(curElt = this$1.parseTemplateElement())
    }
    this.next()
    return this.finishNode(node, "TemplateLiteral")
  }

  // Parse an object literal or binding pattern.

  pp$3.parseObj = function(isPattern, refDestructuringErrors) {
    var this$1 = this;

    var node = this.startNode(), first = true, propHash = {}
    node.properties = []
    this.next()
    while (!this.eat(tt.braceR)) {
      if (!first) {
        this$1.expect(tt.comma)
        if (this$1.afterTrailingComma(tt.braceR)) break
      } else first = false

      var prop = this$1.startNode(), isGenerator, isAsync, startPos, startLoc
      if (this$1.options.ecmaVersion >= 6) {
        prop.method = false
        prop.shorthand = false
        if (isPattern || refDestructuringErrors) {
          startPos = this$1.start
          startLoc = this$1.startLoc
        }
        if (!isPattern)
          isGenerator = this$1.eat(tt.star)
      }
      this$1.parsePropertyName(prop)
      if (!isPattern && this$1.options.ecmaVersion >= 8 && !isGenerator && !prop.computed &&
          prop.key.type === "Identifier" && prop.key.name === "async" && this$1.type !== tt.parenL &&
          this$1.type !== tt.colon && !this$1.canInsertSemicolon()) {
        isAsync = true
        this$1.parsePropertyName(prop, refDestructuringErrors)
      } else {
        isAsync = false
      }
      this$1.parsePropertyValue(prop, isPattern, isGenerator, isAsync, startPos, startLoc, refDestructuringErrors)
      this$1.checkPropClash(prop, propHash)
      node.properties.push(this$1.finishNode(prop, "Property"))
    }
    return this.finishNode(node, isPattern ? "ObjectPattern" : "ObjectExpression")
  }

  pp$3.parsePropertyValue = function(prop, isPattern, isGenerator, isAsync, startPos, startLoc, refDestructuringErrors) {
    if ((isGenerator || isAsync) && this.type === tt.colon)
      this.unexpected()

    if (this.eat(tt.colon)) {
      prop.value = isPattern ? this.parseMaybeDefault(this.start, this.startLoc) : this.parseMaybeAssign(false, refDestructuringErrors)
      prop.kind = "init"
    } else if (this.options.ecmaVersion >= 6 && this.type === tt.parenL) {
      if (isPattern) this.unexpected()
      prop.kind = "init"
      prop.method = true
      prop.value = this.parseMethod(isGenerator, isAsync)
    } else if (this.options.ecmaVersion >= 5 && !prop.computed && prop.key.type === "Identifier" &&
               (prop.key.name === "get" || prop.key.name === "set") &&
               (this.type != tt.comma && this.type != tt.braceR)) {
      if (isGenerator || isAsync || isPattern) this.unexpected()
      prop.kind = prop.key.name
      this.parsePropertyName(prop)
      prop.value = this.parseMethod(false)
      var paramCount = prop.kind === "get" ? 0 : 1
      if (prop.value.params.length !== paramCount) {
        var start = prop.value.start
        if (prop.kind === "get")
          this.raiseRecoverable(start, "getter should have no params")
        else
          this.raiseRecoverable(start, "setter should have exactly one param")
      } else {
        if (prop.kind === "set" && prop.value.params[0].type === "RestElement")
          this.raiseRecoverable(prop.value.params[0].start, "Setter cannot use rest params")
      }
    } else if (this.options.ecmaVersion >= 6 && !prop.computed && prop.key.type === "Identifier") {
      if (this.keywords.test(prop.key.name) ||
          (this.strict ? this.reservedWordsStrict : this.reservedWords).test(prop.key.name) ||
          (this.inGenerator && prop.key.name == "yield") ||
          (this.inAsync && prop.key.name == "await"))
        this.raiseRecoverable(prop.key.start, "'" + prop.key.name + "' can not be used as shorthand property")
      prop.kind = "init"
      if (isPattern) {
        prop.value = this.parseMaybeDefault(startPos, startLoc, prop.key)
      } else if (this.type === tt.eq && refDestructuringErrors) {
        if (!refDestructuringErrors.shorthandAssign)
          refDestructuringErrors.shorthandAssign = this.start
        prop.value = this.parseMaybeDefault(startPos, startLoc, prop.key)
      } else {
        prop.value = prop.key
      }
      prop.shorthand = true
    } else this.unexpected()
  }

  pp$3.parsePropertyName = function(prop) {
    if (this.options.ecmaVersion >= 6) {
      if (this.eat(tt.bracketL)) {
        prop.computed = true
        prop.key = this.parseMaybeAssign()
        this.expect(tt.bracketR)
        return prop.key
      } else {
        prop.computed = false
      }
    }
    return prop.key = this.type === tt.num || this.type === tt.string ? this.parseExprAtom() : this.parseIdent(true)
  }

  // Initialize empty function node.

  pp$3.initFunction = function(node) {
    node.id = null
    if (this.options.ecmaVersion >= 6) {
      node.generator = false
      node.expression = false
    }
    if (this.options.ecmaVersion >= 8)
      node.async = false
  }

  // Parse object or class method.

  pp$3.parseMethod = function(isGenerator, isAsync) {
    var node = this.startNode(), oldInGen = this.inGenerator, oldInAsync = this.inAsync, oldYieldPos = this.yieldPos, oldAwaitPos = this.awaitPos

    this.initFunction(node)
    if (this.options.ecmaVersion >= 6)
      node.generator = isGenerator
    if (this.options.ecmaVersion >= 8)
      node.async = !!isAsync

    this.inGenerator = node.generator
    this.inAsync = node.async
    this.yieldPos = 0
    this.awaitPos = 0

    this.expect(tt.parenL)
    node.params = this.parseBindingList(tt.parenR, false, this.options.ecmaVersion >= 8)
    this.checkYieldAwaitInDefaultParams()
    this.parseFunctionBody(node, false)

    this.inGenerator = oldInGen
    this.inAsync = oldInAsync
    this.yieldPos = oldYieldPos
    this.awaitPos = oldAwaitPos
    return this.finishNode(node, "FunctionExpression")
  }

  // Parse arrow function expression with given parameters.

  pp$3.parseArrowExpression = function(node, params, isAsync) {
    var oldInGen = this.inGenerator, oldInAsync = this.inAsync, oldYieldPos = this.yieldPos, oldAwaitPos = this.awaitPos

    this.initFunction(node)
    if (this.options.ecmaVersion >= 8)
      node.async = !!isAsync

    this.inGenerator = false
    this.inAsync = node.async
    this.yieldPos = 0
    this.awaitPos = 0

    node.params = this.toAssignableList(params, true)
    this.parseFunctionBody(node, true)

    this.inGenerator = oldInGen
    this.inAsync = oldInAsync
    this.yieldPos = oldYieldPos
    this.awaitPos = oldAwaitPos
    return this.finishNode(node, "ArrowFunctionExpression")
  }

  // Parse function body and check parameters.

  pp$3.parseFunctionBody = function(node, isArrowFunction) {
    var isExpression = isArrowFunction && this.type !== tt.braceL

    if (isExpression) {
      node.body = this.parseMaybeAssign()
      node.expression = true
    } else {
      // Start a new scope with regard to labels and the `inFunction`
      // flag (restore them to their old value afterwards).
      var oldInFunc = this.inFunction, oldLabels = this.labels
      this.inFunction = true; this.labels = []
      node.body = this.parseBlock(true)
      node.expression = false
      this.inFunction = oldInFunc; this.labels = oldLabels
    }

    // If this is a strict mode function, verify that argument names
    // are not repeated, and it does not try to bind the words `eval`
    // or `arguments`.
    var useStrict = (!isExpression && node.body.body.length && this.isUseStrict(node.body.body[0])) ? node.body.body[0] : null
    if (useStrict && this.options.ecmaVersion >= 7 && !this.isSimpleParamList(node.params))
      this.raiseRecoverable(useStrict.start, "Illegal 'use strict' directive in function with non-simple parameter list")

    if (this.strict || useStrict) {
      var oldStrict = this.strict
      this.strict = true
      if (node.id)
        this.checkLVal(node.id, true)
      this.checkParams(node)
      this.strict = oldStrict
    } else if (isArrowFunction || !this.isSimpleParamList(node.params)) {
      this.checkParams(node)
    }
  }

  pp$3.isSimpleParamList = function(params) {
    for (var i = 0; i < params.length; i++)
      if (params[i].type !== "Identifier") return false
    return true
  }

  // Checks function params for various disallowed patterns such as using "eval"
  // or "arguments" and duplicate parameters.

  pp$3.checkParams = function(node) {
    var this$1 = this;

    var nameHash = {}
    for (var i = 0; i < node.params.length; i++) this$1.checkLVal(node.params[i], true, nameHash)
  }

  // Parses a comma-separated list of expressions, and returns them as
  // an array. `close` is the token type that ends the list, and
  // `allowEmpty` can be turned on to allow subsequent commas with
  // nothing in between them to be parsed as `null` (which is needed
  // for array literals).

  pp$3.parseExprList = function(close, allowTrailingComma, allowEmpty, refDestructuringErrors) {
    var this$1 = this;

    var elts = [], first = true
    while (!this.eat(close)) {
      if (!first) {
        this$1.expect(tt.comma)
        if (allowTrailingComma && this$1.afterTrailingComma(close)) break
      } else first = false

      var elt
      if (allowEmpty && this$1.type === tt.comma)
        elt = null
      else if (this$1.type === tt.ellipsis) {
        elt = this$1.parseSpread(refDestructuringErrors)
        if (this$1.type === tt.comma && refDestructuringErrors && !refDestructuringErrors.trailingComma) {
          refDestructuringErrors.trailingComma = this$1.start
        }
      } else
        elt = this$1.parseMaybeAssign(false, refDestructuringErrors)
      elts.push(elt)
    }
    return elts
  }

  // Parse the next token as an identifier. If `liberal` is true (used
  // when parsing properties), it will also convert keywords into
  // identifiers.

  pp$3.parseIdent = function(liberal) {
    var node = this.startNode()
    if (liberal && this.options.allowReserved == "never") liberal = false
    if (this.type === tt.name) {
      if (!liberal && (this.strict ? this.reservedWordsStrict : this.reservedWords).test(this.value) &&
          (this.options.ecmaVersion >= 6 ||
           this.input.slice(this.start, this.end).indexOf("\\") == -1))
        this.raiseRecoverable(this.start, "The keyword '" + this.value + "' is reserved")
      if (this.inGenerator && this.value === "yield")
        this.raiseRecoverable(this.start, "Can not use 'yield' as identifier inside a generator")
      if (this.inAsync && this.value === "await")
        this.raiseRecoverable(this.start, "Can not use 'await' as identifier inside an async function")
      node.name = this.value
    } else if (liberal && this.type.keyword) {
      node.name = this.type.keyword
    } else {
      this.unexpected()
    }
    this.next()
    return this.finishNode(node, "Identifier")
  }

  // Parses yield expression inside generator.

  pp$3.parseYield = function() {
    if (!this.yieldPos) this.yieldPos = this.start

    var node = this.startNode()
    this.next()
    if (this.type == tt.semi || this.canInsertSemicolon() || (this.type != tt.star && !this.type.startsExpr)) {
      node.delegate = false
      node.argument = null
    } else {
      node.delegate = this.eat(tt.star)
      node.argument = this.parseMaybeAssign()
    }
    return this.finishNode(node, "YieldExpression")
  }

  pp$3.parseAwait = function() {
    if (!this.awaitPos) this.awaitPos = this.start

    var node = this.startNode()
    this.next()
    node.argument = this.parseMaybeUnary(null, true)
    return this.finishNode(node, "AwaitExpression")
  }

  var pp$4 = Parser.prototype

  // This function is used to raise exceptions on parse errors. It
  // takes an offset integer (into the current `input`) to indicate
  // the location of the error, attaches the position to the end
  // of the error message, and then raises a `SyntaxError` with that
  // message.

  pp$4.raise = function(pos, message) {
    var loc = getLineInfo(this.input, pos)
    message += " (" + loc.line + ":" + loc.column + ")"
    var err = new SyntaxError(message)
    err.pos = pos; err.loc = loc; err.raisedAt = this.pos
    throw err
  }

  pp$4.raiseRecoverable = pp$4.raise

  pp$4.curPosition = function() {
    if (this.options.locations) {
      return new Position(this.curLine, this.pos - this.lineStart)
    }
  }

  var Node = function Node(parser, pos, loc) {
    this.type = ""
    this.start = pos
    this.end = 0
    if (parser.options.locations)
      this.loc = new SourceLocation(parser, loc)
    if (parser.options.directSourceFile)
      this.sourceFile = parser.options.directSourceFile
    if (parser.options.ranges)
      this.range = [pos, 0]
  };

  // Start an AST node, attaching a start offset.

  var pp$5 = Parser.prototype

  pp$5.startNode = function() {
    return new Node(this, this.start, this.startLoc)
  }

  pp$5.startNodeAt = function(pos, loc) {
    return new Node(this, pos, loc)
  }

  // Finish an AST node, adding `type` and `end` properties.

  function finishNodeAt(node, type, pos, loc) {
    node.type = type
    node.end = pos
    if (this.options.locations)
      node.loc.end = loc
    if (this.options.ranges)
      node.range[1] = pos
    return node
  }

  pp$5.finishNode = function(node, type) {
    return finishNodeAt.call(this, node, type, this.lastTokEnd, this.lastTokEndLoc)
  }

  // Finish node at given position

  pp$5.finishNodeAt = function(node, type, pos, loc) {
    return finishNodeAt.call(this, node, type, pos, loc)
  }

  var TokContext = function TokContext(token, isExpr, preserveSpace, override) {
    this.token = token
    this.isExpr = !!isExpr
    this.preserveSpace = !!preserveSpace
    this.override = override
  };

  var types = {
    b_stat: new TokContext("{", false),
    b_expr: new TokContext("{", true),
    b_tmpl: new TokContext("${", true),
    p_stat: new TokContext("(", false),
    p_expr: new TokContext("(", true),
    q_tmpl: new TokContext("`", true, true, function (p) { return p.readTmplToken(); }),
    f_expr: new TokContext("function", true)
  }

  var pp$6 = Parser.prototype

  pp$6.initialContext = function() {
    return [types.b_stat]
  }

  pp$6.braceIsBlock = function(prevType) {
    if (prevType === tt.colon) {
      var parent = this.curContext()
      if (parent === types.b_stat || parent === types.b_expr)
        return !parent.isExpr
    }
    if (prevType === tt._return)
      return lineBreak.test(this.input.slice(this.lastTokEnd, this.start))
    if (prevType === tt._else || prevType === tt.semi || prevType === tt.eof || prevType === tt.parenR)
      return true
    if (prevType == tt.braceL)
      return this.curContext() === types.b_stat
    return !this.exprAllowed
  }

  pp$6.updateContext = function(prevType) {
    var update, type = this.type
    if (type.keyword && prevType == tt.dot)
      this.exprAllowed = false
    else if (update = type.updateContext)
      update.call(this, prevType)
    else
      this.exprAllowed = type.beforeExpr
  }

  // Token-specific context update code

  tt.parenR.updateContext = tt.braceR.updateContext = function() {
    if (this.context.length == 1) {
      this.exprAllowed = true
      return
    }
    var out = this.context.pop()
    if (out === types.b_stat && this.curContext() === types.f_expr) {
      this.context.pop()
      this.exprAllowed = false
    } else if (out === types.b_tmpl) {
      this.exprAllowed = true
    } else {
      this.exprAllowed = !out.isExpr
    }
  }

  tt.braceL.updateContext = function(prevType) {
    this.context.push(this.braceIsBlock(prevType) ? types.b_stat : types.b_expr)
    this.exprAllowed = true
  }

  tt.dollarBraceL.updateContext = function() {
    this.context.push(types.b_tmpl)
    this.exprAllowed = true
  }

  tt.parenL.updateContext = function(prevType) {
    var statementParens = prevType === tt._if || prevType === tt._for || prevType === tt._with || prevType === tt._while
    this.context.push(statementParens ? types.p_stat : types.p_expr)
    this.exprAllowed = true
  }

  tt.incDec.updateContext = function() {
    // tokExprAllowed stays unchanged
  }

  tt._function.updateContext = function(prevType) {
    if (prevType.beforeExpr && prevType !== tt.semi && prevType !== tt._else &&
        !((prevType === tt.colon || prevType === tt.braceL) && this.curContext() === types.b_stat))
      this.context.push(types.f_expr)
    this.exprAllowed = false
  }

  tt.backQuote.updateContext = function() {
    if (this.curContext() === types.q_tmpl)
      this.context.pop()
    else
      this.context.push(types.q_tmpl)
    this.exprAllowed = false
  }

  // Object type used to represent tokens. Note that normally, tokens
  // simply exist as properties on the parser object. This is only
  // used for the onToken callback and the external tokenizer.

  var Token = function Token(p) {
    this.type = p.type
    this.value = p.value
    this.start = p.start
    this.end = p.end
    if (p.options.locations)
      this.loc = new SourceLocation(p, p.startLoc, p.endLoc)
    if (p.options.ranges)
      this.range = [p.start, p.end]
  };

  // ## Tokenizer

  var pp$7 = Parser.prototype

  // Are we running under Rhino?
  var isRhino = typeof Packages == "object" && Object.prototype.toString.call(Packages) == "[object JavaPackage]"

  // Move to the next token

  pp$7.next = function() {
    if (this.options.onToken)
      this.options.onToken(new Token(this))

    this.lastTokEnd = this.end
    this.lastTokStart = this.start
    this.lastTokEndLoc = this.endLoc
    this.lastTokStartLoc = this.startLoc
    this.nextToken()
  }

  pp$7.getToken = function() {
    this.next()
    return new Token(this)
  }

  // If we're in an ES6 environment, make parsers iterable
  if (typeof Symbol !== "undefined")
    pp$7[Symbol.iterator] = function () {
      var self = this
      return {next: function () {
        var token = self.getToken()
        return {
          done: token.type === tt.eof,
          value: token
        }
      }}
    }

  // Toggle strict mode. Re-reads the next number or string to please
  // pedantic tests (`"use strict"; 010;` should fail).

  pp$7.setStrict = function(strict) {
    var this$1 = this;

    this.strict = strict
    if (this.type !== tt.num && this.type !== tt.string) return
    this.pos = this.start
    if (this.options.locations) {
      while (this.pos < this.lineStart) {
        this$1.lineStart = this$1.input.lastIndexOf("\n", this$1.lineStart - 2) + 1
        --this$1.curLine
      }
    }
    this.nextToken()
  }

  pp$7.curContext = function() {
    return this.context[this.context.length - 1]
  }

  // Read a single token, updating the parser object's token-related
  // properties.

  pp$7.nextToken = function() {
    var curContext = this.curContext()
    if (!curContext || !curContext.preserveSpace) this.skipSpace()

    this.start = this.pos
    if (this.options.locations) this.startLoc = this.curPosition()
    if (this.pos >= this.input.length) return this.finishToken(tt.eof)

    if (curContext.override) return curContext.override(this)
    else this.readToken(this.fullCharCodeAtPos())
  }

  pp$7.readToken = function(code) {
    // Identifier or keyword. '\uXXXX' sequences are allowed in
    // identifiers, so '\' also dispatches to that.
    if (isIdentifierStart(code, this.options.ecmaVersion >= 6) || code === 92 /* '\' */)
      return this.readWord()

    return this.getTokenFromCode(code)
  }

  pp$7.fullCharCodeAtPos = function() {
    var code = this.input.charCodeAt(this.pos)
    if (code <= 0xd7ff || code >= 0xe000) return code
    var next = this.input.charCodeAt(this.pos + 1)
    return (code << 10) + next - 0x35fdc00
  }

  pp$7.skipBlockComment = function() {
    var this$1 = this;

    var startLoc = this.options.onComment && this.curPosition()
    var start = this.pos, end = this.input.indexOf("*/", this.pos += 2)
    if (end === -1) this.raise(this.pos - 2, "Unterminated comment")
    this.pos = end + 2
    if (this.options.locations) {
      lineBreakG.lastIndex = start
      var match
      while ((match = lineBreakG.exec(this.input)) && match.index < this.pos) {
        ++this$1.curLine
        this$1.lineStart = match.index + match[0].length
      }
    }
    if (this.options.onComment)
      this.options.onComment(true, this.input.slice(start + 2, end), start, this.pos,
                             startLoc, this.curPosition())
  }

  pp$7.skipLineComment = function(startSkip) {
    var this$1 = this;

    var start = this.pos
    var startLoc = this.options.onComment && this.curPosition()
    var ch = this.input.charCodeAt(this.pos+=startSkip)
    while (this.pos < this.input.length && ch !== 10 && ch !== 13 && ch !== 8232 && ch !== 8233) {
      ++this$1.pos
      ch = this$1.input.charCodeAt(this$1.pos)
    }
    if (this.options.onComment)
      this.options.onComment(false, this.input.slice(start + startSkip, this.pos), start, this.pos,
                             startLoc, this.curPosition())
  }

  // Called at the start of the parse and after every token. Skips
  // whitespace and comments, and.

  pp$7.skipSpace = function() {
    var this$1 = this;

    loop: while (this.pos < this.input.length) {
      var ch = this$1.input.charCodeAt(this$1.pos)
      switch (ch) {
        case 32: case 160: // ' '
          ++this$1.pos
          break
        case 13:
          if (this$1.input.charCodeAt(this$1.pos + 1) === 10) {
            ++this$1.pos
          }
        case 10: case 8232: case 8233:
          ++this$1.pos
          if (this$1.options.locations) {
            ++this$1.curLine
            this$1.lineStart = this$1.pos
          }
          break
        case 47: // '/'
          switch (this$1.input.charCodeAt(this$1.pos + 1)) {
            case 42: // '*'
              this$1.skipBlockComment()
              break
            case 47:
              this$1.skipLineComment(2)
              break
            default:
              break loop
          }
          break
        default:
          if (ch > 8 && ch < 14 || ch >= 5760 && nonASCIIwhitespace.test(String.fromCharCode(ch))) {
            ++this$1.pos
          } else {
            break loop
          }
      }
    }
  }

  // Called at the end of every token. Sets `end`, `val`, and
  // maintains `context` and `exprAllowed`, and skips the space after
  // the token, so that the next one's `start` will point at the
  // right position.

  pp$7.finishToken = function(type, val) {
    this.end = this.pos
    if (this.options.locations) this.endLoc = this.curPosition()
    var prevType = this.type
    this.type = type
    this.value = val

    this.updateContext(prevType)
  }

  // ### Token reading

  // This is the function that is called to fetch the next token. It
  // is somewhat obscure, because it works in character codes rather
  // than characters, and because operator parsing has been inlined
  // into it.
  //
  // All in the name of speed.
  //
  pp$7.readToken_dot = function() {
    var next = this.input.charCodeAt(this.pos + 1)
    if (next >= 48 && next <= 57) return this.readNumber(true)
    var next2 = this.input.charCodeAt(this.pos + 2)
    if (this.options.ecmaVersion >= 6 && next === 46 && next2 === 46) { // 46 = dot '.'
      this.pos += 3
      return this.finishToken(tt.ellipsis)
    } else {
      ++this.pos
      return this.finishToken(tt.dot)
    }
  }

  pp$7.readToken_slash = function() { // '/'
    var next = this.input.charCodeAt(this.pos + 1)
    if (this.exprAllowed) {++this.pos; return this.readRegexp()}
    if (next === 61) return this.finishOp(tt.assign, 2)
    return this.finishOp(tt.slash, 1)
  }

  pp$7.readToken_mult_modulo_exp = function(code) { // '%*'
    var next = this.input.charCodeAt(this.pos + 1)
    var size = 1
    var tokentype = code === 42 ? tt.star : tt.modulo

    // exponentiation operator ** and **=
    if (this.options.ecmaVersion >= 7 && next === 42) {
      ++size
      tokentype = tt.starstar
      next = this.input.charCodeAt(this.pos + 2)
    }

    if (next === 61) return this.finishOp(tt.assign, size + 1)
    return this.finishOp(tokentype, size)
  }

  pp$7.readToken_pipe_amp = function(code) { // '|&'
    var next = this.input.charCodeAt(this.pos + 1)
    if (next === code) return this.finishOp(code === 124 ? tt.logicalOR : tt.logicalAND, 2)
    if (next === 61) return this.finishOp(tt.assign, 2)
    return this.finishOp(code === 124 ? tt.bitwiseOR : tt.bitwiseAND, 1)
  }

  pp$7.readToken_caret = function() { // '^'
    var next = this.input.charCodeAt(this.pos + 1)
    if (next === 61) return this.finishOp(tt.assign, 2)
    return this.finishOp(tt.bitwiseXOR, 1)
  }

  pp$7.readToken_plus_min = function(code) { // '+-'
    var next = this.input.charCodeAt(this.pos + 1)
    if (next === code) {
      if (next == 45 && this.input.charCodeAt(this.pos + 2) == 62 &&
          lineBreak.test(this.input.slice(this.lastTokEnd, this.pos))) {
        // A `-->` line comment
        this.skipLineComment(3)
        this.skipSpace()
        return this.nextToken()
      }
      return this.finishOp(tt.incDec, 2)
    }
    if (next === 61) return this.finishOp(tt.assign, 2)
    return this.finishOp(tt.plusMin, 1)
  }

  pp$7.readToken_lt_gt = function(code) { // '<>'
    var next = this.input.charCodeAt(this.pos + 1)
    var size = 1
    if (next === code) {
      size = code === 62 && this.input.charCodeAt(this.pos + 2) === 62 ? 3 : 2
      if (this.input.charCodeAt(this.pos + size) === 61) return this.finishOp(tt.assign, size + 1)
      return this.finishOp(tt.bitShift, size)
    }
    if (next == 33 && code == 60 && this.input.charCodeAt(this.pos + 2) == 45 &&
        this.input.charCodeAt(this.pos + 3) == 45) {
      if (this.inModule) this.unexpected()
      // `<!--`, an XML-style comment that should be interpreted as a line comment
      this.skipLineComment(4)
      this.skipSpace()
      return this.nextToken()
    }
    if (next === 61) size = 2
    return this.finishOp(tt.relational, size)
  }

  pp$7.readToken_eq_excl = function(code) { // '=!'
    var next = this.input.charCodeAt(this.pos + 1)
    if (next === 61) return this.finishOp(tt.equality, this.input.charCodeAt(this.pos + 2) === 61 ? 3 : 2)
    if (code === 61 && next === 62 && this.options.ecmaVersion >= 6) { // '=>'
      this.pos += 2
      return this.finishToken(tt.arrow)
    }
    return this.finishOp(code === 61 ? tt.eq : tt.prefix, 1)
  }

  pp$7.getTokenFromCode = function(code) {
    switch (code) {
      // The interpretation of a dot depends on whether it is followed
      // by a digit or another two dots.
    case 46: // '.'
      return this.readToken_dot()

      // Punctuation tokens.
    case 40: ++this.pos; return this.finishToken(tt.parenL)
    case 41: ++this.pos; return this.finishToken(tt.parenR)
    case 59: ++this.pos; return this.finishToken(tt.semi)
    case 44: ++this.pos; return this.finishToken(tt.comma)
    case 91: ++this.pos; return this.finishToken(tt.bracketL)
    case 93: ++this.pos; return this.finishToken(tt.bracketR)
    case 123: ++this.pos; return this.finishToken(tt.braceL)
    case 125: ++this.pos; return this.finishToken(tt.braceR)
    case 58: ++this.pos; return this.finishToken(tt.colon)
    case 63: ++this.pos; return this.finishToken(tt.question)

    case 96: // '`'
      if (this.options.ecmaVersion < 6) break
      ++this.pos
      return this.finishToken(tt.backQuote)

    case 48: // '0'
      var next = this.input.charCodeAt(this.pos + 1)
      if (next === 120 || next === 88) return this.readRadixNumber(16) // '0x', '0X' - hex number
      if (this.options.ecmaVersion >= 6) {
        if (next === 111 || next === 79) return this.readRadixNumber(8) // '0o', '0O' - octal number
        if (next === 98 || next === 66) return this.readRadixNumber(2) // '0b', '0B' - binary number
      }
      // Anything else beginning with a digit is an integer, octal
      // number, or float.
    case 49: case 50: case 51: case 52: case 53: case 54: case 55: case 56: case 57: // 1-9
      return this.readNumber(false)

      // Quotes produce strings.
    case 34: case 39: // '"', "'"
      return this.readString(code)

      // Operators are parsed inline in tiny state machines. '=' (61) is
      // often referred to. `finishOp` simply skips the amount of
      // characters it is given as second argument, and returns a token
      // of the type given by its first argument.

    case 47: // '/'
      return this.readToken_slash()

    case 37: case 42: // '%*'
      return this.readToken_mult_modulo_exp(code)

    case 124: case 38: // '|&'
      return this.readToken_pipe_amp(code)

    case 94: // '^'
      return this.readToken_caret()

    case 43: case 45: // '+-'
      return this.readToken_plus_min(code)

    case 60: case 62: // '<>'
      return this.readToken_lt_gt(code)

    case 61: case 33: // '=!'
      return this.readToken_eq_excl(code)

    case 126: // '~'
      return this.finishOp(tt.prefix, 1)
    }

    this.raise(this.pos, "Unexpected character '" + codePointToString(code) + "'")
  }

  pp$7.finishOp = function(type, size) {
    var str = this.input.slice(this.pos, this.pos + size)
    this.pos += size
    return this.finishToken(type, str)
  }

  // Parse a regular expression. Some context-awareness is necessary,
  // since a '/' inside a '[]' set does not end the expression.

  function tryCreateRegexp(src, flags, throwErrorAt, parser) {
    try {
      return new RegExp(src, flags)
    } catch (e) {
      if (throwErrorAt !== undefined) {
        if (e instanceof SyntaxError) parser.raise(throwErrorAt, "Error parsing regular expression: " + e.message)
        throw e
      }
    }
  }

  var regexpUnicodeSupport = !!tryCreateRegexp("\uffff", "u")

  pp$7.readRegexp = function() {
    var this$1 = this;

    var escaped, inClass, start = this.pos
    for (;;) {
      if (this$1.pos >= this$1.input.length) this$1.raise(start, "Unterminated regular expression")
      var ch = this$1.input.charAt(this$1.pos)
      if (lineBreak.test(ch)) this$1.raise(start, "Unterminated regular expression")
      if (!escaped) {
        if (ch === "[") inClass = true
        else if (ch === "]" && inClass) inClass = false
        else if (ch === "/" && !inClass) break
        escaped = ch === "\\"
      } else escaped = false
      ++this$1.pos
    }
    var content = this.input.slice(start, this.pos)
    ++this.pos
    // Need to use `readWord1` because '\uXXXX' sequences are allowed
    // here (don't ask).
    var mods = this.readWord1()
    var tmp = content, tmpFlags = ""
    if (mods) {
      var validFlags = /^[gim]*$/
      if (this.options.ecmaVersion >= 6) validFlags = /^[gimuy]*$/
      if (!validFlags.test(mods)) this.raise(start, "Invalid regular expression flag")
      if (mods.indexOf("u") >= 0) {
        if (regexpUnicodeSupport) {
          tmpFlags = "u"
        } else {
          // Replace each astral symbol and every Unicode escape sequence that
          // possibly represents an astral symbol or a paired surrogate with a
          // single ASCII symbol to avoid throwing on regular expressions that
          // are only valid in combination with the `/u` flag.
          // Note: replacing with the ASCII symbol `x` might cause false
          // negatives in unlikely scenarios. For example, `[\u{61}-b]` is a
          // perfectly valid pattern that is equivalent to `[a-b]`, but it would
          // be replaced by `[x-b]` which throws an error.
          tmp = tmp.replace(/\\u\{([0-9a-fA-F]+)\}/g, function (_match, code, offset) {
            code = Number("0x" + code)
            if (code > 0x10FFFF) this$1.raise(start + offset + 3, "Code point out of bounds")
            return "x"
          })
          tmp = tmp.replace(/\\u([a-fA-F0-9]{4})|[\uD800-\uDBFF][\uDC00-\uDFFF]/g, "x")
          tmpFlags = tmpFlags.replace("u", "")
        }
      }
    }
    // Detect invalid regular expressions.
    var value = null
    // Rhino's regular expression parser is flaky and throws uncatchable exceptions,
    // so don't do detection if we are running under Rhino
    if (!isRhino) {
      tryCreateRegexp(tmp, tmpFlags, start, this)
      // Get a regular expression object for this pattern-flag pair, or `null` in
      // case the current environment doesn't support the flags it uses.
      value = tryCreateRegexp(content, mods)
    }
    return this.finishToken(tt.regexp, {pattern: content, flags: mods, value: value})
  }

  // Read an integer in the given radix. Return null if zero digits
  // were read, the integer value otherwise. When `len` is given, this
  // will return `null` unless the integer has exactly `len` digits.

  pp$7.readInt = function(radix, len) {
    var this$1 = this;

    var start = this.pos, total = 0
    for (var i = 0, e = len == null ? Infinity : len; i < e; ++i) {
      var code = this$1.input.charCodeAt(this$1.pos), val
      if (code >= 97) val = code - 97 + 10 // a
      else if (code >= 65) val = code - 65 + 10 // A
      else if (code >= 48 && code <= 57) val = code - 48 // 0-9
      else val = Infinity
      if (val >= radix) break
      ++this$1.pos
      total = total * radix + val
    }
    if (this.pos === start || len != null && this.pos - start !== len) return null

    return total
  }

  pp$7.readRadixNumber = function(radix) {
    this.pos += 2 // 0x
    var val = this.readInt(radix)
    if (val == null) this.raise(this.start + 2, "Expected number in radix " + radix)
    if (isIdentifierStart(this.fullCharCodeAtPos())) this.raise(this.pos, "Identifier directly after number")
    return this.finishToken(tt.num, val)
  }

  // Read an integer, octal integer, or floating-point number.

  pp$7.readNumber = function(startsWithDot) {
    var start = this.pos, isFloat = false, octal = this.input.charCodeAt(this.pos) === 48
    if (!startsWithDot && this.readInt(10) === null) this.raise(start, "Invalid number")
    if (octal && this.pos == start + 1) octal = false
    var next = this.input.charCodeAt(this.pos)
    if (next === 46 && !octal) { // '.'
      ++this.pos
      this.readInt(10)
      isFloat = true
      next = this.input.charCodeAt(this.pos)
    }
    if ((next === 69 || next === 101) && !octal) { // 'eE'
      next = this.input.charCodeAt(++this.pos)
      if (next === 43 || next === 45) ++this.pos // '+-'
      if (this.readInt(10) === null) this.raise(start, "Invalid number")
      isFloat = true
    }
    if (isIdentifierStart(this.fullCharCodeAtPos())) this.raise(this.pos, "Identifier directly after number")

    var str = this.input.slice(start, this.pos), val
    if (isFloat) val = parseFloat(str)
    else if (!octal || str.length === 1) val = parseInt(str, 10)
    else if (/[89]/.test(str) || this.strict) this.raise(start, "Invalid number")
    else val = parseInt(str, 8)
    return this.finishToken(tt.num, val)
  }

  // Read a string value, interpreting backslash-escapes.

  pp$7.readCodePoint = function() {
    var ch = this.input.charCodeAt(this.pos), code

    if (ch === 123) {
      if (this.options.ecmaVersion < 6) this.unexpected()
      var codePos = ++this.pos
      code = this.readHexChar(this.input.indexOf('}', this.pos) - this.pos)
      ++this.pos
      if (code > 0x10FFFF) this.raise(codePos, "Code point out of bounds")
    } else {
      code = this.readHexChar(4)
    }
    return code
  }

  function codePointToString(code) {
    // UTF-16 Decoding
    if (code <= 0xFFFF) return String.fromCharCode(code)
    code -= 0x10000
    return String.fromCharCode((code >> 10) + 0xD800, (code & 1023) + 0xDC00)
  }

  pp$7.readString = function(quote) {
    var this$1 = this;

    var out = "", chunkStart = ++this.pos
    for (;;) {
      if (this$1.pos >= this$1.input.length) this$1.raise(this$1.start, "Unterminated string constant")
      var ch = this$1.input.charCodeAt(this$1.pos)
      if (ch === quote) break
      if (ch === 92) { // '\'
        out += this$1.input.slice(chunkStart, this$1.pos)
        out += this$1.readEscapedChar(false)
        chunkStart = this$1.pos
      } else {
        if (isNewLine(ch)) this$1.raise(this$1.start, "Unterminated string constant")
        ++this$1.pos
      }
    }
    out += this.input.slice(chunkStart, this.pos++)
    return this.finishToken(tt.string, out)
  }

  // Reads template string tokens.

  pp$7.readTmplToken = function() {
    var this$1 = this;

    var out = "", chunkStart = this.pos
    for (;;) {
      if (this$1.pos >= this$1.input.length) this$1.raise(this$1.start, "Unterminated template")
      var ch = this$1.input.charCodeAt(this$1.pos)
      if (ch === 96 || ch === 36 && this$1.input.charCodeAt(this$1.pos + 1) === 123) { // '`', '${'
        if (this$1.pos === this$1.start && this$1.type === tt.template) {
          if (ch === 36) {
            this$1.pos += 2
            return this$1.finishToken(tt.dollarBraceL)
          } else {
            ++this$1.pos
            return this$1.finishToken(tt.backQuote)
          }
        }
        out += this$1.input.slice(chunkStart, this$1.pos)
        return this$1.finishToken(tt.template, out)
      }
      if (ch === 92) { // '\'
        out += this$1.input.slice(chunkStart, this$1.pos)
        out += this$1.readEscapedChar(true)
        chunkStart = this$1.pos
      } else if (isNewLine(ch)) {
        out += this$1.input.slice(chunkStart, this$1.pos)
        ++this$1.pos
        switch (ch) {
          case 13:
            if (this$1.input.charCodeAt(this$1.pos) === 10) ++this$1.pos
          case 10:
            out += "\n"
            break
          default:
            out += String.fromCharCode(ch)
            break
        }
        if (this$1.options.locations) {
          ++this$1.curLine
          this$1.lineStart = this$1.pos
        }
        chunkStart = this$1.pos
      } else {
        ++this$1.pos
      }
    }
  }

  // Used to read escaped characters

  pp$7.readEscapedChar = function(inTemplate) {
    var ch = this.input.charCodeAt(++this.pos)
    ++this.pos
    switch (ch) {
    case 110: return "\n" // 'n' -> '\n'
    case 114: return "\r" // 'r' -> '\r'
    case 120: return String.fromCharCode(this.readHexChar(2)) // 'x'
    case 117: return codePointToString(this.readCodePoint()) // 'u'
    case 116: return "\t" // 't' -> '\t'
    case 98: return "\b" // 'b' -> '\b'
    case 118: return "\u000b" // 'v' -> '\u000b'
    case 102: return "\f" // 'f' -> '\f'
    case 13: if (this.input.charCodeAt(this.pos) === 10) ++this.pos // '\r\n'
    case 10: // ' \n'
      if (this.options.locations) { this.lineStart = this.pos; ++this.curLine }
      return ""
    default:
      if (ch >= 48 && ch <= 55) {
        var octalStr = this.input.substr(this.pos - 1, 3).match(/^[0-7]+/)[0]
        var octal = parseInt(octalStr, 8)
        if (octal > 255) {
          octalStr = octalStr.slice(0, -1)
          octal = parseInt(octalStr, 8)
        }
        if (octalStr !== "0" && (this.strict || inTemplate)) {
          this.raise(this.pos - 2, "Octal literal in strict mode")
        }
        this.pos += octalStr.length - 1
        return String.fromCharCode(octal)
      }
      return String.fromCharCode(ch)
    }
  }

  // Used to read character escape sequences ('\x', '\u', '\U').

  pp$7.readHexChar = function(len) {
    var codePos = this.pos
    var n = this.readInt(16, len)
    if (n === null) this.raise(codePos, "Bad character escape sequence")
    return n
  }

  // Read an identifier, and return it as a string. Sets `this.containsEsc`
  // to whether the word contained a '\u' escape.
  //
  // Incrementally adds only escaped chars, adding other chunks as-is
  // as a micro-optimization.

  pp$7.readWord1 = function() {
    var this$1 = this;

    this.containsEsc = false
    var word = "", first = true, chunkStart = this.pos
    var astral = this.options.ecmaVersion >= 6
    while (this.pos < this.input.length) {
      var ch = this$1.fullCharCodeAtPos()
      if (isIdentifierChar(ch, astral)) {
        this$1.pos += ch <= 0xffff ? 1 : 2
      } else if (ch === 92) { // "\"
        this$1.containsEsc = true
        word += this$1.input.slice(chunkStart, this$1.pos)
        var escStart = this$1.pos
        if (this$1.input.charCodeAt(++this$1.pos) != 117) // "u"
          this$1.raise(this$1.pos, "Expecting Unicode escape sequence \\uXXXX")
        ++this$1.pos
        var esc = this$1.readCodePoint()
        if (!(first ? isIdentifierStart : isIdentifierChar)(esc, astral))
          this$1.raise(escStart, "Invalid Unicode escape")
        word += codePointToString(esc)
        chunkStart = this$1.pos
      } else {
        break
      }
      first = false
    }
    return word + this.input.slice(chunkStart, this.pos)
  }

  // Read an identifier or keyword token. Will check for reserved
  // words when necessary.

  pp$7.readWord = function() {
    var word = this.readWord1()
    var type = tt.name
    if ((this.options.ecmaVersion >= 6 || !this.containsEsc) && this.keywords.test(word))
      type = keywordTypes[word]
    return this.finishToken(type, word)
  }

  var version = "4.0.3"

  // The main exported interface (under `self.acorn` when in the
  // browser) is a `parse` function that takes a code string and
  // returns an abstract syntax tree as specified by [Mozilla parser
  // API][api].
  //
  // [api]: https://developer.mozilla.org/en-US/docs/SpiderMonkey/Parser_API

  function parse(input, options) {
    return new Parser(options, input).parse()
  }

  // This function tries to parse a single expression at a given
  // offset in a string. Useful for parsing mixed-language formats
  // that embed JavaScript expressions.

  function parseExpressionAt(input, pos, options) {
    var p = new Parser(options, input, pos)
    p.nextToken()
    return p.parseExpression()
  }

  // Acorn is organized as a tokenizer and a recursive-descent parser.
  // The `tokenizer` export provides an interface to the tokenizer.

  function tokenizer(input, options) {
    return new Parser(options, input)
  }

  // This is a terrible kludge to support the existing, pre-ES6
  // interface where the loose parser module retroactively adds exports
  // to this module.
  function addLooseExports(parse, Parser, plugins) {
    exports.parse_dammit = parse
    exports.LooseParser = Parser
    exports.pluginsLoose = plugins
  }

  exports.version = version;
  exports.parse = parse;
  exports.parseExpressionAt = parseExpressionAt;
  exports.tokenizer = tokenizer;
  exports.addLooseExports = addLooseExports;
  exports.Parser = Parser;
  exports.plugins = plugins;
  exports.defaultOptions = defaultOptions;
  exports.Position = Position;
  exports.SourceLocation = SourceLocation;
  exports.getLineInfo = getLineInfo;
  exports.Node = Node;
  exports.TokenType = TokenType;
  exports.tokTypes = tt;
  exports.TokContext = TokContext;
  exports.tokContexts = types;
  exports.isIdentifierChar = isIdentifierChar;
  exports.isIdentifierStart = isIdentifierStart;
  exports.Token = Token;
  exports.isNewLine = isNewLine;
  exports.lineBreak = lineBreak;
  exports.lineBreakG = lineBreakG;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
},{}],4:[function(require,module,exports){
/**
 * @fileoverview Main Espree file that converts Acorn into Esprima output.
 *
 * This file contains code from the following MIT-licensed projects:
 * 1. Acorn
 * 2. Babylon
 * 3. Babel-ESLint
 *
 * This file also contains code from Esprima, which is BSD licensed.
 *
 * Acorn is Copyright 2012-2015 Acorn Contributors (https://github.com/marijnh/acorn/blob/master/AUTHORS)
 * Babylon is Copyright 2014-2015 various contributors (https://github.com/babel/babel/blob/master/packages/babylon/AUTHORS)
 * Babel-ESLint is Copyright 2014-2015 Sebastian McKenzie <sebmck@gmail.com>
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * * Redistributions of source code must retain the above copyright
 *   notice, this list of conditions and the following disclaimer.
 * * Redistributions in binary form must reproduce the above copyright
 *   notice, this list of conditions and the following disclaimer in the
 *   documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * Esprima is Copyright (c) jQuery Foundation, Inc. and Contributors, All Rights Reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 *   * Redistributions of source code must retain the above copyright
 *     notice, this list of conditions and the following disclaimer.
 *   * Redistributions in binary form must reproduce the above copyright
 *     notice, this list of conditions and the following disclaimer in the
 *     documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
/* eslint no-undefined:0, no-use-before-define: 0 */

"use strict";

var astNodeTypes = require("./lib/ast-node-types"),
    commentAttachment = require("./lib/comment-attachment"),
    TokenTranslator = require("./lib/token-translator"),
    acornJSX = require("acorn-jsx/inject"),
    rawAcorn = require("acorn");


var acorn = acornJSX(rawAcorn);

var lookahead,
    extra,
    lastToken;

/**
 * Resets the extra object to its default.
 * @returns {void}
 * @private
 */
function resetExtra() {
    extra = {
        tokens: null,
        range: false,
        loc: false,
        comment: false,
        comments: [],
        tolerant: false,
        errors: [],
        strict: false,
        ecmaFeatures: {},
        ecmaVersion: 5,
        isModule: false
    };
}



var tt = acorn.tokTypes,
    getLineInfo = acorn.getLineInfo;

// custom type for JSX attribute values
tt.jsxAttrValueToken = {};

/**
 * Determines if a node is valid given the set of ecmaFeatures.
 * @param {ASTNode} node The node to check.
 * @returns {boolean} True if the node is allowed, false if not.
 * @private
 */
function isValidNode(node) {
    var ecma = extra.ecmaFeatures;

    switch (node.type) {
        case "ExperimentalSpreadProperty":
        case "ExperimentalRestProperty":
            return ecma.experimentalObjectRestSpread;

        case "ImportDeclaration":
        case "ExportNamedDeclaration":
        case "ExportDefaultDeclaration":
        case "ExportAllDeclaration":
            return extra.isModule;

        default:
            return true;
    }
}

/**
 * Performs last-minute Esprima-specific compatibility checks and fixes.
 * @param {ASTNode} result The node to check.
 * @returns {ASTNode} The finished node.
 * @private
 * @this acorn.Parser
 */
function esprimaFinishNode(result) {
    // ensure that parsed node was allowed through ecmaFeatures
    if (!isValidNode(result)) {
        this.unexpected(result.start);
    }

    // https://github.com/marijnh/acorn/issues/323
    if (result.type === "TryStatement") {
        delete result.guardedHandlers;
    } else if (result.type === "CatchClause") {
        delete result.guard;
    }

    // Acorn doesn't count the opening and closing backticks as part of templates
    // so we have to adjust ranges/locations appropriately.
    if (result.type === "TemplateElement") {

        // additional adjustment needed if ${ is the last token
        var terminalDollarBraceL = this.input.slice(result.end, result.end + 2) === "${";

        if (result.range) {
            result.range[0]--;
            result.range[1] += (terminalDollarBraceL ? 2 : 1);
        }

        if (result.loc) {
            result.loc.start.column--;
            result.loc.end.column += (terminalDollarBraceL ? 2 : 1);
        }
    }

    // Acorn currently uses expressions instead of declarations in default exports
    if (result.type === "ExportDefaultDeclaration") {
        if (/^(Class|Function)Expression$/.test(result.declaration.type)) {
            result.declaration.type = result.declaration.type.replace("Expression", "Declaration");
        }
    }

    // Acorn uses undefined instead of null, which affects serialization
    if (result.type === "Literal" && result.value === undefined) {
        result.value = null;
    }

    if (extra.attachComment) {
        commentAttachment.processComment(result);
    }

    if (result.type.indexOf("Function") > -1 && !result.generator) {
        result.generator = false;
    }

    return result;
}

/**
 * Determines if a token is valid given the set of ecmaFeatures.
 * @param {acorn.Parser} parser The parser to check.
 * @returns {boolean} True if the token is allowed, false if not.
 * @private
 */
function isValidToken(parser) {
    var ecma = extra.ecmaFeatures;
    var type = parser.type;

    switch (type) {
        case tt.jsxName:
        case tt.jsxText:
        case tt.jsxTagStart:
        case tt.jsxTagEnd:
            return ecma.jsx;

        // https://github.com/ternjs/acorn/issues/363
        case tt.regexp:
            if (extra.ecmaVersion < 6 && parser.value.flags && parser.value.flags.indexOf("y") > -1) {
                return false;
            }

            return true;

        default:
            return true;
    }
}

/**
 * Injects esprimaFinishNode into the finishNode process.
 * @param {Function} finishNode Original finishNode function.
 * @returns {ASTNode} The finished node.
 * @private
 */
function wrapFinishNode(finishNode) {
    return /** @this acorn.Parser */ function(node, type, pos, loc) {
        var result = finishNode.call(this, node, type, pos, loc);
        return esprimaFinishNode.call(this, result);
    };
}

acorn.plugins.espree = function(instance) {

    instance.extend("finishNode", wrapFinishNode);

    instance.extend("finishNodeAt", wrapFinishNode);

    instance.extend("next", function(next) {
        return /** @this acorn.Parser */ function() {
            if (!isValidToken(this)) {
                this.unexpected();
            }
            return next.call(this);
        };
    });

    // needed for experimental object rest/spread
    instance.extend("checkLVal", function(checkLVal) {

        return /** @this acorn.Parser */ function(expr, isBinding, checkClashes) {

            if (extra.ecmaFeatures.experimentalObjectRestSpread && expr.type === "ObjectPattern") {
                for (var i = 0; i < expr.properties.length; i++) {
                    if (expr.properties[i].type.indexOf("Experimental") === -1) {
                        this.checkLVal(expr.properties[i].value, isBinding, checkClashes);
                    }
                }
                return undefined;
            }

            return checkLVal.call(this, expr, isBinding, checkClashes);
        };
    });

    instance.extend("parseTopLevel", function(parseTopLevel) {
        return /** @this acorn.Parser */ function(node) {
            if (extra.ecmaFeatures.impliedStrict && this.options.ecmaVersion >= 5) {
                this.strict = true;
            }
            return parseTopLevel.call(this, node);
        };
    });

    instance.extend("toAssignable", function(toAssignable) {

        return /** @this acorn.Parser */ function(node, isBinding) {

            if (extra.ecmaFeatures.experimentalObjectRestSpread &&
                    node.type === "ObjectExpression"
            ) {
                node.type = "ObjectPattern";

                for (var i = 0; i < node.properties.length; i++) {
                    var prop = node.properties[i];

                    if (prop.type === "ExperimentalSpreadProperty") {
                        prop.type = "ExperimentalRestProperty";
                    } else if (prop.kind !== "init") {
                        this.raise(prop.key.start, "Object pattern can't contain getter or setter");
                    } else {
                        this.toAssignable(prop.value, isBinding);
                    }
                }

                return node;
            } else {
                return toAssignable.call(this, node, isBinding);
            }
        };

    });

    /**
     * Method to parse an object rest or object spread.
     * @returns {ASTNode} The node representing object rest or object spread.
     * @this acorn.Parser
     */
    instance.parseObjectRest = function() {
        var node = this.startNode();
        this.next();
        node.argument = this.parseIdent();
        return this.finishNode(node, "ExperimentalRestProperty");
    };

    /**
     * Method to parse an object with object rest or object spread.
     * @param {boolean} isPattern True if the object is a destructuring pattern.
     * @param {Object} refShorthandDefaultPos ?
     * @returns {ASTNode} The node representing object rest or object spread.
     * @this acorn.Parser
     */
    instance.parseObj = function(isPattern, refShorthandDefaultPos) {
        var node = this.startNode(),
            first = true,
            propHash = {};
        node.properties = [];
        this.next();
        while (!this.eat(tt.braceR)) {

            if (!first) {
                this.expect(tt.comma);

                if (this.afterTrailingComma(tt.braceR)) {
                    break;
                }

            } else {
                first = false;
            }

            var prop = this.startNode(),
                isGenerator,
                isAsync,
                startPos,
                startLoc;

            if (extra.ecmaFeatures.experimentalObjectRestSpread && this.type === tt.ellipsis) {
                if (isPattern) {
                    prop = this.parseObjectRest();
                } else {
                    prop = this.parseSpread();
                    prop.type = "ExperimentalSpreadProperty";
                }

                node.properties.push(prop);
                continue;
            }

            if (this.options.ecmaVersion >= 6) {
                prop.method = false;
                prop.shorthand = false;

                if (isPattern || refShorthandDefaultPos) {
                    startPos = this.start;
                    startLoc = this.startLoc;
                }

                if (!isPattern) {
                    isGenerator = this.eat(tt.star);
                }
            }

            // grab the property name or "async"
            this.parsePropertyName(prop, refShorthandDefaultPos);
            if (this.options.ecmaVersion >= 8 &&
                !isPattern &&
                !isGenerator &&
                !prop.computed &&
                prop.key.type === "Identifier" &&
                prop.key.name === "async" &&
                this.type !== tt.parenL &&
                this.type !== tt.colon &&
                !this.canInsertSemicolon()
            ) {
                this.parsePropertyName(prop, refShorthandDefaultPos);
                isAsync = true;
            } else {
                isAsync = false;
            }

            this.parsePropertyValue(prop, isPattern, isGenerator, isAsync, startPos, startLoc, refShorthandDefaultPos);
            this.checkPropClash(prop, propHash);
            node.properties.push(this.finishNode(prop, "Property"));
        }

        return this.finishNode(node, isPattern ? "ObjectPattern" : "ObjectExpression");
    };

    /**
     * Overwrites the default raise method to throw Esprima-style errors.
     * @param {int} pos The position of the error.
     * @param {string} message The error message.
     * @throws {SyntaxError} A syntax error.
     * @returns {void}
     */
    instance.raise = instance.raiseRecoverable = function(pos, message) {
        var loc = getLineInfo(this.input, pos);
        var err = new SyntaxError(message);
        err.index = pos;
        err.lineNumber = loc.line;
        err.column = loc.column + 1; // acorn uses 0-based columns
        throw err;
    };

    /**
     * Overwrites the default unexpected method to throw Esprima-style errors.
     * @param {int} pos The position of the error.
     * @throws {SyntaxError} A syntax error.
     * @returns {void}
     */
    instance.unexpected = function(pos) {
        var message = "Unexpected token";

        if (pos !== null && pos !== undefined) {
            this.pos = pos;

            if (this.options.locations) {
                while (this.pos < this.lineStart) {
                    this.lineStart = this.input.lastIndexOf("\n", this.lineStart - 2) + 1;
                    --this.curLine;
                }
            }

            this.nextToken();
        }

        if (this.end > this.start) {
            message += " " + this.input.slice(this.start, this.end);
        }

        this.raise(this.start, message);
    };

    /*
    * Esprima-FB represents JSX strings as tokens called "JSXText", but Acorn-JSX
    * uses regular tt.string without any distinction between this and regular JS
    * strings. As such, we intercept an attempt to read a JSX string and set a flag
    * on extra so that when tokens are converted, the next token will be switched
    * to JSXText via onToken.
    */
    instance.extend("jsx_readString", function(jsxReadString) {
        return /** @this acorn.Parser */ function(quote) {
            var result = jsxReadString.call(this, quote);
            if (this.type === tt.string) {
                extra.jsxAttrValueToken = true;
            }

            return result;
        };
    });
};

//------------------------------------------------------------------------------
// Tokenizer
//------------------------------------------------------------------------------

/**
 * Tokenizes the given code.
 * @param {string} code The code to tokenize.
 * @param {Object} options Options defining how to tokenize.
 * @returns {Token[]} An array of tokens.
 * @throws {SyntaxError} If the input code is invalid.
 * @private
 */
function tokenize(code, options) {
    var toString,
        tokens,
        impliedStrict,
        translator = new TokenTranslator(tt, code);

    toString = String;
    if (typeof code !== "string" && !(code instanceof String)) {
        code = toString(code);
    }

    lookahead = null;

    // Options matching.
    options = options || {};

    var acornOptions = {
        ecmaVersion: 5,
        plugins: {
            espree: true
        }
    };

    resetExtra();

    // Of course we collect tokens here.
    options.tokens = true;
    extra.tokens = [];

    extra.range = (typeof options.range === "boolean") && options.range;
    acornOptions.ranges = extra.range;

    extra.loc = (typeof options.loc === "boolean") && options.loc;
    acornOptions.locations = extra.loc;

    extra.comment = typeof options.comment === "boolean" && options.comment;

    if (extra.comment) {
        acornOptions.onComment = function() {
            var comment = convertAcornCommentToEsprimaComment.apply(this, arguments);
            extra.comments.push(comment);
        };
    }

    extra.tolerant = typeof options.tolerant === "boolean" && options.tolerant;

    if (typeof options.ecmaVersion === "number") {
        switch (options.ecmaVersion) {
            case 3:
            case 5:
            case 6:
            case 7:
            case 8:
                acornOptions.ecmaVersion = options.ecmaVersion;
                extra.ecmaVersion = options.ecmaVersion;
                break;

            default:
                throw new Error("ecmaVersion must be 3, 5, 6, 7, or 8.");
        }
    }

    // apply parsing flags
    if (options.ecmaFeatures && typeof options.ecmaFeatures === "object") {
        extra.ecmaFeatures = options.ecmaFeatures;
        impliedStrict = extra.ecmaFeatures.impliedStrict;
        extra.ecmaFeatures.impliedStrict = typeof impliedStrict === "boolean" && impliedStrict;
    }

    try {
        var tokenizer = acorn.tokenizer(code, acornOptions);
        while ((lookahead = tokenizer.getToken()).type !== tt.eof) {
            translator.onToken(lookahead, extra);
        }

        // filterTokenLocation();
        tokens = extra.tokens;

        if (extra.comment) {
            tokens.comments = extra.comments;
        }
        if (extra.tolerant) {
            tokens.errors = extra.errors;
        }
    } catch (e) {
        throw e;
    }
    return tokens;
}

//------------------------------------------------------------------------------
// Parser
//------------------------------------------------------------------------------



/**
 * Converts an Acorn comment to a Esprima comment.
 * @param {boolean} block True if it's a block comment, false if not.
 * @param {string} text The text of the comment.
 * @param {int} start The index at which the comment starts.
 * @param {int} end The index at which the comment ends.
 * @param {Location} startLoc The location at which the comment starts.
 * @param {Location} endLoc The location at which the comment ends.
 * @returns {Object} The comment object.
 * @private
 */
function convertAcornCommentToEsprimaComment(block, text, start, end, startLoc, endLoc) {
    var comment = {
        type: block ? "Block" : "Line",
        value: text
    };

    if (typeof start === "number") {
        comment.start = start;
        comment.end = end;
        comment.range = [start, end];
    }

    if (typeof startLoc === "object") {
        comment.loc = {
            start: startLoc,
            end: endLoc
        };
    }

    return comment;
}

/**
 * Parses the given code.
 * @param {string} code The code to tokenize.
 * @param {Object} options Options defining how to tokenize.
 * @returns {ASTNode} The "Program" AST node.
 * @throws {SyntaxError} If the input code is invalid.
 * @private
 */
function parse(code, options) {
    var program,
        toString = String,
        translator,
        impliedStrict,
        acornOptions = {
            ecmaVersion: 5,
            plugins: {
                espree: true
            }
        };

    lastToken = null;

    if (typeof code !== "string" && !(code instanceof String)) {
        code = toString(code);
    }

    resetExtra();
    commentAttachment.reset();

    if (typeof options !== "undefined") {
        extra.range = (typeof options.range === "boolean") && options.range;
        extra.loc = (typeof options.loc === "boolean") && options.loc;
        extra.attachComment = (typeof options.attachComment === "boolean") && options.attachComment;

        if (extra.loc && options.source !== null && options.source !== undefined) {
            extra.source = toString(options.source);
        }

        if (typeof options.tokens === "boolean" && options.tokens) {
            extra.tokens = [];
            translator = new TokenTranslator(tt, code);
        }
        if (typeof options.comment === "boolean" && options.comment) {
            extra.comment = true;
            extra.comments = [];
        }
        if (typeof options.tolerant === "boolean" && options.tolerant) {
            extra.errors = [];
        }
        if (extra.attachComment) {
            extra.range = true;
            extra.comments = [];
            commentAttachment.reset();
        }

        if (typeof options.ecmaVersion === "number") {
            switch (options.ecmaVersion) {
                case 3:
                case 5:
                case 6:
                case 7:
                case 8:
                    acornOptions.ecmaVersion = options.ecmaVersion;
                    extra.ecmaVersion = options.ecmaVersion;
                    break;

                default:
                    throw new Error("ecmaVersion must be 3, 5, 6, 7, or 8.");
            }
        }

        if (options.sourceType === "module") {
            extra.isModule = true;

            // modules must be in 6 at least
            if (acornOptions.ecmaVersion < 6) {
                acornOptions.ecmaVersion = 6;
                extra.ecmaVersion = 6;
            }

            acornOptions.sourceType = "module";
        }

        // apply parsing flags after sourceType to allow overriding
        if (options.ecmaFeatures && typeof options.ecmaFeatures === "object") {
            extra.ecmaFeatures = options.ecmaFeatures;
            impliedStrict = extra.ecmaFeatures.impliedStrict;
            extra.ecmaFeatures.impliedStrict = typeof impliedStrict === "boolean" && impliedStrict;
            if (options.ecmaFeatures.globalReturn) {
                acornOptions.allowReturnOutsideFunction = true;
            }
        }


        acornOptions.onToken = function(token) {
            if (extra.tokens) {
                translator.onToken(token, extra);
            }
            if (token.type !== tt.eof) {
                lastToken = token;
            }
        };

        if (extra.attachComment || extra.comment) {
            acornOptions.onComment = function() {
                var comment = convertAcornCommentToEsprimaComment.apply(this, arguments);
                extra.comments.push(comment);

                if (extra.attachComment) {
                    commentAttachment.addComment(comment);
                }
            };
        }

        if (extra.range) {
            acornOptions.ranges = true;
        }

        if (extra.loc) {
            acornOptions.locations = true;
        }

        if (extra.ecmaFeatures.jsx) {
            // Should process jsx plugin before espree plugin.
            acornOptions.plugins = {
                jsx: true,
                espree: true
            };
        }
    }

    program = acorn.parse(code, acornOptions);
    program.sourceType = extra.isModule ? "module" : "script";

    if (extra.comment || extra.attachComment) {
        program.comments = extra.comments;
    }

    if (extra.tokens) {
        program.tokens = extra.tokens;
    }

    /*
     * Adjust opening and closing position of program to match Esprima.
     * Acorn always starts programs at range 0 whereas Esprima starts at the
     * first AST node's start (the only real difference is when there's leading
     * whitespace or leading comments). Acorn also counts trailing whitespace
     * as part of the program whereas Esprima only counts up to the last token.
     */
    if (program.range) {
        program.range[0] = program.body.length ? program.body[0].range[0] : program.range[0];
        program.range[1] = lastToken ? lastToken.range[1] : program.range[1];
    }

    if (program.loc) {
        program.loc.start = program.body.length ? program.body[0].loc.start : program.loc.start;
        program.loc.end = lastToken ? lastToken.loc.end : program.loc.end;
    }

    return program;
}

//------------------------------------------------------------------------------
// Public
//------------------------------------------------------------------------------

exports.version = require("./package.json").version;

exports.tokenize = tokenize;

exports.parse = parse;

// Deep copy.
/* istanbul ignore next */
exports.Syntax = (function() {
    var name, types = {};

    if (typeof Object.create === "function") {
        types = Object.create(null);
    }

    for (name in astNodeTypes) {
        if (astNodeTypes.hasOwnProperty(name)) {
            types[name] = astNodeTypes[name];
        }
    }

    if (typeof Object.freeze === "function") {
        Object.freeze(types);
    }

    return types;
}());

/* istanbul ignore next */
exports.VisitorKeys = (function() {
    var visitorKeys = require("./lib/visitor-keys");
    var name,
        keys = {};

    if (typeof Object.create === "function") {
        keys = Object.create(null);
    }

    for (name in visitorKeys) {
        if (visitorKeys.hasOwnProperty(name)) {
            keys[name] = visitorKeys[name];
        }
    }

    if (typeof Object.freeze === "function") {
        Object.freeze(keys);
    }

    return keys;
}());

},{"./lib/ast-node-types":5,"./lib/comment-attachment":6,"./lib/token-translator":7,"./lib/visitor-keys":8,"./package.json":9,"acorn":3,"acorn-jsx/inject":1}],5:[function(require,module,exports){
/**
 * @fileoverview The AST node types produced by the parser.
 * @author Nicholas C. Zakas
 */

"use strict";

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

// None!

//------------------------------------------------------------------------------
// Public
//------------------------------------------------------------------------------

module.exports = {
    AssignmentExpression: "AssignmentExpression",
    AssignmentPattern: "AssignmentPattern",
    ArrayExpression: "ArrayExpression",
    ArrayPattern: "ArrayPattern",
    ArrowFunctionExpression: "ArrowFunctionExpression",
    BlockStatement: "BlockStatement",
    BinaryExpression: "BinaryExpression",
    BreakStatement: "BreakStatement",
    CallExpression: "CallExpression",
    CatchClause: "CatchClause",
    ClassBody: "ClassBody",
    ClassDeclaration: "ClassDeclaration",
    ClassExpression: "ClassExpression",
    ConditionalExpression: "ConditionalExpression",
    ContinueStatement: "ContinueStatement",
    DoWhileStatement: "DoWhileStatement",
    DebuggerStatement: "DebuggerStatement",
    EmptyStatement: "EmptyStatement",
    ExperimentalRestProperty: "ExperimentalRestProperty",
    ExperimentalSpreadProperty: "ExperimentalSpreadProperty",
    ExpressionStatement: "ExpressionStatement",
    ForStatement: "ForStatement",
    ForInStatement: "ForInStatement",
    ForOfStatement: "ForOfStatement",
    FunctionDeclaration: "FunctionDeclaration",
    FunctionExpression: "FunctionExpression",
    Identifier: "Identifier",
    IfStatement: "IfStatement",
    Literal: "Literal",
    LabeledStatement: "LabeledStatement",
    LogicalExpression: "LogicalExpression",
    MemberExpression: "MemberExpression",
    MetaProperty: "MetaProperty",
    MethodDefinition: "MethodDefinition",
    NewExpression: "NewExpression",
    ObjectExpression: "ObjectExpression",
    ObjectPattern: "ObjectPattern",
    Program: "Program",
    Property: "Property",
    RestElement: "RestElement",
    ReturnStatement: "ReturnStatement",
    SequenceExpression: "SequenceExpression",
    SpreadElement: "SpreadElement",
    Super: "Super",
    SwitchCase: "SwitchCase",
    SwitchStatement: "SwitchStatement",
    TaggedTemplateExpression: "TaggedTemplateExpression",
    TemplateElement: "TemplateElement",
    TemplateLiteral: "TemplateLiteral",
    ThisExpression: "ThisExpression",
    ThrowStatement: "ThrowStatement",
    TryStatement: "TryStatement",
    UnaryExpression: "UnaryExpression",
    UpdateExpression: "UpdateExpression",
    VariableDeclaration: "VariableDeclaration",
    VariableDeclarator: "VariableDeclarator",
    WhileStatement: "WhileStatement",
    WithStatement: "WithStatement",
    YieldExpression: "YieldExpression",
    JSXIdentifier: "JSXIdentifier",
    JSXNamespacedName: "JSXNamespacedName",
    JSXMemberExpression: "JSXMemberExpression",
    JSXEmptyExpression: "JSXEmptyExpression",
    JSXExpressionContainer: "JSXExpressionContainer",
    JSXElement: "JSXElement",
    JSXClosingElement: "JSXClosingElement",
    JSXOpeningElement: "JSXOpeningElement",
    JSXAttribute: "JSXAttribute",
    JSXSpreadAttribute: "JSXSpreadAttribute",
    JSXText: "JSXText",
    ExportDefaultDeclaration: "ExportDefaultDeclaration",
    ExportNamedDeclaration: "ExportNamedDeclaration",
    ExportAllDeclaration: "ExportAllDeclaration",
    ExportSpecifier: "ExportSpecifier",
    ImportDeclaration: "ImportDeclaration",
    ImportSpecifier: "ImportSpecifier",
    ImportDefaultSpecifier: "ImportDefaultSpecifier",
    ImportNamespaceSpecifier: "ImportNamespaceSpecifier"
};

},{}],6:[function(require,module,exports){
/**
 * @fileoverview Attaches comments to the AST.
 * @author Nicholas C. Zakas
 */

"use strict";

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

var astNodeTypes = require("./ast-node-types");

//------------------------------------------------------------------------------
// Private
//------------------------------------------------------------------------------

var extra = {
    trailingComments: [],
    leadingComments: [],
    bottomRightStack: [],
    previousNode: null
};

//------------------------------------------------------------------------------
// Public
//------------------------------------------------------------------------------

module.exports = {

    reset: function() {
        extra.trailingComments = [];
        extra.leadingComments = [];
        extra.bottomRightStack = [];
        extra.previousNode = null;
    },

    addComment: function(comment) {
        extra.trailingComments.push(comment);
        extra.leadingComments.push(comment);
    },

    processComment: function(node) {
        var lastChild,
            trailingComments,
            i,
            j;

        if (node.type === astNodeTypes.Program) {
            if (node.body.length > 0) {
                return;
            }
        }

        if (extra.trailingComments.length > 0) {

            /*
             * If the first comment in trailingComments comes after the
             * current node, then we're good - all comments in the array will
             * come after the node and so it's safe to add then as official
             * trailingComments.
             */
            if (extra.trailingComments[0].range[0] >= node.range[1]) {
                trailingComments = extra.trailingComments;
                extra.trailingComments = [];
            } else {

                /*
                 * Otherwise, if the first comment doesn't come after the
                 * current node, that means we have a mix of leading and trailing
                 * comments in the array and that leadingComments contains the
                 * same items as trailingComments. Reset trailingComments to
                 * zero items and we'll handle this by evaluating leadingComments
                 * later.
                 */
                extra.trailingComments.length = 0;
            }
        } else {
            if (extra.bottomRightStack.length > 0 &&
                    extra.bottomRightStack[extra.bottomRightStack.length - 1].trailingComments &&
                    extra.bottomRightStack[extra.bottomRightStack.length - 1].trailingComments[0].range[0] >= node.range[1]) {
                trailingComments = extra.bottomRightStack[extra.bottomRightStack.length - 1].trailingComments;
                delete extra.bottomRightStack[extra.bottomRightStack.length - 1].trailingComments;
            }
        }

        // Eating the stack.
        while (extra.bottomRightStack.length > 0 && extra.bottomRightStack[extra.bottomRightStack.length - 1].range[0] >= node.range[0]) {
            lastChild = extra.bottomRightStack.pop();
        }

        if (lastChild) {
            if (lastChild.leadingComments) {
                if (lastChild.leadingComments[lastChild.leadingComments.length - 1].range[1] <= node.range[0]) {
                    node.leadingComments = lastChild.leadingComments;
                    delete lastChild.leadingComments;
                } else {
                    // A leading comment for an anonymous class had been stolen by its first MethodDefinition,
                    // so this takes back the leading comment.
                    // See Also: https://github.com/eslint/espree/issues/158
                    for (i = lastChild.leadingComments.length - 2; i >= 0; --i) {
                        if (lastChild.leadingComments[i].range[1] <= node.range[0]) {
                            node.leadingComments = lastChild.leadingComments.splice(0, i + 1);
                            break;
                        }
                    }
                }
            }
        } else if (extra.leadingComments.length > 0) {
            if (extra.leadingComments[extra.leadingComments.length - 1].range[1] <= node.range[0]) {
                if (extra.previousNode) {
                    for (j = 0; j < extra.leadingComments.length; j++) {
                        if (extra.leadingComments[j].end < extra.previousNode.end) {
                            extra.leadingComments.splice(j, 1);
                            j--;
                        }
                    }
                }
                if (extra.leadingComments.length > 0) {
                    node.leadingComments = extra.leadingComments;
                    extra.leadingComments = [];
                }
            } else {

                // https://github.com/eslint/espree/issues/2

                /*
                 * In special cases, such as return (without a value) and
                 * debugger, all comments will end up as leadingComments and
                 * will otherwise be eliminated. This extra step runs when the
                 * bottomRightStack is empty and there are comments left
                 * in leadingComments.
                 *
                 * This loop figures out the stopping point between the actual
                 * leading and trailing comments by finding the location of the
                 * first comment that comes after the given node.
                 */
                for (i = 0; i < extra.leadingComments.length; i++) {
                    if (extra.leadingComments[i].range[1] > node.range[0]) {
                        break;
                    }
                }

                /*
                 * Split the array based on the location of the first comment
                 * that comes after the node. Keep in mind that this could
                 * result in an empty array, and if so, the array must be
                 * deleted.
                 */
                node.leadingComments = extra.leadingComments.slice(0, i);
                if (node.leadingComments.length === 0) {
                    delete node.leadingComments;
                }

                /*
                 * Similarly, trailing comments are attached later. The variable
                 * must be reset to null if there are no trailing comments.
                 */
                trailingComments = extra.leadingComments.slice(i);
                if (trailingComments.length === 0) {
                    trailingComments = null;
                }
            }
        }

        extra.previousNode = node;

        if (trailingComments) {
            node.trailingComments = trailingComments;
        }

        extra.bottomRightStack.push(node);
    }

};

},{"./ast-node-types":5}],7:[function(require,module,exports){
/**
 * @fileoverview Translates tokens between Acorn format and Esprima format.
 * @author Nicholas C. Zakas
 */
/* eslint no-underscore-dangle: 0 */

"use strict";

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

// none!

//------------------------------------------------------------------------------
// Private
//------------------------------------------------------------------------------


// Esprima Token Types
var Token = {
    Boolean: "Boolean",
    EOF: "<end>",
    Identifier: "Identifier",
    Keyword: "Keyword",
    Null: "Null",
    Numeric: "Numeric",
    Punctuator: "Punctuator",
    String: "String",
    RegularExpression: "RegularExpression",
    Template: "Template",
    JSXIdentifier: "JSXIdentifier",
    JSXText: "JSXText"
};

/**
 * Converts part of a template into an Esprima token.
 * @param {AcornToken[]} tokens The Acorn tokens representing the template.
 * @param {string} code The source code.
 * @returns {EsprimaToken} The Esprima equivalent of the template token.
 * @private
 */
function convertTemplatePart(tokens, code) {
    var firstToken = tokens[0],
        lastTemplateToken = tokens[tokens.length - 1];

    var token = {
        type: Token.Template,
        value: code.slice(firstToken.start, lastTemplateToken.end)
    };

    if (firstToken.loc) {
        token.loc = {
            start: firstToken.loc.start,
            end: lastTemplateToken.loc.end
        };
    }

    if (firstToken.range) {
        token.range = [firstToken.range[0], lastTemplateToken.range[1]];
    }

    return token;
}

/**
 * Contains logic to translate Acorn tokens into Esprima tokens.
 * @param {Object} acornTokTypes The Acorn token types.
 * @param {string} code The source code Acorn is parsing. This is necessary
 *      to correct the "value" property of some tokens.
 * @constructor
 */
function TokenTranslator(acornTokTypes, code) {

    // token types
    this._acornTokTypes = acornTokTypes;

    // token buffer for templates
    this._tokens = [];

    // track the last curly brace
    this._curlyBrace = null;

    // the source code
    this._code = code;

}

TokenTranslator.prototype = {
    constructor: TokenTranslator,

    /**
     * Translates a single Esprima token to a single Acorn token. This may be
     * inaccurate due to how templates are handled differently in Esprima and
     * Acorn, but should be accurate for all other tokens.
     * @param {AcornToken} token The Acorn token to translate.
     * @param {Object} extra Espree extra object.
     * @returns {EsprimaToken} The Esprima version of the token.
     */
    translate: function(token, extra) {

        var type = token.type,
            tt = this._acornTokTypes;

        if (type === tt.name) {
            token.type = Token.Identifier;

            // TODO: See if this is an Acorn bug
            if (token.value === "static") {
                token.type = Token.Keyword;
            }

            if (extra.ecmaVersion > 5 && (token.value === "yield" || token.value === "let")) {
                token.type = Token.Keyword;
            }

        } else if (type === tt.semi || type === tt.comma ||
                 type === tt.parenL || type === tt.parenR ||
                 type === tt.braceL || type === tt.braceR ||
                 type === tt.dot || type === tt.bracketL ||
                 type === tt.colon || type === tt.question ||
                 type === tt.bracketR || type === tt.ellipsis ||
                 type === tt.arrow || type === tt.jsxTagStart ||
                 type === tt.incDec || type === tt.starstar ||
                 type === tt.jsxTagEnd || type === tt.prefix ||
                 (type.binop && !type.keyword) ||
                 type.isAssign) {

            token.type = Token.Punctuator;
            token.value = this._code.slice(token.start, token.end);
        } else if (type === tt.jsxName) {
            token.type = Token.JSXIdentifier;
        } else if (type.label === "jsxText" || type === tt.jsxAttrValueToken) {
            token.type = Token.JSXText;
        } else if (type.keyword) {
            if (type.keyword === "true" || type.keyword === "false") {
                token.type = Token.Boolean;
            } else if (type.keyword === "null") {
                token.type = Token.Null;
            } else {
                token.type = Token.Keyword;
            }
        } else if (type === tt.num) {
            token.type = Token.Numeric;
            token.value = this._code.slice(token.start, token.end);
        } else if (type === tt.string) {

            if (extra.jsxAttrValueToken) {
                extra.jsxAttrValueToken = false;
                token.type = Token.JSXText;
            } else {
                token.type = Token.String;
            }

            token.value = this._code.slice(token.start, token.end);
        } else if (type === tt.regexp) {
            token.type = Token.RegularExpression;
            var value = token.value;
            token.regex = {
                flags: value.flags,
                pattern: value.pattern
            };
            token.value = "/" + value.pattern + "/" + value.flags;
        }

        return token;
    },

    /**
     * Function to call during Acorn's onToken handler.
     * @param {AcornToken} token The Acorn token.
     * @param {Object} extra The Espree extra object.
     * @returns {void}
     */
    onToken: function(token, extra) {

        var that = this,
            tt = this._acornTokTypes,
            tokens = extra.tokens,
            templateTokens = this._tokens;

        /**
         * Flushes the buffered template tokens and resets the template
         * tracking.
         * @returns {void}
         * @private
         */
        function translateTemplateTokens() {
            tokens.push(convertTemplatePart(that._tokens, that._code));
            that._tokens = [];
        }

        if (token.type === tt.eof) {

            // might be one last curlyBrace
            if (this._curlyBrace) {
                tokens.push(this.translate(this._curlyBrace, extra));
            }

            return;
        }

        if (token.type === tt.backQuote) {

            // if there's already a curly, it's not part of the template
            if (this._curlyBrace) {
                tokens.push(this.translate(this._curlyBrace, extra));
                this._curlyBrace = null;
            }

            templateTokens.push(token);

            // it's the end
            if (templateTokens.length > 1) {
                translateTemplateTokens();
            }

            return;
        } else if (token.type === tt.dollarBraceL) {
            templateTokens.push(token);
            translateTemplateTokens();
            return;
        } else if (token.type === tt.braceR) {

            // if there's already a curly, it's not part of the template
            if (this._curlyBrace) {
                tokens.push(this.translate(this._curlyBrace, extra));
            }

            // store new curly for later
            this._curlyBrace = token;
            return;
        } else if (token.type === tt.template) {
            if (this._curlyBrace) {
                templateTokens.push(this._curlyBrace);
                this._curlyBrace = null;
            }

            templateTokens.push(token);
            return;
        }

        if (this._curlyBrace) {
            tokens.push(this.translate(this._curlyBrace, extra));
            this._curlyBrace = null;
        }

        tokens.push(this.translate(token, extra));
    }
};

//------------------------------------------------------------------------------
// Public
//------------------------------------------------------------------------------

module.exports = TokenTranslator;

},{}],8:[function(require,module,exports){
/**
 * @fileoverview The visitor keys for the node types Espree supports
 * @author Nicholas C. Zakas
 *
 * This file contains code from estraverse-fb.
 *
 * The MIT license. Copyright (c) 2014 Ingvar Stepanyan
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

"use strict";

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

// None!

//------------------------------------------------------------------------------
// Public
//------------------------------------------------------------------------------

module.exports = {

    // ECMAScript
    AssignmentExpression: ["left", "right"],
    AssignmentPattern: ["left", "right"],
    ArrayExpression: ["elements"],
    ArrayPattern: ["elements"],
    ArrowFunctionExpression: ["params", "body"],
    BlockStatement: ["body"],
    BinaryExpression: ["left", "right"],
    BreakStatement: ["label"],
    CallExpression: ["callee", "arguments"],
    CatchClause: ["param", "body"],
    ClassBody: ["body"],
    ClassDeclaration: ["id", "superClass", "body"],
    ClassExpression: ["id", "superClass", "body"],
    ConditionalExpression: ["test", "consequent", "alternate"],
    ContinueStatement: ["label"],
    DebuggerStatement: [],
    DirectiveStatement: [],
    DoWhileStatement: ["body", "test"],
    EmptyStatement: [],
    ExportAllDeclaration: ["source"],
    ExportDefaultDeclaration: ["declaration"],
    ExportNamedDeclaration: ["declaration", "specifiers", "source"],
    ExportSpecifier: ["exported", "local"],
    ExpressionStatement: ["expression"],
    ForStatement: ["init", "test", "update", "body"],
    ForInStatement: ["left", "right", "body"],
    ForOfStatement: ["left", "right", "body"],
    FunctionDeclaration: ["id", "params", "body"],
    FunctionExpression: ["id", "params", "body"],
    Identifier: [],
    IfStatement: ["test", "consequent", "alternate"],
    ImportDeclaration: ["specifiers", "source"],
    ImportDefaultSpecifier: ["local"],
    ImportNamespaceSpecifier: ["local"],
    ImportSpecifier: ["imported", "local"],
    Literal: [],
    LabeledStatement: ["label", "body"],
    LogicalExpression: ["left", "right"],
    MemberExpression: ["object", "property"],
    MetaProperty: ["meta", "property"],
    MethodDefinition: ["key", "value"],
    ModuleSpecifier: [],
    NewExpression: ["callee", "arguments"],
    ObjectExpression: ["properties"],
    ObjectPattern: ["properties"],
    Program: ["body"],
    Property: ["key", "value"],
    RestElement: [ "argument" ],
    ReturnStatement: ["argument"],
    SequenceExpression: ["expressions"],
    SpreadElement: ["argument"],
    Super: [],
    SwitchStatement: ["discriminant", "cases"],
    SwitchCase: ["test", "consequent"],
    TaggedTemplateExpression: ["tag", "quasi"],
    TemplateElement: [],
    TemplateLiteral: ["quasis", "expressions"],
    ThisExpression: [],
    ThrowStatement: ["argument"],
    TryStatement: ["block", "handler", "finalizer"],
    UnaryExpression: ["argument"],
    UpdateExpression: ["argument"],
    VariableDeclaration: ["declarations"],
    VariableDeclarator: ["id", "init"],
    WhileStatement: ["test", "body"],
    WithStatement: ["object", "body"],
    YieldExpression: ["argument"],

    // JSX
    JSXIdentifier: [],
    JSXNamespacedName: ["namespace", "name"],
    JSXMemberExpression: ["object", "property"],
    JSXEmptyExpression: [],
    JSXExpressionContainer: ["expression"],
    JSXElement: ["openingElement", "closingElement", "children"],
    JSXClosingElement: ["name"],
    JSXOpeningElement: ["name", "attributes"],
    JSXAttribute: ["name", "value"],
    JSXText: null,
    JSXSpreadAttribute: ["argument"],

    // Experimental features
    ExperimentalRestProperty: ["argument"],
    ExperimentalSpreadProperty: ["argument"]
};

},{}],9:[function(require,module,exports){
module.exports={
  "name": "espree",
  "description": "An Esprima-compatible JavaScript parser built on Acorn",
  "author": "Nicholas C. Zakas <nicholas+npm@nczconsulting.com>",
  "homepage": "https://github.com/eslint/espree",
  "main": "espree.js",
  "version": "3.3.2",
  "files": [
    "lib",
    "espree.js"
  ],
  "engines": {
    "node": ">=0.10.0"
  },
  "repository": "eslint/espree",
  "bugs": {
    "url": "http://github.com/eslint/espree.git"
  },
  "license": "BSD-2-Clause",
  "dependencies": {
    "acorn": "^4.0.1",
    "acorn-jsx": "^3.0.0"
  },
  "devDependencies": {
    "browserify": "^7.0.0",
    "chai": "^1.10.0",
    "eslint": "^2.0.0-beta.1",
    "eslint-config-eslint": "^3.0.0",
    "eslint-release": "^0.10.0",
    "esprima": "latest",
    "esprima-fb": "^8001.2001.0-dev-harmony-fb",
    "istanbul": "~0.2.6",
    "json-diff": "~0.3.1",
    "leche": "^1.0.1",
    "mocha": "^2.0.1",
    "regenerate": "~0.5.4",
    "shelljs": "^0.3.0",
    "shelljs-nodecli": "^0.1.1",
    "unicode-6.3.0": "~0.1.0"
  },
  "keywords": [
    "ast",
    "ecmascript",
    "javascript",
    "parser",
    "syntax",
    "acorn"
  ],
  "scripts": {
    "generate-regex": "node tools/generate-identifier-regex.js",
    "test": "npm run-script lint && node Makefile.js test",
    "lint": "node Makefile.js lint",
    "release": "eslint-release",
    "ci-release": "eslint-ci-release",
    "gh-release": "eslint-gh-release",
    "alpharelease": "eslint-prelease alpha",
    "betarelease": "eslint-prelease beta",
    "browserify": "node Makefile.js browserify"
  }
}

},{}]},{},[4])(4)
});
