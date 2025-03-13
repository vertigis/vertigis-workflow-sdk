// @ts-check
"use strict";

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const dirName = path.dirname(fileURLToPath(import.meta.url));
const moduleFileExtensions = [".tsx", ".ts", ".jsx", ".js", ".json"];
// This assumes that commands are always run from project root.
const projRoot = process.cwd();

// Resolve file paths in the same order as webpack
const resolveModule = (resolveFn, filePath) => {
    const extension = moduleFileExtensions.find(extension => fs.existsSync(resolveFn(`${filePath}${extension}`)));

    if (extension) {
        return resolveFn(`${filePath}${extension}`);
    }

    return resolveFn(`${filePath}.js`);
};
const resolveProj = relativePath => path.resolve(projRoot, relativePath);
// Up 1 from "config/"
const resolveOwn = relativePath => path.resolve(dirName, "..", relativePath);

export default {
    projBuild: resolveProj("build"),
    projEntry: resolveModule(resolveProj, "src/main"),
    projRoot: resolveProj("."),
    projSrc: resolveProj("src"),
    ownPath: resolveOwn("."),
    moduleFileExtensions,
};
