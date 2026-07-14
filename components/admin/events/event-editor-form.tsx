"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export function EventEditorForm({
  action,
  children,
  className,
}: {
  action: (formData: FormData) => void | Promise<void>;
  children: React.ReactNode;
  className?: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [initial, setInitial] = useState("");
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (formRef.current) setInitial(snapshotForm(formRef.current));
  }, []);

  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const statusText = useMemo(
    () => (dirty ? "Unsaved changes" : "No unsaved changes"),
    [dirty],
  );

  return (
    <form
      ref={formRef}
      action={action}
      className={className}
      onInput={(event) => {
        const form = event.currentTarget;
        setDirty(snapshotForm(form) !== initial);
      }}
      onSubmit={() => setDirty(false)}
    >
      <div className="mb-4 inline-flex rounded-md border border-border bg-surface-muted px-3 py-1.5 text-xs font-semibold text-foreground/[0.62]">
        {statusText}
      </div>
      {children}
    </form>
  );
}

function snapshotForm(form: HTMLFormElement) {
  const entries = Array.from(new FormData(form).entries())
    .filter(([key]) => !key.startsWith("$ACTION"))
    .map(([key, value]) => [key, typeof value === "string" ? value.trim() : value.name])
    .sort(([left], [right]) => String(left).localeCompare(String(right)));
  return JSON.stringify(entries);
}
