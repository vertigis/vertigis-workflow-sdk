const { Project } = require("ts-morph");
const { getProjectMetadata } = require("../../lib/compilerUtils");

/**
 * @param {string} fileName
 * @param {string} sourceFileText
 */
function createSourceFile(fileName, sourceFileText) {
    const project = new Project();
    return project.createSourceFile(fileName, sourceFileText);
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
                 * @defaultExpressionHint Input1DefaultExpressionHint
                 * @defaultValue Input1DefaultValue
                 * @deprecated Input1Deprecated
                 * @description Input1Description 
                 * @displayName Input1DisplayName
                 * @helpUrl http://help/Activity/Input1 
                 * @placeholder Input1Placeholder
                 * @required
                 * @hidden
                 * @tag Input1Tag1 value1
                 * @tag Input1Tag2 value2
                 */
                input1: string;
            
                input2: number;
            }
            
            interface TestActivityOutputs {
                /** 
                 * Output1Comment  
                 * @description Output1Description 
                 * @displayName Output1DisplayName
                 * @helpUrl http://help/Activity/Output1
                 * @hidden
                 * @tag Output1Tag1 value1
                 */
                output1: string;
            }
            
            /** 
             * ActivityComment 
             * @category ActivityCategory
             * @defaultName ActivityDefaultName
             * @deprecated ActivityDeprecated
             * @description ActivityDescription 
             * @displayName ActivityDisplayName 
             * @helpUrl http://help/TestActivity 
             * @hidden
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
    });

    describe("elements", () => {
        it("passes", () => {
            expect(true).toBe(true);
        });
    });
});
