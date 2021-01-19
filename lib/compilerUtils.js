// @ts-check
"use strict";

const path = require("path");
const {
    ClassDeclaration,
    Node,
    Project,
    ts,
    VariableDeclaration,
    Expression,
    ObjectLiteralExpression,
    Symbol,
    JSDoc,
    ArrowFunction,
    FunctionDeclaration,
} = require("ts-morph");
const paths = require("../config/paths");

function getSuite(uuid) {
    return `uuid:${uuid}`;
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

function toPascalCase(text) {
    // Add spaces where we see an inflection of casing.
    const result = text.replace(/[a-z][A-Z]|.[A-Z][a-z]/g, function (value) {
        return value.substr(0, 1) + " " + value.substr(1);
    });

    // Make the first character upper case.
    return result.substr(0, 1).toUpperCase() + result.substr(1);
}

/**
 * @param {Node} node
 * @returns {node is ClassDeclaration}
 */
function isActivityDeclaration(node) {
    if (!Node.isClassDeclaration(node)) {
        return false;
    }

    const extendsExpression = node.getExtends();
    const extendsExpressionText =
        extendsExpression && extendsExpression.getText();
    const implementsExpression = node.getImplements();

    const hasCorrectExtends =
        implementsExpression.some((expression) =>
            expression.getText().includes("IActivityHandler")
        ) ||
        extendsExpressionText === "AppActivity" ||
        extendsExpressionText === "RegisterCustomFormElementBase";

    const hasExcuteMethod = !!node.getMethod("execute");

    return hasCorrectExtends && hasExcuteMethod;
}

/**
 * @param {Node} node
 * @returns {node is VariableDeclaration}
 */
function isElementDeclaration(node) {
    if (!Node.isVariableDeclaration(node)) {
        return false;
    }

    const expression = node.getInitializer();

    if (!isObjectLiteralExpression(expression)) {
        return false;
    }

    const id = expression.getProperty("id");
    const component = expression.getProperty("component");

    return !!(id && id.getType().isString() && component);
}

/**
 * @param {Expression} expression
 * @returns {expression is ObjectLiteralExpression}
 */
function isObjectLiteralExpression(expression) {
    return Node.isObjectLiteralExpression(expression);
}

/**
 *
 * @param {JSDoc[]} jsDocs
 */
function getTagsFromJsDocs(jsDocs) {
    return jsDocs
        .reduce((acc, jsDoc) => acc.concat(jsDoc.getTags()), [])
        .reduce(
            (acc, tag) => ({
                ...acc,
                [tag.getTagName()]: tag.getComment(),
            }),
            {}
        );
}

/**
 *
 * @param {Node} param
 * @param {Symbol[]} properties
 */
function getParameterMetadata(param, properties) {
    const props = {};
    for (const paramProp of properties) {
        const paramName = paramProp.getName();
        const paramType = paramProp.getTypeAtLocation(param).getText();

        /** @type {any} */
        const paramTags = paramProp.compilerSymbol.getJsDocTags().reduce(
            (acc, tag) => ({
                ...acc,
                [tag.name]: tag.text,
            }),
            {}
        );

        const paramMeta = {
            name: paramName,
            description: paramTags.description,
            displayName: paramTags.displayName || toPascalCase(paramName),
            placeholder: paramTags.placeholder,
            typeName: paramType,
            defaultValue: paramTags.defaultValue,
            defaultExpressionHint: paramTags.defaultExpressionHint,
            isRequired: paramTags.hasOwnProperty("required") || undefined,
            noExpressions:
                paramTags.hasOwnProperty("noExpressions") || undefined,
            deprecated: paramTags.hasOwnProperty("deprecated") || undefined,
            supportedApps: parseCommaSeparatedValues(paramTags.supportedApps),
            unsupportedApps: parseCommaSeparatedValues(
                paramTags.unsupportedApps
            ),
            onlineOnly: paramTags.hasOwnProperty("onlineOnly") || undefined,
            clientOnly: paramTags.hasOwnProperty("clientOnly") || undefined,
            serverOnly: paramTags.hasOwnProperty("serverOnly") || undefined,
        };

        props[paramName] = paramMeta;
    }
    return props;
}

/**
 * @param {ClassDeclaration} declaration
 * @param {string} suiteUuid
 */
function getActivityMetadata(declaration, suiteUuid) {
    const actionMember = declaration.getMember("action");
    const suiteMember = declaration.getMember("suite");
    const executeMember = declaration.getMethod("execute");

    const activityName = declaration.getName();
    let action = `uuid:${suiteUuid}::${activityName}`;
    let suite = getSuite(suiteUuid);

    if (actionMember && Node.isStringLiteral(actionMember)) {
        action = actionMember.getLiteralValue();
    }
    if (suiteMember && Node.isStringLiteral(suiteMember)) {
        suite = suiteMember.getLiteralValue();
    }

    const inputParam = executeMember.getParameters()[0];
    const inputType = inputParam && inputParam.getType();
    const returnType = executeMember.getReturnType();
    const inputs = inputType
        ? getParameterMetadata(executeMember, inputType.getProperties())
        : {};
    const outputs = returnType
        ? getParameterMetadata(executeMember, returnType.getProperties())
        : {};
    const activityTags = getTagsFromJsDocs(declaration.getJsDocs());

    return {
        action,
        suite,
        category: activityTags.category || "Custom Activities",
        description: activityTags.description,
        displayName: activityTags.displayName,
        name: activityName,
        inputs,
        outputs,
        helpUrl: activityTags.helpUrl,
        deprecated: activityTags.hasOwnProperty("deprecated") || undefined,
        supportedApps: parseCommaSeparatedValues(activityTags.supportedApps),
        unsupportedApps: parseCommaSeparatedValues(
            activityTags.unsupportedApps
        ),
        onlineOnly: activityTags.hasOwnProperty("onlineOnly") || undefined,
        clientOnly: activityTags.hasOwnProperty("clientOnly") || undefined,
        serverOnly: activityTags.hasOwnProperty("serverOnly") || undefined,
    };
}

/**
 * @param {VariableDeclaration} registrationDeclaration
 * @param {string} suiteUuid
 */
function getElementMetadata(registrationDeclaration, suiteUuid) {
    const registrationObjectExpression = /** @type {ObjectLiteralExpression} */ (registrationDeclaration.getInitializer());

    /**
     * @param {ObjectLiteralExpression} regObject
     */
    function getElementId(regObject) {
        const idPropertyAssignment = regObject
            .getPropertyOrThrow("id")
            .getSymbolOrThrow()
            .getValueDeclarationOrThrow();
        if (!Node.isPropertyAssignment(idPropertyAssignment)) {
            throw new Error(
                `Must directly assign value to "id" property of element registration. Ex. id: "foo". Received:\n${registrationDeclaration.print()}`
            );
        }
        const idStringLiteral = idPropertyAssignment.getInitializerOrThrow();
        if (!Node.isStringLiteral(idStringLiteral)) {
            throw new Error(
                `Value of "id" property of element registration must be a string literal. Ex. id: "foo". Received:\n${registrationDeclaration.print()}`
            );
        }
        return idStringLiteral.getLiteralValue();
    }

    /**
     *
     * @param {ClassDeclaration | VariableDeclaration | FunctionDeclaration} propAssignment
     * @returns {ArrowFunction | FunctionDeclaration | ClassDeclaration}
     */
    function getComponentDeclarationFromPropertyValue(propAssignment) {
        if (Node.isVariableDeclaration(propAssignment)) {
            const componentFunctionDeclaration = componentPropertyValue
                .getType()
                .getCallSignatures()[0]
                .getDeclaration();

            if (
                !Node.isFunctionDeclaration(componentFunctionDeclaration) &&
                !Node.isArrowFunction(componentFunctionDeclaration)
            ) {
                throw new Error(
                    "Component property of element registration isn't a function or class component."
                );
            }

            return componentFunctionDeclaration;
        }

        return propAssignment;
    }

    /**
     * @param {ArrowFunction | FunctionDeclaration | ClassDeclaration} componentDeclaration
     */
    function getInputsMetadata(componentDeclaration) {
        // Get inputs metadata
        if (Node.isClassDeclaration(componentDeclaration)) {
            // Get the generic type argument provided to the base class which should
            // be `React.Component<P>`.
            const componentTypeArgs = componentDeclaration
                .getExtendsOrThrow()
                .getTypeArguments();

            // They may not have provided props type argument if they have a basic
            // component.
            if (!componentTypeArgs || !componentTypeArgs[0]) {
                return;
            }

            const componentPropsType = componentTypeArgs[0];
            const elementPropsMembers = componentPropsType
                .getType()
                // Get the referenced symbol of the type argument
                .getSymbol()
                // Get the members from this symbol. This excludes inherited
                // properties from the base props interface.
                .getMembers();
            return getParameterMetadata(
                componentPropsType,
                elementPropsMembers
            );
        } else {
            // TODO: Test `const Foo: React.FC<FooProps> = ...`

            const componentPropsParam = componentDeclaration.getParameters()[0];

            if (!componentPropsParam) {
                return;
            }

            const elementPropsMembers = componentPropsParam
                .getType()
                // Get the referenced symbol of the type argument
                .getSymbol()
                // Get the members from this symbol. This excludes inherited
                // properties from the base props interface.
                .getMembers();

            return getParameterMetadata(
                componentPropsParam,
                elementPropsMembers
            );
        }
    }

    const componentPropertyAssignment = registrationObjectExpression.getPropertyOrThrow(
        "component"
    );
    if (!Node.isPropertyAssignment(componentPropertyAssignment)) {
        // TODO: What about shorthand prop assignment?
        throw new Error(
            "Component property of element registration is not a property assignment."
        );
    }

    // Should be a `VariableDeclaration`, `FunctionDeclaration`, or
    // `ClassDeclaration`.
    const componentPropertyValue = componentPropertyAssignment
        // Get the value of the component property on the registration object
        .getInitializerOrThrow()
        .getSymbolOrThrow()
        // Get referenced node (component)
        .getValueDeclarationOrThrow();

    if (
        // Declared as variable: `const Foo = (props: FooProps) => {...}`
        !Node.isVariableDeclaration(componentPropertyValue) &&
        // Declared as function: `function Foo(props: FooProps) {...}`
        !Node.isFunctionDeclaration(componentPropertyValue) &&
        // Declared as class: `class Foo extends React.Component<FooProps>`
        !Node.isClassDeclaration(componentPropertyValue)
    ) {
        throw new Error(
            "Component property of element registration isn't a function or class component."
        );
    }

    const componentDeclaration = getComponentDeclarationFromPropertyValue(
        componentPropertyValue
    );

    const elementId = getElementId(registrationObjectExpression);
    const inputs = getInputsMetadata(componentDeclaration);

    const elementJsDocs = Node.isVariableDeclaration(componentPropertyValue)
        ? // `VariableDeclaration` is a descendent of `VariableStatement`.
          // `VariableStatement` is the node where the JSDocs may be present.
          componentPropertyValue.getVariableStatementOrThrow().getJsDocs()
        : componentPropertyValue.getJsDocs();
    const elementTags = getTagsFromJsDocs(elementJsDocs);

    return {
        id: elementId,
        suite: getSuite(suiteUuid),
        inputs,
        description: elementTags.description,
        displayName: elementTags.displayName,
        helpUrl: elementTags.helpUrl,
        deprecated: elementTags.hasOwnProperty("deprecated") || undefined,
        supportedApps: parseCommaSeparatedValues(elementTags.supportedApps),
        unsupportedApps: parseCommaSeparatedValues(elementTags.unsupportedApps),
    };
}

/**
 * Generate metadata about the exported activities and form elements of the
 * project.
 * @param {string} suiteUuid
 */
function getProjectMetadata(suiteUuid) {
    const project = new Project({
        tsConfigFilePath: path.join(paths.projRoot, "tsconfig.json"),
    });
    const projectExportsFile = project.getSourceFileOrThrow("index.ts");

    const activities = [];
    const elements = [];

    for (const [
        name,
        declarations,
    ] of projectExportsFile.getExportedDeclarations()) {
        for (const declaration of declarations) {
            if (isActivityDeclaration(declaration)) {
                activities.push(getActivityMetadata(declaration, suiteUuid));
            } else if (isElementDeclaration(declaration)) {
                elements.push(getElementMetadata(declaration, suiteUuid));
            }
        }
    }

    return { activities, elements };
}

module.exports = {
    getProjectMetadata,
    isActivityDeclaration,
};
