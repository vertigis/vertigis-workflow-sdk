// @ts-check
"use strict";
const fs = require("fs").promises;
const globby = require("globby");
const path = require("path");
const { Compilation, sources } = require("webpack");
const projPaths = require("../config/paths");
const { adaptActivityMaterial, parseFile } = require("./compilerUtils");

const projUuid = require(path.join(projPaths.projRoot, "uuid"));

const pluginName = "ActivityMetadataWebpackPlugin";

async function generateActivityManifest() {
    const filePaths = await globby(["**/*.{ts,tsx}", "!**/*.d.ts"], {
        cwd: projPaths.projSrc,
    });

    const metadata = [];

    for (const filePath of filePaths) {
        const absPath = path.join(projPaths.projSrc, filePath);
        const contents = await fs.readFile(absPath, "utf-8");

        const materials = parseFile(contents, path.basename(filePath), projUuid)
            .activities;
        for (const material of materials) {
            metadata.push(adaptActivityMaterial(material));
        }
    }

    const manifest = { activities: metadata };

    return manifest;
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
                    try {
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
                    } catch (err) {
                        // We rearrange the properties a bit here because webpack logs it as:
                        //   ERROR in ${err.message}
                        //   ${err.details}
                        err.details = err.message;
                        err.message = pluginName;
                        compilation.errors.push(err);
                    }
                }
            );
        });
    }
}

module.exports = GenerateActivityMetadataPlugin;
