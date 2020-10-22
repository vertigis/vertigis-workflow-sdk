// @ts-check
"use strict";
const { Compilation, sources } = require("webpack");
const generateActivityManifest = require("./generateActivityManifest");

const pluginName = "ActivityMetadataWebpackPlugin";

class ActivityMetadataWebpackPlugin {
    apply(compiler) {
        compiler.hooks.thisCompilation.tap(pluginName, (compilation) => {
            compilation.hooks.processAssets.tapPromise(
                {
                    name: pluginName,
                    stage: Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL,
                },
                async () => {
                    const manifest = await generateActivityManifest();
                    const manifestString = JSON.stringify(
                        manifest,
                        null,
                        process.env.NODE_ENV === "development" ? 2 : 0
                    );

                    compilation.emitAsset(
                        "activitypack.json",
                        new sources.RawSource(manifestString)
                    );
                }
            );
        });
    }
}

module.exports = ActivityMetadataWebpackPlugin;
