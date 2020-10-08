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
export class Foo {
    // The unique identifier of the activity.
    // This value should not be changed once an activity has been published.
    static readonly action = "uuid:<uuid>::<name>";

    // The identifier of the suite of activities that this activity belongs to.
    // This value should not be changed once an activity has been published.
    static readonly suite = "uuid:<uuid>";

    // Perform the execution logic of the activity.
    execute(inputs: FooInputs): FooOutputs {
        return {
            result: `input1: ${inputs.input1}, input2: ${
                inputs.input2 || "undefined"
            }`,
        };
    }
}
