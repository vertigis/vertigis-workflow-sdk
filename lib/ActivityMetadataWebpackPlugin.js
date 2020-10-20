// @ts-check
"use strict";

const generateActivityManifest = require("./generateActivityManifest");

const pluginName = "ActivityMetadataWebpackPlugin";

class ActivityMetadataWebpackPlugin {
    apply(compiler) {
        compiler.hooks.emit.tapPromise(pluginName, async (compilation) => {
            const manifest = await generateActivityManifest();
            const manifestString = JSON.stringify(manifest);

            compilation.assets["activitypack.json"] = {
                source: function () {
                    return manifestString;
                },
                size: function () {
                    return manifestString.length;
                },
            };
        });
    }
}

module.exports = ActivityMetadataWebpackPlugin;
