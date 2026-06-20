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
  { label: "Championship", href: "/championship" },
  { label: "Events", href: "/events" },
  { label: "Riders", href: "/riders" },
  { label: "Standings", href: "/standings" },
  { label: "Media", href: "/gallery" },
];

export const megaNavigation: NavigationGroup[] = [
  {
    label: "Championship",
    items: [
      { label: "Championship", href: "/championship", description: "Season hub" },
      { label: "Standings", href: "/standings", description: "Points tables" },
      { label: "Records", href: "/records", description: "Historic marks" },
      { label: "Statistics", href: "/statistics", description: "Performance data" },
      { label: "History", href: "/history", description: "Archive" },
    ],
  },
  {
    label: "Racing",
    items: [
      { label: "Events", href: "/events", description: "Event calendar" },
      { label: "Future Events", href: "/future-events", description: "Upcoming races" },
      {
        label: "Interactive Map",
        href: "/interactive-map",
        description: "Global venues",
      },
      { label: "Motorcycles", href: "/motorcycles", description: "Machine history" },
    ],
  },
  {
    label: "Paddock",
    items: [
      { label: "Riders", href: "/riders", description: "Athlete profiles" },
      { label: "Teams", href: "/teams", description: "Factory and privateer teams" },
      { label: "Manufacturers", href: "/manufacturers", description: "Brand dashboards" },
    ],
  },
  {
    label: "Media",
    items: [
      { label: "Gallery", href: "/gallery", description: "Photography archive" },
      { label: "Videos", href: "/videos", description: "Films and highlights" },
      { label: "News", href: "/news", description: "Latest stories" },
    ],
  },
  {
    label: "Platform",
    items: [
      { label: "About", href: "/about", description: "Project mission" },
      { label: "Contact", href: "/contact", description: "Get in touch" },
    ],
  },
];

export const allNavigationItems = megaNavigation.flatMap((group) => group.items);
