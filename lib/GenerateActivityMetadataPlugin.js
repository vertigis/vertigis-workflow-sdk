// @ts-check
"use strict";
const fs = require("fs").promises;
const globby = require("globby");
const path = require("path");
const { Compilation, sources } = require("webpack");
const projPaths = require("../config/paths");
const { getProjectMetadata } = require("./compilerUtils");

const projUuid = require(path.join(projPaths.projRoot, "uuid"));

const pluginName = "ActivityMetadataWebpackPlugin";

function generateActivityManifest() {
    return getProjectMetadata(projUuid);
}

class GenerateActivityMetadataPlugin {
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

module.exports = GenerateActivityMetadataPlugin;
