import { readFileSync } from "node:fs";
import { defineRailway, github, group, project, service, volume } from "railway/iac";

const repository = process.env.SOURCE_REPO || "tech-progress/ntfy-private-push";
if (!repository || repository.split("/").length !== 2 || !repository.split("/").every((part) => /^[A-Za-z0-9_.-]+$/.test(part))) throw new Error("Set SOURCE_REPO to an existing owner/repository before compiling");
const branch = process.env.SOURCE_BRANCH || "release-v1";
if (branch.includes("/")) throw new Error("Use a slash-free publication branch, such as release-v1");
const SOURCE = github(repository, { branch, rootDirectory: process.env.SOURCE_ROOT_DIRECTORY || "/" });
const BUILD = { builder: "DOCKERFILE" as const, dockerfilePath: "Dockerfile" };
const POSTGRES_IMAGE = "postgres:17.9-bookworm@sha256:47f917f7409eacd22fc5dfb1dee634e1b55cf0c01d1a7eb701be2227a03e0641";
const defaults = JSON.parse(readFileSync("template-defaults.json", "utf8"));

export default defineRailway(() => {
  const data = volume("ntfy Data", { sizeMB: 5000 });
  const ntfy = service("ntfy", { source: SOURCE, build: BUILD, healthcheck: "/v1/health", healthcheckTimeout: 120, env: defaults.ntfy, volumeMounts: { "/var/lib/ntfy": data }, networking: { serviceDomains: { "<hasDomain>": { port: 8080 } } } });
  return project("ntfy-private-push", { resources: [group("Push", [ntfy, data])] });
});
