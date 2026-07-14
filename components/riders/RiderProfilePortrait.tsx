"use client";

import { useState } from "react";
import { getSafeRiderProfileImageUrl } from "@/lib/riders/profile-image";

export function RiderProfilePortrait({
  name,
  initials,
  profileImageUrl,
}: {
  name: string;
  initials: string;
  profileImageUrl: string | null;
}) {
  const [failed, setFailed] = useState(false);
  const safeUrl = failed ? null : getSafeRiderProfileImageUrl(profileImageUrl);

  if (!safeUrl) {
    return (
      <div className="flex h-40 w-40 items-center justify-center rounded-full border border-accent/40 bg-accent/15 text-5xl font-black text-accent">
        {initials}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- CMS images are stored in Supabase Storage and may not be in the Next image remote allowlist yet.
    <img
      src={safeUrl}
      alt={`${name} profile image`}
      className="h-full w-full rounded-full object-cover"
      loading="eager"
      decoding="async"
      sizes="(min-width: 1024px) 340px, 80vw"
      onError={() => setFailed(true)}
    />
  );
}
