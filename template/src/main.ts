import * as index from "./index";

// TODO: think about this and if it's needed
// __webpack_public_path__ = "http://foo.com/"

// TODO: will this actually get called multiple times in practice? If so we should handle.
export async function main(): Promise<any> {
    return Promise.resolve(index);
}
