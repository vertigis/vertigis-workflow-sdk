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
            
            /** Defines the inputs for the TestActivity activity. */
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
            
            /** Defines the outputs for the TestActivity activity. */
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
                static readonly action = "uuid:${uuid}:ActivityAction";
            
                static readonly suite = "uuid:${uuid}";
            
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
    });

    describe("elements", () => {
        it("passes", () => {
            expect(true).toBe(true);
        });
    });
});
