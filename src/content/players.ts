export type PlayerGroup = "position" | "pitcher" | "following";

export type Player = {
  name: string;
  position: string;
  mlbId: number;
  group: PlayerGroup;
  note?: string;
};

export const rosterSnapshot =
  "Names and positions are a fan-curated cut of the Athletics 40-man roster snapshot taken from MLB's public roster feed on November 16, 2026. Everyone listed was marked Active that day. This is not a complete official roster, and it is not a stat line. Transactions move faster than a fan page. MLB.com is the source of truth.";

export const players: Player[] = [
  { name: "Jacob Wilson", position: "SS", mlbId: 805779, group: "position" },
  { name: "Nick Kurtz", position: "1B", mlbId: 701762, group: "position" },
  { name: "Shea Langeliers", position: "C", mlbId: 669127, group: "position" },
  { name: "Zack Gelof", position: "3B", mlbId: 680869, group: "position" },
  {
    name: "Max Muncy",
    position: "3B",
    mlbId: 691777,
    group: "position",
    note: "Athletics infielder on this snapshot. Not the Dodgers' Max Muncy.",
  },
  { name: "Darell Hernaiz", position: "SS", mlbId: 687231, group: "position" },
  { name: "Lawrence Butler", position: "RF", mlbId: 671732, group: "position" },
  { name: "Tyler Soderstrom", position: "LF", mlbId: 691016, group: "position" },
  { name: "Brent Rooker", position: "DH", mlbId: 667670, group: "position" },
  { name: "Denzel Clarke", position: "CF", mlbId: 672016, group: "position" },
  { name: "Henry Bolte", position: "CF", mlbId: 703607, group: "position" },
  { name: "Luis Severino", position: "P", mlbId: 622663, group: "pitcher" },
  { name: "J.T. Ginn", position: "P", mlbId: 669372, group: "pitcher" },
  { name: "Luis Morales", position: "P", mlbId: 806960, group: "pitcher" },
  { name: "Gage Jump", position: "P", mlbId: 695611, group: "pitcher" },
  { name: "Mason Barnett", position: "P", mlbId: 686930, group: "pitcher" },
  { name: "Hogan Harris", position: "P", mlbId: 663687, group: "pitcher" },
  { name: "Jack Perkins", position: "P", mlbId: 678022, group: "pitcher" },
  { name: "Elvis Alvarado", position: "P", mlbId: 665660, group: "pitcher" },
  { name: "Tommy White", position: "1B", mlbId: 695720, group: "following" },
  { name: "Kade Morris", position: "P", mlbId: 695034, group: "following" },
  { name: "Joshua Kuroda-Grauer", position: "3B", mlbId: 811965, group: "following" },
  { name: "Braden Nett", position: "P", mlbId: 804556, group: "following" },
];

export function mlbPlayerUrl(mlbId: number): string {
  return `https://www.mlb.com/player/${mlbId}`;
}

export const playerGroups: { id: PlayerGroup; title: string; lede: string }[] = [
  {
    id: "position",
    title: "Position players",
    lede: "Everyday names from the November 16, 2026 snapshot. Bios and stats stay on the official page.",
  },
  {
    id: "pitcher",
    title: "Pitchers",
    lede: "A handful of arms from the same snapshot, including younger pitchers the prospects board keeps bringing up.",
  },
  {
    id: "following",
    title: "Also on the 40-man",
    lede: "More names fans are following. This is not an MLB Pipeline ranking. Use the link for that.",
  },
];
