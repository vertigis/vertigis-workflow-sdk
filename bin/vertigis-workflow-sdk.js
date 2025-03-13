#!/usr/bin/env node
// @ts-check
// Necessary to turn this into a module, which allows top-level await.
export {};

const args = process.argv.slice(2);

const scriptIndex = args.findIndex(x => x === "build" || x === "create" || x === "generate" || x === "start");
const script = scriptIndex === -1 ? args[0] : args[scriptIndex];

if (["build", "create", "generate", "start"].includes(script)) {
    try {
        await import(`../scripts/${script}.js`);
    } catch (e) {
        console.error(e);
    }
} else {
    console.error(`Unknown script '${script}'.`);
}
