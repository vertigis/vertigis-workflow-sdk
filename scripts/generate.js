// @ts-check
"use strict";

import chalk from "chalk";
import fs from "fs/promises";
import inquirer from "inquirer";
import * as path from "path";
import { fileURLToPath } from "url";

import paths from "../config/paths.js";

const generate = async () => {
    const answers = await inquirer.prompt([
        {
            type: "list",
            name: "type",
            message: "What would you like to create",
            choices: [
                {
                    name: "Activity",
                    value: "activity",
                },
                {
                    name: "Form Element",
                    value: "element",
                },
            ],
        },
        {
            type: "input",
            name: "name",
            message: function (answers) {
                return `What is the ${answers.type} name`;
            },
            validate: async function (value) {
                const pass = value.match(/^[A-Z]\w*$/);

                if (!pass) {
                    return "Please enter a valid name in PascalCase (letters, numbers, and underscores are allowed)";
                }

                return true;
            },
        },
        {
            type: "input",
            name: "description",
            message: "What is the description",
        },
    ]);

    const { name, description, type } = answers;

    let templateName;
    let destFolderName;
    let destFilename;

    if (type === "activity") {
        templateName = "activity.ts";
        destFolderName = "activities";
        destFilename = `${name}.ts`;
    } else {
        templateName = "element.tsx";
        destFolderName = "elements";
        destFilename = `${name}.tsx`;
    }

    const destFolder = path.join(paths.projSrc, destFolderName);
    const indexPath = path.join(paths.projSrc, "index.ts");
    const dirName = path.dirname(fileURLToPath(import.meta.url));

    let [templateContent, indexContent] = await Promise.all([
        fs.readFile(path.join(dirName, `../lib/templates/${templateName}`), "utf-8"),
        fs.readFile(indexPath, "utf-8"),
    ]);

    templateContent = templateContent.replace(/(<name>|Foo)/g, name).replace(/<description>/g, description);

    // Replace placeholder default export that is used to prevent isolatedModules error.
    indexContent = indexContent.replace("\nexport default {};", "");

    const exportToken = type === "activity" ? `${name}Activity` : `${name}Registration`;
    indexContent += `\nexport { default as ${exportToken} } from "./${destFolderName}/${name}";\n`;

    await fs.mkdir(destFolder, { recursive: true });

    const destFile = path.join(destFolder, destFilename);

    await Promise.all([fs.writeFile(destFile, templateContent, {}), fs.writeFile(indexPath, indexContent)]);
    return destFile;
};

try {
    console.log("starting generate");
    const destFile = await generate();
    console.log(chalk.green(`Created new activity at ${destFile}`));
} catch (e) {
    console.error(e);
    process.exit(1);
}
