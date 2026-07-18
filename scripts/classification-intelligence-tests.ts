import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const candidateSource = readFileSync(
  "lib/data-quality/record-classification-candidates.ts",
  "utf8",
);
const intelligenceSource = readFileSync(
  "lib/data-quality/classification-intelligence.ts",
  "utf8",
);
const dashboardSource = readFileSync("app/admin/classifications/page.tsx", "utf8");
const detailPageSource = readFileSync(
  "app/admin/classifications/candidates/[entityType]/[entityId]/page.tsx",
  "utf8",
);
const panelSource = readFileSync("components/admin/classification-panel.tsx", "utf8");
const actionsSource = readFileSync("app/admin/classifications/actions.ts", "utf8");
const workflowSource = readFileSync(
  "lib/data-quality/record-classification-workflow.ts",
  "utf8",
);

main();

function main() {
  testCandidateStateIsSeparateFromClassificationStatus();
  testAdapterRegistryAndControlCenter();
  testCandidateEngineIsReadOnly();
  testReadinessReportUsesBatchSummaryPath();
  testProposalPathIsExplicitAndReviewOnly();
  testManualProposalPathIsPreserved();

  console.log("Classification intelligence tests passed.");
}

function testCandidateStateIsSeparateFromClassificationStatus() {
  assert.match(candidateSource, /export type ClassificationCandidateState/);
  for (const state of [
    "READY_FOR_PROPOSAL",
    "REVIEW_REQUIRED",
    "BLOCKED",
    "NO_CANDIDATE",
    "NO_CHANGE",
    "ARCHIVED_ENTITY",
    "UNSUPPORTED_EVIDENCE_PATH",
    "STALE",
  ]) {
    assert.match(candidateSource, new RegExp(`"${state}"`));
    assert.match(panelSource, new RegExp("candidate\\.candidateState"));
  }
  assert.match(candidateSource, /suggestedStatus: DataOriginStatus \| null/);
  assert.match(candidateSource, /suggestedStatus = null/);
  assert.match(candidateSource, /candidateState === "READY_FOR_PROPOSAL"/);
  assert.match(candidateSource, /if \(!suggestedStatus\) return "NO_CANDIDATE"/);
  assert.match(panelSource, /Candidate state/);
  assert.match(panelSource, /Suggested classification/);
  assert.match(panelSource, /No candidate/);
}

