import * as React from "react";
import {
    FormElementProps,
    FormElementRegistration,
} from "@geocortex/workflow/runtime";

/**
 * The generic type argument provided to `FormElementProps<T>` controls the type
 * of `props.value` and `props.setValue(value)`. If your element doesn't need a
 * `value`, you can omit the type argument.
 *
 * You can also declare additional public state of your element by adding
 * properties to this interface. The state will be managed by the Workflow
 * runtime, and passed in as props. You can update the state by using
 * `props.setProperty(key, value)`.
 */
interface FooProps extends FormElementProps<string> {}

/**
 * A simple Workflow element built using React.
 * @displayName <name>
 * @description <description>
 * @param props The props that will be provided by the Workflow runtime.
 */
function Foo(props: FooProps): React.ReactElement {
    const { setValue, value } = props;
    return (
        <input
            onChange={(event) => setValue(event.currentTarget.value)}
            value={value}
        />
    );
}

const FooElementRegistration: FormElementRegistration<FooProps> = {
    component: Foo,
    getInitialState: () => ({ value: "Hello World" }),
    id: "Foo",
};

export default FooElementRegistration;
