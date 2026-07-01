export type NavigationItem = {
  label: string;
  href: string;
  description?: string;
};

export type NavigationGroup = {
  label: string;
  items: NavigationItem[];
};

export const primaryNavigation: NavigationItem[] = [
  { label: "Home", href: "/" },
  { label: "Race Live Center", href: "/future-events" },
  { label: "Events", href: "/events" },
  { label: "Riders", href: "/riders" },
  { label: "Manufacturers", href: "/manufacturers" },
  { label: "Teams", href: "/teams" },
  { label: "Media", href: "/videos" },
  { label: "History", href: "/history" },
];

export const megaNavigation: NavigationGroup[] = [
  {
    label: "Racing",
    items: [
      {
        label: "Race Live Center",
        href: "/future-events",
        description: "Live and next race",
      },
      { label: "Events", href: "/events", description: "Event calendar" },
      { label: "History", href: "/history", description: "Season archive" },
    ],
  },
  {
    label: "Paddock",
    items: [
      { label: "Riders", href: "/riders", description: "Athlete profiles" },
      { label: "Manufacturers", href: "/manufacturers", description: "Brand dashboards" },
      { label: "Teams", href: "/teams", description: "Factory and privateer teams" },
    ],
  },
  {
    label: "Media",
    items: [{ label: "Media", href: "/videos", description: "Official videos" }],
  },
];

export const allNavigationItems = primaryNavigation;