function testAdapterRegistryAndControlCenter() {
  assert.match(intelligenceSource, /classificationEntityAdapters/);
  assert.match(intelligenceSource, /classifiableEntityTypes\.map/);
  assert.match(intelligenceSource, /generateClassificationReadinessReport/);
  assert.match(intelligenceSource, /generateClassificationCandidates/);
  assert.match(intelligenceSource, /capabilityMatrix/);
  assert.match(intelligenceSource, /events2026/);
  assert.match(intelligenceSource, /eventSeasonYears/);
  assert.match(intelligenceSource, /eventSeasonYears\.get\(row\.entityId\) === 2026/);
  const reportFunction = sourceBetween(
    intelligenceSource,
    "export async function generateClassificationReadinessReport",
    "export function summarizeCandidates",
  );
  assert.doesNotMatch(
    reportFunction,
    /entityLabel\?\.includes\("2026"\)|reason\.includes\("2026"\)|sourceLinkLabel\?\.includes\("2026"\)/,
    "2026 Event inventory must use the Event -> Season.year relation, not label text",
  );
  assert.match(intelligenceSource, /erzbergrodeo/);
  assert.match(dashboardSource, /Total Records/);
  assert.match(dashboardSource, /Action Needed/);
  assert.match(dashboardSource, /All Records/);
  assert.match(dashboardSource, /More filters/);
  assert.match(dashboardSource, /Advanced diagnostics/);
  assert.match(dashboardSource, /Entity Coverage/);
  assert.match(dashboardSource, /Conflicts/);
  assert.match(dashboardSource, /Missing Evidence/);
  assert.match(dashboardSource, /2026 Events/);
  assert.match(dashboardSource, /candidateStateLabel/);
  assert.match(dashboardSource, /capabilityLabel/);
  assert.doesNotMatch(dashboardSource, /Erzbergrodeo 2026 Audit/);
  assert.match(dashboardSource, /READY_FOR_PROPOSAL: "Ready"/);
  assert.match(dashboardSource, /NO_CANDIDATE: "Missing Evidence"/);
  assert.match(dashboardSource, /REVIEW_REQUIRED: "Needs Review"/);
  assert.match(dashboardSource, /BLOCKED: "Blocked"/);
  assert.match(dashboardSource, /CONFLICTING: "Conflict"/);
  assert.match(dashboardSource, /SUPPORTED_FOR_ANALYSIS: "Analysis available"/);
  assert.match(dashboardSource, /SUPPORTED_FOR_PROPOSAL: "Proposal available"/);
  assert.match(dashboardSource, /READINESS_ONLY: "Read-only"/);
  assert.match(dashboardSource, /SOURCE_MANAGED_UNVERIFIED: "Source managed"/);
  assert.match(dashboardSource, /AUDITED_MANUAL: "Audited manual"/);
  assert.doesNotMatch(
    dashboardSource,
    /Promise\.all\(\[\s*getAdminClassificationDashboard/,
    "classification dashboard should avoid concurrent heavy read bundles",
  );
  assert.match(detailPageSource, /Classification Candidate/);
  assert.match(detailPageSource, /Resolution trace/);
  assert.match(detailPageSource, /Rule results/);
  assert.match(detailPageSource, /Evidence graph/);
  assert.match(detailPageSource, /Checksums/);
  assert.match(detailPageSource, /Proposal controls/);
  assert.match(detailPageSource, /generateClassificationCandidateProposal/);
  assert.match(detailPageSource, /Advanced: create a deliberate manual proposal/);
}

function testCandidateEngineIsReadOnly() {
  assert.match(candidateSource, /generateRecordClassificationCandidate/);
  assert.doesNotMatch(
    candidateSource,
    /\b(?:recordClassification|dataVersion|sourceLink|sourceSnapshot|connectorSnapshot|connectorReviewItem|event|rider|result|stageResult|championshipRegulation)\.(?:create|createMany|update|updateMany|delete|deleteMany|upsert)\(/,
  );
  assert.doesNotMatch(candidateSource, /\$transaction\s*\(/);
  assert.doesNotMatch(candidateSource, /\$executeRaw(?:Unsafe)?\s*\(/);
  assert.doesNotMatch(
    candidateSource,
    /recordClassification\.(?:create|update|delete|upsert)/,
  );
  assert.doesNotMatch(candidateSource, /dataVersion\.(?:create|update|delete|upsert)/);
  assert.doesNotMatch(candidateSource, /sourceLink\.(?:create|update|delete|upsert)/);
  assert.doesNotMatch(candidateSource, /sourceSnapshot\.(?:create|update|delete|upsert)/);
  assert.doesNotMatch(
    candidateSource,
    /connectorSnapshot\.(?:create|update|delete|upsert)/,
  );
  assert.doesNotMatch(
    candidateSource,
    /connectorReviewItem\.(?:create|update|delete|upsert)/,
  );
  assert.doesNotMatch(
    candidateSource,
    /Promise\.all/,
    "detail candidate generation should avoid parallel Prisma fan-out",
  );
}

function testReadinessReportUsesBatchSummaryPath() {
  const reportFunction = sourceBetween(
    intelligenceSource,
    "export async function generateClassificationReadinessReport",
    "export function summarizeCandidates",
  );
  assert.match(reportFunction, /generateClassificationCandidatesForIdentities/);
  assert.doesNotMatch(
    reportFunction,
    /generateRecordClassificationCandidate/,
    "readiness reports must not loop through the detailed per-entity candidate loader",
  );
  assert.match(intelligenceSource, /loadBatchEvidence/);
  assert.match(intelligenceSource, /sourceSnapshotsByDataSource/);
  assert.match(intelligenceSource, /loadBatchSupportingReviews/);
}

function testProposalPathIsExplicitAndReviewOnly() {
  assert.match(panelSource, /Generate Review Proposal/);
  assert.match(actionsSource, /generateClassificationCandidateProposal/);
  assert.match(actionsSource, /candidateChecksum/);
  assert.match(actionsSource, /candidate\.candidateChecksum !== submittedChecksum/);
  assert.match(actionsSource, /entityType !== ClassifiableEntityType\.EVENT/);
  assert.match(actionsSource, /createRecordClassificationReviewProposal/);
  assert.match(workflowSource, /deterministic-rule-evaluation/);
  assert.match(workflowSource, /mandatoryRulesSatisfied/);
  assert.doesNotMatch(workflowSource, /method: "explicit-admin-proposal"/);
  assert.doesNotMatch(workflowSource, /score: action ===/);
  const proposalFunction = sourceBetween(
    workflowSource,
    "export async function createRecordClassificationReviewProposal",
    "export async function applyRecordClassificationReviewItem",
  );
  assert.match(proposalFunction, /connectorReviewItem\.create/);
  assert.match(proposalFunction, /findOrCreateSnapshot/);
  assert.doesNotMatch(
    proposalFunction,
    /recordClassification\.(create|update|delete|upsert)/,
  );
  assert.doesNotMatch(proposalFunction, /dataVersion\.create/);
}

function testManualProposalPathIsPreserved() {
  assert.match(panelSource, /Advanced: create a deliberate manual proposal/);
  assert.match(panelSource, /name="originStatus"/);
  assert.match(panelSource, /Generate Manual Review Proposal/);
  assert.match(panelSource, /manualProposalStatuses/);
  assert.doesNotMatch(panelSource, /ARCHIVED_HISTORY[\s\S]*<option/);
}

function sourceBetween(source: string, start: string, end: string) {
  const startIndex = source.indexOf(start);
  const endIndex = source.indexOf(end);
  assert.notEqual(startIndex, -1, `Missing source start: ${start}`);
  assert.notEqual(endIndex, -1, `Missing source end: ${end}`);
  return source.slice(startIndex, endIndex);
}
