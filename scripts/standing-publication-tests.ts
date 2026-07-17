import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { authPermissions, rolePermissions } from "@/lib/auth/permissions";

testPublicationSchema();
testPublicReadPath();
testPublicationService();
testAdminActionsAndPermissions();

console.log("Standing publication tests passed.");

function testPublicationSchema() {
  const schema = readFileSync("prisma/schema.prisma", "utf8");
  assert.match(schema, /model StandingPublication/);
  assert.match(schema, /calculationSetId\s+String/);
  assert.match(schema, /regulationVersion\s+Int\?/);
  assert.match(schema, /regulationChecksum\s+String\?/);
  assert.match(schema, /snapshotChecksum\s+String/);
  assert.match(schema, /activeKey\s+String\?\s+@unique/);
  assert.match(schema, /publicationVersion\s+Int/);
  assert.match(schema, /versionKey\s+String\s+@unique/);
  assert.match(schema, /rows\s+Json/);
}

function testPublicReadPath() {
  const publicRepo = readFileSync("db/standings.ts", "utf8");
  const publicPage = readFileSync("app/standings/page.tsx", "utf8");

  assert.match(publicRepo, /standingPublication\.findMany/);
  assert.match(publicRepo, /status:\s+"PUBLISHED"/);
  assert.match(publicRepo, /activeKey:\s+\{\s+not:\s+null\s+\}/);
  assert.doesNotMatch(publicRepo, /prisma\.season\.findMany\(\{[\s\S]*standings/);
  assert.match(publicPage, /Official standings will appear here after/);
  assert.match(publicPage, /officially published/i);
}

function testPublicationService() {
  const service = readFileSync("lib/admin/standing-publications.ts", "utf8");

  assert.match(service, /publishStandingCalculationSet/);
  assert.match(service, /rollbackStandingPublication/);
  assert.match(service, /prisma\.\$transaction/);
  assert.match(service, /Every Standing proposal must be applied before publication/);
  assert.match(service, /Regulation changed or is no longer active/);
  assert.match(service, /A newer unapplied Standing calculation set exists/);
  assert.match(service, /status:\s+"SUPERSEDED"/);
  assert.match(service, /nextPublicationVersion/);
  assert.match(service, /versionKey:\s+`\$\{activeKey\}:v\$\{publicationVersion\}`/);
  assert.match(service, /standingChecksum/);
  assert.match(service, /standingDataVersionId/);
  assert.match(service, /reviewItemId/);
  assert.match(service, /assertStandingMatchesProposal/);
  assert.match(service, /revalidatePath\("\/standings"\)/);
  assert.match(service, /entityType:\s+"StandingPublication"/);
  assert.match(service, /entityType:\s+"Standing"/);
}

function testAdminActionsAndPermissions() {
  const actions = readFileSync("app/admin/standings/actions.ts", "utf8");
  const reviewPage = readFileSync("app/admin/review/[id]/page.tsx", "utf8");
  const adminPage = readFileSync("app/admin/standings/page.tsx", "utf8");

  assert.ok(authPermissions.includes("standings:publish"));
  assert.ok(rolePermissions.owner.includes("standings:publish"));
  assert.ok(rolePermissions.admin.includes("standings:publish"));
  assert.equal(rolePermissions.reviewer.includes("standings:publish"), false);
  assert.ok(rolePermissions.reviewer.includes("calculations:review"));

  assert.match(actions, /hasPermission\(session,\s+"standings:publish"\)/);
  assert.match(actions, /publishStandingCalculationSet/);
  assert.match(actions, /rollbackStandingPublication/);
  assert.match(reviewPage, /StandingPublicationForm/);
  assert.match(adminPage, /Publication history/);
  assert.match(adminPage, /Applied standings/);
}
