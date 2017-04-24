[![npm](https://img.shields.io/npm/v/hirse.outline-list.svg)](https://www.npmjs.com/package/hirse.outline-list)
[![Build Status](https://travis-ci.org/Hirse/brackets-outline-list.svg?branch=master)](https://travis-ci.org/Hirse/brackets-outline-list)
[![Code Climate](https://codeclimate.com/github/Hirse/brackets-outline-list/badges/gpa.svg)](https://codeclimate.com/github/Hirse/brackets-outline-list)
[![Test Coverage](https://codeclimate.com/github/Hirse/brackets-outline-list/badges/coverage.svg)](https://codeclimate.com/github/Hirse/brackets-outline-list/coverage)

<a href="http://brackets.io/"><img src="https://raw.githubusercontent.com/Hirse/brackets-outline-list/master/images/brackets.png" alt="Brackets" align="left" /></a>

# Brackets Outline List
[Brackets][Brackets] Extension to display a list of the functions or definitions in the currently opened document. Settings for parameters and anonymous functions. See [features](#features) for a list of supported languages.

## Screenshots
![JavaScript Outline](https://raw.githubusercontent.com/Hirse/brackets-outline-list/master/images/outline.png)  
*Outline for JavaScript*

![CSS Outline](https://raw.githubusercontent.com/Hirse/brackets-outline-list/master/images/outline-sidebar.png)  
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
|                                    | Parsing      | Sorting            | Indentation        | Arguments          | Unnamed            |
|------------------------------------|--------------|:------------------:|:------------------:|:------------------:|:------------------:|
| CSS, SCSS, LESS                    | PostCSS      | :heavy_check_mark: | :heavy_check_mark: | :no_entry_sign:    | :no_entry_sign:    |
| CoffeeScript                       | RegExp       | :heavy_check_mark: | :x:                | :heavy_check_mark: | :heavy_check_mark: |
| Haxe                               | RegExp       | :heavy_check_mark: | :x:                | :heavy_check_mark: | :heavy_check_mark: |
| Pug (Jade)                         | RegExp       | :no_entry_sign:    | :x:                | :x:                | :no_entry_sign:    |
| JavaScript, JSX                    | Espree       | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: |
| Markdown, GitHub-Flavored-Markdown | RegExp       | :heavy_check_mark: | :no_entry_sign:    | :no_entry_sign:    | :no_entry_sign:    |
| PHP                                | php-parser   | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: |
| Python                             | RegExp       | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :x:                |
| Ruby                               | RegExp       | :heavy_check_mark: | :x:                | :heavy_check_mark: | :x:                |
| Stylus                             | RegExp       | :x:                | :x:                | :no_entry_sign:    | :no_entry_sign:    |
| XML, HTML, SVG                     | htmlparser2  | :no_entry_sign:    | :heavy_check_mark: | :heavy_check_mark: | :no_entry_sign:    |

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
* [Espree][Espree] is licensed under the [BSD 2-Clause License][BSD-2-Clause]
* [Ionicons][Ionicons] is licensed under the [MIT license][MIT]
* [PostCSS Safe Parser][PostCSS] is licensed under the [MIT license][MIT]
* [htmlparser2][htmlparser2] is licensed under the [MIT license][MIT]
* [php-parser][php-parser] is licensed under the [BSD-3-Clause license][BSD-3-Clause]


[Brackets]: http://brackets.io
[Brackets Extension Manager]: https://github.com/adobe/brackets/wiki/Brackets-Extensions
[Brackets Extension Registry]: https://brackets-registry.aboutweb.com
[Brackets npm Registry]: https://github.com/zaggino/brackets-npm-registry

[Espree]: https://github.com/eslint/espree
[Ionicons]: http://ionicons.com
[PostCSS]: https://github.com/postcss/postcss-safe-parser
[htmlparser2]: https://github.com/fb55/htmlparser2
[php-parser]: https://github.com/glayzzle/php-parser

[BSD-2-Clause]: https://opensource.org/licenses/BSD-2-Clause
[BSD-3-Clause]: https://opensource.org/licenses/BSD-3-Clause
[MIT]: http://opensource.org/licenses/MIT
