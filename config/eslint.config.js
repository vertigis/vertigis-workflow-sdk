import baseConfig from "@vertigis/sdk-library/config/eslint.base.config.js";
import { defineConfig, globalIgnores } from "eslint/config";

/**
 * Adds rules specific to the Web SDK.
 */
export default defineConfig([
    globalIgnores(["**/*.cjs"]),
    baseConfig,
    {
        name: "vertigis/workflow-sdk/recommended",
        rules: {
            "@typescript-eslint/explicit-function-return-type": "off",
            "@typescript-eslint/no-empty-interface": "off",
            "@typescript-eslint/no-explicit-any": "off",
            "@typescript-eslint/no-unsafe-assignment": "off",
            "@typescript-eslint/no-unsafe-member-access": "off",
            "@typescript-eslint/no-unsafe-call": "off",
            "@typescript-eslint/no-unsafe-return": "off",
            "react/prop-types": "off",
            "react-hooks/rules-of-hooks": "error",
            "react-hooks/exhaustive-deps": "warn",
        },
    },
]);
