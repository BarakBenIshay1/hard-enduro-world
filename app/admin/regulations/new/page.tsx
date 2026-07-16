import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import { createAdminRegulation } from "@/app/admin/regulations/actions";
import { getRegulationFormOptions } from "@/db/admin-regulations";
import { getAdminAccessContext, canAccessAdmin } from "@/lib/admin/access";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "New Regulation",
  robots: { index: false, follow: false, nocache: true },
};

export default async function NewRegulationPage() {
  const access = await getAdminAccessContext();
  if (!canAccessAdmin(access, "calculations:review")) notFound();
  const options = await getRegulationFormOptions();

  return (
    <div className="grid min-w-0 gap-6">
      <section>
        <Link
          href="/admin/regulations"
          className="text-xs font-semibold uppercase tracking-[0.18em] text-accent"
        >
          Back to regulations
        </Link>
        <h1 className="mt-3 text-3xl font-black lg:text-5xl">New regulation</h1>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-foreground/[0.62]">
          Create a draft official regulation. Drafts can contain validation issues and
          cannot generate points until activated.
        </p>
      </section>

      <Card className="p-5">
        <RegulationForm action={createAdminRegulation} options={options} />
      </Card>
    </div>
  );
}

function RegulationForm({
  action,
  options,
}: {
  action: (formData: FormData) => Promise<void>;
  options: Awaited<ReturnType<typeof getRegulationFormOptions>>;
}) {
  return (
    <form action={action} className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold">
          Season
          <select
            name="seasonId"
            required
            className="rounded-md border border-border bg-surface-muted p-3"
          >
            <option value="">Select season</option>
            {options.seasons.map((season) => (
              <option key={season.id} value={season.id}>
                {season.name}
              </option>
            ))}
          </select>
        </label>
        <Input name="regulationYear" label="Regulation Year" type="number" required />
        <Input name="title" label="Source Title" required />
        <Input name="sourceUrl" label="Official Source URL" required />
        <Input name="section" label="Section / Article" required />
        <Input name="verificationDate" label="Verification Date" type="date" required />
        <Input
          name="classificationScope"
          label="Classification Scope"
          defaultValue="OVERALL"
        />
        <Input name="className" label="Class Name" />
        <Input name="effectiveFrom" label="Effective From" type="date" />
        <Input name="effectiveTo" label="Effective To" type="date" />
        <Input name="contentChecksum" label="Content Checksum" />
        <label className="grid gap-2 text-sm font-semibold">
          Source Snapshot
          <select
            name="sourceSnapshotId"
            className="rounded-md border border-border bg-surface-muted p-3"
          >
            <option value="">None</option>
            {options.sourceSnapshots.map((snapshot) => (
              <option key={snapshot.id} value={snapshot.id}>
                {snapshot.id} · {snapshot.contentHash}
              </option>
            ))}
          </select>
        </label>
      </div>
      <Textarea name="pointsMapping" label="Points Mapping JSON" defaultValue="[]" />
      <Textarea name="tieBreakRules" label="Tie-Break Rules JSON" defaultValue="[]" />
      <Textarea name="notes" label="Notes" defaultValue="" />
      <button className="inline-flex h-11 w-fit items-center rounded-md bg-accent px-5 text-sm font-black text-black">
        Create Draft
      </button>
    </form>
  );
}

function Input({
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="grid gap-2 text-sm font-semibold">
      {label}
      <input
        {...props}
        className="rounded-md border border-border bg-surface-muted p-3"
      />
    </label>
  );
}

function Textarea({
  label,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  return (
    <label className="grid gap-2 text-sm font-semibold">
      {label}
      <textarea
        {...props}
        rows={5}
        className="rounded-md border border-border bg-surface-muted p-3 font-mono text-xs"
      />
    </label>
  );
}
