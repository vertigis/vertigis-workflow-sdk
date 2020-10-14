import * as index from "./index";

// TODO: think about this and if it's needed
// __webpack_public_path__ = "http://foo.com/"
// document.currentScript
// https://stackoverflow.com/questions/42190544/how-can-i-configure-webpacks-automatic-code-splitting-to-load-modules-relative

// TODO: will this actually get called multiple times in practice? If so we should handle.
export async function main(): Promise<any> {
    return Promise.resolve(index);
}
