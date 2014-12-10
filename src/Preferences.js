/* global define, brackets */

define(function (require, exports, module) {
    "use strict";

    var _                   = brackets.getModule("thirdparty/lodash");
    var PreferencesManager  = brackets.getModule("preferences/PreferencesManager");

    var prefix = "hirse.outline";
    var prefs = PreferencesManager.getExtensionPrefs(prefix);

    var defaultPreferences = {
        enabled: {
            type: "boolean",
            value: false
        }, unnamed: {
            type: "boolean",
            value: true
        }, args: {
            type: "boolean",
            value: true
        }, sidebar: {
            type: "boolean",
            value: true
        }, sort: {
            type: "boolean",
            value: false
        }
    };

    _.each(defaultPreferences, function (definition, key) {
        prefs.definePreference(key, definition.type, definition.value);
    });
    prefs.save();

    function togglePref(key) {
        var state = prefs.get(key);
        prefs.set(key, !state);
        prefs.save();
        return !state;
    }

    function getSettings() {
        var prefValues = {};
        Object.keys(defaultPreferences).forEach(function (value) {
            if (value !== "enabled" && value !== "sidebar") {
                prefValues[value] = prefs.get(value);
            }
        });
        return prefValues;
    }

    function get(key) {
        return prefs.get(key);
    }

    module.exports = {
        get: get,
        getSettings: getSettings,
        togglePref: togglePref
    };
});
