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
        }
    });

    grunt.loadNpmTasks("grunt-contrib-compress");

    grunt.registerTask("default", [
        "compress"
    ]);
};
