"use strict";

const { WebpackError } = require("webpack");

module.exports = class InvalidMetatagsError extends WebpackError {
    /** @param {string} message Error message */
    constructor(message) {
        super(message);
        this.name = "InvalidMetatagsError";
        this.hideStack = true;

        Error.captureStackTrace(this, this.constructor);
    }
};
