define(function (require, exports, module) {
    "use strict";

    var _                   = brackets.getModule("thirdparty/lodash");
    var PreferencesManager  = brackets.getModule("preferences/PreferencesManager");

    var Strings             = require("../strings");

    var prefix = "hirse.outline";
    var prefs = PreferencesManager.getExtensionPrefs(prefix);

    var defaultPreferences = {
        enabled: {
            type: "boolean",
            value: false,
            options: {
                name: Strings.PREF_ENABLED_NAME,
                description: Strings.PREF_ENABLED_DESC
            }
        }, unnamed: {
            type: "boolean",
            value: true,
            options: {
                name: Strings.PREF_UNNAMED_NAME,
                description: Strings.PREF_UNNAMED_DESC
            }
        }, args: {
            type: "boolean",
            value: true,
            options: {
                name: Strings.PREF_ARGS_NAME,
                description: Strings.PREF_ARGS_DESC
            }
        }, sidebar: {
            type: "boolean",
            value: true,
            options: {
                name: Strings.PREF_SIDEBAR_NAME,
                description: Strings.PREF_SIDEBAR_DESC
            }
        }, sort: {
            type: "boolean",
            value: false,
            options: {
                name: Strings.PREF_SORT_NAME,
                description: Strings.PREF_SORT_DESC
            }
        }
    };

    _.each(defaultPreferences, function (definition, key) {
        prefs.definePreference(key, definition.type, definition.value, definition.options);
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
