// @ts-check
"use strict";
const path = require("path");
const { Project } = require("ts-morph");
const { Compilation, sources } = require("webpack");
const projPaths = require("../config/paths");
const { getProjectMetadata } = require("./compilerUtils");

const projUuid = require(path.join(projPaths.projRoot, "uuid"));

const pluginName = "ActivityMetadataWebpackPlugin";

class GenerateActivityMetadataPlugin {
    apply(compiler) {
        compiler.hooks.thisCompilation.tap(pluginName, (compilation) => {
            compilation.hooks.processAssets.tapPromise(
                {
                    name: pluginName,
                    stage: Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL,
                },
                () => {
                    const project = new Project({
                        tsConfigFilePath: path.join(
                            projPaths.projRoot,
                            "tsconfig.json"
                        ),
                    });
                    const projectExportsFile = project.getSourceFileOrThrow(
                        "index.ts"
                    );
                    const manifest = getProjectMetadata(
                        projectExportsFile,
                        projUuid
                    );
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
