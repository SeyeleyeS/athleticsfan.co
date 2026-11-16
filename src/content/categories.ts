export type Category = {
  slug: string;
  name: string;
  description: string;
  linkIds: string[];
};

export const categories: Category[] = [
  {
    slug: "spring-training-2027",
    name: "Spring Training 2027",
    description:
      "Where fans are gathering once camp opens. The club has trained in Mesa for years. Confirm the 2027 site and schedule on MLB.com before you book a flight.",
    linkIds: ["mlb-news", "mlb-home", "athletic"],
  },
  {
    slug: "predictions",
    name: "Predictions",
    description:
      "Wins, roster guesses, and October arguments. Bring a reason. Numbers stay on MLB.com and Baseball-Reference.",
    linkIds: ["bref-2026", "fangraphs", "mlb-news"],
  },
  {
    slug: "road-trips",
    name: "Road Trips",
    description:
      "Announcements and ride shares to games. Public meetups only. This board does not sell tickets.",
    linkIds: ["mlb-home", "bee", "rvj", "mlb-vegas-homestand"],
  },
  {
    slug: "fan-gear",
    name: "Fan Gear by Fans",
    description:
      "Talk about handmade work. Listings, with the no-logo rule and an external link, go on the Fan Gear page. The site never takes payment.",
    linkIds: ["mlb-home"],
  },
  {
    slug: "prospects",
    name: "Prospects Chatter",
    description:
      "Who you are watching this winter. Rankings and scouting reports live on MLB Pipeline. Link them instead of pasting a stat line.",
    linkIds: ["mlb-pipeline", "fangraphs-roster", "mlb-roster"],
  },
  {
    slug: "sacramento-vegas",
    name: "Sacramento to the Vegas Showcase",
    description:
      "Sutter Health Park, Stomper sightings, the Summerlin series, and the Strip ballpark. The Dream Season thread lives here. It is a fan scenario, not a report.",
    linkIds: ["mlb-vegas-homestand", "bref-2026", "rvj", "chronicle", "bee"],
  },
];
