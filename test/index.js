// @ts-check
"use strict";

process.env.OPEN_BROWSER = "false";
process.env.SDK_LOCAL_DEV = "true";

const execa = require("execa");
const assert = require("assert").strict;
const fetch = require("node-fetch");
const fs = require("fs");
const https = require("https");
const path = require("path");
const pRetry = require("p-retry");

const rootDir = path.join(__dirname, "..");
const testLibProjPath = path.join(rootDir, "test-lib");

// Will be set on child processes (via execa).
process.env.SMOKE_TEST = "true";

/** @type {execa.ExecaChildProcess<string>} */
let subprocess;

/**
 * @param {Array<string>} args
 * @param {execa.Options<string>} [opts]
 */
function runNpmScript(args, opts) {
    console.log(`\nExecuting CLI script: ${args.join(" ")}\n`);
    const scriptProcess = execa.node(
        path.join(rootDir, "bin/vertigis-workflow-sdk.js"),
        args,
        opts
    );

    // Pipe process output to current process output so it is visible in the
    // console, but still allows us to examine the subprocess stdout/stderr
    // variables.
    scriptProcess.stdout.pipe(process.stdout);
    scriptProcess.stderr.pipe(process.stderr);

    // Set data encoding to be a string instead of Buffer objects.
    scriptProcess.stdout.setEncoding("utf8");
    scriptProcess.stderr.setEncoding("utf8");

    return scriptProcess;
}

function killSubprocess() {
    if (subprocess && !subprocess.killed) {
        subprocess.kill();
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
        processResult.stderr.includes(
            `Cannot create new project at ${testLibProjPath} as it already exists`
        ),
        true,
        "Failed to detect existing directory"
    );
}

// We assume the project was successfully created to run the following tests.
async function testBuildProject() {
    subprocess = runNpmScript(["build"], { cwd: testLibProjPath });
    await subprocess;
    assert.strictEqual(
        fs.existsSync(path.join(testLibProjPath, "build/main.js")),
        true,
        "build/main.js is missing"
    );
    assert.strictEqual(
        fs
            .readFileSync(path.join(testLibProjPath, "build/main.js"), "utf-8")
            .startsWith("define("),
        true,
        "main.js should be an AMD module"
    );
}

async function testStartProject() {
    subprocess = runNpmScript(["start"], { cwd: testLibProjPath });

    // The dev server uses a self signed cert which the `https` module won't allow by default.
    const unsafeAgent = new https.Agent({ rejectUnauthorized: false });

    try {
        await pRetry(
            async () => {
                const response = await fetch("https://localhost:5000/main.js", {
                    agent: unsafeAgent,
                });
                const text = await response.text();
                assert.strictEqual(
                    text.startsWith("define("),
                    true,
                    "main.js should be an AMD module"
                );
            },
            {
                maxRetryTime: 10000,
            }
        );
    } finally {
        killSubprocess();
    }
}

async function testGenerateActivity() {
    const stdoutDataCallback = (data) => {
        const cleanData = data
            // Remove ansi escape sequences (font styling, etc.)
            .replace(/\[\w+\s*/gi, "")
            // Remove any remaining that aren't printable (ansi control sequences)
            .replace(/[^\w\s\?]/gi, "")
            .trim();

        // Being asked about what we'd like to create (activity or form element)
        if (cleanData.endsWith("Form Element")) {
            // Hit enter on default selected item (activity)
            subprocess.stdin.write("\n");
        } else if (cleanData.endsWith("What is the activity name")) {
            subprocess.stdin.write("FooName\n");
        } else if (cleanData.endsWith("What is the description")) {
            subprocess.stdin.write("Bar description\n");
        }
    };

    try {
        subprocess = runNpmScript(["generate"], { cwd: testLibProjPath });
        subprocess.stdout.on("data", stdoutDataCallback);

        await pRetry(
            () => {
                assert.strictEqual(
                    fs.existsSync(
                        path.join(testLibProjPath, "src/activities/FooName.ts")
                    ),
                    true,
                    "Generate activity should create activity module"
                );
                assert.strictEqual(
                    fs
                        .readFileSync(
                            path.join(testLibProjPath, "src/index.ts"),
                            "utf-8"
                        )
                        .includes('export * from "./activities/FooName";'),
                    true,
                    "Generate activity should update index.ts exports"
                );
            },
            {
                maxRetryTime: 2000,
            }
        );
    } finally {
        subprocess.stdout.off("data", stdoutDataCallback);
    }
}

function rmdir(path) {
    fs.rmdirSync(path, { recursive: true });
}

function cleanup() {
    console.log("\nCleaning up...");
    killSubprocess();
    rmdir(testLibProjPath);
    console.log("Done cleaning.");
}

(async () => {
    try {
        await testCreateProject();
        // Test build on empty project
        await testBuildProject();
        await testGenerateActivity();
        // Test build again now that we've generated activities
        await testBuildProject();
        await testStartProject();
        console.log("\n\nAll tests passed!\n");
        cleanup();
    } catch (error) {
        console.error("\n\nTest failed.\n");
        console.error(error);
        cleanup();
        process.exit(1);
    }
})();
