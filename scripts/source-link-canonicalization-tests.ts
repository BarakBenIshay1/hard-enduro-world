import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { ClassifiableEntityType } from "@prisma/client";
import {
  dedupeSourceLinksByLogicalEvidence,
  requiredCanonicalSourceLinkEntityTypeForClassifiable,
  sourceLinkEntityTypeAliasesFor,
} from "@/lib/sources/source-link-entity-types";

const applyService = readFileSync("lib/admin/connector-review-application.ts", "utf8");
const adminResults = readFileSync("db/admin-results.ts", "utf8");
const candidateEngine = readFileSync(
  "lib/data-quality/record-classification-candidates.ts",
  "utf8",
);
const intelligence = readFileSync(
  "lib/data-quality/classification-intelligence.ts",
  "utf8",
);
const helper = readFileSync("lib/sources/source-link-entity-types.ts", "utf8");

assert.match(applyService, /requiredCanonicalSourceLinkEntityTypeForClassifiable/);
assert.match(applyService, /ClassifiableEntityType\.RESULT/);
assert.match(applyService, /ClassifiableEntityType\.STAGE_RESULT/);
const resultSourceLinkBody = functionBody(applyService, "createResultSourceLink");
const stageResultSourceLinkBody = functionBody(
  applyService,
  "createStageResultSourceLink",
);
assert.doesNotMatch(resultSourceLinkBody, /entityType: "Result"/);
assert.doesNotMatch(stageResultSourceLinkBody, /entityType: "StageResult"/);

assert.match(adminResults, /sourceLinkEntityTypeAliasesFor\(entityType\)/);
assert.match(candidateEngine, /sourceLinkEntityTypeAliasesFor\(legacyType\)/);
assert.match(intelligence, /sourceLinkEntityTypeAliasesFor\(legacyType\)/);

assert.match(helper, /requiredCanonicalSourceLinkEntityTypeForClassifiable/);
assert.match(helper, /throw new Error\(`Unsupported canonical SourceLink entity type/);
assert.match(helper, /return \[value\]/);
assert.doesNotMatch(helper, /toLowerCase\(\)/);
assert.doesNotMatch(helper, /cmrm9q7so0005u9clqaic6ggt/);
assert.doesNotMatch(helper, /cmrm9q9or000bu9cle03ey72u/);
assert.deepEqual(sourceLinkEntityTypeAliasesFor("SEED_DATA"), ["SEED_DATA"]);
assert.equal(
  requiredCanonicalSourceLinkEntityTypeForClassifiable(ClassifiableEntityType.RESULT),
  "RESULT",
);
assert.equal(
  requiredCanonicalSourceLinkEntityTypeForClassifiable(
    ClassifiableEntityType.STAGE_RESULT,
  ),
  "STAGE_RESULT",
);
assert.throws(
  () =>
    requiredCanonicalSourceLinkEntityTypeForClassifiable(ClassifiableEntityType.EVENT),
  /Unsupported canonical SourceLink entity type/,
);
assert.deepEqual(
  dedupeSourceLinksByLogicalEvidence([
    {
      entityType: "Result",
      entityId: "result-1",
      dataSourceId: "source-1",
      url: "https://example.test",
      note: null,
    },
    {
      entityType: "RESULT",
      entityId: "result-1",
      dataSourceId: "source-1",
      url: "https://example.test",
      note: null,
    },
  ]),
  [
    {
      entityType: "RESULT",
      entityId: "result-1",
      dataSourceId: "source-1",
      url: "https://example.test",
      note: null,
    },
  ],
);
assert.deepEqual(
  dedupeSourceLinksByLogicalEvidence([
    {
      entityType: "RESULT",
      entityId: "result-1",
      dataSourceId: "source-1",
      url: "https://example.test/a",
      note: null,
    },
    {
      entityType: "RESULT",
      entityId: "result-1",
      dataSourceId: "source-2",
      url: "https://example.test/a",
      note: null,
    },
    {
      entityType: "RESULT",
      entityId: "result-1",
      dataSourceId: "source-1",
      url: "https://example.test/b",
      note: null,
    },
  ]).map((link) => `${link.dataSourceId}:${link.url}`),
  [
    "source-1:https://example.test/a",
    "source-2:https://example.test/a",
    "source-1:https://example.test/b",
  ],
);
assert.deepEqual(
  dedupeSourceLinksByLogicalEvidence([
    {
      entityType: "StageResult",
      entityId: "stage-result-1",
      dataSourceId: "source-1",
      url: "https://example.test",
      note: null,
    },
    {
      entityType: "STAGE_RESULT",
      entityId: "stage-result-1",
      dataSourceId: "source-1",
      url: "https://example.test",
      note: null,
    },
  ]),
  [
    {
      entityType: "STAGE_RESULT",
      entityId: "stage-result-1",
      dataSourceId: "source-1",
      url: "https://example.test",
      note: null,
    },
  ],
);

console.log("SourceLink canonicalization tests passed");

function functionBody(source: string, functionName: string) {
  const marker = `async function ${functionName}`;
  const start = source.indexOf(marker);
  assert.notEqual(start, -1, `${functionName} should exist`);
  const nextFunction = source.indexOf("\nasync function ", start + marker.length);
  return source.slice(start, nextFunction === -1 ? undefined : nextFunction);
}
