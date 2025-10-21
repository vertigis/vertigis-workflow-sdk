// @ts-check
"use strict";

import paths from "@vertigis/sdk-library/config/paths.js";
import { merge } from "webpack-merge";

import GenerateActivityMetadataPlugin from "@vertigis/sdk-library/lib/workflow/GenerateActivityMetadataPlugin.js";
import baseConfig from "@vertigis/sdk-library/config/webpack.base.config.js";

export { merge };

export default merge(baseConfig, {
    externals: [
        /^dojo\/.+$/,
        /^esri\/.+$/,
        /^@arcgis\/.+$/,
        /^@geocortex\/.+$/,
        /^@vertigis\/(?!reporting-client).+$/,
        "react",
        "react-dom",
    ],
    module: {
        rules: [
            {
                test: /\.(js|jsx|ts|tsx)$/i,
                include: paths.projSrc,
                loader: "activityLoader",
            },
        ],
    },
    plugins: [new GenerateActivityMetadataPlugin()],
    resolveLoader: {
        modules: [
            "node_modules/@vertigis/workflow-sdk/node_modules/@vertigis/sdk-library/node_modules",
            "node_modules/@vertigis/workflow-sdk/node_modules/@vertigis/sdk-library/lib/workflow",
            "node_modules/@vertigis/sdk-library/node_modules",
            "node_modules/@vertigis/sdk-library/lib/workflow",
            "node_modules",
            "lib/workflow",
        ],
    },
});
