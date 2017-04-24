# Change Log
All notable changes to this project will be documented in this file.
This project tries to adhere to [Semantic Versioning](http://semver.org/).


## 1.2.0 - 2017-04-24
### Fixed
- PHP multiline strings (see [#91](https://github.com/Hirse/brackets-outline-list/issues/91))

### Changed
- Use php-parser to parse PHP


## 1.1.0 - 2017-04-20
### Added
- Arabic translation, thanks to [__@sadik-fattah__](https://github.com/sadik-fattah)
- Autohide Outline (see [#17](https://github.com/Hirse/brackets-outline-list/issues/17)), thanks to [__@pelatx__](https://github.com/pelatx)

### Fixed
- Support ES6 Modules (see [#86](https://github.com/Hirse/brackets-outline-list/issues/86))
- Don't break on destructuring assignments (see [#88](https://github.com/Hirse/brackets-outline-list/issues/88))
- Support Python parameter default parameters (see [#89](https://github.com/Hirse/brackets-outline-list/issues/89)), thanks to [__@pelatx__](https://github.com/pelatx)


## 1.0.1 - 2017-03-13
### Fixed
- Use correct name (or none) for callback functions (see [#81](https://github.com/Hirse/brackets-outline-list/issues/81))


## 1.0.0 - 2017-03-12
### Added
- Support ES6 Classes (see [#79](https://github.com/Hirse/brackets-outline-list/issues/79))

### Changed
- Use htmlparser2 to parse XML, HTML, and SVG
- Use PostCSS Safe Parser to parse CSS, Less, and SCSS

### Fixed
- Various PHP issues, for example multipe inheritance, thanks to [__@pelatx__](https://github.com/pelatx)
- Use Class icon for PHP Class definitions
- Don't break on PHP return types (see [#80](https://github.com/Hirse/brackets-outline-list/issues/80))


## 1.0.0-alpha.1 - 2017-01-22
### Fixed
- No distractions mode conflict (see [#64](https://github.com/Hirse/brackets-outline-list/issues/64))
- Position change shows hid outline (see [#72](https://github.com/Hirse/brackets-outline-list/issues/72))
- Broken PHP class detection (see [#73](https://github.com/Hirse/brackets-outline-list/issues/73) and [#74](https://github.com/Hirse/brackets-outline-list/issues/74)), thanks to [__@pelatx__](https://github.com/pelatx)
- PHP abstract classes detection (see [#76](https://github.com/Hirse/brackets-outline-list/issues/76)), thanks to [__@pelatx__](https://github.com/pelatx)
- Performance in large PHP files (see [#70](https://github.com/Hirse/brackets-outline-list/issues/70)), thanks to [__@mskocik__](https://github.com/mskocik)


## 1.0.0-alpha.0 - 2016-11-14
### Added
- Python Support (see [#44](https://github.com/Hirse/brackets-outline-list/issues/44))
- Jade Support (see [#15](https://github.com/Hirse/brackets-outline-list/issues/15))
- Stylus Support (see [#14](https://github.com/Hirse/brackets-outline-list/issues/14))
- JSX Support (see [#65](https://github.com/Hirse/brackets-outline-list/issues/65))

### Changed
- Use Espree to parse JavaScript to extract the outline
- Use Lexer to parse PHP to extract the outline, thanks to [__@yfwz100__](https://github.com/yfwz100)
- Update to Brackets 1.8 API


## 0.7.0 - 2015-07-28
### Added
- Names and Descriptions for preferences

### Changed
- Update to Brackets 1.4 API
- Reduced Toolbar Icon size to fit design guide


## 0.6.0 - 2015-07-02
### Added
- Support for arrow functions in JavaScript (see [#28](https://github.com/Hirse/brackets-outline-list/issues/28))
- Support for ES6 generator functions in JavaScript (see [#32](https://github.com/Hirse/brackets-outline-list/issues/32))
- Detect PHP &-functions (see [#31](https://github.com/Hirse/brackets-outline-list/issues/31))
- Detect static functions in PHP (see [#33](https://github.com/Hirse/brackets-outline-list/issues/33))
- Japanese translation, thanks to [__@nishioka__](https://github.com/nishioka)

### Fixed
- Allow all characters in PHP function arguments (see [#33](https://github.com/Hirse/brackets-outline-list/issues/33))
- Skip CSS lines with more than 1000 characters (see [#37](https://github.com/Hirse/brackets-outline-list/issues/37))

### Changed
- Update to Brackets 1.2 API
- Updated Ionicons to version 2.0.1


## 0.5.1 - 2015-02-13
### Fixed
- Actually use translated strings
- Match correct properties to XML elements if multiple elements in one line


## 0.5.0 - 2015-02-10
### Added
- Support for XML namespaces
- Hiding Animation in Sidebar mode to reduce missclicking

### Fixed
- Recognize CSS declarations where the open brace is on the next line (see [#5](https://github.com/Hirse/brackets-outline-list/issues/5)), thanks to [__@giovannicalo__](https://github.com/giovannicalo)
- Outline Indentation for XML files that use tabs for indentation, thanks to [__@giovannicalo__](https://github.com/giovannicalo)
- Assigning correct id or classes to XML elements in outline


## 0.4.6 - 2015-01-30
### Changed
- Improved method detection for CoffeeScript, thanks to [__@giovannicalo__](https://github.com/giovannicalo)


## 0.4.5 - 2015-01-21
### Fixed
- Recognize PHP functions with default values for parameter that involve parens. (see [#21](https://github.com/Hirse/brackets-outline-list/issues/21)).


## 0.4.4 - 2015-01-09
### Changed
- Updated Ionicons to version 2.0.0


## 0.4.3 - 2014-12-20
### Added
- French Translation, thanks to [__@cedced19__](https://github.com/cedced19)


## 0.4.2 - 2014-12-15
### Changed
- Remove HMTL elements from the outline that are not in the beginning of the line (see [#12](https://github.com/Hirse/brackets-outline-list/issues/12))


## 0.4.1 - 2014-12-14
### Fixed
- Detect PHP functions with referenced parameters (see [#16](https://github.com/Hirse/brackets-outline-list/issues/16))


## 0.4.0 - 2014-12-11
### Changed
- New Settings UI (Imitating Brackets Working Set Design)

### Added
- XML, HTML and SVG Support


## 0.3.1 - 2014-12-05
### Changed
- Better detection for PHP
- Visibility Icons for PHP


## 0.3.0 - 2014-12-04
### Added
- Markdown Support

### Changed
- Auto-hide Outline Pane for unsupported languages (see [#10](https://github.com/Hirse/brackets-outline-list/issues/10))


## 0.2.1 - 2014-12-02
### Fixed
- Detaching global Event Handlers makes other Extensions unusable (see [#3](https://github.com/Hirse/brackets-outline-list/issues/3), [#4](https://github.com/Hirse/brackets-outline-list/issues/4))


## 0.2.0 - 2014-12-01
### Added
- CofeeScript Support


## 0.1.1 - 2014-11-30
### Added
- CSS Icon for Attribute Selectors

### Changed
- Sorting disabled by default

### Fixed
- Collision with [Extensions Toolbar Reposition](https://github.com/dnbard/extensions-toolbar) (see [#1](https://github.com/Hirse/brackets-outline-list/issues/1))
- Sorting of Functions now works as intended
