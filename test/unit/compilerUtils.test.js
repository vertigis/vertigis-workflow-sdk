const { Project } = require("ts-morph");
const { getProjectMetadata } = require("../../lib/compilerUtils");

// Maintain a single instance of a project to avoid the large cost of
// initialization (~3s).
const project = new Project();
let sourceFiles = [];

// Clean up any source files created during the test run.
afterEach(() => {
    for (const sourceFile of sourceFiles) {
        project.removeSourceFile(sourceFile);
    }
    sourceFiles = [];
});

/**
 * @param {string} fileName
 * @param {string} sourceFileText
 */
function createSourceFile(fileName, sourceFileText) {
    const sourceFile = project.createSourceFile(fileName, sourceFileText);
    sourceFiles.push(sourceFile);
    return sourceFile;
}

const uuid = "proj-id-123";

describe("getProjectMetadata", () => {
    describe("activities", () => {
        it("passes basic sanity", () => {
            const activitySource = `
            import { IActivityHandler } from "@geocortex/workflow/IActivityHandler";
            
            interface TestActivityInputs {
                /** 
                 * Input1Comment
                 * @clientOnly
                 * @defaultExpressionHint Input1DefaultExpressionHint
                 * @defaultValue Input1DefaultValue
                 * @deprecated Input1Deprecated
                 * @description Input1Description 
                 * @displayName Input1DisplayName
                 * @helpUrl http://help/Activity/Input1 
                 * @hidden
                 * @onlineOnly
                 * @placeholder Input1Placeholder
                 * @required
                 * @supportedApps gvh, gxw
                 * @unsupportedApps wab
                 * @tag Input1Tag1 value1
                 * @tag Input1Tag2 value2
                 */
                input1: string;
            
                input2: number;
            }
            
            interface TestActivityOutputs {
                /** 
                 * Output1Comment
                 * @clientOnly
                 * @defaultExpressionHint Output1DefaultExpressionHint
                 * @defaultValue Output1DefaultValue
                 * @deprecated Output1Deprecated
                 * @description Output1Description 
                 * @displayName Output1DisplayName
                 * @helpUrl http://help/Activity/Output1 
                 * @hidden
                 * @onlineOnly
                 * @placeholder Output1Placeholder
                 * @required
                 * @supportedApps gvh, gxw
                 * @unsupportedApps wab
                 * @tag Output1Tag1 value1
                 * @tag Output1Tag2 value2
                 */
                output1: string;

                output2: number;
            }
            
            /** 
             * ActivityComment 
             * @category ActivityCategory
             * @clientOnly
             * @defaultName ActivityDefaultName
             * @deprecated ActivityDeprecated
             * @description ActivityDescription 
             * @displayName ActivityDisplayName 
             * @helpUrl http://help/TestActivity 
             * @hidden
             * @onlineOnly
             * @supportedApps gvh, gxw
             * @unsupportedApps wab
             * @tag ActivityTag1 value1
             * @tag ActivityTag2 value2
             * @tag ActivityTag3 
             */
            export class TestActivity implements IActivityHandler {
                static readonly action = "fake-action";
                static readonly suite = "fake-suite";
            
                execute(inputs: TestActivityInputs): TestActivityOutputs {
                    return {};
                }
            }

            /**
             * Should not be included as it doesn't implement 'IActivityHandler'
             */
            export class NotAnActivity {
                static readonly action = "fake-action";
                static readonly suite = "fake-suite";
            
                execute(inputs: TestActivityInputs): TestActivityOutputs {
                    return {};
                }
            }
            `;

            const { activities } = getProjectMetadata(
                createSourceFile("index.ts", activitySource),
                uuid
            );

            expect(activities).toMatchSnapshot();
        });

        it("unwraps `Promise<T>` output type to `T`", () => {
            const activitySource = `
            import { IActivityHandler } from "@geocortex/workflow/IActivityHandler";
            
            interface TestActivityOutputs {
                output1: string;
            }

            export class TestActivity implements IActivityHandler {
                static readonly action = "fake-action";
                static readonly suite = "fake-suite";
            
                execute(inputs: TestActivityInputs): TestActivityOutputs {
                    return {};
                }
            }
            `;

            const { activities } = getProjectMetadata(
                createSourceFile("index.ts", activitySource),
                uuid
            );

            expect(activities[0].outputs.output1.typeName).toBe("string");
        });

        it("has no outputs when output type is `void`", () => {
            const activitySource = `
            import { IActivityHandler } from "@geocortex/workflow/IActivityHandler";

            export class TestActivity implements IActivityHandler {
                static readonly action = "fake-action";
                static readonly suite = "fake-suite";
            
                execute(inputs: TestActivityInputs): void {
                    return {};
                }
            }
            `;

            const { activities } = getProjectMetadata(
                createSourceFile("index.ts", activitySource),
                uuid
            );

            expect(Object.keys(activities[0].outputs)).toHaveLength(0);
        });

        it("has no outputs when output type is `Promise<void>`", () => {
            const activitySource = `
            import { IActivityHandler } from "@geocortex/workflow/IActivityHandler";

            export class TestActivity implements IActivityHandler {
                static readonly action = "fake-action";
                static readonly suite = "fake-suite";
            
                execute(inputs: TestActivityInputs): Promise<void> {
                    return {};
                }
            }
            `;

            const { activities } = getProjectMetadata(
                createSourceFile("index.ts", activitySource),
                uuid
            );

            expect(Object.keys(activities[0].outputs)).toHaveLength(0);
        });

        it("handles Promise<T> inputs/outputs", () => {
            const activitySource = `
            import { IActivityHandler } from "@geocortex/workflow/IActivityHandler";
            
            interface TestActivityInputs {
                input1: Promise<string>;
            }
            
            interface TestActivityOutputs {
                output1: Promise<boolean>;
            }

            export class TestActivity implements IActivityHandler {
                static readonly action = "fake-action";
                static readonly suite = "fake-suite";
            
                execute(inputs: TestActivityInputs): TestActivityOutputs {
                    return {};
                }
            }
            `;

            const { activities } = getProjectMetadata(
                createSourceFile("index.ts", activitySource),
                uuid
            );

            expect(activities[0].inputs.input1.typeName).toBe(
                "Promise<string>"
            );
            expect(activities[0].outputs.output1.typeName).toBe(
                "Promise<boolean>"
            );
        });

        it("handles complex types", () => {
            const activitySource = `
            import { IActivityHandler } from "@geocortex/workflow/IActivityHandler";
            
            interface TestActivityInputs {
                input1: {
                    foo: string;
                };
            }

            export class TestActivity implements IActivityHandler {
                static readonly action = "fake-action";
                static readonly suite = "fake-suite";
            
                execute(inputs: TestActivityInputs): TestActivityOutputs {
                    return {};
                }
            }
            `;

            const { activities } = getProjectMetadata(
                createSourceFile("index.ts", activitySource),
                uuid
            );

            expect(activities[0].inputs.input1.typeName).toBe(
                "{ foo: string; }"
            );
        });
    });

    describe("elements", () => {
        it("passes basic sanity", () => {
            const activitySource = `
            import { FormElementProps, FormElementRegistration } from "@geocortex/workflow/runtime";
            import React from "react";
            
            interface Props extends FormElementProps<string> {
                /** 
                 * Input1Comment
                 * @clientOnly
                 * @defaultExpressionHint Input1DefaultExpressionHint
                 * @defaultValue Input1DefaultValue
                 * @deprecated Input1Deprecated
                 * @description Input1Description 
                 * @displayName Input1DisplayName
                 * @helpUrl http://help/Activity/Input1 
                 * @hidden
                 * @onlineOnly
                 * @placeholder Input1Placeholder
                 * @required
                 * @supportedApps gvh, gxw
                 * @unsupportedApps wab
                 */
                input1: string;

                input2: number;
            }
            
            /** 
             * ElementComment 
             * @category ElementCategory
             * @defaultName ElementDefaultName
             * @deprecated ElementDeprecated
             * @description ElementDescription 
             * @displayName ElementDisplayName 
             * @helpUrl http://help/TestElement
             * @supportedApps gvh, gxw
             * @unsupportedApps wab
             */
            const Foo = (props: Props) => null;
            
            export const fooRegistration: FormElementRegistration<Props> = {
                component: Foo,
                id: "foo",
            };

            /** 
             * ElementComment 
             * @category ElementCategory
             * @defaultName ElementDefaultName
             * @deprecated ElementDeprecated
             * @description ElementDescription 
             * @displayName ElementDisplayName 
             * @helpUrl http://help/TestElement
             * @supportedApps gvh, gxw
             * @unsupportedApps wab
             */
            function Bar(props: Props) { return null; };
            
            export const barRegistration: FormElementRegistration<Props> = {
                component: Bar,
                id: "bar",
            };

            /** 
             * ElementComment 
             * @category ElementCategory
             * @defaultName ElementDefaultName
             * @deprecated ElementDeprecated
             * @description ElementDescription 
             * @displayName ElementDisplayName 
             * @helpUrl http://help/TestElement
             * @supportedApps gvh, gxw
             * @unsupportedApps wab
             */
            class Baz extends React.Component<Props> {
                render() { return null; } 
            };
            
            export const bazRegistration: FormElementRegistration<Props> = {
                component: Baz,
                id: "baz",
            };
            `;

            const { elements } = getProjectMetadata(
                createSourceFile("index.ts", activitySource),
                uuid
            );

            expect(elements).toMatchSnapshot();
        });

        it("includes elements with basic props interface", () => {
            const activitySource = `
            import { FormElementProps, FormElementRegistration } from "@geocortex/workflow/runtime";
            import React from "react";
            
            interface Props extends FormElementProps<string> {}
            
            const Foo = (props: Props) => null;
            
            export const fooRegistration: FormElementRegistration<Props> = {
                component: Foo,
                id: "foo",
            };
            
            const Bar = (props: FormElementProps) => null;
            
            export const barRegistration: FormElementRegistration = {
                component: Bar,
                id: "bar",
            };
            
            const Baz = () => null;
            
            export const bazRegistration: FormElementRegistration = {
                component: Baz,
                id: "baz",
            };
            `;

            const { elements } = getProjectMetadata(
                createSourceFile("index.ts", activitySource),
                uuid
            );

            expect(elements.map((element) => element.inputs)).toEqual([
                {},
                {},
                {},
            ]);
        });

        it("throws error for invalid `component` value", () => {
            const activitySource = `
            import { FormElementProps, FormElementRegistration } from "@geocortex/workflow/runtime";

            const Foo = 42;
            
            export const fooRegistration: FormElementRegistration = {
                component: Foo,
                id: "foo"
            };
            `;

            expect(() =>
                getProjectMetadata(
                    createSourceFile("index.ts", activitySource),
                    uuid
                )
            ).toThrow(
                `"component" property of element registration isn't a function or class component.`
            );
        });

        it("throws error for shorthand `id` expression", () => {
            const activitySource = `
            import { FormElementProps, FormElementRegistration } from "@geocortex/workflow/runtime";

            const Foo = () => null;

            const id = "foo";
            
            export const fooRegistration: FormElementRegistration = {
                component: Foo,
                id
            };
            `;

            expect(() =>
                getProjectMetadata(
                    createSourceFile("index.ts", activitySource),
                    uuid
                )
            ).toThrow(
                'Must directly assign value to "id" property of element registration'
            );
        });

        it("throws error for incorrect type of `id` value", () => {
            const activitySource = `
            import { FormElementProps, FormElementRegistration } from "@geocortex/workflow/runtime";

            const Foo = () => null;
            
            export const fooRegistration: FormElementRegistration = {
                component: Foo,
                id: 42
            };
            `;

            expect(() =>
                getProjectMetadata(
                    createSourceFile("index.ts", activitySource),
                    uuid
                )
            ).toThrow(
                `Value of "id" property of element registration must be a string literal.`
            );
        });
    });
});
