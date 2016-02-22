define(function (require, exports, module) {
    "use strict";

    /* beautify preserve:start *//* eslint-disable no-multi-spaces */
    var _                   = brackets.getModule("thirdparty/lodash");
    var PreferencesManager  = brackets.getModule("preferences/PreferencesManager");

    var Strings             = require("../strings");
    /* eslint-enable no-multi-spaces *//* beautify preserve:end */

    /** @const {string} Prefix for preferences. */
    var PREFIX = "hirse.outline";

    var prefs = PreferencesManager.getExtensionPrefs(PREFIX);

    var defaultPreferences = {
        enabled: {
            type: "boolean",
            value: false,
            options: {
                name: Strings.PREF_ENABLED_NAME,
                description: Strings.PREF_ENABLED_DESC
            }
        },
        unnamed: {
            type: "boolean",
            value: true,
            options: {
                name: Strings.PREF_UNNAMED_NAME,
                description: Strings.PREF_UNNAMED_DESC
            }
        },
        args: {
            type: "boolean",
            value: true,
            options: {
                name: Strings.PREF_ARGS_NAME,
                description: Strings.PREF_ARGS_DESC
            }
        },
        sidebar: {
            type: "boolean",
            value: true,
            options: {
                name: Strings.PREF_SIDEBAR_NAME,
                description: Strings.PREF_SIDEBAR_DESC
            }
        },
        sort: {
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

    /**
     * Toggle a preference by key and return the new value.
     * Only works with boolean preferences.
     * @param   {string}  key Preference key without prefix.
     * @returns {boolean} New preference value.
     */
    function togglePref(key) {
        var state = prefs.get(key);
        prefs.set(key, !state);
        prefs.save();
        return !state;
    }

    /**
     * Get the settings for the Configure menu.
     * @returns {object[]} List of preference objects.
     */
    function getSettings() {
        var prefValues = {};
        Object.keys(defaultPreferences).forEach(function (value) {
            if (value !== "enabled" && value !== "sidebar") {
                prefValues[value] = prefs.get(value);
            }
        });
        return prefValues;
    }

    /**
     * Get a preference by key.
     * @param   {string} key Preference key without prefix.
     * @returns {any}    Preference value.
     */
    function get(key) {
        return prefs.get(key);
    }

    module.exports = {
        get: get,
        getSettings: getSettings,
        togglePref: togglePref
    };
});
