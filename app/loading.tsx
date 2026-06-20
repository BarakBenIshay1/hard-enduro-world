import { Container } from "@/components/ui/container";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";

export default function LoadingPage() {
  return (
    <main className="min-h-screen bg-surface pt-28 text-foreground">
      <Container className="grid gap-5 py-16">
        <LoadingSkeleton className="h-8 w-48" />
        <LoadingSkeleton className="h-16 max-w-3xl" />
        <LoadingSkeleton className="h-40 w-full" />
      </Container>
    </main>
  );
}
