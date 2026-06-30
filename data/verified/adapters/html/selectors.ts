export type HtmlSelectorDefinition = {
  selector: string;
  attribute?: string;
  required: boolean;
  notes: string;
};

export type HtmlAdapterSelectorMap = {
  eventMetadata: Record<string, HtmlSelectorDefinition>;
  riderMetadata: Record<string, HtmlSelectorDefinition>;
  overallResults: Record<string, HtmlSelectorDefinition>;
  stageResults: Record<string, HtmlSelectorDefinition>;
  standings: Record<string, HtmlSelectorDefinition>;
  documents: Record<string, HtmlSelectorDefinition>;
  media: Record<string, HtmlSelectorDefinition>;
};

export const defaultHtmlSelectors: HtmlAdapterSelectorMap = {
  eventMetadata: {
    eventSlug: {
      selector: "[data-event-slug]",
      attribute: "data-event-slug",
      required: true,
      notes: "Stable event slug or id supplied by the official source parser.",
    },
    eventName: {
      selector: "h1",
      required: false,
      notes: "Official event display name when present.",
    },
  },
  riderMetadata: {
    riderSlug: {
      selector: "[data-rider-slug]",
      attribute: "data-rider-slug",
      required: true,
      notes: "Stable rider slug or id supplied by the official source parser.",
    },
  },
  overallResults: {
    riderSlug: {
      selector: "[data-result-rider-slug]",
      attribute: "data-result-rider-slug",
      required: true,
      notes: "Stable rider slug for an official overall classification row.",
    },
    position: {
      selector: "[data-result-position]",
      attribute: "data-result-position",
      required: false,
      notes: "Overall finishing position if officially published.",
    },
  },
  stageResults: {
    stageSlug: {
      selector: "[data-stage-slug]",
      attribute: "data-stage-slug",
      required: true,
      notes: "Stable stage slug for an official stage classification row.",
    },
    riderSlug: {
      selector: "[data-stage-rider-slug]",
      attribute: "data-stage-rider-slug",
      required: true,
      notes: "Stable rider slug for an official stage classification row.",
    },
  },
  standings: {
    riderSlug: {
      selector: "[data-standing-rider-slug]",
      attribute: "data-standing-rider-slug",
      required: true,
      notes: "Stable rider slug for an official standings row.",
    },
  },
  documents: {
    documentUrl: {
      selector: "a[data-document-url]",
      attribute: "href",
      required: false,
      notes: "Official document URL discovered by a future parser.",
    },
  },
  media: {
    mediaUrl: {
      selector: "a[data-media-url]",
      attribute: "href",
      required: false,
      notes: "Official or trusted media URL discovered by a future parser.",
    },
  },
};
