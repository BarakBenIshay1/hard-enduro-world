export type VideoSourceType =
  | "Official Rider"
  | "Official Event"
  | "Official Brand"
  | "Trusted Creator";

export type VideoContentType =
  | "Highlights"
  | "Full Race"
  | "Behind the Scenes"
  | "Interviews"
  | "Training"
  | "Onboard";

export type VideoSource = {
  id: string;
  name: string;
  type: VideoSourceType;
  featured: boolean;
};

export type VideoEntityLink = {
  id: string;
  name: string;
  slug?: string | null;
};

export type VideoKnowledgeGraphRelations = {
  rider?: VideoEntityLink | null;
  team?: VideoEntityLink | null;
  manufacturer?: VideoEntityLink | null;
  motorcycle?: VideoEntityLink | null;
  event?: VideoEntityLink | null;
  stage?: VideoEntityLink | null;
  season?: {
    year: number;
    name?: string | null;
  } | null;
  source?: VideoEntityLink | null;
};

export type VideoEventOption = {
  id: string;
  name: string;
};

export type VideoFeedItem = {
  id: string;
  title: string | null;
  sourceName: string;
  sourceType: VideoSourceType;
  contentType: VideoContentType | null;
  eventName: string | null;
  publishedAt: string | null;
  duration: string | null;
  verified: boolean;
  url: string | null;
  placeholder: boolean;
  relations: VideoKnowledgeGraphRelations;
};

export type VideoSort = "newest" | "oldest" | "source";
export type VideoView = "grid" | "list";
