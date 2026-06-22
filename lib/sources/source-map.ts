export type SourceRiskLevel = "low" | "medium" | "high";

export type AutomationStatus =
  | "manual"
  | "connector-ready"
  | "calculation-preview"
  | "future";

export type SourceMapItem = {
  dataType: string;
  primarySource: string;
  secondarySource: string;
  currentConnector: string;
  importFrequency: string;
  riskLevel: SourceRiskLevel;
  reviewRequired: boolean;
  automationStatus: AutomationStatus;
  notes: string;
};

export type SourceTruthRule = {
  dataType: string;
  rule: string;
  canAutomate: boolean;
  mustReview: boolean;
  neverDirectlyImport: boolean;
};

export type ConflictRule = {
  title: string;
  description: string;
  appliesTo: string;
};

export const sourceMapItems: SourceMapItem[] = [
  {
    dataType: "Events calendar",
    primarySource: "Official championship calendar",
    secondarySource: "FIM calendar",
    currentConnector: "official-events",
    importFrequency: "Daily during season",
    riskLevel: "medium",
    reviewRequired: true,
    automationStatus: "connector-ready",
    notes: "Calendar metadata can be proposed automatically but requires review.",
  },
  {
    dataType: "Event details",
    primarySource: "Official event page",
    secondarySource: "FIM event listing",
    currentConnector: "official-events",
    importFrequency: "Weekly / before event",
    riskLevel: "medium",
    reviewRequired: true,
    automationStatus: "connector-ready",
    notes: "Venue, dates, country, and official URLs must keep source links.",
  },
  {
    dataType: "Riders",
    primarySource: "Manual admin records",
    secondarySource: "Reviewed official team/championship sources",
    currentConnector: "Not implemented",
    importFrequency: "Manual / reviewed updates",
    riskLevel: "medium",
    reviewRequired: true,
    automationStatus: "manual",
    notes: "Profiles need human review for identity, nationality, and career history.",
  },
  {
    dataType: "Teams",
    primarySource: "Manual admin records",
    secondarySource: "Reviewed official team/championship sources",
    currentConnector: "Not implemented",
    importFrequency: "Manual / seasonal updates",
    riskLevel: "medium",
    reviewRequired: true,
    automationStatus: "manual",
    notes: "Team affiliation changes should be audited by season.",
  },
  {
    dataType: "Manufacturers",
    primarySource: "Manual admin records",
    secondarySource: "Reviewed official manufacturer/championship sources",
    currentConnector: "Not implemented",
    importFrequency: "Manual / seasonal updates",
    riskLevel: "low",
    reviewRequired: true,
    automationStatus: "manual",
    notes: "Manufacturer records are stable but still require slug/source discipline.",
  },
  {
    dataType: "Motorcycles",
    primarySource: "Manual admin records",
    secondarySource: "Reviewed official manufacturer specifications",
    currentConnector: "Not implemented",
    importFrequency: "Manual / model-year updates",
    riskLevel: "medium",
    reviewRequired: true,
    automationStatus: "manual",
    notes: "Specs and usage history should not be inferred without attribution.",
  },
  {
    dataType: "Results",
    primarySource: "Official timing / FIM results",
    secondarySource: "Official event PDFs",
    currentConnector: "official-results",
    importFrequency: "After event",
    riskLevel: "high",
    reviewRequired: true,
    automationStatus: "connector-ready",
    notes: "Results never auto-publish and must preserve official timing rows.",
  },
  {
    dataType: "Stage timing",
    primarySource: "Official timing tables",
    secondarySource: "Official event PDFs",
    currentConnector: "official-stage-results placeholder",
    importFrequency: "After each stage",
    riskLevel: "high",
    reviewRequired: true,
    automationStatus: "future",
    notes: "Every row, gap, penalty, status, and raw source must be preserved.",
  },
  {
    dataType: "Standings",
    primarySource: "Calculation engine from approved results",
    secondarySource: "Official championship standings for verification",
    currentConnector: "standings-engine",
    importFrequency: "After approved results",
    riskLevel: "high",
    reviewRequired: true,
    automationStatus: "calculation-preview",
    notes: "Derived data. Do not directly import as the source of truth.",
  },
  {
    dataType: "Statistics",
    primarySource: "Calculation engine from approved results",
    secondarySource: "Official summaries for verification",
    currentConnector: "statistics-engine",
    importFrequency: "After approved results",
    riskLevel: "medium",
    reviewRequired: true,
    automationStatus: "calculation-preview",
    notes: "Derived data. Recalculate after approved result changes.",
  },
  {
    dataType: "Records",
    primarySource: "Calculation engine from approved results",
    secondarySource: "Historical official records for verification",
    currentConnector: "records-engine",
    importFrequency: "After approved results/statistics",
    riskLevel: "medium",
    reviewRequired: true,
    automationStatus: "calculation-preview",
    notes: "Derived data. Requires complete historical coverage before publishing.",
  },
  {
    dataType: "Videos",
    primarySource: "YouTube official channels",
    secondarySource: "Official championship media pages",
    currentConnector: "youtube-videos",
    importFrequency: "Daily / weekly",
    riskLevel: "low",
    reviewRequired: true,
    automationStatus: "connector-ready",
    notes: "Video metadata is low risk but still needs source tracking.",
  },
  {
    dataType: "Weather",
    primarySource: "Weather provider snapshots",
    secondarySource: "Event/location observations",
    currentConnector: "weather-snapshots placeholder",
    importFrequency: "Daily around event",
    riskLevel: "low",
    reviewRequired: false,
    automationStatus: "future",
    notes: "Store snapshots by event/time for future historical analysis.",
  },
  {
    dataType: "Track maps",
    primarySource: "Official event maps",
    secondarySource: "Verified organizer documents",
    currentConnector: "Not implemented",
    importFrequency: "Before event / manual",
    riskLevel: "medium",
    reviewRequired: true,
    automationStatus: "future",
    notes: "Maps may have licensing restrictions and need attribution.",
  },
  {
    dataType: "Documents / PDFs",
    primarySource: "Official source links",
    secondarySource: "FIM/event document archives",
    currentConnector: "Not implemented",
    importFrequency: "Manual / event updates",
    riskLevel: "medium",
    reviewRequired: true,
    automationStatus: "future",
    notes: "Documents should preserve provider, license, source URL, and upload date.",
  },
];

