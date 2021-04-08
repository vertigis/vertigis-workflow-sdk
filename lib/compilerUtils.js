// @ts-check
"use strict";

const ts = require("typescript");
const InvalidMetatagsError = require("./InvalidMetatagsError");

// The logic in this module was copied from the GXWF Designer.

function isPublic(flags) {
    if ((flags & ts.ModifierFlags.Protected) > 0) {
        return false;
    }

    if ((flags & ts.ModifierFlags.Private) > 0) {
        return false;
    }

    return true;
}

function isExported(flags) {
    if ((flags & ts.ModifierFlags.Abstract) > 0) {
        return false;
    }

    return (flags & ts.ModifierFlags.Export) > 0;
}

/**
 * @param {ts.Node} node
 * @returns {node is ts.ClassDeclaration}
 */
function isActivityDeclaration(node) {
    if (!ts.isClassDeclaration(node)) {
        return false;
    }
    if (!node.heritageClauses) {
        return false;
    }

    for (const heritageClause of node.heritageClauses) {
        for (const heritageType of heritageClause.types) {
            if (
                heritageType.expression &&
                (heritageType.expression.getText() === "IActivityHandler" ||
                    heritageType.expression.getText() === "AppActivity" ||
                    heritageType.expression.getText() ===
                        "RegisterCustomFormElementBase")
            ) {
                return true;
            }
        }
    }

    return false;
}

function getTrivia(node, file) {
    const length = node.getLeadingTriviaWidth(file);
    const text = file.getFullText().substr(node.pos, length);
    const triviaRaw = text.match(/\S+/g);
    if (!triviaRaw) {
        return [];
    }

    return triviaRaw.filter((x) => x[0] !== "/" && x[0] !== "*");
}

function getSummary(trivia) {
    let leading = true;
    return trivia.filter((x) => leading && (leading = x[0] !== "@")).join(" ");
}

function getName(node) {
    if (ts.isIdentifier(node)) {
        return node.text;
    }

    let name;
    if (ts.isClassDeclaration(node)) {
        name = node.name;
        if (name && ts.isIdentifier(name)) {
            return name.text;
        }
    }

    if (ts.isMethodDeclaration(node)) {
        name = node.name;
        if (name && ts.isIdentifier(name)) {
            return name.text;
        }
    }

    if (ts.isParameter(node)) {
        name = node.name;
        if (ts.isIdentifier(name)) {
            return name.text;
        }
    }

    if (ts.isPropertySignature(node)) {
        name = node.name;
        if (ts.isIdentifier(name)) {
            return name.text;
        }
    }

    if (ts.isTypeReferenceNode(node)) {
        name = node.typeName;
        if (ts.isIdentifier(name)) {
            if (node.typeArguments) {
                if (
                    name.text === "Deferrable" ||
                    name.text === "Promise" ||
                    name.text === "PromiseLike"
                ) {
                    const typeArg = node.typeArguments[0];
                    if (ts.isTypeReferenceNode(typeArg)) {
                        const name = typeArg.typeName;
                        if (ts.isIdentifier(name)) {
                            return name.text;
                        }
                    }
                }
            }

            return name.text;
        }
    }
}

function getMembersOf(node, lookup, file) {
    const result = [];
    if (node) {
        let type;
        if (ts.isParameter(node)) {
            type = lookup[getName(node.type)]; // enable-ts-strict
        }

        if (ts.isTypeReferenceNode(node)) {
            type = lookup[getName(node)]; // enable-ts-strict
        }

        if (type) {
            for (const member of type.members) {
                if (ts.isPropertySignature(member) && member.type) {
                    const typeRef = member.type;
                    const trivia = getTrivia(member, file);
                    result.push({
                        name: getName(member),
                        type: type
                            ? file
                                  .getFullText()
                                  .substr(
                                      typeRef.pos,
                                      typeRef.end - typeRef.pos
                                  )
                                  .trim()
                            : undefined,
                        summary: getSummary(trivia),
                        meta: getMeta(trivia),
                        tags: getTags(trivia),
                    });
                }
            }
        }
    }

    return result;
}

