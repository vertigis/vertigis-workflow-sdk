const path = require("path");

module.exports = {
    extends: [path.join(__dirname, "config", ".eslintrc.js")],
    env: {
        jest: true,
    },
    rules: {
        "@typescript-eslint/no-var-requires": "off",
    },
};