export const sourceTruthRules: SourceTruthRule[] = [
  {
    dataType: "Events calendar",
    rule: "Use official championship or FIM calendar as the source of truth.",
    canAutomate: true,
    mustReview: true,
    neverDirectlyImport: false,
  },
  {
    dataType: "Results",
    rule: "Use official timing or FIM results. Never publish without review.",
    canAutomate: true,
    mustReview: true,
    neverDirectlyImport: false,
  },
  {
    dataType: "Standings",
    rule: "Derive from approved results using the calculation engine.",
    canAutomate: true,
    mustReview: true,
    neverDirectlyImport: true,
  },
  {
    dataType: "Statistics",
    rule: "Derive from approved results and reviewed standings.",
    canAutomate: true,
    mustReview: true,
    neverDirectlyImport: true,
  },
  {
    dataType: "Records",
    rule: "Derive from approved results/statistics and verified history.",
    canAutomate: true,
    mustReview: true,
    neverDirectlyImport: true,
  },
  {
    dataType: "Videos",
    rule: "Use official YouTube channels and reviewed media metadata.",
    canAutomate: true,
    mustReview: true,
    neverDirectlyImport: false,
  },
  {
    dataType: "Weather",
    rule: "Use weather provider snapshots tied to events and fetch times.",
    canAutomate: true,
    mustReview: false,
    neverDirectlyImport: false,
  },
  {
    dataType: "Riders / teams / manufacturers / motorcycles",
    rule: "Use manual/admin records plus reviewed official sources.",
    canAutomate: false,
    mustReview: true,
    neverDirectlyImport: false,
  },
  {
    dataType: "Documents / PDFs",
    rule: "Use official source links and preserve attribution metadata.",
    canAutomate: true,
    mustReview: true,
    neverDirectlyImport: false,
  },
];

export const conflictRules: ConflictRule[] = [
  {
    title: "Official beats unofficial",
    description:
      "Official championship, FIM, timing, or organizer sources take priority over unofficial summaries.",
    appliesTo: "All imported or reviewed data",
  },
  {
    title: "Manual correction requires audit",
    description:
      "Manual admin corrections are allowed only with an audit note and source context.",
    appliesTo: "All admin-managed records",
  },
  {
    title: "High-risk data requires review",
    description:
      "Results, stage timing, standings, statistics, and records must go through review before public changes.",
    appliesTo: "Competitive data",
  },
  {
    title: "Results never auto-publish",
    description:
      "Official results connector output must remain pending until approved by an authorized reviewer.",
    appliesTo: "Results and stage timing",
  },
  {
    title: "Derived data is not directly imported",
    description:
      "Standings, statistics, and records are calculated from approved results, not treated as direct source-of-truth imports.",
    appliesTo: "Derived championship data",
  },
];
