// @ts-check
"use strict";

/* eslint-disable @typescript-eslint/no-unused-vars */
const {
    ArrowFunction,
    CallSignatureDeclaration,
    ClassDeclaration,
    Expression,
    FunctionDeclaration,
    JSDoc,
    JSDocTag,
    Node,
    ObjectLiteralExpression,
    SourceFile,
    Symbol,
    VariableDeclaration,
} = require("ts-morph");
/* eslint-enable @typescript-eslint/no-unused-vars */
const InvalidMetatagsError = require("./InvalidMetatagsError");

/**
 * @param {string} uuid
 */
function getSuite(uuid) {
    return `uuid:${uuid}`;
}

/**
 * @param {string | undefined} value
 */
function parseCommaSeparatedValues(value) {
    if (!value) {
        return;
    }

    const result = value.trim().split(/\s*,\s*/);

    return result.length > 0 ? result : undefined;
}

/**
 * @param {string} text
 */
function toPascalCase(text) {
    // Add spaces where we see an inflection of casing.
    const result = text.replace(/[a-z][A-Z]|.[A-Z][a-z]/g, function (value) {
        return `${value.substr(0, 1)} ${value.substr(1)}`;
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

    const expression = node.getInitializerOrThrow();

    if (!isObjectLiteralExpression(expression)) {
        return false;
    }

    const id = expression.getProperty("id");
    const component = expression.getProperty("component");

    return !!(id && component);
}

/**
 * @param {Expression} expression
 * @returns {expression is ObjectLiteralExpression}
 */
function isObjectLiteralExpression(expression) {
    return Node.isObjectLiteralExpression(expression);
}

/**
 * @param {JSDoc[]} jsDocs
 */
function getTagsFromJsDocs(jsDocs) {
    return jsDocs
        .reduce(
            (acc, jsDoc) => acc.concat(jsDoc.getTags()),
            /** @type {JSDocTag[]} */ ([])
        )
        .reduce(
            (acc, tag) => ({
                ...acc,
                [tag.getTagName()]: tag.getComment(),
            }),
            /** @type {Object.<string, string | undefined>} */ ({})
        );
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

/**
 * @param {Node} param
 * @param {Symbol[]} properties
 */
function getParameterMetadata(param, properties, inputType) {
    const props = {};
    for (const paramProp of properties) {
        const paramName = paramProp.getName();
        const paramType = paramProp.getTypeAtLocation(param).getText();

        const paramTags = paramProp.compilerSymbol.getJsDocTags().reduce(
            (acc, tag) => ({
                ...acc,
                [tag.name]: tag.text,
            }),
            /** @type {Object.<string, string | undefined>} */ ({})
        );

        validateMetatags(paramTags, inputType);

        const paramMeta = {
            clientOnly:
                Object.prototype.hasOwnProperty.call(paramTags, "clientOnly") ||
                undefined,
            defaultExpressionHint: paramTags.defaultExpressionHint,
            defaultValue: paramTags.defaultValue,
            deprecated: paramTags.deprecated,
            description: paramTags.description,
            displayName: paramTags.displayName || toPascalCase(paramName),
            isHidden:
                Object.prototype.hasOwnProperty.call(paramTags, "hidden") ||
                undefined,
            isRequired:
                Object.prototype.hasOwnProperty.call(paramTags, "required") ||
                undefined,
            name: paramName,
            noExpressions:
                Object.prototype.hasOwnProperty.call(
                    paramTags,
                    "noExpressions"
                ) || undefined,
            onlineOnly:
                Object.prototype.hasOwnProperty.call(paramTags, "onlineOnly") ||
                undefined,
            placeholder: paramTags.placeholder,
            serverOnly:
                Object.prototype.hasOwnProperty.call(paramTags, "serverOnly") ||
                undefined,
            supportedApps: parseCommaSeparatedValues(paramTags.supportedApps),
            typeName: paramType,
            unsupportedApps: parseCommaSeparatedValues(
                paramTags.unsupportedApps
            ),
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
    const executeMember = declaration.getMethodOrThrow("execute");

    const activityName = declaration.getNameOrThrow();
    let action = `uuid:${suiteUuid}::${activityName}`;
    let suite = getSuite(suiteUuid);

    if (actionMember && Node.isPropertyDeclaration(actionMember)) {
        const actionInitializer = actionMember.getInitializer();

        if (actionInitializer && Node.isStringLiteral(actionInitializer)) {
            action = actionInitializer.getLiteralValue();
        }
    }
    if (suiteMember && Node.isPropertyDeclaration(suiteMember)) {
        const suiteInitializer = suiteMember.getInitializer();

        if (suiteInitializer && Node.isStringLiteral(suiteInitializer)) {
            suite = suiteInitializer.getLiteralValue();
        }
    }

    const inputParam = executeMember.getParameters()[0];
    const inputType = inputParam && inputParam.getType();
    let returnType = executeMember.getReturnType();
    const returnTypeSymbol = returnType.getSymbol();

    // Special case for `Promise<T>` which is a valid return type for
    // `execute()`, but that isn't important outside of the activity as the
    // engine will await the result.
    if (returnTypeSymbol && returnTypeSymbol.getName() === "Promise") {
        const promiseTypeArgument = returnType.getTypeArguments()[0];

        // Get the type of `T`
        if (promiseTypeArgument) {
            returnType = promiseTypeArgument;
        }
    }

    const inputs = inputType
        ? getParameterMetadata(
              executeMember,
              inputType.getProperties(),
              "activity input"
          )
        : {};
    const outputs = returnType
        ? getParameterMetadata(
              executeMember,
              returnType.getProperties(),
              "activity output"
          )
        : {};
    const activityTags = getTagsFromJsDocs(declaration.getJsDocs());
    validateMetatags(activityTags, "activity");

    return {
        action,
        category: activityTags.category || "Custom Activities",
        clientOnly:
            Object.prototype.hasOwnProperty.call(activityTags, "clientOnly") ||
            undefined,
        description: activityTags.description,
        deprecated: activityTags.deprecated,
        displayName: activityTags.displayName,
        helpUrl: activityTags.helpUrl,
        inputs,
        isHidden:
            Object.prototype.hasOwnProperty.call(activityTags, "hidden") ||
            undefined,
        onlineOnly:
            Object.prototype.hasOwnProperty.call(activityTags, "onlineOnly") ||
            undefined,
        outputs,
        suite,
        serverOnly:
            Object.prototype.hasOwnProperty.call(activityTags, "serverOnly") ||
            undefined,
        supportedApps: parseCommaSeparatedValues(activityTags.supportedApps),
        unsupportedApps: parseCommaSeparatedValues(
            activityTags.unsupportedApps
        ),
    };
}

/**
 * @param {VariableDeclaration} registrationDeclaration
 * @param {string} suiteUuid
 */
function getElementMetadata(registrationDeclaration, suiteUuid) {
    const registrationObjectExpression =
        /** @type {ObjectLiteralExpression} */ (
            registrationDeclaration.getInitializer()
        );

    /**
     * @param {ObjectLiteralExpression} regObject
     */
    function getElementId(regObject) {
        const idPropertyAssignment = regObject
            .getPropertyOrThrow("id")
            .getSymbolOrThrow()
            .getValueDeclarationOrThrow();

        // Note that shorthand property assignment won't pass this check.
        if (!Node.isPropertyAssignment(idPropertyAssignment)) {
            throw new Error(
                `Must directly assign value to "id" property of element registration. Ex. id: "foo".`
            );
        }

        const idStringLiteral = idPropertyAssignment.getInitializerOrThrow();
        if (!Node.isStringLiteral(idStringLiteral)) {
            throw new Error(
                `Value of "id" property of element registration must be a string literal. Ex. id: "foo".`
            );
        }

        return idStringLiteral.getLiteralValue();
    }

    /**
     *
     * @param {ClassDeclaration | VariableDeclaration | FunctionDeclaration} propValue
     * @returns {ArrowFunction | FunctionDeclaration | ClassDeclaration}
     */
    function getComponentDeclarationFromPropertyValue(propValue) {
        if (Node.isVariableDeclaration(propValue)) {
            const callSignature = propValue.getType().getCallSignatures()[0];

            if (!callSignature) {
                throw new Error(
                    `"component" property of element registration isn't a function or class component.`
                );
            }

            const componentFunctionDeclaration = callSignature.getDeclaration();

            // Declared using `const Foo: React.FC<FooProps> = ...` or similar.
            // I didn't find a great way to get the types we wanted although I'm
            // sure it's possible.
            if (Node.isCallSignatureDeclaration(componentFunctionDeclaration)) {
                throw new Error(
                    `"component" property in element registration was declared using a call signature declaration which is not supported. 
                    Declare your component using "function Foo(props: FooProps) {}" or "const Foo = (props: FooProps) => {}" instead.`
                );
            }

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

        return propValue;
    }

    /**
     * @param {ArrowFunction | FunctionDeclaration | ClassDeclaration | CallSignatureDeclaration} componentDeclaration
     * @returns {{}}
     */
    function getInputsMetadata(componentDeclaration) {
        /**
         * Checks to see if the members "smell" like our base props interface.
         * If so, treat the members as an empty interface.
         * @param {Symbol[]} members
         */
        function sanitizeMembers(members) {
            if (members.some((member) => member.getName() === "raiseEvent")) {
                return [];
            }

            return members;
        }

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
                return {};
            }

            const componentPropsType = componentTypeArgs[0];
            const elementPropsMembers = componentPropsType
                .getType()
                // Get the referenced symbol of the type argument
                .getSymbolOrThrow()
                // Get the members from this symbol. This excludes inherited
                // properties from the base props interface.
                .getMembers();
            return getParameterMetadata(
                componentPropsType,
                sanitizeMembers(elementPropsMembers),
                "activity input"
            );
        } else {
            const componentPropsParam = componentDeclaration.getParameters()[0];

            if (!componentPropsParam) {
                return {};
            }

            const elementPropsMembers = componentPropsParam
                .getType()
                // Get the referenced symbol of the type argument
                .getSymbolOrThrow()
                // Get the members from this symbol. This excludes inherited
                // properties from the base props interface.
                .getMembers();

            return getParameterMetadata(
                componentPropsParam,
                sanitizeMembers(elementPropsMembers),
                "activity input"
            );
        }
    }

    const componentPropertyAssignment =
        registrationObjectExpression.getPropertyOrThrow("component");
    if (!Node.isPropertyAssignment(componentPropertyAssignment)) {
        throw new Error(
            '"component" property of element registration is not a property assignment.'
        );
    }

    const componentPropertyValue = componentPropertyAssignment
        // Get the value of the component property on the registration object
        .getInitializerOrThrow()
        .getSymbolOrThrow()
        // Get referenced node (component)
        .getValueDeclarationOrThrow();

    if (
        // Declared as variable. Ex: `const Foo = (props: FooProps) => {...}`
        !Node.isVariableDeclaration(componentPropertyValue) &&
        // Declared as function. Ex: `function Foo(props: FooProps) {...}``
        !Node.isFunctionDeclaration(componentPropertyValue) &&
        // Declared as class. Ex: `class Foo extends React.Component<FooProps>`
        !Node.isClassDeclaration(componentPropertyValue)
    ) {
        throw new Error(
            `"Component" property of element registration isn't a function or class component.`
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
        deprecated: elementTags.deprecated,
        description: elementTags.description,
        displayName: elementTags.displayName,
        helpUrl: elementTags.helpUrl,
        id: elementId,
        inputs,
        suite: getSuite(suiteUuid),
        supportedApps: parseCommaSeparatedValues(elementTags.supportedApps),
        unsupportedApps: parseCommaSeparatedValues(elementTags.unsupportedApps),
    };
}

/**
 * Generate metadata about the exported activities and form elements of the
 * project.
 * @param {SourceFile} projectExportsFile
 * @param {string} suiteUuid
 */
function getProjectMetadata(projectExportsFile, suiteUuid) {
    const activities = [];
    const elements = [];

    for (const [
        ,
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
