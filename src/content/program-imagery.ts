import photos from "./program-photos.json";
import { sitePath } from "../lib/site";

const selections: Record<string, keyof typeof photos> = {
  beginner: "youth-practice",
  advanced: "women-2716",
  batting: "indoor",
  "fast-bowling": "women-2796",
  spin: "women-2785",
  "one-to-one": "training",
  group: "women-2856",
  summer: "youth-practice",
  "high-performance": "women-2659"
};
const descriptions: Partial<Record<keyof typeof photos, string>> = {
  "youth-practice": "Young players practising cricket on the Ardingly College field",
  training: "A batter discussing training with other cricketers beside the nets",
  "women-2716": "Batters and fielders during the 2017 Women's Cricket World Cup",
  indoor: "A batter practising a shot in an indoor cricket net",
  "women-2796": "A bowler delivering toward the batter and wicketkeeper",
  "women-2785": "A batter, wicketkeeper and close fielder ready for a delivery",
  "women-2824": "Cricketers stretching and warming up on the field",
  "women-2856": "A women's cricket squad gathering together on the outfield",
  "club-practice": "Club players practising in outdoor cricket nets at Benalla",
  "women-2910": "Women's cricket players on the practice field beside agility equipment",
  "women-2659": "The Women's Cricket World Cup trophy on display"
};

export function programPhoto(programId: string) {
  const id = selections[programId];
  if (!id) throw new Error(`No program photo selected for ${programId}`);
  return { ...photos[id], src: sitePath(photos[id].src), alt: `${descriptions[id]}. CC0 sample; not Tailor academy photography.` };
}
