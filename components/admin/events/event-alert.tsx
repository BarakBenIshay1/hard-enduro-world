"use client";

import { useEffect, useState } from "react";

export function EventAlert({
  children,
  tone = "success",
}: {
  children: React.ReactNode;
  tone?: "success" | "error";
}) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timeout = window.setTimeout(() => setVisible(false), 6000);
    return () => window.clearTimeout(timeout);
  }, []);

  if (!visible) return null;

  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      aria-live="polite"
      className={
        tone === "error"
          ? "rounded-md border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200"
          : "rounded-md border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200"
      }
    >
      {children}
    </div>
  );
}
