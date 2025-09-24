// @ts-check
"use strict";

import sdkGenerate from "@vertigis/sdk-library/scripts/generate.js";
import chalk from "chalk";
import path from "path";
import { fileURLToPath } from "url";

try {
    console.log("starting generate");
    const dirName = path.dirname(fileURLToPath(import.meta.url));
    const destFile = await sdkGenerate(dirName);
    console.log(chalk.green(`Created new activity at ${destFile}`));
} catch (e) {
    console.error(e);
    process.exit(1);
}
