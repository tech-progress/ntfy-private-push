import assert from "node:assert/strict";
import test from "node:test";
import { loadDocumentation, verifyDocumentation } from "../scripts/verify-docs.mjs";

const documentation = loadDocumentation();
const changedDocument = (filename, transform) => ({
  ...documentation,
  documents: { ...documentation.documents, [filename]: transform(documentation.documents[filename]) },
});

test("distributed release docs preserve historical proof and independent qualification gates", () => {
  verifyDocumentation(documentation);
});

test("rejects omitted sync-topic exception or public aggregate visibility", () => {
  for (const filename of ["README.md", "MARKETPLACE.md"]) {
    assert.throws(() => verifyDocumentation(changedDocument(filename, (text) => text.replaceAll("private sync topic", "settings channel"))), /sync exception required/);
    assert.throws(() => verifyDocumentation(changedDocument(filename, (text) => text.replaceAll(/aggregate/gi, "summary"))), /aggregate statistics required/);
  }
});

test("rejects inconsistent release versions and runtime pins", () => {
  for (const filename of ["README.md", "PUBLISHING.md", "UPGRADE.md", "SUPPORT.md", "MARKETPLACE.md"]) {
    assert.throws(() => verifyDocumentation(changedDocument(filename, (text) =>
      text.replace(`Template release **v${documentation.version}**`, "Template release **v0.0.0**")
    )), /release must match VERSION/);
  }
  assert.throws(() => verifyDocumentation({ ...documentation, upstreamVersion: "0.0.0" }), /upstream pin must match Dockerfile/);
});

test("rejects malformed or incomplete marketplace headings", () => {
  const marketplace = documentation.documents["MARKETPLACE.md"];
  for (const heading of marketplace.match(/^#{1,3} .+$/gm)) {
    assert.throws(() => verifyDocumentation(changedDocument("MARKETPLACE.md", (text) =>
      text.replace(heading, `${heading} extra`)
    )), /six exact publication headings/);
    assert.throws(() => verifyDocumentation(changedDocument("MARKETPLACE.md", (text) =>
      text.replace(`${heading}\n`, "")
    )), /six exact publication headings/);
  }
});

test("rejects stale absolute status claims and loss of independent release gates", () => {
  const staleClaims = [
    "This release has not been released or tested live.",
    "This release has not yet been published.",
    "This release has never been tested live.",
    "This release has never been live-qualified.",
    "This release is unreleased.",
    "This release remains unpublished.",
    "Marketplace publication remains pending.",
    "Live qualification remains pending.",
    "Its clean rebuild/start and exact final stored-graph tests remain pending.",
    "The planned immutable tag does not exist yet.",
  ];
  for (const filename of Object.keys(documentation.documents)) {
    for (const claim of staleClaims) {
      assert.throws(() => verifyDocumentation(changedDocument(filename, (text) =>
        `${text}\n${claim}\n`
      )), /stale absolute qualification status/);
    }
  }
  for (const filename of ["README.md", "PUBLISHING.md", "UPGRADE.md", "SUPPORT.md", "MARKETPLACE.md"]) {
    assert.throws(() => verifyDocumentation(changedDocument(filename, (text) =>
      text.replace("This release must be qualified independently.", "Historical proof is sufficient.")
    )), /independent release qualification required/);
    assert.throws(() => verifyDocumentation(changedDocument(filename, (text) =>
      text.replace(/([Aa]) source release does not prove marketplace publication/, "$1 source release proves marketplace publication")
    )), /source release is not marketplace proof/);
  }
  for (const wording of ["Template candidate", "the parent"]) {
    assert.throws(() => verifyDocumentation(changedDocument("README.md", (text) =>
      `${text}\n${wording} owns qualification.\n`
    )), /durable release and maintainer wording/);
  }
});

test("rejects loss of exact historical source and obsolete source status", () => {
  assert.throws(() => verifyDocumentation(changedDocument("PUBLISHING.md", (text) =>
    text.replace("08089b9848557308275a05c80de581f1a8e81cb8", "unknown-revision")
  )), /exact historical source revision/);
  assert.throws(() => verifyDocumentation(changedDocument("CHANGELOG.md", (text) =>
    `${text}\nNo Railway/GitHub publication or standalone distribution exists yet.\n`
  )), /stale source status/);
});

test("rejects superseded physical-deletion holds without weakening cleanup", () => {
  assert.throws(() => verifyDocumentation(changedDocument("PUBLISHING.md", (text) =>
    text.replace("Standard deletion plus verified zero compute and disclosed retention satisfies the owner's cleanup policy.", "Cleanup is optional.")
  )), /accepted cleanup policy required/);
  assert.throws(() => verifyDocumentation(changedDocument("PUBLISHING.md", (text) =>
    text.replace("Physical storage deletion and billing-zero proof are not publication gates under the accepted policy.", "Billing-zero proof is required before publication.")
  )), /retention\/billing proof boundary/);
  assert.throws(() => verifyDocumentation(changedDocument("PUBLISHING.md", (text) =>
    `${text}\nKeep the draft unpublished while storage deletion remains pending or unverified.\n`
  )), /superseded cleanup hold/);
});

test("rejects private/broken links, missing origins and unrelated product instructions", () => {
  for (const filename of Object.keys(documentation.documents)) {
    assert.throws(() => verifyDocumentation(changedDocument(filename, (text) =>
      `${text}\n[Internal proof](FINDINGS.md)\n`
    )), /private evidence references/);
  }
  assert.throws(() => verifyDocumentation(changedDocument("README.md", (text) =>
    `${text}\n[Missing guide](missing-public-guide.md)\n`
  )), /missing distributed link target/);
  for (const filename of ["README.md", "MARKETPLACE.md"]) {
    assert.throws(() => verifyDocumentation(changedDocument(filename, (text) =>
      text.replaceAll("https://ntfy.sh/", "https://example.invalid/")
    )), /upstream product link required/);
  }
  assert.throws(() => verifyDocumentation(changedDocument("MARKETPLACE.md", (text) =>
    `${text}\nHatchet requires a tenant token.\n`
  )), /unrelated product instructions/);
});