function getMeta(trivia) {
    let key;
    const result = {};
    const builder = [];

    function add() {
        if (key && key !== "tag") {
            var list = result[key] || (result[key] = []);
            list.push(builder.join(" "));
        }

        builder.length = 0;
        key = word.substr(1);
    }

    for (var word of trivia) {
        if (word[0] === "@") {
            add();
        } else {
            builder.push(word);
        }
    }

    if (key) {
        add();
    }

    return result;
}

function getTags(trivia) {
    let key;
    const builder = [];
    const result = {};
    function add() {
        if (key === "tag") {
            var name;
            for (var item of builder) {
                if (name) {
                    var list = result[name] || (result[name] = []);
                    list.push(item);
                    name = undefined;
                } else {
                    name = item;
                }
            }
        }

        builder.length = 0;
        key = word.substr(1);
    }

    for (var word of trivia) {
        if (word[0] === "@") {
            add();
        } else {
            builder.push(word);
        }
    }

    if (key) {
        add();
    }

    return result;
}

function getFirst(stuff) {
    return Array.isArray(stuff) ? stuff[0] : undefined;
}

/**
 * Separates out comma-separated values defined across multiple strings.
 * Output has no duplicates. When no values are found, output is undefined.
 * @param strings An array of strings to parse.
 */
function parseCommaSeparatedValues(strings) {
    const result = [];
    if (strings) {
        for (const entry of strings) {
            const itemsInEntry = entry.trim().split(/\s*,\s*/);
            for (const item of itemsInEntry) {
                if (item && result.indexOf(item) === -1) {
                    result.push(item);
                }
            }
        }
    }
    return result.length > 0 ? result : undefined;
}

function addCamelSpace(text) {
    if (!text) {
        // enable-ts-strict - Returning 'text' here in case text is an empty string. We'd
        // be changing existing behaviour otherwise.
        return text;
    }

    // Add spaces where we see an inflection of casing.
    const result = text.replace(/[a-z][A-Z]|.[A-Z][a-z]/g, function (value) {
        return value.substr(0, 1) + " " + value.substr(1);
    });

    // Make the first character upper case.
    return result.substr(0, 1).toUpperCase() + result.substr(1);
}

const incompatibleMetatags = [
    ["supportedApps", "unsupportedApps"],
    ["clientOnly", "serverOnly"],
];

function validateMetatags(meta, itemType) {
    if (!meta) {
        return;
    }
    for (const pair of incompatibleMetatags) {
        if (meta[pair[0]] && meta[pair[1]]) {
            throw new InvalidMetatagsError(
                `You cannot include the @${pair[0]} and @${pair[1]} metatags on the same ${itemType}.`
            );
        }
    }
}

function adaptArgumentMaterial(material) {
    validateMetatags(material.meta, "activity input");

    const name =
        getFirst(material.meta && material.meta.name) || material.name || "";

    return {
        name: name,
        displayName:
            getFirst(material.meta && material.meta.displayName) ||
            addCamelSpace(name) ||
            "",
        description: getFirst(material.meta && material.meta.description) || "",
        placeholder: getFirst(material.meta && material.meta.placeholder) || "",
        typeName: material.type,
        defaultValue:
            getFirst(material.meta && material.meta.defaultValue) || "",
        defaultExpressionHint:
            getFirst(material.meta && material.meta.defaultExpressionHint) ||
            "",
        isRequired: material.meta && material.meta.required ? true : false,
        noExpressions:
            material.meta && material.meta.noExpressions ? true : false,
        deprecated: getFirst(material.meta && material.meta.deprecated),
        supportedApps: parseCommaSeparatedValues(
            material.meta && material.meta.supportedApps
        ),
        unsupportedApps: parseCommaSeparatedValues(
            material.meta && material.meta.unsupportedApps
        ),
        clientOnly: material.meta && material.meta.clientOnly ? true : void 0,
        serverOnly: material.meta && material.meta.serverOnly ? true : void 0,
    };
}

