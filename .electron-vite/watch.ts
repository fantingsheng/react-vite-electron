process.env.NODE_ENV = "development";

import { join } from "path";
import { build, createServer } from "vite";
import { spawn } from "child_process";
import electron from "electron";
import type { ChildProcess } from "child_process";
import type { RollupWatcher } from "rollup";
let electron_process: ChildProcess;
let argvs: string[] = [];

async function use_watch_main() {
    const watch: RollupWatcher = (await build({
        configFile: join(__dirname, "./main.vite.config.ts"),
        mode: process.env.NODE_ENV,
    })) as RollupWatcher;
    watch.on("change", (data) => {
        console.log("update file: ", data);
        use_electron_process();
    });
}

async function use_watch_preload() {
    const watch: RollupWatcher = (await build({
        configFile: join(__dirname, "./preload.vite.config.ts"),
        mode: process.env.NODE_ENV,
    })) as RollupWatcher;
    watch.on("change", (data) => {
        console.log("update file: ", data);
        use_electron_process();
    });
}

async function use_watch_renderer() {
    const rednerer = await createServer({
        configFile: join(__dirname, "./renderer.vite.config.ts"),
    });
    await rednerer.listen();
}

function use_electron_process() {
    if (electron_process) electron_process.kill("SIGINT");
    electron_process = spawn(electron as any, use_argvs());

    electron_process.stdout?.pipe(process.stdout);

    electron_process.stderr?.pipe(process.stderr);
    electron_process.on("close", () => {
        process.exit(0);
    });
}

function use_argvs(): string[] {
    if (argvs.length) return argvs;
    argvs = [
        // `--inspect=${config.INSPECT_PORT}`,
        join(__dirname, "../dist/main/index.js"),
    ];
    argvs = argvs.concat(process.argv.slice(2));
    return argvs;
}

function use_process_event() {
    process.on("SIGINT", () => {
        process.exit();
    });
    process.on("exit", () => {
        electron_process?.kill();
    });
}
async function start() {
    await use_watch_renderer();
    await use_watch_main();
    await use_watch_preload();
    use_electron_process();
    use_process_event();
}
start();
