// @ts-check
"use strict";
const fs = require("fs").promises;
const globby = require("globby");
const path = require("path");
const { adaptActivityMaterial, parseFile } = require("./compilerUtils");
const projPaths = require("../config/paths");

async function generateActivityManifest() {
    const filePaths = await globby(["**/*.{ts,tsx}", "!**/*.d.ts"], {
        cwd: projPaths.projSrc,
    });

    const metadata = [];

    for (const filePath of filePaths) {
        const absPath = path.join(projPaths.projSrc, filePath);
        const contents = await fs.readFile(absPath, "utf-8");

        const materials = parseFile(contents, path.basename(filePath))
            .activities;
        for (const material of materials) {
            metadata.push(adaptActivityMaterial(material));
        }
    }

    const manifest = { activities: metadata };

    await fs.writeFile(
        path.join(projPaths.projBuild, "activities.json"),
        JSON.stringify(manifest)
    );
}

generateActivityManifest();
