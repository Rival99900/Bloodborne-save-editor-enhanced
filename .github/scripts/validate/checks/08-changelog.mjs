// CHANGELOG.md matches the release notes, and the current version has notes.
import assert from "node:assert/strict";
import fs from "node:fs";
import { buildChangelog } from "../../changelog.mjs";

export default function changelog({ readJson }) {
  const { version } = readJson("package.json");
  assert(
    fs.existsSync(`.github/release-notes/v${version}.md`),
    `Missing release notes for v${version}`,
  );
  assert.equal(
    fs.readFileSync("CHANGELOG.md", "utf8"),
    buildChangelog(),
    "CHANGELOG.md is outdated: run npm run changelog",
  );
  for (const file of ["package.json", "src-tauri/tauri.conf.json"])
    assert.equal(readJson(file).version, version, `${file} version`);
  assert.match(
    fs.readFileSync("src-tauri/Cargo.toml", "utf8"),
    new RegExp(`^version = "${version.replaceAll(".", "\\.")}"`, "m"),
    "Cargo.toml version",
  );
  return `v${version}`;
}
