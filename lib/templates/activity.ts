import type { IActivityHandler } from "@geocortex/workflow/runtime/IActivityHandler";

/** An interface that defines the inputs of the activity. */
export interface FooInputs {
    // @displayName Input 1
    // @description The first input to the activity.
    // @required
    input1: string;

    // @displayName Input 2
    // @description The second input to the activity.
    input2?: number;
}

/** An interface that defines the outputs of the activity. */
export interface FooOutputs {
    /** A result of the activity. */
    // @description The result of the activity.
    result: string;
}

// @displayName <name>
// @category Custom Activities
// @description <description>
export class Foo implements IActivityHandler {
    // Perform the execution logic of the activity.
    execute(inputs: FooInputs): FooOutputs {
        return {
            result: `input1: ${inputs.input1}, input2: ${
                inputs.input2 || "undefined"
            }`,
        };
    }
}
