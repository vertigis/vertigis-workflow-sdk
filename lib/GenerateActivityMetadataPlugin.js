// @ts-check
"use strict";

import * as path from "path";
import { Project } from "ts-morph";
import webpack from "webpack";
import { pathToFileURL } from "url";

import projPaths from "../config/paths.js";
import { getProjectMetadata } from "./compilerUtils.js";

/**
 * @type {string}
 */
const projUuid = (await import(pathToFileURL(path.join(projPaths.projRoot, "uuid.js")).href)).default;

const pluginName = "ActivityMetadataWebpackPlugin";

class GenerateActivityMetadataPlugin {
    apply(compiler) {
        compiler.hooks.thisCompilation.tap(pluginName, compilation => {
            compilation.hooks.processAssets.tap(
                {
                    name: pluginName,
                    stage: webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL,
                },
                () => {
                    const project = new Project({
                        tsConfigFilePath: path.join(projPaths.projRoot, "tsconfig.json"),
                    });
                    const projectExportsFile = project.getSourceFileOrThrow("index.ts");
                    let manifest;
                    try {
                        manifest = getProjectMetadata(projectExportsFile, projUuid);
                    } catch (/** @type {any} */ err) {
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

                    compilation.emitAsset("activitypack.json", new webpack.sources.RawSource(manifestString));
                }
            );
        });
    }
}

export default GenerateActivityMetadataPlugin;
