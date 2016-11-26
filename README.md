[![npm](https://img.shields.io/npm/v/hirse.outline-list.svg)](https://www.npmjs.com/package/hirse.outline-list)
[![Build Status](https://travis-ci.org/Hirse/brackets-outline-list.svg?branch=master)](https://travis-ci.org/Hirse/brackets-outline-list)
[![Code Climate](https://codeclimate.com/github/Hirse/brackets-outline-list/badges/gpa.svg)](https://codeclimate.com/github/Hirse/brackets-outline-list)
[![Test Coverage](https://codeclimate.com/github/Hirse/brackets-outline-list/badges/coverage.svg)](https://codeclimate.com/github/Hirse/brackets-outline-list/coverage)

# Brackets Outline List
[Brackets][Brackets] Extension to display a list of the functions or definitions in the currently opened document. Settings for parameters and anonymous functions. See [features](#features) for a list of supported languages.

## Screenshots
![JavaScript Outline](https://raw.githubusercontent.com/Hirse/brackets-outline-list/master/screenshots/outline.png)  
*Outline for JavaScript*

![CSS Outline](https://raw.githubusercontent.com/Hirse/brackets-outline-list/master/screenshots/outline-sidebar.png)  
*Outline for CSS, HTML and Markdown in the Sidebar*

## Features
* List Functions or Definitions in the current document
* Jump to declaration from the Outline List
* Show Outline List in the sidebar or next to the toolbar
* Differentiate between types easily by showing different icons
* Toggle sorting of Outline List
* Toggle anonymous function
* Toggle function arguments

### Language features:
|                                    | Parsing | Sorting            | Indentation        | Arguments          | Unnamed            |
|------------------------------------|---------|:------------------:|:------------------:|:------------------:|:------------------:|
| CSS, SCSS, LESS                    | RegExp  | :heavy_check_mark: | :x:                | :x:                | :x:                |
| CoffeeScript                       | RegExp  | :heavy_check_mark: | :x:                | :heavy_check_mark: | :heavy_check_mark: |
| Haxe                               | RegExp  | :heavy_check_mark: | :x:                | :heavy_check_mark: | :heavy_check_mark: |
| Jade                               | RegExp  | :x:                | :x:                | :x:                | :x:                |
| JavaScript, JSX                    | Espree  | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: |
| Markdown, GitHub-Flavored-Markdown | RegExp  | :heavy_check_mark: | :x:                | :x:                | :x:                |
| PHP                                | Lexer   | :heavy_check_mark: | :x:                | :heavy_check_mark: | :heavy_check_mark: |
| Python                             | RegExp  | :heavy_check_mark: | :x:                | :heavy_check_mark: | :x:                |
| Ruby                               | RegExp  | :heavy_check_mark: | :x:                | :heavy_check_mark: | :x:                |
| Stylus                             | RegExp  | :x:                | :x:                | :x:                | :x:                |
| XML, HTML, SVG                     | RegExp  | :x:                | :heavy_check_mark: | :x:                | :x:                |

## Installation
### Latest Release
To install the latest _release_ of this extension use the built-in Brackets [Extension Manager][Brackets Extension Manager] which downloads the extension from the [extension registry][Brackets Extension Registry].

### Brackets npm Registry
The latest _release_ of this extension is also available on the [Brackets npm Registry][Brackets npm Registry].

### Latest Commit
To install the latest _commit_ of this extension use the built-in Brackets [Extension Manager][Brackets Extension Manager] which has a function to `Install from URL...` using this link: https://github.com/Hirse/brackets-outline-list/archive/master.zip.

## License
Brackets Outline List is licensed under the [MIT license][MIT].  

Used thirdparty software:
* [Ionicons][Ionicons] is licensed under the [MIT license][MIT]
* [Lexer][Lexer] is licensed under the [MIT license][MIT]
* [Espree][Espree] is licensed under the [BSD 2-Clause License][BSD-2-Clause]


[Brackets]: http://brackets.io
[Brackets Extension Manager]: https://github.com/adobe/brackets/wiki/Brackets-Extensions
[Brackets Extension Registry]: https://brackets-registry.aboutweb.com
[Brackets npm Registry]: https://github.com/zaggino/brackets-npm-registry

[Ionicons]: http://ionicons.com
[Lexer]: https://github.com/aaditmshah/lexer
[Espree]: https://github.com/eslint/espree

[MIT]: http://opensource.org/licenses/MIT
[BSD-2-Clause]: https://opensource.org/licenses/BSD-2-Clause
