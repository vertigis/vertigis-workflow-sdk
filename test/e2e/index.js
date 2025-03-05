// @ts-check
"use strict";

import { execa } from "execa";
import { strict as assert } from "assert";
import fetch from "node-fetch";
import * as fs from "fs";
import https from "https";
import path from "path";
import pRetry from "p-retry";
import { fileURLToPath, pathToFileURL } from "url";

process.env.OPEN_BROWSER = "false";
process.env.SDK_LOCAL_DEV = "true";

const dirName = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(dirName, "../..");
const testLibProjPath = path.join(rootDir, "test-lib");

// Will be set on child processes (via execa).
process.env.SMOKE_TEST = "true";

/** @type {import("execa").ResultPromise} */
let subprocess;

/** @returns {Promise<string>} */
async function getProjectUuid() {
    return (await import(pathToFileURL(path.join(testLibProjPath, "uuid.js")).href)).default;
}

/**
 * @param {Array<string>} args
 * @param {import("execa").Options} [opts]
 */
function runNpmScript(args, opts) {
    console.log(`\nExecuting CLI script: ${args.join(" ")}\n`);
    const scriptProcess = execa(path.join(rootDir, "bin/vertigis-workflow-sdk.js"), args, opts);

    // Pipe process output to current process output so it is visible in the
    // console, but still allows us to examine the subprocess stdout/stderr
    // variables.
    scriptProcess.stdout?.pipe(process.stdout);
    scriptProcess.stderr?.pipe(process.stderr);

    // Set data encoding to be a string instead of Buffer objects.
    scriptProcess.stdout?.setEncoding("utf8");
    scriptProcess.stderr?.setEncoding("utf8");

    return scriptProcess;
}

function killSubprocess() {
    if (subprocess && !subprocess.killed) {
        subprocess.kill();
        subprocess = undefined;
    }
}

async function testCreateProject() {
    // First try creating the project.
    subprocess = runNpmScript(["create", "test-lib"]);
    await subprocess;

    // Try to create same named project again.
    subprocess = runNpmScript(["create", "test-lib"], { reject: false });
    const processResult = await subprocess;
    assert.strictEqual(
        processResult.stderr
            .toString()
            .includes(`Cannot create new project at ${testLibProjPath} as it already exists`),
        true,
        "Failed to detect existing directory"
    );

    const projectUuid = await getProjectUuid();
    assert.strictEqual(projectUuid.length, 36, "Create project should populate uuid");
}

// We assume the project was successfully created to run the following tests.
async function testBuildProject() {
    subprocess = runNpmScript(["build"], { cwd: testLibProjPath });
    await subprocess;
    assert.strictEqual(fs.existsSync(path.join(testLibProjPath, "build/main.js")), true, "build/main.js is missing");
    assert.strictEqual(
        fs.readFileSync(path.join(testLibProjPath, "build/main.js"), "utf-8").includes("define("),
        true,
        "main.js should be an AMD module (build)"
    );
}

async function testStartProject() {
    subprocess = runNpmScript(["start"], { cwd: testLibProjPath, stdio: "ignore" });

    await new Promise(resolve => setTimeout(resolve, 10000));

    // The dev server uses a self signed cert which the `https` module won't allow by default.
    const unsafeAgent = new https.Agent({ rejectUnauthorized: false });

    await pRetry(
        async () => {
            const response = await fetch("https://localhost:5000/main.js", {
                agent: unsafeAgent,
            });
            assert.strictEqual(
                (await response.text()).includes("define("),
                true,
                "main.js should be an AMD module (start)"
            );
        },
        {
            maxRetryTime: 10000,
        }
    );
}

