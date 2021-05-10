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
            compilation.hooks.processAssets.tap(
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
                    const projectExportsFile =
                        project.getSourceFileOrThrow("index.ts");
                    let manifest;
                    try {
                        manifest = getProjectMetadata(
                            projectExportsFile,
                            projUuid
                        );
                    } catch (err) {
                        // We rearrange the properties a bit here because webpack logs it as:
                        //   ERROR in ${err.message}
                        //   ${err.details}
                        err.details = err.message;
                        err.message = pluginName;
                        compilation.errors.push(err);
                    }

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
