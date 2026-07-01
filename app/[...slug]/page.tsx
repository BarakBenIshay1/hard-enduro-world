import { allNavigationItems } from "@/config/navigation";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHero } from "@/components/ui/page-hero";

export const dynamic = "force-dynamic";

type PlaceholderPageProps = {
  params: Promise<{
    slug: string[];
  }>;
};

function titleFromSlug(slug: string[]) {
  const path = `/${slug.join("/")}`;
  const knownItem = allNavigationItems.find((item) => item.href === path);

  if (knownItem) {
    return knownItem.label;
  }

  return slug
    .at(-1)!
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export async function generateMetadata({ params }: PlaceholderPageProps) {
  const { slug } = await params;
  const title = titleFromSlug(slug);

  return {
    title,
    description: `${title} is planned for a later release.`,
  };
}

export default async function PlaceholderPage({ params }: PlaceholderPageProps) {
  const { slug } = await params;
  const title = titleFromSlug(slug);

  return (
    <main className="min-h-screen bg-surface text-foreground">
      <PageHero
        compact
        eyebrow="Planned section"
        title={title}
        description="This section is planned for a later release. Current championship coverage is available through the active event areas."
      />
      <Container className="py-12">
        <EmptyState
          title="Section coming later"
          description="Use the current calendar, race center, and championship data pages for the live product experience."
        />
        <div className="mt-6 flex justify-center">
          <ButtonLink href="/events" variant="secondary">
            Open current vertical slice
          </ButtonLink>
        </div>
      </Container>
    </main>
  );
}
