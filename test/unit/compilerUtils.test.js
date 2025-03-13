import { Project } from "ts-morph";
import { getProjectMetadata } from "../../lib/compilerUtils";
import InvalidMetatagsError from "../../lib/InvalidMetatagsError";

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
    const sourceFile = project.createSourceFile(fileName, sourceFileText, { overwrite: true });
    sourceFiles.push(sourceFile);
    return sourceFile;
}

const uuid = "proj-id-123";

describe("getProjectMetadata", () => {
    describe("activities", () => {
        it("passes basic sanity", () => {
            const activitySource = `
            import { IActivityHandler } from "@vertigis/workflow/IActivityHandler";

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
                 * @supportedApps gvh
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
                 * @supportedApps gxw
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

            const { activities } = getProjectMetadata(createSourceFile("index.ts", activitySource), uuid);

            expect(activities).toMatchSnapshot();
        });

        it("produces minimal defaults when JSDoc comments are absent", () => {
            const activitySource = `
            import { IActivityHandler } from "@vertigis/workflow/IActivityHandler";

            interface TestActivityInputs {
                inputA: string;
            }

            interface TestActivityOutputs {
                outputB: string;
            }

            export class TestActivity implements IActivityHandler {
                execute(inputs: TestActivityInputs): TestActivityOutputs {
                    return {};
                }
            }
            `;

            const { activities } = getProjectMetadata(createSourceFile("index.ts", activitySource), uuid);

            expect(activities[0].category).toBe("Custom Activities");
            expect(activities[0].displayName).toBe("Test Activity");
            expect(activities[0].inputs.inputA.displayName).toBe("Input A");
            expect(activities[0].outputs.outputB.displayName).toBe("Output B");
        });

        it("rejects invalid metadata", () => {
            // Activity: Client & Server tags
            let activitySource = `
            import { IActivityHandler } from "@vertigis/workflow/IActivityHandler";
            /**
             * @clientOnly
             * @serverOnly
             */
            export class TestActivity implements IActivityHandler {
                execute(inputs: any): any {
                    return undefined;
                }
            }
            `;
            expect(() => getProjectMetadata(createSourceFile("index.ts", activitySource), uuid)).toThrow(
                InvalidMetatagsError
            );

            // Activity: Supported & Unsupported Apps
            activitySource = `
            import { IActivityHandler } from "@vertigis/workflow/IActivityHandler";
            /**
             * @supportedApps gvh
             * @unsupportedApps wab
             */
            export class TestActivity implements IActivityHandler {
                execute(inputs: any): any {
                    return undefined;
                }
            }
            `;
            expect(() => getProjectMetadata(createSourceFile("index.ts", activitySource), uuid)).toThrow(
                InvalidMetatagsError
            );

            // Input: Client & Server tags
            activitySource = `
            import { IActivityHandler } from "@vertigis/workflow/IActivityHandler";
            interface TestActivityInputs {
                /**
                 * @clientOnly
                 * @serverOnly
                 */
                input1: number;
                input2: string;
            }
            export class TestActivity implements IActivityHandler {
                execute(inputs: TestActivityInputs): any {
                    return undefined;
                }
            }
            `;
            expect(() => getProjectMetadata(createSourceFile("index.ts", activitySource), uuid)).toThrow(
                InvalidMetatagsError
            );

            // Input: Supported & Unsupported Apps
            activitySource = `
            import { IActivityHandler } from "@vertigis/workflow/IActivityHandler";
            interface TestActivityInputs {
                /**
                 * @supportedApps gvh
                 * @unsupportedApps wab
                 */
                input1: number;
                input2: string;
            }
            export class TestActivity implements IActivityHandler {
                execute(inputs: TestActivityInputs): any {
                    return undefined;
                }
            }
            `;
            expect(() => getProjectMetadata(createSourceFile("index.ts", activitySource), uuid)).toThrow(
                InvalidMetatagsError
            );

            // Output: Client & Server tags
            activitySource = `
            import { IActivityHandler } from "@vertigis/workflow/IActivityHandler";
            interface TestActivityOutputs {
                /**
                 * @clientOnly
                 * @serverOnly
                 */
                output1: number;
                output2: string;
            }
            export class TestActivity implements IActivityHandler {
                execute(inputs: any): TestActivityOutputs {
                    return { output1: 12, output2: "fred" };
                }
            }
            `;
            expect(() => getProjectMetadata(createSourceFile("index.ts", activitySource), uuid)).toThrow(
                InvalidMetatagsError
            );

            // Input: Supported & Unsupported Apps
            activitySource = `
            import { IActivityHandler } from "@vertigis/workflow/IActivityHandler";
            interface TestActivityOutputs {
                /**
                 * @supportedApps gvh
                 * @unsupportedApps wab
                 */
                output1: number;
                output2: string;
            }
            export class TestActivity implements IActivityHandler {
                execute(inputs: any): TestActivityOutputs {
                    return { output1: 12, output2: "fred" };
                }
            }
            `;
            expect(() => getProjectMetadata(createSourceFile("index.ts", activitySource), uuid)).toThrow(
                InvalidMetatagsError
            );
        });

        it("unwraps `Promise<T>` output type to `T`", () => {
            const activitySource = `
            import { IActivityHandler } from "@vertigis/workflow/IActivityHandler";

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

            const { activities } = getProjectMetadata(createSourceFile("index.ts", activitySource), uuid);

            expect(activities[0].outputs.output1.typeName).toBe("string");
        });

        it("has no outputs when output type is `void`", () => {
            const activitySource = `
            import { IActivityHandler } from "@vertigis/workflow/IActivityHandler";

            export class TestActivity implements IActivityHandler {
                static readonly action = "fake-action";
                static readonly suite = "fake-suite";

                execute(inputs: TestActivityInputs): void {
                    return {};
                }
            }
            `;

            const { activities } = getProjectMetadata(createSourceFile("index.ts", activitySource), uuid);

            expect(Object.keys(activities[0].outputs)).toHaveLength(0);
        });

        it("has no outputs when output type is `Promise<void>`", () => {
            const activitySource = `
            import { IActivityHandler } from "@vertigis/workflow/IActivityHandler";

            export class TestActivity implements IActivityHandler {
                static readonly action = "fake-action";
                static readonly suite = "fake-suite";

                execute(inputs: TestActivityInputs): Promise<void> {
                    return {};
                }
            }
            `;

            const { activities } = getProjectMetadata(createSourceFile("index.ts", activitySource), uuid);

            expect(Object.keys(activities[0].outputs)).toHaveLength(0);
        });

        it("handles Promise<T> inputs/outputs", () => {
            const activitySource = `
            import { IActivityHandler } from "@vertigis/workflow/IActivityHandler";

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

            const { activities } = getProjectMetadata(createSourceFile("index.ts", activitySource), uuid);

            expect(activities[0].inputs.input1.typeName).toBe("Promise<string>");
            expect(activities[0].outputs.output1.typeName).toBe("Promise<boolean>");
        });

        it("handles complex types", () => {
            const activitySource = `
            import { IActivityHandler } from "@vertigis/workflow/IActivityHandler";

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

            const { activities } = getProjectMetadata(createSourceFile("index.ts", activitySource), uuid);

            expect(activities[0].inputs.input1.typeName).toBe(
                `{
    foo: string;
}`
            );
        });

        it("handles union types", () => {
            const activitySource = `
            import { IActivityHandler } from "@vertigis/workflow/IActivityHandler";

            interface TestActivityInputs {
                input1: "foo" | "bar" | string;
            }

            export class TestActivity implements IActivityHandler {
                static readonly action = "fake-action";
                static readonly suite = "fake-suite";

                execute(inputs: TestActivityInputs): TestActivityOutputs {
                    return {};
                }
            }
            `;

            const { activities } = getProjectMetadata(createSourceFile("index.ts", activitySource), uuid);

            expect(activities[0].inputs.input1.typeName).toBe(`"foo" | "bar" | string`);
        });

        it("handles unknown imported types", () => {
            const activitySource = `
            import { IActivityHandler } from "@vertigis/workflow/IActivityHandler";
            import { MyInterface } from "./other";

            interface TestActivityInputs {
                input1: MyInterface;
            }

            export class TestActivity implements IActivityHandler {
                static readonly action = "fake-action";
                static readonly suite = "fake-suite";

                execute(inputs: TestActivityInputs): TestActivityOutputs {
                    return {};
                }
            }
            `;

            const { activities } = getProjectMetadata(createSourceFile("index.ts", activitySource), uuid);

            expect(activities[0].inputs.input1.typeName).toBe("MyInterface");
        });

        it("handles imported types", () => {
            const interfaceSource = `
            export interface MyInterface {
                foo: string;
            };
            `;
            sourceFiles.push(project.createSourceFile("MyInterface.ts", interfaceSource));

            const activitySource = `
            import { IActivityHandler } from "@vertigis/workflow/IActivityHandler";
            import { MyInterface } from "../MyInterface";

            interface TestActivityInputs {
                input1: MyInterface;
            }

            export class TestActivity implements IActivityHandler {
                static readonly action = "fake-action";
                static readonly suite = "fake-suite";

                execute(inputs: TestActivityInputs): TestActivityOutputs {
                    return {};
                }
            }
            `;
            sourceFiles.push(project.createSourceFile("activities/TestActivity.ts", activitySource));

            const indexSource = `
            export * from "./activities/TestActivity";
            `;

            const { activities } = getProjectMetadata(createSourceFile("index.ts", indexSource), uuid);

            expect(activities[0].inputs.input1.typeName).toBe("MyInterface");
        });

        it("handles absolute path sources", () => {
            // This test was specifically added to ensure type names do not contain inline imports
            // See https://github.com/dsherret/ts-morph/issues/453#issuecomment-427405736
            const interfaceSource = `
            export interface MyInterface {
                foo: string;
            };
            `;
            sourceFiles.push(project.createSourceFile("c:/temp/MyInterface.ts", interfaceSource));

            const activitySource = `
            import { IActivityHandler } from "@vertigis/workflow/IActivityHandler";
            import { MyInterface } from "../MyInterface";

            interface TestActivityInputs {
                input1: MyInterface;
            }

            export class TestActivity implements IActivityHandler {
                static readonly action = "fake-action";
                static readonly suite = "fake-suite";

                execute(inputs: TestActivityInputs): TestActivityOutputs {
                    return {};
                }
            }
            `;
            sourceFiles.push(project.createSourceFile("c:/temp/activities/TestActivity.ts", activitySource));

            const indexSource = `
            export * from "./activities/TestActivity";
            `;

            const { activities } = getProjectMetadata(createSourceFile("c:/temp/index.ts", indexSource), uuid);

            expect(activities[0].inputs.input1.typeName).toBe("MyInterface");
        });
    });

    describe("elements", () => {
        it("passes basic sanity", () => {
            const activitySource = `
            import { FormElementProps, FormElementRegistration } from "@vertigis/workflow";
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

            const { elements } = getProjectMetadata(createSourceFile("index.ts", activitySource), uuid);

            expect(elements).toMatchSnapshot();
        });

        it("includes elements with basic props interface", () => {
            const activitySource = `
            import { FormElementProps, FormElementRegistration } from "@vertigis/workflow";
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

            const { elements } = getProjectMetadata(createSourceFile("index.ts", activitySource), uuid);

            expect(elements.map(element => element.inputs)).toEqual([{}, {}, {}]);
        });

        it("throws error for invalid `component` value", () => {
            const activitySource = `
            import { FormElementProps, FormElementRegistration } from "@vertigis/workflow";

            const Foo = 42;

            export const fooRegistration: FormElementRegistration = {
                component: Foo,
                id: "foo"
            };
            `;

            expect(() => getProjectMetadata(createSourceFile("index.ts", activitySource), uuid)).toThrow(
                `"component" property of element registration isn't a function or class component.`
            );
        });

        it("throws error for shorthand `id` expression", () => {
            const activitySource = `
            import { FormElementProps, FormElementRegistration } from "@vertigis/workflow";

            const Foo = () => null;

            const id = "foo";

            export const fooRegistration: FormElementRegistration = {
                component: Foo,
                id
            };
            `;

            expect(() => getProjectMetadata(createSourceFile("index.ts", activitySource), uuid)).toThrow(
                'Must directly assign value to "id" property of element registration'
            );
        });

        it("throws error for incorrect type of `id` value", () => {
            const activitySource = `
            import { FormElementProps, FormElementRegistration } from "@vertigis/workflow";

            const Foo = () => null;

            export const fooRegistration: FormElementRegistration = {
                component: Foo,
                id: 42
            };
            `;

            expect(() => getProjectMetadata(createSourceFile("index.ts", activitySource), uuid)).toThrow(
                `Value of "id" property of element registration must be a string literal.`
            );
        });
    });
});
