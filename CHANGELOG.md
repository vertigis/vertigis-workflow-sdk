# Changelog

## [6.1.1] - 2026-07-30

### Fixed

- Fix `build` failure in projects that install the SDK from npm (introduced in 6.1.0)
- Fix the versions in the banner comment of the `start` output

## [6.1.0] - 2026-07-29

### Added

- Add a banner comment to `build/main.js` with the library ID and the versions of Workflow, the Workflow SDK, and `@vertigis/sdk-library`
- Add `allowScripts` to `package.json` in new projects to stop the install scripts of `@mui/x-telemetry` and `@vaadin/vaadin-usage-statistics`

### Removed

- Remove the React 18 `overrides` for `@vertigis/react-ui` from new projects
- Remove `baseUrl` from `tsconfig.json` in new projects

## [6.0.0] - 2026-01-20

_To upgrade a project, run `npx @vertigis/workflow-sdk@latest upgrade` in the project folder. Then move your custom ESLint rules from `.eslintrc.js` to `eslint.config.js`._

### Changed

- **Breaking:** Read the project ID from `uuid.cjs` instead of `uuid.js`
- **Breaking:** Use ESLint 9 and `eslint.config.js` instead of `.eslintrc.js`
- **Breaking:** Change projects to ES modules (`"type": "module"`)
- **Breaking:** Set `noImplicitAny` to `true` in the TypeScript configuration
- Set `strictNullChecks` and `strictFunctionTypes` to `false` in the TypeScript configuration
- Target ES2022 instead of ES2018 in new projects
- Use `inline-source-map` by default instead of `eval-source-map` in `start`
- Add the recommended `eslint-plugin-import` rules to the ESLint configuration
- Show all ESLint problems as warnings

### Added

- Add the `upgrade` command
- Add the `--port` and `--type` options to `start`
- Add support for a `webpack.config.js` file in the project folder, which `build` and `start` use if it exists
- Add the `DEV_TOOL` environment variable to set the webpack `devtool` in `start`
- Add the `lint` script to new projects

### Removed

- **Breaking:** Remove `config/.eslintrc`

## [5.1.3] - 2025-09-22

### Added

- Add the `--host` and `--allowed-hosts` options to `start`

### Fixed

- Fix `start` on `localhost` with new versions of `webpack-dev-server` by setting `allowedHosts` to `all` by default

## [5.1.2] - 2025-06-16

### Fixed

- Fix the React version in new projects by setting React 18 for `@vertigis/react-ui`

## [5.1.1] - 2025-03-20

### Fixed

- Fix the install of the SDK by correcting the invalid `webpack` version range from 5.1.0
- Fix the ESLint error about the missing `only-warn` plugin

## [5.1.0] - 2025-03-13

### Changed

- Require Node.js 18 or later and npm 8 or later
- Use the `react-jsx` JSX transform in the TypeScript configuration
- Change the TypeScript `lib` from ES2018 to ES2022
- Use `main` as the default branch of the Git repository that `create` makes

### Added

- Add a Prettier configuration and a `prettier` script to new projects

### Removed

- Remove support for Internet Explorer 11 by building for the browsers in `browserslist` instead of ES5

## [5.0.0] - 2024-03-28

### Changed

- **Breaking:** Bump `webpack-dev-server` from 4 to 5 and `postcss-loader` from 7 to 8, which require Node.js 18.12 or later
- Bump `typescript` from 4 to 5 in new projects
- Bump `@typescript-eslint/eslint-plugin` and `@typescript-eslint/parser` from 6 to 7

### Removed

- Remove `suppressImplicitAnyIndexErrors` from the TypeScript configuration because TypeScript 5 does not support it

[6.1.1]: https://github.com/vertigis/vertigis-workflow-sdk/releases/tag/v6.1.1
[6.1.0]: https://github.com/vertigis/vertigis-workflow-sdk/releases/tag/v6.1.0
[6.0.0]: https://github.com/vertigis/vertigis-workflow-sdk/releases/tag/v6.0.0
[5.1.3]: https://github.com/vertigis/vertigis-workflow-sdk/releases/tag/v5.1.3
[5.1.2]: https://github.com/vertigis/vertigis-workflow-sdk/releases/tag/v5.1.2
[5.1.1]: https://github.com/vertigis/vertigis-workflow-sdk/releases/tag/v5.1.1
[5.1.0]: https://github.com/vertigis/vertigis-workflow-sdk/releases/tag/v5.1.0
[5.0.0]: https://github.com/vertigis/vertigis-workflow-sdk/releases/tag/v5.0.0
