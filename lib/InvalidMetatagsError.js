"use strict";

import webpack from "webpack";

class InvalidMetatagsError extends webpack.WebpackError {
    /** @param {string} message Error message */
    constructor(message) {
        super(message);
        this.name = "InvalidMetatagsError";
        this.hideStack = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

export default InvalidMetatagsError;
