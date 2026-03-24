#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const USAGE = `
Usage: node scripts/release.js <patch|minor|major>

Examples:
  node scripts/release.js patch   # 0.0.1 → 0.0.2
  node scripts/release.js minor   # 0.0.2 → 0.1.0
  node scripts/release.js major   # 0.1.0 → 1.0.0
`;

function run(cmd) {
  return execSync(cmd, { encoding: "utf-8" }).trim();
}

function bumpVersion(current, type) {
  const parts = current.split(".").map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) {
    throw new Error(`Invalid version format: ${current}`);
  }
  const [major, minor, patch] = parts;
  switch (type) {
    case "major":
      return `${major + 1}.0.0`;
    case "minor":
      return `${major}.${minor + 1}.0`;
    case "patch":
      return `${major}.${minor}.${patch + 1}`;
    default:
      throw new Error(`Unknown bump type: ${type}`);
  }
}

function getCommitsSinceLastTag() {
  let range;
  try {
    const lastTag = run("git describe --tags --abbrev=0 HEAD");
    range = `${lastTag}..HEAD`;
  } catch {
    // No previous tags — use all commits
    range = "HEAD";
  }

  let commits;
  try {
    commits = run(`git log --pretty=format:%s ${range}`);
  } catch {
    return [];
  }
  return commits
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

function categorizeCommits(commits) {
  const features = [];
  const bugfixes = [];
  const other = [];

  for (const msg of commits) {
    const lower = msg.toLowerCase();
    if (/^(add|feat)[\s(:]/.test(lower)) {
      features.push(msg);
    } else if (/^fix[\s(:]/.test(lower)) {
      bugfixes.push(msg);
    } else {
      other.push(msg);
    }
  }

  return { features, bugfixes, other };
}

function buildChangelogSection(version, categories) {
  const date = new Date().toISOString().split("T")[0];
  const lines = [`## [v${version}] - ${date}`, ""];

  if (categories.features.length > 0) {
    lines.push("### Features");
    for (const msg of categories.features) {
      lines.push(`- ${msg}`);
    }
    lines.push("");
  }

  if (categories.bugfixes.length > 0) {
    lines.push("### Bug Fixes");
    for (const msg of categories.bugfixes) {
      lines.push(`- ${msg}`);
    }
    lines.push("");
  }

  if (categories.other.length > 0) {
    lines.push("### Other");
    for (const msg of categories.other) {
      lines.push(`- ${msg}`);
    }
    lines.push("");
  }

  // If no commits in any category, add a placeholder
  if (
    categories.features.length === 0 &&
    categories.bugfixes.length === 0 &&
    categories.other.length === 0
  ) {
    lines.push("- Release v" + version);
    lines.push("");
  }

  return lines.join("\n");
}

function updateChangelog(newSection) {
  const changelogPath = path.join(process.cwd(), "CHANGELOG.md");

  let existing = "";
  if (fs.existsSync(changelogPath)) {
    existing = fs.readFileSync(changelogPath, "utf-8");
  }

  let content;
  if (existing.startsWith("# Changelog")) {
    // Insert new section after the heading
    const headingEnd = existing.indexOf("\n");
    const before = existing.slice(0, headingEnd + 1);
    const after = existing.slice(headingEnd + 1);
    content = before + "\n" + newSection + "\n" + after;
  } else {
    content = "# Changelog\n\n" + newSection + "\n" + (existing ? "\n" + existing : "");
  }

  fs.writeFileSync(changelogPath, content, "utf-8");
  return changelogPath;
}

// ---- Main ----

const bumpType = process.argv[2];
if (!bumpType || !["patch", "minor", "major"].includes(bumpType)) {
  console.error(USAGE);
  process.exit(1);
}

// Ensure working tree is clean
try {
  const status = run("git status --porcelain");
  if (status) {
    console.error("Error: Working tree is not clean. Commit or stash changes first.");
    process.exit(1);
  }
} catch {
  console.error("Error: Not a git repository or git is not available.");
  process.exit(1);
}

// Read and bump version
const pkgPath = path.join(process.cwd(), "package.json");
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
const oldVersion = pkg.version;
const newVersion = bumpVersion(oldVersion, bumpType);
const tag = `v${newVersion}`;

console.log(`Bumping version: ${oldVersion} → ${newVersion}`);

// Update package.json
pkg.version = newVersion;
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n", "utf-8");

// Generate changelog section
const commits = getCommitsSinceLastTag();
const categories = categorizeCommits(commits);
const section = buildChangelogSection(newVersion, categories);
const changelogPath = updateChangelog(section);

console.log(`Updated ${path.relative(process.cwd(), pkgPath)}`);
console.log(`Updated ${path.relative(process.cwd(), changelogPath)}`);

// Create commit and tag
run("git add package.json CHANGELOG.md");
run(`git commit -m "release: ${tag}"`);
run(`git tag ${tag}`);

console.log(`\nCreated commit: release: ${tag}`);
console.log(`Created tag: ${tag}`);
console.log(`\nTo publish the release, run:\n`);
console.log(`  git push origin main --follow-tags\n`);
