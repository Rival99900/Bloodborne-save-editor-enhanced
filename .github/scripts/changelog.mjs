// Builds CHANGELOG.md from .github/release-notes/v*.md, newest first.
// `node .github/scripts/changelog.mjs --check` fails when CHANGELOG.md is outdated.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const notesDir = path.join(root, ".github/release-notes");
const version = (file) =>
  file
    .slice(1, -3)
    .split(/[.-]/)
    .map((part) => (Number.isNaN(Number(part)) ? part : Number(part)));
const compare = (a, b) => {
  const [x, y] = [version(a), version(b)];
  for (let i = 0; i < Math.max(x.length, y.length); i++)
    if (x[i] !== y[i]) return (y[i] ?? -1) > (x[i] ?? -1) ? 1 : -1;
  return 0;
};

export function buildChangelog() {
  const files = fs
    .readdirSync(notesDir)
    .filter((file) => /^v\d+\.\d+\.\d+.*\.md$/.test(file))
    .sort(compare);
  const sections = files.map((file) => {
    const text = fs.readFileSync(path.join(notesDir, file), "utf8").trim();
    // "# Bloodborne Save Editor Enhanced v0.7.0" becomes "## v0.7.0"; headings move down one level.
    return text
      .replace(/^# .*$/m, `## ${file.slice(0, -3)}`)
      .replace(/^(#{2,5}) (?!v\d)/gm, "#$1 ");
  });
  return `# Changelog\n\nGenerated from \`.github/release-notes\` by \`npm run changelog\`: edit the release notes, not this file.\n\n${sections.join("\n\n")}\n`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const target = path.join(root, "CHANGELOG.md");
  const text = buildChangelog();
  if (process.argv.includes("--check")) {
    if (!fs.existsSync(target) || fs.readFileSync(target, "utf8") !== text) {
      console.error("CHANGELOG.md is outdated: run npm run changelog.");
      process.exitCode = 1;
    }
  } else {
    fs.writeFileSync(target, text);
    console.log("CHANGELOG.md written.");
  }
}
