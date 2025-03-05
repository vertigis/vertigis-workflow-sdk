/*
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/en/configuration.html
 */

export default {
    clearMocks: true,
    coverageProvider: "v8",
    testEnvironment: "node",
    transform: {
        "^.+\\.(js|jsx|ts|tsx)$": "babel-jest",
    },
};
