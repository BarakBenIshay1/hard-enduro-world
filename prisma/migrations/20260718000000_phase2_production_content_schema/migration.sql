-- CreateEnum
CREATE TYPE "MediaRightsStatus" AS ENUM ('OWNED', 'LICENSED', 'OFFICIAL_PRESS', 'USER_PROVIDED', 'EMBED_ONLY', 'PERMISSION_REQUIRED', 'RIGHTS_UNKNOWN');

-- CreateEnum
CREATE TYPE "MediaEntityRole" AS ENUM ('HERO', 'LOGO', 'THUMBNAIL', 'PROFILE', 'GALLERY', 'COVER', 'VIDEO', 'DOCUMENT');

-- CreateEnum
CREATE TYPE "GalleryStatus" AS ENUM ('DRAFT', 'REVIEW', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "SocialPlatform" AS ENUM ('WEBSITE', 'INSTAGRAM', 'FACEBOOK', 'YOUTUBE', 'X', 'TIKTOK', 'VIMEO', 'OTHER');

-- CreateEnum
CREATE TYPE "ContentVerificationStatus" AS ENUM ('VERIFIED', 'UNVERIFIED', 'NEEDS_REVIEW', 'CONFLICTING', 'EXPIRED');

-- AlterTable
ALTER TABLE "MediaItem" ADD COLUMN     "altText" TEXT,
ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "archivedBy" TEXT,
ADD COLUMN     "caption" TEXT,
ADD COLUMN     "checksum" TEXT,
ADD COLUMN     "creditText" TEXT,
ADD COLUMN     "derivativeAllowed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "directSourceUrl" TEXT,
ADD COLUMN     "fileSizeBytes" INTEGER,
ADD COLUMN     "height" INTEGER,
ADD COLUMN     "mimeType" TEXT,
ADD COLUMN     "originalFilename" TEXT,
ADD COLUMN     "publicDisplayAllowed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "rehostingAllowed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "rightsStatus" "MediaRightsStatus" NOT NULL DEFAULT 'RIGHTS_UNKNOWN',
ADD COLUMN     "sourcePageUrl" TEXT,
ADD COLUMN     "storageBucket" TEXT,
ADD COLUMN     "storagePath" TEXT,
ADD COLUMN     "uploadedByUserEmail" TEXT,
ADD COLUMN     "uploadedByUserId" TEXT,
ADD COLUMN     "usageNotes" TEXT,
ADD COLUMN     "width" INTEGER;

-- AlterTable
ALTER TABLE "MediaEntityLink" ADD COLUMN     "altTextOverride" TEXT,
ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "archivedBy" TEXT,
ADD COLUMN     "captionOverride" TEXT,
ADD COLUMN     "displayOrder" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "featured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "role" "MediaEntityRole" NOT NULL DEFAULT 'GALLERY',
ADD COLUMN     "visibility" "EventVisibility" NOT NULL DEFAULT 'DRAFT';

-- CreateTable
CREATE TABLE "Gallery" (
    "id" TEXT NOT NULL,
    "ownerEntityType" TEXT NOT NULL,
    "ownerEntityId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "visibility" "EventVisibility" NOT NULL DEFAULT 'DRAFT',
    "status" "GalleryStatus" NOT NULL DEFAULT 'DRAFT',
    "coverMediaItemId" TEXT,
    "eventId" TEXT,
    "dateContext" TIMESTAMP(3),
    "photographer" TEXT,
    "sourceAttribution" TEXT,
    "rightsNotes" TEXT,
    "archivedAt" TIMESTAMP(3),
    "archivedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Gallery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GalleryItem" (
    "id" TEXT NOT NULL,
    "galleryId" TEXT NOT NULL,
    "mediaItemId" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "captionOverride" TEXT,
    "altTextOverride" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GalleryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialLink" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "platform" "SocialPlatform" NOT NULL,
    "url" TEXT NOT NULL,
    "label" TEXT,
    "official" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "archivedAt" TIMESTAMP(3),
    "archivedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeoMetadata" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "canonicalPath" TEXT,
    "openGraphImage" TEXT,
    "noIndex" BOOLEAN NOT NULL DEFAULT false,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SeoMetadata_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentVerification" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "fieldKey" TEXT,
    "status" "ContentVerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "sourceLinkId" TEXT,
    "sourceSnapshotId" TEXT,
    "connectorReviewItemId" TEXT,
    "verifiedByUserId" TEXT,
    "verifiedByUserEmail" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "note" TEXT,
    "archivedAt" TIMESTAMP(3),
    "archivedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentVerification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Gallery_ownerEntityType_ownerEntityId_idx" ON "Gallery"("ownerEntityType", "ownerEntityId");

-- CreateIndex
CREATE INDEX "Gallery_visibility_idx" ON "Gallery"("visibility");

-- CreateIndex
CREATE INDEX "Gallery_status_idx" ON "Gallery"("status");

-- CreateIndex
CREATE INDEX "Gallery_archivedAt_idx" ON "Gallery"("archivedAt");

-- CreateIndex
CREATE INDEX "Gallery_eventId_idx" ON "Gallery"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "Gallery_ownerEntityType_ownerEntityId_slug_key" ON "Gallery"("ownerEntityType", "ownerEntityId", "slug");

-- CreateIndex
CREATE INDEX "GalleryItem_galleryId_displayOrder_idx" ON "GalleryItem"("galleryId", "displayOrder");

-- CreateIndex
CREATE INDEX "GalleryItem_mediaItemId_idx" ON "GalleryItem"("mediaItemId");

-- CreateIndex
CREATE UNIQUE INDEX "GalleryItem_galleryId_mediaItemId_key" ON "GalleryItem"("galleryId", "mediaItemId");

-- CreateIndex
CREATE INDEX "SocialLink_entityType_entityId_idx" ON "SocialLink"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "SocialLink_platform_idx" ON "SocialLink"("platform");

-- CreateIndex
CREATE INDEX "SocialLink_archivedAt_idx" ON "SocialLink"("archivedAt");

-- CreateIndex
CREATE INDEX "SeoMetadata_noIndex_idx" ON "SeoMetadata"("noIndex");

-- CreateIndex
CREATE UNIQUE INDEX "SeoMetadata_entityType_entityId_key" ON "SeoMetadata"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "ContentVerification_entityType_entityId_idx" ON "ContentVerification"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "ContentVerification_fieldKey_idx" ON "ContentVerification"("fieldKey");

-- CreateIndex
CREATE INDEX "ContentVerification_status_idx" ON "ContentVerification"("status");

-- CreateIndex
CREATE INDEX "ContentVerification_sourceLinkId_idx" ON "ContentVerification"("sourceLinkId");

-- CreateIndex
CREATE INDEX "ContentVerification_sourceSnapshotId_idx" ON "ContentVerification"("sourceSnapshotId");

-- CreateIndex
CREATE INDEX "ContentVerification_connectorReviewItemId_idx" ON "ContentVerification"("connectorReviewItemId");

-- CreateIndex
CREATE INDEX "ContentVerification_archivedAt_idx" ON "ContentVerification"("archivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "MediaItem_storagePath_key" ON "MediaItem"("storagePath");

-- CreateIndex
CREATE INDEX "MediaItem_type_idx" ON "MediaItem"("type");

-- CreateIndex
CREATE INDEX "MediaItem_rightsStatus_idx" ON "MediaItem"("rightsStatus");

-- CreateIndex
CREATE INDEX "MediaItem_archivedAt_idx" ON "MediaItem"("archivedAt");

-- CreateIndex
CREATE INDEX "MediaItem_checksum_idx" ON "MediaItem"("checksum");

-- CreateIndex
CREATE INDEX "MediaEntityLink_entityType_entityId_role_idx" ON "MediaEntityLink"("entityType", "entityId", "role");

-- CreateIndex
CREATE INDEX "MediaEntityLink_entityType_entityId_visibility_idx" ON "MediaEntityLink"("entityType", "entityId", "visibility");

-- CreateIndex
CREATE INDEX "MediaEntityLink_archivedAt_idx" ON "MediaEntityLink"("archivedAt");

-- AddForeignKey
ALTER TABLE "Gallery" ADD CONSTRAINT "Gallery_coverMediaItemId_fkey" FOREIGN KEY ("coverMediaItemId") REFERENCES "MediaItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GalleryItem" ADD CONSTRAINT "GalleryItem_galleryId_fkey" FOREIGN KEY ("galleryId") REFERENCES "Gallery"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GalleryItem" ADD CONSTRAINT "GalleryItem_mediaItemId_fkey" FOREIGN KEY ("mediaItemId") REFERENCES "MediaItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentVerification" ADD CONSTRAINT "ContentVerification_sourceLinkId_fkey" FOREIGN KEY ("sourceLinkId") REFERENCES "SourceLink"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentVerification" ADD CONSTRAINT "ContentVerification_sourceSnapshotId_fkey" FOREIGN KEY ("sourceSnapshotId") REFERENCES "SourceSnapshot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentVerification" ADD CONSTRAINT "ContentVerification_connectorReviewItemId_fkey" FOREIGN KEY ("connectorReviewItemId") REFERENCES "ConnectorReviewItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
