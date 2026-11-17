// Single validation entry point (`npm run validate`): one Vite server, every
// check module in ./checks, a non-zero exit code on the first failure.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
process.chdir(root);

const readJson = (file) => JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));
const flatten = (object, prefix = "") =>
  Object.entries(object).reduce((out, [key, value]) => {
    if (value && typeof value === "object" && !Array.isArray(value))
      Object.assign(out, flatten(value, `${prefix}${key}.`));
    else out[`${prefix}${key}`] = value;
    return out;
  }, {});

function sourceFiles(dir, pattern = /\.(jsx?|mjs)$/) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(file, pattern);
    return pattern.test(entry.name) ? [file] : [];
  });
}

const only = process.argv.slice(2);
const checkFiles = fs
  .readdirSync(path.join(root, ".github/scripts/validate/checks"))
  .filter((file) => file.endsWith(".mjs"))
  .sort()
  .filter((file) => !only.length || only.some((name) => file.includes(name)));

const server = await createServer({
  root,
  logLevel: "error",
  server: { watch: null, middlewareMode: true },
  appType: "custom",
});
let failed = false;
try {
  const i18n = await server.ssrLoadModule("/src/i18n/localization.jsx");
  const locales = Object.fromEntries(
    i18n.SUPPORTED_LANGUAGES.map(({ code }) => [code, readJson(`src/i18n/locales/${code}.json`)]),
  );
  /** Renders `probe(t)` inside the provider for one language and returns the markup. */
  function withLanguage(code, probe, ...children) {
    globalThis.localStorage = { getItem: () => code, setItem: () => {} };
    function Probe() {
      probe?.(i18n.useLocalization().t);
      return null;
    }
    try {
      return renderToStaticMarkup(
        React.createElement(
          i18n.LocalizationProvider,
          null,
          React.createElement(Probe),
          ...children,
        ),
      );
    } finally {
      delete globalThis.localStorage;
    }
  }
  const context = {
    root,
    server,
    React,
    renderToStaticMarkup,
    readJson,
    flatten,
    sourceFiles,
    withLanguage,
    languages: i18n.SUPPORTED_LANGUAGES.map(({ code }) => code),
    locales,
    flat: Object.fromEntries(Object.entries(locales).map(([code, data]) => [code, flatten(data)])),
    i18n,
  };
  for (const file of checkFiles) {
    const started = Date.now();
    try {
      const { default: check } = await import(
        path.join(root, ".github/scripts/validate/checks", file)
      );
      const summary = await check(context);
      console.log(
        `PASS ${file.replace(/\.mjs$/, "")} (${Date.now() - started} ms)${summary ? `: ${summary}` : ""}`,
      );
    } catch (error) {
      failed = true;
      console.error(`FAIL ${file.replace(/\.mjs$/, "")}\n${error?.stack ?? error}`);
    }
  }
} finally {
  await server.close();
}
if (failed) process.exitCode = 1;
