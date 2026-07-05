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
  subscribed: boolean;
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
};

export type VideoSort = "newest" | "oldest" | "source";
export type VideoView = "grid" | "list";
export type VideoTopTab =
  | "all"
  | "subscribed"
  | "highlights"
  | "races"
  | "behind-scenes"
  | "interviews";
