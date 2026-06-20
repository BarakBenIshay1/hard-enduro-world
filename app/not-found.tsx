import { Compass } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";

export default function NotFoundPage() {
  return (
    <main className="min-h-screen bg-surface pt-28 text-foreground">
      <Container className="py-16">
        <EmptyState
          icon={Compass}
          title="Route not found"
          description="The line you followed is not part of the course yet. Return to the championship hub or open the event calendar."
        />
        <div className="mt-6 flex justify-center gap-3">
          <ButtonLink href="/">Home</ButtonLink>
          <ButtonLink href="/events" variant="secondary">
            Events
          </ButtonLink>
        </div>
      </Container>
    </main>
  );
}
