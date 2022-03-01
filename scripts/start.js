// @ts-check
"use strict";

// Do this as the first thing so that any code reading it knows the right env.
process.env.BABEL_ENV = "development";
process.env.NODE_ENV = "development";

// Makes the script crash on unhandled rejections instead of silently
// ignoring them. In the future, promise rejections that are not handled will
// terminate the Node.js process with a non-zero exit code.
process.on("unhandledRejection", (err) => {
    throw err;
});

const webpack = require("webpack");
const WebpackDevServer = require("webpack-dev-server");
const webpackConfig = require("../config/webpack.config");
const yargs = require("yargs");
const { hideBin } = require("yargs/helpers");

const argv = yargs(hideBin(process.argv)).argv;

const port = process.env.PORT || 5000;

const compiler = webpack(webpackConfig);
const serverConfig = {
    client: {
        logging: "none",
    },
    compress: true,
    headers: {
        "Access-Control-Allow-Origin": "*",
    },
    hot: false,
    server: {
        type: "https",
        options: {
            key: argv.key,
            cert: argv.cert,
            ca: argv.ca,
        },
    },
    host: "localhost",
    open: process.env.SMOKE_TEST !== "true" &&
        process.env.OPEN_BROWSER !== "false" && {
            target: ["main.js"],
        },
    port,
    static: {
        publicPath: "/",
        watch: {
            // Don't bother watching node_modules files for changes. This reduces
            // CPU/mem overhead, but means that changes from `npm install` while the
            // dev server is running won't take effect until restarted.
            ignored: [/node_modules/],
        },
    },
    //stats: "minimal",
};

const devServer = new WebpackDevServer(serverConfig, compiler);
devServer.startCallback((err) => {
    if (err) {
        throw err;
    }
});

["SIGINT", "SIGTERM"].forEach((signal) => {
    process.on(signal, () => {
        devServer.stopCallback(() => {
            process.exit();
        });
    });
});
