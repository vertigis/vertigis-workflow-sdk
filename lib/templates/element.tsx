import * as React from "react";
import type { CustomFormElementProps } from "@geocortex/workflow/runtime/app/RegisterCustomFormElementBase";
import { RegisterCustomFormElementBase } from "@geocortex/workflow/runtime/app/RegisterCustomFormElementBase";

/**
 * A simple React Component that demonstrates raising events.
 * @param props The props that will be provided by the Workflow runtime.
 */
const Foo = (props: CustomFormElementProps) => {
    const raiseClick = (event) => {
        // Raise the clicked event.
        props.raiseEvent("clicked", new Date());
    };

    // TODO: Show pattern for managed state via props.element
    const raiseChange = (event) => {
        // Raise the changed event.
        props.raiseEvent("changed", new Date());
    };

    const raiseCustom = (event) => {
        // Raise the custom event with a custom event value.
        const eventValue = {
            customEventType: "custom1",
            data: new Date(),
        };
        props.raiseEvent("custom", eventValue);
    };

    return (
        <div>
            A simple custom Workflow form element
            <div>
                <button onClick={raiseClick}>Raise click</button>
                <button onClick={raiseChange}>Raise change</button>
                <button onClick={raiseCustom}>Raise custom</button>
            </div>
        </div>
    );
};

// @displayName Register <name> Form Element
// @category Custom Activities
// @description <description>
export class RegisterFooElement extends RegisterCustomFormElementBase {
    // Perform the execution logic of the activity.
    execute() {
        this.register("<name>", Foo);
    }
}
