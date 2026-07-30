// @ts-check
"use strict";

import paths from "@vertigis/sdk-library/config/paths.js";
import sdkBuild from "@vertigis/sdk-library/scripts/build.js";
import { existsSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import libPackage from "@vertigis/sdk-library/package.json" with { type: "json" };
import webPackage from "@vertigis/workflow/package.json" with { type: "json" };
import sdkPackage from "../package.json" with { type: "json" };

// These needs to be set prior to importing the webpack config. The only way to
// do that with ES modules is by using a dynamic import.
process.env.BABEL_ENV = "production";
process.env.NODE_ENV = "production";

// This information will be included in a banner comment.
process.env.SDK_PLATFORM = "workflow";
process.env.SDK_VERSION = sdkPackage.version;
process.env.SDK_LIBRARY_VERSION = libPackage.version;
process.env.PLATFORM_VERSION = webPackage.version;

// Load the webpack.config.js from the project folder if it exists.
const localWebPackPath = path.join(paths.projRoot, "webpack.config.js");
const webpackConfigUrl = existsSync(localWebPackPath)
    ? pathToFileURL(localWebPackPath).href
    : "../config/webpack.config.js";

const { default: webpackConfig } = await import(webpackConfigUrl);

// Makes the script crash on unhandled rejections instead of silently
// ignoring them. In the future, promise rejections that are not handled will
// terminate the Node.js process with a non-zero exit code.
process.on("unhandledRejection", err => {
    throw err;
});

try {
    await sdkBuild(webpackConfig);
} catch (e) {
    if (e instanceof Error && e.message) {
        console.error(e);
    }
    process.exit(1);
}
