// @ts-check
"use strict";

const { createWrappedNode, ts } = require("ts-morph");
const path = require("path");
const paths = require("../config/paths");
const { isActivityDeclaration } = require("./compilerUtils");

const projUuid = require(path.join(paths.projRoot, "uuid"));

/**
 * Inject required members into activity class declarations.
 * @param {string} content The raw module source
 */
module.exports = function (content) {
    const sourceFile = ts.createSourceFile(
        "activity.ts",
        content,
        ts.ScriptTarget.ES5,
        true
    );

    for (const node of sourceFile.statements) {
        if (isActivity(node)) {
            if (!node.name) {
                throw new Error(
                    "Activity classes need to be named. `export default class ...` is not permitted."
                );
            }

            const needsAction = !node.members.find(
                (member) => member.name && member.name.getText() === "action"
            );
            const needsSuite = !node.members.find(
                (member) => member.name && member.name.getText() === "suite"
            );

            function inject(source, addition) {
                // Inject just before the closing brace.
                const injectIndex = node.end - 1;
                return (
                    source.substr(0, injectIndex) +
                    addition +
                    source.substr(injectIndex)
                );
            }

            if (needsAction) {
                content = inject(
                    content,
                    `\nstatic action = "uuid:${projUuid}::${node.name.getText()}"\n`
                );
            }
            if (needsSuite) {
                content = inject(
                    content,
                    `\nstatic suite = "uuid:${projUuid}"\n`
                );
            }
        }
    }

    return content;
};

/**
 * @param {ts.Node} node
 * @returns {node is ts.ClassDeclaration}
 */
function isActivity(node) {
    return isActivityDeclaration(createWrappedNode(node));
}
