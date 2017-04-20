define(function Preferences(require, exports, module) {
    "use strict";

    /* beautify preserve:start *//* eslint-disable no-multi-spaces */
    var PreferencesManager = brackets.getModule("preferences/PreferencesManager");

    var Strings            = require("../strings");
    /* eslint-enable no-multi-spaces *//* beautify preserve:end */

    /** @const {string} Prefix for preferences. */
    var PREFIX = "hirse.outline";

    var prefs = PreferencesManager.getExtensionPrefs(PREFIX);

    var defaultPreferences = [
        {
            id: "enabled",
            type: "boolean",
            value: false,
            options: {
                name: Strings.PREF_ENABLED_NAME,
                description: Strings.PREF_ENABLED_DESC
            }
        }, {
            id: "unnamed",
            type: "boolean",
            value: true,
            options: {
                name: Strings.PREF_UNNAMED_NAME,
                description: Strings.PREF_UNNAMED_DESC
            },
            inContextMenu: true
        }, {
            id: "args",
            type: "boolean",
            value: true,
            options: {
                name: Strings.PREF_ARGS_NAME,
                description: Strings.PREF_ARGS_DESC
            },
            inContextMenu: true
        }, {
            id: "sidebar",
            type: "boolean",
            value: true,
            options: {
                name: Strings.PREF_SIDEBAR_NAME,
                description: Strings.PREF_SIDEBAR_DESC
            }
        }, {
            id: "sort",
            type: "boolean",
            value: false,
            options: {
                name: Strings.PREF_SORT_NAME,
                description: Strings.PREF_SORT_DESC
            },
            inContextMenu: true
        }, {
            id: "indent",
            type: "boolean",
            value: true,
            options: {
                name: Strings.PREF_INDENT_NAME,
                description: Strings.PREF_INDENT_DESC
            },
            inContextMenu: true
        }, {
            id: "autohide",
            type: "boolean",
            value: false,
            options: {
                name: Strings.PREF_AUTOHIDE_NAME,
                description: Strings.PREF_AUTOHIDE_DESC
            }
        }
    ];

    defaultPreferences.forEach(function (preference) {
        prefs.definePreference(preference.id, preference.type, preference.value, preference.options);
    });
    prefs.save();

    /**
     * Toggle a preference by id and return the new value.
     * Only works with boolean preferences.
     * @param   {string}  id Preference id without prefix.
     * @returns {boolean} New preference value.
     */
    function togglePref(id) {
        var state = prefs.get(id);
        prefs.set(id, !state);
        prefs.save();
        return !state;
    }

    /**
     * Get the settings for the Configure menu.
     * @returns {object[]} List of preference objects.
     */
    function getSettings() {
        return defaultPreferences.filter(function (defaultPreference) {
            return defaultPreference.inContextMenu;
        }).map(function (defaultPreference) {
            return {
                id: defaultPreference.id,
                value: prefs.get(defaultPreference.id)
            };
        });
    }

    /**
     * Get a preference by id.
     * @param   {string} id Preference id without prefix.
     * @returns {any}    Preference value.
     */
    function get(id) {
        return prefs.get(id);
    }

    /**
     * Set up a listener for the change event on a preference.
     * @param {string}   id      Preference Id.
     * @param {function} handler Handler function.
     */
    function onChange(id, handler) {
        prefs.on("change", id, handler);
    }

    module.exports = {
        get: get,
        getSettings: getSettings,
        togglePref: togglePref,
        onChange: onChange
    };
});
