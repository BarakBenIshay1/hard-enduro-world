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
    description: `${title} will be built in a future approved step.`,
  };
}

export default async function PlaceholderPage({ params }: PlaceholderPageProps) {
  const { slug } = await params;
  const title = titleFromSlug(slug);

  return (
    <main className="min-h-screen bg-surface text-foreground">
      <PageHero
        compact
        eyebrow="Future module"
        title={title}
        description="This navigation destination is reserved in the global product shell. Its feature implementation will wait for a future approved step."
      />
      <Container className="py-12">
        <EmptyState
          title="Not built in Step 4"
          description="The global navigation is ready, but this section has intentionally not been implemented yet."
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