function parseFile(sourceText, fileName, suiteUuid) {
    if (!fileName || typeof fileName !== "string") {
        fileName = "activity.ts";
    }

    fileName = fileName.substr(fileName.lastIndexOf("/") + 1);
    const file = ts.createSourceFile(
        fileName,
        sourceText,
        ts.ScriptTarget.ES5,
        // Set parent nodes. This allows functions like `getText()` to walk up
        // the node tree and find the root `sourceFile`. Without setting this,
        // `sourceFile` won't be found and those functions will throw.
        true
    );

    const activities = [];
    const types = {};
    for (const statement of file.statements) {
        if (
            ts.isInterfaceDeclaration(statement) &&
            isExported(ts.getCombinedModifierFlags(statement))
        ) {
            types[statement.name.text] = statement;
        }

        if (
            isActivityDeclaration(statement) &&
            isExported(ts.getCombinedModifierFlags(statement))
        ) {
            let action;
            let suite;
            let execute;
            for (let member of statement.members) {
                if (isPublic(ts.getCombinedModifierFlags(member))) {
                    const name = member.name;
                    if (name && ts.isIdentifier(name)) {
                        if (
                            ts.isMethodDeclaration(member) &&
                            name.text === "execute"
                        ) {
                            execute = member;
                        }

                        const initializer = ts.isPropertyDeclaration(member)
                            ? member.initializer
                            : undefined;
                        if (initializer && ts.isStringLiteral(initializer)) {
                            if (name.text === "action") {
                                action = initializer.text;
                            }

                            if (name.text === "suite") {
                                suite = initializer.text;
                            }
                        }
                    }
                }
            }

            if (execute) {
                let trivia = getTrivia(statement, file);
                activities.push({
                    action:
                        action ||
                        `uuid:${suiteUuid}::${statement.name.getText()}`,
                    suite: suite || `uuid:${suiteUuid}`,
                    name: getName(statement),
                    type: getName(statement),
                    inputs: getMembersOf(execute.parameters[0], types, file),
                    outputs: getMembersOf(execute.type, types, file),
                    summary: getSummary(trivia),
                    meta: getMeta(trivia),
                    tags: getTags(trivia),
                });
            }
        }
    }

    return { activities: activities };
}

function adaptActivityMaterial(material) {
    validateMetatags(material.meta, "activity");

    const inputs = {};
    const outputs = {};
    const result = {
        action: material.action,
        suite: material.suite,
        defaultName: getFirst(material.meta.defaultName),
        displayName:
            getFirst(material.meta && material.meta.displayName) ||
            addCamelSpace(material.name) ||
            "",
        description: getFirst(material.meta && material.meta.description) || "",
        category:
            getFirst(material.meta && material.meta.category) || "Default",
        tags: material.tags,
        inputs: inputs,
        outputs: outputs,
        helpUrl: getFirst(material.meta.helpUrl),
        deprecated: getFirst(material.meta && material.meta.deprecated),
        supportedApps: parseCommaSeparatedValues(
            material.meta && material.meta.supportedApps
        ),
        unsupportedApps: parseCommaSeparatedValues(
            material.meta && material.meta.unsupportedApps
        ),
        onlineOnly:
            material.meta && material.meta.onlineOnly ? true : undefined,
        clientOnly:
            material.meta && material.meta.clientOnly ? true : undefined,
        serverOnly:
            material.meta && material.meta.serverOnly ? true : undefined,
    };

    for (const input of material.inputs) {
        inputs[input.name] = adaptArgumentMaterial(input);
    }

    for (const output of material.outputs) {
        outputs[output.name] = adaptArgumentMaterial(output);
    }

    return result;
}

module.exports = {
    adaptActivityMaterial,
    isActivityDeclaration,
    parseFile,
};
