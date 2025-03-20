// @ts-check
"use strict";

import * as crypto from "crypto";
import { CleanWebpackPlugin } from "clean-webpack-plugin";
import path from "path";
import { fileURLToPath } from "url";
import webpack from "webpack";

import paths from "./paths.js";
import GenerateActivityMetadataPlugin from "../lib/GenerateActivityMetadataPlugin.js";

const isEnvProduction = process.env.NODE_ENV === "production";

// Generate random identifier to ensure uniqueness in the application. This is
// especially important to avoid collisions when multiple webpack runtimes are
// in the same document, such as Web's runtime and this library's runtime.
const libId = crypto.randomBytes(8).toString("hex");
const dirName = path.dirname(fileURLToPath(import.meta.url));

/**
 * @type { webpack.Configuration }
 */
export default {
    mode: isEnvProduction ? "production" : "development",
    context: paths.projRoot,
    devtool: isEnvProduction ? false : "eval-source-map",
    // Disable perf hints as it's mostly out of the developer's control as we
    // only allow one chunk.
    performance: false,
    resolve: {
        extensions: paths.moduleFileExtensions,
    },
    entry: paths.projEntry,
    externals: [
        /^dojo\/.+$/,
        /^esri\/.+$/,
        /^@arcgis\/.+$/,
        /^@geocortex\/.+$/,
        /^@vertigis\/(?!reporting-client).+$/,
        "react",
        "react-dom",
    ],
    output: {
        // Technically this shouldn't be needed as we restrict the library to
        // one chunk, but we set this here just to be extra safe against
        // collisions.
        chunkLoadingGlobal: libId,
        libraryTarget: "amd",
        publicPath: "/",
        path: paths.projBuild,
        // There will be one main bundle, and one file per asynchronous chunk.
        // In development, it does not produce real files.
        filename: "[name].js",
    },
    module: {
        parser: {
            javascript: {
                exportsPresence: "error",
            },
        },
        rules: [
            {
                // "oneOf" will traverse all following loaders until one will
                // match the requirements.
                oneOf: [
                    // Embeds assets smaller than the specified limit (Infinity
                    // in our case) as data URLs.
                    {
                        test: /\.(png|jpe?g|gif|svg|eot|ttf|woff|woff2)$/i,
                        loader: "url-loader",
                        options: {
                            esModule: true,
                        },
                    },
                    // Process application JS with Babel.
                    // The preset includes JSX, Flow, TypeScript, and some ESnext features.
                    {
                        test: /\.(js|jsx|ts|tsx)$/i,
                        include: paths.projSrc,
                        loader: "ts-loader",
                        options: {
                            // Needed by e2e tests.
                            compilerOptions: {
                                noEmit: false,
                            },
                            context: paths.projRoot,
                        },
                    },
                    {
                        test: /\.css$/i,
                        sideEffects: true,
                        use: [
                            {
                                loader: "style-loader",
                                options: {
                                    esModule: true,
                                },
                            },
                            {
                                loader: "css-loader",
                                options: {
                                    // How many loaders before "css-loader" should be applied to "@import"ed resources
                                    importLoaders: 1,
                                },
                            },
                            {
                                // Adds vendor prefixing based on your specified browser support in
                                // package.json
                                loader: "postcss-loader",
                                options: {
                                    postcssOptions: {
                                        plugins: ["postcss-preset-env"],
                                    },
                                },
                            },
                        ],
                    },
                ],
            },
            {
                test: /\.(js|jsx|ts|tsx)$/i,
                include: paths.projSrc,
                loader: path.join(dirName, "../lib/activityLoader.js"),
            },
        ],
    },
    plugins: [
        // Define process.env variables that should be made available in source code.
        new webpack.DefinePlugin({
            "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV),
        }),

        new webpack.optimize.LimitChunkCountPlugin({ maxChunks: 1 }),

        new GenerateActivityMetadataPlugin(),

        isEnvProduction && new CleanWebpackPlugin(),
    ].filter(Boolean),
};
