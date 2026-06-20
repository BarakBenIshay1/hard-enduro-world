"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <main className="min-h-screen bg-surface pt-28 text-foreground">
          <Container className="py-16">
            <EmptyState
              icon={AlertTriangle}
              title="Something went off line"
              description="The application hit an unexpected error. Try reloading the experience."
            />
            <div className="mt-6 flex justify-center">
              <Button type="button" onClick={reset}>
                Try again
              </Button>
            </div>
          </Container>
        </main>
      </body>
    </html>
  );
}
