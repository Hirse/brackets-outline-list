/* global module */

module.exports = function (grunt) {
    "use strict";

    grunt.initConfig({
        compress: {
            main: {
                options: {
                    archive: "hirse.outline-list.zip"
                },
                files: [
                    {
                        src: [
                            "nls/**",
                            "src/**",
                            "styles/**",
                            "templates/*",
                            "thirdparty/*",
                            "CHANGELOG.md",
                            "LICENSE",
                            "main.js",
                            "package.json",
                            "README.md",
                            "strings.js"
                        ]
                    }
                ]
            }
        },
        karma: {
            ci: {
                configFile: "karma.conf.js",
                singleRun: true,
                browsers: ["PhantomJS"]
            }
        },
        eslint: {
            target: [
                "**/*.js",
                "!thirdparty/**/*.js",
                "!node_modules/**/*.js"
            ]
        }
    });

    grunt.loadNpmTasks("grunt-contrib-compress");
    grunt.loadNpmTasks("grunt-eslint");
    grunt.loadNpmTasks("grunt-karma");

    grunt.registerTask("default", [
        "compress"
    ]);

    grunt.registerTask("test", [
        "eslint",
        "karma:ci"
    ]);
};