async function testGenerate() {
    const cleanStdoutData = data =>
        data
            // Remove ansi escape sequences (font styling, etc.)
            .replace(/\[\w+\s*/gi, "")
            // Remove any remaining that aren't printable (ansi control sequences)
            .replace(/[^\w\s\?]/gi, "")
            .trim();

    const createDataCallback = matches => data => {
        const cleanData = cleanStdoutData(data);

        for (const match of matches) {
            if (!match.matched && cleanData.endsWith(match.endsWith)) {
                subprocess.stdin.write(match.write);
                // Because of the nature of inquirer clearing and reprinting
                // lines in the console, we can receive data events that end
                // with the same match. Make sure we only write to stdin once.
                match.matched = true;
                return;
            }
        }
    };

    // Test create activity
    console.log("running generate");
    subprocess = runNpmScript(["generate"], { cwd: testLibProjPath });
    subprocess.stdout.on(
        "data",
        createDataCallback([
            // Being asked about what we'd like to create (activity or form element)
            {
                endsWith: "Form Element",
                // Hit enter on default selected item (activity)
                write: "\n",
            },
            {
                endsWith: "What is the activity name",
                write: "FooName\n",
            },
            {
                endsWith: "What is the description",
                write: "FooName description\n",
            },
        ])
    );

    await subprocess;

    await pRetry(
        () => {
            assert.strictEqual(
                fs.existsSync(path.join(testLibProjPath, "src/activities/FooName.ts")),
                true,
                "Generate activity should create activity module"
            );
            assert.strictEqual(
                fs
                    .readFileSync(path.join(testLibProjPath, "src/index.ts"), "utf-8")
                    .includes('export { default as FooNameActivity } from "./activities/FooName";'),
                true,
                "Generate activity should update index.ts exports"
            );
            assert.strictEqual(
                fs.readFileSync(path.join(testLibProjPath, "src/index.ts"), "utf-8").includes("export default {};"),
                false,
                "Generate activity should remove placeholder export in index.ts"
            );

            const activityContent = fs.readFileSync(path.join(testLibProjPath, "src/activities/FooName.ts"), "utf-8");

            const activityContentAssertions = [
                "interface FooNameInputs {",
                "interface FooNameOutputs {",
                "* @displayName FooName",
                "* @description FooName description",
                "export default class FooNameActivity implements IActivityHandler {",
                "execute(inputs: FooNameInputs): FooNameOutputs {",
            ];

            for (const assertion of activityContentAssertions) {
                assert.strictEqual(
                    activityContent.includes(assertion),
                    true,
                    `Expected content "${assertion}" in activity`
                );
            }
        },
        {
            maxRetryTime: 2000,
        }
    );

    // Test create form element
    subprocess = runNpmScript(["generate"], { cwd: testLibProjPath });
    subprocess.stdout.on(
        "data",
        createDataCallback([
            // Being asked about what we'd like to create (activity or form element)
            {
                endsWith: "Form Element",
                // Down arrow + enter (select form element option)
                write: "\u001b[B\n",
            },
            {
                endsWith: "What is the element name",
                write: "BarName\n",
            },
            {
                endsWith: "What is the description",
                write: "BarName description\n",
            },
        ])
    );

    await pRetry(
        () => {
            assert.strictEqual(
                fs.existsSync(path.join(testLibProjPath, "src/elements/BarName.tsx")),
                true,
                "Generate element should create element module"
            );
            assert.strictEqual(
                fs
                    .readFileSync(path.join(testLibProjPath, "src/index.ts"), "utf-8")
                    .includes('export { default as BarNameRegistration } from "./elements/BarName";'),
                true,
                "Generate element should update index.ts exports"
            );

            const elementContent = fs.readFileSync(path.join(testLibProjPath, "src/elements/BarName.tsx"), "utf-8");

            const elementContentAssertions = [
                "interface BarNameProps extends FormElementProps<string> {}",
                "* @displayName BarName",
                "* @description BarName description",
                "function BarName(props: BarNameProps): React.ReactElement",
                "const BarNameElementRegistration: FormElementRegistration<BarNameProps>",
                "component: BarName",
                'id: "BarName"',
                "export default BarNameElementRegistration",
            ];

            for (const assertion of elementContentAssertions) {
                assert.strictEqual(
                    elementContent.includes(assertion),
                    true,
                    `Expected content "${assertion}" in element`
                );
            }
        },
        {
            maxRetryTime: 2000,
        }
    );
}

async function testActivityPackMetadataGeneration() {
    const metadataPath = path.join(testLibProjPath, "build/activitypack.json");

    assert.strictEqual(fs.existsSync(metadataPath), true, "build/activitypack.json");

    const projectUuid = await getProjectUuid();
    const metadata = JSON.parse(
        JSON.stringify(await import(pathToFileURL(metadataPath).href, { with: { type: "json" } }))
    );

    assert.deepStrictEqual(metadata?.default, {
        activities: [
            {
                action: `uuid:${projectUuid}::FooNameActivity`,
                category: "Custom Activities",
                description: "FooName description",
                displayName: "FooName",
                inputs: {
                    input1: {
                        description: "The first input to the activity.",
                        displayName: "Input 1",
                        isRequired: true,
                        name: "input1",
                        typeName: "string",
                    },
                    input2: {
                        description: "The second input to the activity.",
                        displayName: "Input 2",
                        name: "input2",
                        typeName: "number",
                    },
                },
                outputs: {
                    result: {
                        description: "The result of the activity.",
                        displayName: "Result",
                        name: "result",
                        typeName: "string",
                    },
                },
                suite: `uuid:${projectUuid}`,
            },
        ],
        elements: [
            {
                description: "BarName description",
                displayName: "BarName",
                id: "BarName",
                inputs: {},
                suite: `uuid:${projectUuid}`,
            },
        ],
    });
}

function rmdir(path) {
    fs.rmSync(path, { recursive: true });
}

function cleanup() {
    console.log("\nCleaning up...");
    killSubprocess();
    rmdir(testLibProjPath);
    console.log("Done cleaning.");
}

try {
    await testCreateProject();
    // Test build on empty project
    await testBuildProject();
    await testGenerate();
    // Test build again now that we've generated activities and elements.
    await testBuildProject();
    await testActivityPackMetadataGeneration();
    await testStartProject();
    console.log("\n\nAll tests passed!\n");
} catch (error) {
    console.error("\n\nTest failed.\n");
    console.error(error);
    cleanup();
    process.exit(1);
}

try {
    cleanup();
} catch (error) {
    console.error("\n\nFailed to clean up. You may need to remove the 'test-lib' directory manually.\n");
}
