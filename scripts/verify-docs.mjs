import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const root = new URL("../", import.meta.url);
const read = (filename) => readFileSync(new URL(filename, root), "utf8");
const historicalRevision = "08089b9848557308275a05c80de581f1a8e81cb8";
const releaseDocuments = ["README.md", "PUBLISHING.md", "UPGRADE.md", "SUPPORT.md", "MARKETPLACE.md"];
const staleQualificationClaims = [
  /\b(?:has|have) (?:not (?:yet )?|never )been (?:released|published|tested live|live[- ]tested|qualified live|live[- ]qualified)\b/i,
  /\b(?:is|remains) (?:unreleased|unpublished|untested live|never[- ]live)\b/i,
  /\b(?:marketplace publication|live qualification|(?:clean )?rebuild\/start and exact final stored-graph tests) (?:is|remains|remain) pending\b/i,
  /\b(?:tag|release) (?:does not|doesn't) exist yet\b/i,
];

export function loadDocumentation() {
  return {
    version: read("VERSION").trim(),
    upstreamVersion: read("Dockerfile").match(/^FROM binwiederhier\/ntfy:v([\d.]+)@sha256:/m)[1],
    metadata: JSON.parse(read("marketplace-metadata.json")),
    defaults: JSON.parse(read("template-defaults.json")).ntfy,
    documents: Object.fromEntries(
      readdirSync(root)
        .filter((filename) => filename.endsWith(".md") && filename !== "FINDINGS.md")
        .map((filename) => [filename, read(filename)])
    ),
  };
}

export function verifyDocumentation({ version, upstreamVersion, metadata, defaults, documents }) {
  assert.match(version, /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/, "VERSION: SemVer required");
  for (const filename of releaseDocuments) {
    const declarations = [...documents[filename].matchAll(/Template release \*\*v([\d.]+)\*\*/g)];
    assert.equal(declarations.length, 1, `${filename}: one release declaration required`);
    assert.equal(declarations[0][1], version, `${filename}: release must match VERSION`);
    assert.ok(documents[filename].includes("This release must be qualified independently."), `${filename}: independent release qualification required`);
    assert.match(documents[filename], /[Aa] source release does not prove marketplace publication/, `${filename}: source release is not marketplace proof`);
  }
  assert.match(documents["CHANGELOG.md"], new RegExp(`^## \\[${version.replaceAll(".", "\\.")}\\] - \\d{4}-\\d{2}-\\d{2}$`, "m"), "CHANGELOG.md: current version entry required");

  for (const filename of ["README.md", "PUBLISHING.md", "UPGRADE.md"]) {
    assert.ok(documents[filename].includes(historicalRevision), `${filename}: exact historical source revision required`);
    assert.ok(documents[filename].includes("`v1.0.0`"), `${filename}: historical release required`);
  }
  for (const filename of ["README.md", "PUBLISHING.md", "UPGRADE.md", "MARKETPLACE.md"]) {
    assert.ok(documents[filename].includes(`ntfy ${upstreamVersion}`), `${filename}: upstream pin must match Dockerfile`);
  }
  for (const key of Object.keys(defaults)) {
    assert.ok(documents["README.md"].includes(`\`${key}\``), "README.md: every runtime default must be documented");
  }
  for (const filename of ["README.md", "MARKETPLACE.md"]) {
    assert.ok(documents[filename].includes("private sync topic"), `${filename}: own-user sync exception required`);
    assert.match(documents[filename], /aggregate/i, `${filename}: public aggregate statistics required`);
    assert.doesNotMatch(documents[filename], /(?:only|exclusively)\s+`alerts-\*`/, `${filename}: absolute namespace confinement is inaccurate`);
  }
  for (const filename of ["README.md", "MARKETPLACE.md"]) {
    for (const origin of metadata.origins) {
      assert.ok(documents[filename].includes(origin.url), `${filename}: upstream product link required`);
    }
  }
  assert.ok(metadata.description.length >= 45 && metadata.description.length <= 75, "marketplace description: 45–75 characters required");
  assert.ok(documents["MARKETPLACE.md"].includes(metadata.description), "MARKETPLACE.md: registered description required");

  const name = metadata.name;
  const headings = documents["MARKETPLACE.md"].match(/^#{1,3} .+$/gm);
  assert.deepEqual(headings, [
    `# Deploy and Host ${name} on Railway`,
    `## About Hosting ${name}`,
    `## Why Deploy ${name}`,
    "## Common Use Cases",
    `## Dependencies for ${name}`,
    "### Deployment Dependencies",
  ], "MARKETPLACE.md: six exact publication headings required");

  const publishing = documents["PUBLISHING.md"];
  assert.ok(publishing.includes(`${metadata.description.length}-character description`), "PUBLISHING.md: description length must match metadata");
  assert.ok(publishing.includes("Standard deletion plus verified zero compute and disclosed retention satisfies the owner's cleanup policy."), "PUBLISHING.md: accepted cleanup policy required");
  assert.ok(publishing.includes("Physical storage deletion and billing-zero proof are not publication gates under the accepted policy."), "PUBLISHING.md: retention/billing proof boundary required");
  assert.doesNotMatch(publishing, /keep the draft unpublished while storage deletion remains pending or unverified/i, "PUBLISHING.md: superseded cleanup hold");

  for (const [filename, document] of Object.entries(documents)) {
    for (const claim of staleQualificationClaims) {
      assert.doesNotMatch(document, claim, `${filename}: stale absolute qualification status`);
    }
    assert.doesNotMatch(document, /\bTemplate candidate\b|\bthe parent\b/i, `${filename}: durable release and maintainer wording required`);
    assert.doesNotMatch(document, /FINDINGS\.md|\.verification\b/, `${filename}: private evidence references are not distributed`);
    assert.doesNotMatch(document, /\bHatchet\b|uv sync --frozen/, `${filename}: unrelated product instructions`);
    assert.doesNotMatch(document, /no Railway\/GitHub publication or standalone distribution exists yet/i, `${filename}: stale source status`);
    for (const match of document.matchAll(/\]\(([^)]+)\)/g)) {
      const target = match[1].split("#")[0];
      if (!target || /^[a-z][a-z\d+.-]*:/i.test(target)) continue;
      assert.ok(!target.startsWith("/") && !target.split("/").includes(".."), `${filename}: link must stay within standalone source`);
      assert.ok(existsSync(new URL(target, root)), `${filename}: missing distributed link target`);
    }
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  verifyDocumentation(loadDocumentation());
  console.log("PASS: release-neutral docs, historical source, independent qualification gates, upstream pins, marketplace headings, cleanup policy and distributed links.");
}
