// @ts-check
"use strict";

import { createWrappedNode, ts } from "ts-morph";
import * as path from "path";
import { pathToFileURL } from "url";

import paths from "../config/paths.js";
import { isActivityDeclaration } from "./compilerUtils.js";

/**
 * Inject required members into activity class declarations.
 * @param {string} content The raw module source
 * @returns {Promise<string>}
 */
export default async function (content) {
    const sourceFile = ts.createSourceFile("activity.ts", content, ts.ScriptTarget.ES5, true);

    /**
     * @param {ts.ClassDeclaration} node
     * @param {string} source
     * @param {string} addition
     */
    function inject(node, source, addition) {
        // Inject just before the closing brace.
        const injectIndex = node.end - 1;
        return source.substring(0, injectIndex) + addition + source.substring(injectIndex);
    }

    for (const node of sourceFile.statements) {
        if (isActivity(node)) {
            if (!node.name) {
                throw new Error("Activity classes need to be named. `export default class ...` is not permitted.");
            }

            const needsAction = !node.members.find(member => member.name && member.name.getText() === "action");
            const needsSuite = !node.members.find(member => member.name && member.name.getText() === "suite");

            if (needsAction) {
                content = inject(
                    node,
                    content,
                    `\nstatic action = "uuid:${await getProjectUuid()}::${node.name.getText()}"\n`
                );
            }
            if (needsSuite) {
                content = inject(node, content, `\nstatic suite = "uuid:${await getProjectUuid()}"\n`);
            }
        }
    }

    return content;
}

/**
 * @returns {Promise<string>}
 */
async function getProjectUuid() {
    return (await import(pathToFileURL(path.join(paths.projRoot, "uuid.js")).href)).default;
}

/**
 * @param {ts.Node} node
 * @returns {node is ts.ClassDeclaration}
 */
function isActivity(node) {
    return isActivityDeclaration(createWrappedNode(node));
}
