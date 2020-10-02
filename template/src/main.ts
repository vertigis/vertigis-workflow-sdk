import * as index from "./index";

// TODO: will this actually get called multiple times in practice? If so we should handle.
export function main(): Promise<any> {
    return Promise.resolve(index);
}
