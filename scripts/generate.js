// @ts-check
"use strict";

const fs = require("fs").promises;
const inquirer = require("inquirer");
const path = require("path");
const paths = require("../config/paths");

(async function () {
    try {
        const answers = await inquirer.prompt([
            {
                type: "list",
                name: "type",
                message: "What would you like to create?",
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
                message: "What is the name?",
                validate: function (value) {
                    const pass = value.match(/^\w+$/i);

                    if (!pass) {
                        return "Please enter a valid name (letters, numbers, and underscores are allowed)";
                    }

                    return true;
                },
            },
            {
                type: "input",
                name: "description",
                message: "What is the description?",
            },
        ]);

        console.log(answers);

        const projUuid = require(path.join(paths.projRoot, "uuid"));

        if (answers.type === "activity") {
            const indexPath = path.join(paths.projSrc, "index.ts");

            let [templateContent, indexContent] = await Promise.all([
                fs.readFile(
                    path.join(__dirname, "../lib/templates/activity.ts"),
                    "utf-8"
                ),
                fs.readFile(indexPath, "utf-8"),
            ]);

            templateContent = templateContent
                .replace(/<uuid>/g, projUuid)
                .replace(/(<name>|Foo)/g, answers.name)
                .replace(/<description>/g, answers.description);

            indexContent = indexContent += `\nexport * from "./activities/${answers.name}"\n`;

            const destFolder = path.join(paths.projSrc, "activities");
            await fs.mkdir(destFolder, { recursive: true });

            await Promise.all([
                fs.writeFile(
                    path.join(destFolder, `${answers.name}.ts`),
                    templateContent
                ),
                fs.writeFile(indexPath, indexContent),
            ]);
        }
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
})();
