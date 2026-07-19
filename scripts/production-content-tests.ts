import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  ContentVerificationStatus,
  GalleryStatus,
  MediaEntityRole,
  MediaRightsStatus,
  SocialPlatform,
} from "@prisma/client";
import { getEventContentReadiness } from "@/lib/content/readiness";
import {
  publicEventWhere,
  publicResultWhere,
  publicRiderWhere,
  publicStageResultWhere,
  publicTeamWhere,
} from "@/lib/results/public-filters";

testEventContentReadinessDimensions();
testEventPublicationBlocksWithoutSourcesAndRights();
testPublicEntityFilters();
testPhase2SchemaEnumsCompile();
testPhase2SchemaModelsAndRelations();
testPhase2MigrationIsAdditive();

console.log("Production content tests passed.");

function testEventContentReadinessDimensions() {
  const readiness = getEventContentReadiness({
    name: "Red Bull Erzbergrodeo 2026",
    slug: "red-bull-erzbergrodeo-2026",
    seasonId: "season-2026",
    countryId: "country-at",
    roundNumber: 2,
    city: "Eisenerz",
    venue: "Erzberg",
    startDate: new Date("2026-06-04T00:00:00.000Z"),
    endDate: new Date("2026-06-07T00:00:00.000Z"),
    officialUrl: "https://www.redbullerzbergrodeo.com",
    organizer: "Red Bull Erzbergrodeo",
    description: "Official event profile.",
    heroImage: "https://media.example.test/erzberg.jpg",
    galleryImages: ["https://media.example.test/gallery.jpg"],
    visibility: "PUBLIC",
    archivedAt: null,
    sourceLinkCount: 1,
    mediaItems: [
      {
        type: "IMAGE",
        title: "Hero",
        url: "https://media.example.test/erzberg.jpg",
        copyrightOwner: "Hard Enduro World",
        license: null,
        source: "Owner upload",
      },
      {
        type: "YOUTUBE",
        title: "Official preview",
        url: "https://www.youtube.com/watch?v=example",
        copyrightOwner: "Official channel",
        license: "Embed only",
        source: "Official YouTube",
      },
    ],
  });

  assert.equal(readiness.publicationReady, true);
  assert.equal(readiness.dimensions.length, 5);
  assert.deepEqual(
    readiness.dimensions.map((item) => item.dimension),
    [
      "DATA_COMPLETE",
      "MEDIA_COMPLETE",
      "SOURCES_COMPLETE",
      "RIGHTS_COMPLETE",
      "PUBLICATION_READY",
    ],
  );
}

function testEventPublicationBlocksWithoutSourcesAndRights() {
  const readiness = getEventContentReadiness({
    name: "Red Bull Erzbergrodeo 2026",
    slug: "red-bull-erzbergrodeo-2026",
    seasonId: "season-2026",
    countryId: "country-at",
    roundNumber: 2,
    city: "Eisenerz",
    venue: "Erzberg",
    startDate: new Date("2026-06-04T00:00:00.000Z"),
    endDate: new Date("2026-06-07T00:00:00.000Z"),
    officialUrl: "https://www.redbullerzbergrodeo.com",
    organizer: null,
    description: "Official event profile.",
    heroImage: "https://media.example.test/erzberg.jpg",
    galleryImages: [],
    visibility: "DRAFT",
    archivedAt: null,
    sourceLinkCount: 0,
    mediaItems: [],
  });

  assert.equal(readiness.publicationReady, false);
  assert.equal(
    readiness.dimensions.find((item) => item.dimension === "SOURCES_COMPLETE")?.status,
    "blocked",
  );
  assert.equal(
    readiness.dimensions.find((item) => item.dimension === "RIGHTS_COMPLETE")?.status,
    "blocked",
  );
  assert.equal(
    readiness.dimensions.find((item) => item.dimension === "PUBLICATION_READY")?.status,
    "blocked",
  );
}

function testPublicEntityFilters() {
  assert.deepEqual(publicEventWhere, { visibility: "PUBLIC", archivedAt: null });
  assert.deepEqual(publicRiderWhere, { visibility: "PUBLIC", archivedAt: null });
  assert.deepEqual(publicTeamWhere, { visibility: "PUBLIC", archivedAt: null });
  assert.deepEqual(publicResultWhere.event, { is: publicEventWhere });
  assert.deepEqual(publicStageResultWhere.stage, {
    is: {
      event: {
        is: publicEventWhere,
      },
    },
  });
}

