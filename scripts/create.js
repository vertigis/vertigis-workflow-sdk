// @ts-check
"use strict";

import chalk from "chalk";
import * as spawn from "cross-spawn";
import * as fs from "fs";
import fsExtra from "fs-extra";
import * as path from "path";
import { fileURLToPath } from "url";

const { copySync, moveSync } = fsExtra;
const dirName = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(dirName, "..");
const createIndex = process.argv.findIndex(s => s.includes("create"));
const directoryName = process.argv[createIndex + 1];
const directoryPath = path.resolve(directoryName);

const checkSpawnSyncResult = syncResult => {
    if (syncResult.status !== 0) {
        process.exit(1);
    }
};

const checkDirectoryPath = projectPath => {
    if (!/^[\w-]+$/.test(path.basename(projectPath))) {
        console.error(
            chalk.red(
                `Cannot create new project at ${chalk.green(
                    projectPath
                )} as the directory name is not valid. Letters, numbers, dashes and underscores are allowed.\n`
            )
        );
        process.exit(1);
    }

    // Exclamation points are not permitted in the path as it's reserved for
    // webpack loader syntax.
    if (/[!]/.test(projectPath)) {
        console.error(
            chalk.red(
                `Cannot create new project at ${chalk.green(
                    projectPath
                )} as the path is not valid. Exclamation points (!) are not allowed in the file system path.\n`
            )
        );
        process.exit(1);
    }

    if (fs.existsSync(projectPath) && fs.readdirSync(projectPath).length > 0) {
        console.error(chalk.red(`Cannot create new project at ${chalk.green(projectPath)} as it already exists.\n`));
        process.exit(1);
    }
};

/**
 * @param { string } projectPath
 */
const copyTemplate = projectPath => {
    console.log(`Creating new project at ${chalk.green(projectPath)}`);

    copySync(path.join(rootDir, "template"), projectPath, {
        errorOnExist: true,
        overwrite: false,
    });
    copySync(path.join(rootDir, "config/tsconfig.json.template"), path.join(projectPath, "tsconfig.json"), {
        errorOnExist: true,
        overwrite: false,
    });
    // Rename gitignore after the fact to prevent npm from renaming it to .npmignore
    // See: https://github.com/npm/npm/issues/1862
    moveSync(path.join(projectPath, "gitignore"), path.join(projectPath, ".gitignore"));
};

/**
 * @param { string } projectPath
 */
const updateTemplateContent = projectPath => {
    const uuid = crypto.randomUUID();

    const filesToUpdate = [path.join(projectPath, "uuid.js")];

    for (const fileToUpdate of filesToUpdate) {
        const contents = fs.readFileSync(fileToUpdate, { encoding: "utf8" });
        const newContents = contents.replace(/<uuid>/g, uuid);
        fs.writeFileSync(fileToUpdate, newContents);
    }
};

const installNpmDeps = projectPath => {
    console.log(`Installing packages. This might take a couple of minutes.\n`);

    /**
     * @type { string }
     */
    const selfVersion = JSON.parse(
        fs.readFileSync(path.join(rootDir, "package.json"), {
            encoding: "utf-8",
        })
    ).version;

    // First install existing deps.
    checkSpawnSyncResult(
        spawn.sync("npm", ["install"], {
            cwd: projectPath,
            stdio: "inherit",
        })
    );

    // Install React 18 first to match @vertigis/workflow peer dependencies.
    checkSpawnSyncResult(
        spawn.sync("npm", ["install", "--save", "react@^18.3.0", "react-dom@^18.3.0"], {
            cwd: projectPath,
            stdio: "inherit",
        })
    );

    // Add SDK package.
    checkSpawnSyncResult(
        spawn.sync(
            "npm",
            [
                "install",
                "--save-dev",
                "--save-exact",
                "@vertigis/workflow",
                process.env.SDK_LOCAL_DEV === "true" ? process.cwd() : `@vertigis/workflow-sdk@${selfVersion}`,
                process.env.SDK_LOCAL_DEV === "true" ? "ts-loader" : "",
            ],
            {
                cwd: projectPath,
                stdio: "inherit",
            }
        )
    );
};

/**
 * Initialize newly cloned directory as a git repo
 *
 * @param { string } projectPath
 */
const gitInit = projectPath => {
    console.log(`Initializing git in ${projectPath}\n`);
    spawn.sync(`git init -b main`, { cwd: projectPath }).status;
};

const printSuccess = () => {
    console.log(`${chalk.green("Success!")} Created ${directoryName} at ${directoryPath}\n`);
    console.log("Inside that directory, you can run several commands:\n");
    console.log(chalk.cyan(`  npm run generate`));
    console.log("    Generate new activities and form elements.\n");
    console.log(chalk.cyan(`  npm start`));
    console.log("    Starts the development server.\n");
    console.log(chalk.cyan(`  npm run build`));
    console.log("    Bundles the app into static files for production.\n");
    console.log("We suggest that you begin by typing:\n");
    console.log(chalk.cyan(`  cd ${directoryName}`));
    console.log(chalk.cyan("  npm start\n"));
    console.log("You can learn more by visiting https://developers.vertigisstudio.com/docs/workflow/sdk-web-overview/");
};

checkDirectoryPath(directoryPath);
copyTemplate(directoryPath);
updateTemplateContent(directoryPath);
installNpmDeps(directoryPath);
gitInit(directoryPath);
printSuccess();
