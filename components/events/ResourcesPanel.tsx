import { Card } from "@/components/ui/card";
import { SectionTitle } from "@/components/ui/section-title";
import type { VerifiedEventFact } from "@/data/verified/types";
import { CompactMetricRow, ResourceRow } from "./dashboard-ui";
import type { EventDocumentItem, MediaStats, OfficialLinkItem } from "./types";

export function ResourcesPanel({
  verifiedFact,
  mediaStats,
  documents,
  officialLinks,
}: {
  verifiedFact: VerifiedEventFact;
  mediaStats: MediaStats;
  documents: EventDocumentItem[];
  officialLinks: OfficialLinkItem[];
}) {
  return (
    <section id="resources" className="scroll-mt-32">
      <SectionTitle
        eyebrow="Resources"
        title="Official links, media, and documents"
        description="One source-aware resource hub instead of separate media and document blocks."
      />
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="p-5">
          <h3 className="text-xl font-black">Official links</h3>
          <div className="mt-4 grid gap-2">
            {officialLinks.map((link) => (
              <ResourceRow
                key={`${link.group}-${link.label}`}
                label={link.label}
                meta={link.group}
                href={link.url}
              />
            ))}
          </div>
        </Card>
        <Card className="p-5">
          <h3 className="text-xl font-black">Media</h3>
          <div className="mt-4 grid gap-2">
            <CompactMetricRow label="Gallery items" value={String(mediaStats.images)} />
            <CompactMetricRow label="Videos" value={String(mediaStats.videos)} />
            <CompactMetricRow
              label="Official gallery"
              value={verifiedFact.officialMediaGalleryPlaceholders?.[0]?.label ?? "TBC"}
            />
          </div>
        </Card>
        <Card className="p-5">
          <h3 className="text-xl font-black">Documents</h3>
          <div className="mt-4 grid gap-2">
            {verifiedFact.officialPdfPlaceholders?.map((item) => (
              <ResourceRow
                key={item.label}
                label={item.label}
                meta={item.url ? "Available" : "TBC"}
                href={item.url}
              />
            ))}
            <CompactMetricRow label="Document rows" value={String(documents.length)} />
          </div>
        </Card>
      </div>
    </section>
  );
}
