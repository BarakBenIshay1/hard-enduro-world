import type { Metadata } from "next";
import { CirclePlay, Film, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/ui/page-hero";
import { SectionTitle } from "@/components/ui/section-title";
import { siteConfig } from "@/config/site";
import { getVideosPageData } from "@/db/videos";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

const canonical = "/videos";
const description =
  "Hard Enduro World videos placeholder prepared for reviewed YouTube metadata imports.";

export const metadata: Metadata = {
  title: "Videos",
  description,
  alternates: {
    canonical,
  },
  openGraph: {
    title: "Videos | Hard Enduro World",
    description,
    url: new URL(canonical, siteConfig.url).toString(),
    siteName: siteConfig.name,
    type: "website",
  },
};

export default async function VideosPage() {
  const { mediaItems } = await getVideosPageData();
  const videos = mediaItems.map((item) => ({
    id: item.id,
    title: item.title ?? "Untitled video",
    channel: item.provider ?? "YouTube",
    publishedAt: item.publishedAt ?? item.uploadedAt,
    thumbnailUrl: item.thumbnailUrl,
    relatedEvent: item.event?.name ?? "Event review pending",
    relatedRider: "Rider review pending",
    url: item.url,
  }));

  return (
    <main className="min-h-screen bg-surface text-foreground">
      <PageHero
        compact
        eyebrow="Videos"
        title="Reviewed video metadata, ready for the media system."
        description="A premium videos surface powered by import-ready YouTube metadata. Publishing remains review-first and does not affect championship data."
      />

      <Container className="py-12">
        <div className="mb-8">
          <SectionTitle
            eyebrow="YouTube Connector Preview"
            title="Reviewed video cards"
            description="This page only displays approved/import-ready media records. Fresh YouTube API fetches stay inside admin review until approved."
          />
        </div>
        {videos.length > 0 ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {videos.map((video) => (
              <Card key={video.id} className="overflow-hidden">
                <div className="relative min-h-56 bg-black">
                  <div className="absolute inset-0 bg-[linear-gradient(135deg,hsl(0_0%_4%),hsl(220_10%_12%)_46%,hsl(22_88%_18%))]" />
                  <div className="absolute left-5 top-5 flex h-14 w-14 items-center justify-center rounded-md border border-white/[0.16] bg-white/[0.08] text-white backdrop-blur">
                    <CirclePlay className="h-7 w-7 text-accent" aria-hidden="true" />
                    <span className="sr-only">Thumbnail placeholder</span>
                  </div>
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/62 to-transparent p-5 text-white">
                    <p className="text-xs uppercase tracking-[0.18em] text-white/[0.48]">
                      Thumbnail placeholder
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold">{video.title}</h2>
                  </div>
                </div>
                <div className="grid gap-4 p-5">
                  <div className="grid gap-2 text-sm text-foreground/[0.64]">
                    <span className="inline-flex items-center gap-2">
                      <Film className="h-4 w-4 text-accent" aria-hidden="true" />
                      {video.channel}
                    </span>
                    <span>Published {formatDate(video.publishedAt)}</span>
                    <span>Related event: {video.relatedEvent}</span>
                    <span>Related rider: {video.relatedRider}</span>
                  </div>
                  <Button type="button" disabled className="w-full opacity-70">
                    <LinkIcon className="mr-2 h-4 w-4" aria-hidden="true" />
                    Watch placeholder
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
              Review Required
            </p>
            <h2 className="mt-3 text-2xl font-black">No approved videos yet</h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-foreground/[0.62]">
              YouTube API fetches appear in the admin job review flow first. Approved
              media records will appear here after the future approval system is
              implemented.
            </p>
          </Card>
        )}
      </Container>
    </main>
  );
}
