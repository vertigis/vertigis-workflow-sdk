// @ts-check
"use strict";

import sdkCreate from "@vertigis/sdk-library/scripts/create.js";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Root of the SDK installation where the template is found.
const dirName = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(dirName, "..");

// Target directory name.
const createIndex = process.argv.findIndex(s => s.includes("create"));
const directoryName = process.argv[createIndex + 1];

sdkCreate(rootDir, directoryName, "workflow");
