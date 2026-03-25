#!/usr/bin/env node
/**
 * CLI entry point for TypeScript type generation.
 * Usage: npx node-api-python generate-types <file-or-dir> [-o <output-dir>] [--watch]
 */

const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const PYTHON_SRC = path.resolve(__dirname, "..", "src", "python");

function usage() {
  console.log(`
Usage:
  npx node-api-python generate-types <file-or-dir> [-o <output-dir>] [--watch]

Examples:
  npx node-api-python generate-types ./my_module.py
  npx node-api-python generate-types ./python/ -o ./types/
  npx node-api-python generate-types ./python/ -o ./types/ --watch
`.trim());
}

function findPython() {
  const candidates = process.platform === "win32"
    ? ["python", "python3", "py"]
    : ["python3", "python"];

  for (const cmd of candidates) {
    try {
      execFileSync(cmd, ["--version"], { stdio: "pipe" });
      return cmd;
    } catch {
      // try next
    }
  }
  return null;
}

function collectPyFiles(target) {
  const resolved = path.resolve(target);
  const stat = fs.statSync(resolved);

  if (stat.isFile()) {
    if (resolved.endsWith(".py")) return [resolved];
    console.error(`Error: ${target} is not a .py file`);
    process.exit(1);
  }

  if (stat.isDirectory()) {
    const files = [];
    for (const entry of fs.readdirSync(resolved)) {
      if (entry.endsWith(".py") && !entry.startsWith("_")) {
        files.push(path.join(resolved, entry));
      }
    }
    return files;
  }

  return [];
}

function generateForFile(pythonCmd, pyFile, outputDir) {
  const moduleName = path.basename(pyFile, ".py");
  try {
    const result = execFileSync(
      pythonCmd,
      ["-m", "typegen", pyFile],
      {
        cwd: PYTHON_SRC,
        encoding: "utf-8",
        env: {
          ...process.env,
          PYTHONPATH: PYTHON_SRC,
        },
        stdio: ["pipe", "pipe", "pipe"],
      }
    );

    const outFile = path.join(outputDir, `${moduleName}.d.ts`);
    fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(outFile, result, "utf-8");
    console.log(`  Generated: ${outFile}`);
    return true;
  } catch (err) {
    const stderr = err.stderr ? err.stderr.toString() : err.message;
    console.error(`  Error processing ${pyFile}: ${stderr}`);
    return false;
  }
}

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    usage();
    process.exit(args.length === 0 ? 1 : 0);
  }

  const target = args[0];
  let outputDir = ".";
  let watch = false;

  for (let i = 1; i < args.length; i++) {
    if ((args[i] === "-o" || args[i] === "--output") && args[i + 1]) {
      outputDir = args[++i];
    } else if (args[i] === "--watch") {
      watch = true;
    }
  }

  const pythonCmd = findPython();
  if (!pythonCmd) {
    console.error("Error: Python not found. Install Python 3.8+ and ensure it is on your PATH.");
    process.exit(1);
  }

  if (!fs.existsSync(target)) {
    console.error(`Error: ${target} does not exist.`);
    process.exit(1);
  }

  const pyFiles = collectPyFiles(target);
  if (pyFiles.length === 0) {
    console.error("No .py files found.");
    process.exit(1);
  }

  outputDir = path.resolve(outputDir);

  console.log(`Generating TypeScript definitions...`);
  let allOk = true;
  for (const f of pyFiles) {
    if (!generateForFile(pythonCmd, f, outputDir)) {
      allOk = false;
    }
  }

  if (watch) {
    const watchTarget = path.resolve(target);
    console.log(`\nWatching for changes in ${watchTarget}...`);

    const stat = fs.statSync(watchTarget);
    const watchDir = stat.isDirectory() ? watchTarget : path.dirname(watchTarget);

    fs.watch(watchDir, { recursive: false }, (eventType, filename) => {
      if (!filename || !filename.endsWith(".py") || filename.startsWith("_")) return;

      const fullPath = path.join(watchDir, filename);
      if (!fs.existsSync(fullPath)) return;

      console.log(`\nFile changed: ${filename}`);
      generateForFile(pythonCmd, fullPath, outputDir);
    });
  } else if (!allOk) {
    process.exit(1);
  }
}

main();