function testPhase2SchemaEnumsCompile() {
  assert.equal(MediaRightsStatus.RIGHTS_UNKNOWN, "RIGHTS_UNKNOWN");
  assert.equal(MediaEntityRole.GALLERY, "GALLERY");
  assert.equal(GalleryStatus.DRAFT, "DRAFT");
  assert.equal(SocialPlatform.YOUTUBE, "YOUTUBE");
  assert.equal(ContentVerificationStatus.UNVERIFIED, "UNVERIFIED");
}

function testPhase2SchemaModelsAndRelations() {
  const schema = readFileSync("prisma/schema.prisma", "utf8");

  assert.match(
    schema,
    /model MediaItem[\s\S]*rightsStatus\s+MediaRightsStatus\s+@default\(RIGHTS_UNKNOWN\)/,
  );
  assert.match(schema, /model MediaItem[\s\S]*storagePath\s+String\?\s+@unique/);
  assert.match(schema, /model MediaItem[\s\S]*galleryItems\s+GalleryItem\[\]/);
  assert.match(
    schema,
    /model MediaItem[\s\S]*coverForGalleries\s+Gallery\[\]\s+@relation\("GalleryCoverMedia"\)/,
  );

  assert.match(
    schema,
    /model MediaEntityLink[\s\S]*role\s+MediaEntityRole\s+@default\(GALLERY\)/,
  );
  assert.match(
    schema,
    /model MediaEntityLink[\s\S]*visibility\s+EventVisibility\s+@default\(DRAFT\)/,
  );

  assert.match(
    schema,
    /model Gallery[\s\S]*@@unique\(\[ownerEntityType, ownerEntityId, slug\]\)/,
  );
  assert.match(schema, /model GalleryItem[\s\S]*@@unique\(\[galleryId, mediaItemId\]\)/);
  assert.match(schema, /model SocialLink[\s\S]*platform\s+SocialPlatform/);
  assert.match(schema, /model SeoMetadata[\s\S]*@@unique\(\[entityType, entityId\]\)/);
  assert.match(schema, /model ContentVerification[\s\S]*sourceLink\s+SourceLink\?/);
  assert.match(
    schema,
    /model ContentVerification[\s\S]*connectorReviewItem\s+ConnectorReviewItem\?/,
  );

  assert.match(
    schema,
    /model SourceLink[\s\S]*contentVerifications\s+ContentVerification\[\]/,
  );
  assert.match(
    schema,
    /model SourceSnapshot[\s\S]*contentVerifications\s+ContentVerification\[\]/,
  );
  assert.match(
    schema,
    /model ConnectorReviewItem[\s\S]*contentVerifications\s+ContentVerification\[\]/,
  );
}

function testPhase2MigrationIsAdditive() {
  const sql = readFileSync(
    "prisma/migrations/20260718000000_phase2_production_content_schema/migration.sql",
    "utf8",
  );

  assert.doesNotMatch(sql, /^\s*DROP\b/im);
  assert.doesNotMatch(sql, /^\s*DELETE\b/im);
  assert.doesNotMatch(sql, /^\s*TRUNCATE\b/im);
  assert.doesNotMatch(sql, /^\s*UPDATE\b/im);
  assert.doesNotMatch(sql, /^\s*ALTER\s+TABLE\s+\S+\s+DROP\b/im);
  assert.doesNotMatch(sql, /^\s*ALTER\s+TABLE\s+\S+\s+RENAME\b/im);
  assert.match(sql, /CREATE TYPE "MediaRightsStatus"/);
  assert.match(sql, /CREATE TABLE "Gallery"/);
  assert.match(sql, /CREATE TABLE "GalleryItem"/);
  assert.match(sql, /CREATE TABLE "SocialLink"/);
  assert.match(sql, /CREATE TABLE "SeoMetadata"/);
  assert.match(sql, /CREATE TABLE "ContentVerification"/);
  assert.match(
    sql,
    /ADD COLUMN\s+"rightsStatus" "MediaRightsStatus" NOT NULL DEFAULT 'RIGHTS_UNKNOWN'/,
  );
  assert.match(
    sql,
    /ADD COLUMN\s+"visibility" "EventVisibility" NOT NULL DEFAULT 'DRAFT'/,
  );
  assert.match(sql, /ON DELETE SET NULL ON UPDATE CASCADE/);
  assert.match(sql, /ON DELETE CASCADE ON UPDATE CASCADE/);
  assert.match(sql, /ON DELETE RESTRICT ON UPDATE CASCADE/);
}
