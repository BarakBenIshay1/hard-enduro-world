import type { VerifiedSourcedLink } from "@/data/verified/types";
import type { getEventDetail } from "@/db/events";
import type { ComponentType } from "react";

export type EventDetail = Awaited<ReturnType<typeof getEventDetail>>;
export type EventStage = EventDetail["stages"][number];
export type EventResult = EventDetail["results"][number];

export type CrossLink = {
  label: string;
  href: string;
  detail: string;
};

export type OfficialLinkItem = VerifiedSourcedLink & {
  group: string;
};

export type EventStageCard = {
  id: string;
  slug: string;
  order: number;
  type: string;
  name: string;
  distance: string;
  terrain: string;
  elevation: string;
  winner: string;
  bestTime: string;
  dnfCount: string;
  difficulty: string;
};

export type RiderCardItem = {
  slug: string;
  name: string;
  country: string;
  team: string;
  manufacturer: string;
  motorcycle: string;
  championshipPosition: string;
};

export type SummaryRow = {
  name: string;
  entries: number;
  best: number;
  wins: number;
  podiums: number;
  bestResult: string;
};

export type EventDocumentItem = {
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" }>;
  title: string;
  description: string;
  status: string;
};

export type MediaStats = {
  images: number;
  videos: number;
  documents: number;
};

export type CrossNavigation = {
  riders: CrossLink[];
  manufacturers: CrossLink[];
  teams: CrossLink[];
  motorcycles: CrossLink[];
};
