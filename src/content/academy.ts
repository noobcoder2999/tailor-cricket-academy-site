import { sitePath } from "../lib/site";

export const academy = {
  name: "Tailor Cricket Academy",
  shortName: "Tailor",
  tagline: "The game shapes you.",
  searchTitle: "Cricket Coaching in Jaipur | Tailor Cricket Academy",
  searchDescription: "Explore cricket coaching at Tailor Cricket Academy in Sanganer, Jaipur: beginner training, batting, pace and spin bowling, personal coaching and summer camps.",
  description: "Tailor Cricket Academy in Jotdiwala, Sanganer, Jaipur brings together cricket coaching for beginners, focused batting and bowling practice, and personal attention for players developing their game. From a first session to advanced training, our approach puts technique, confidence and a lasting love of cricket first.",
  sampleNotice: "Academy profiles and contact details are supplied by the owner. Programs, schedules, results and stories marked as samples remain illustrative.",
  founded: "2012",
  history: "The academy reports that its ground is affiliated with the Rajasthan Cricket Association (RCA) and hosts RCA matches. That match-day setting is part of the cricket culture here, alongside the everyday work of developing batting, bowling and fielding skills. Each session is an opportunity to learn, practise and grow in the game.",
  mission: "Make thoughtful, individual cricket coaching accessible to players at every stage.",
  vision: "A generation of confident cricketers who play with skill, courage and respect.",
  philosophy: "Observe. Understand. Practise with purpose. Review. We pair technical work with game scenarios, recovery and honest, constructive feedback.",
  founder: { name: "Arun Mehta", message: "Talent opens the door. Curiosity, consistency and a love of the game keep it open. There is a place here for every player willing to learn." },
  values: ["Respect the game", "Progress over pressure", "Train with purpose", "Belong as a team"],
  agePolicy: { min: 6, max: 80, adult: 18 },
  contact: {
    address: null as string | null,
    phone: null as string | null,
    email: null as string | null,
    whatsapp: null as string | null,
    mapUrl: null as string | null,
    socials: [] as { label: string; url: string }[],
    hours: "Sample timetable: Mon-Fri 6-9am & 4-7pm; Sat-Sun 7-11am"
  }
};

export const navigation = [
  ["home", "Home"], ["about", "About"], ["coaches", "Coaches"], ["programs", "Programs"],
  ["facilities", "Facilities"], ["achievements", "Achievements"], ["tournaments", "Tournaments"],
  ["gallery", "Gallery"], ["videos", "Videos"], ["contact", "Contact"]
] as const;

export const images = {
  pavilion: sitePath("/images/pavilion.jpg"),
  nets: sitePath("/images/nets.jpg"),
  player: sitePath("/images/player.svg"),
  equipment: sitePath("/images/equipment.svg"),
  crest: sitePath("/images/crest.svg")
};

export type Program = {
  id: string; title: string; category: "Foundations" | "Specialist" | "Performance" | "Community";
  description: string; age: string; level: string; schedule: string; image: string;
};
export const programs: Program[] = [
  { id: "beginner", title: "A first love for the game", category: "Foundations", description: "A friendly first step for new players. Learn how to hold the bat, find a balanced stance, throw and catch through simple drills and small-sided games.", age: "6-12", level: "Beginner", schedule: "Tue & Thu, 4-5:30pm", image: images.nets },
  { id: "advanced", title: "Ready for the next level", category: "Performance", description: "Advanced player development with individual season plans, match preparation and reviews.", age: "14+", level: "Advanced", schedule: "Mon-Fri, 6-8am", image: images.nets },
  { id: "batting", title: "Own the crease", category: "Specialist", description: "Batting coaching built around balance, timing, shot selection and reading the field.", age: "8+", level: "All levels", schedule: "Tue & Thu, 6-7pm", image: images.equipment },
  { id: "one-to-one", title: "Ready for the next level - personal coaching", category: "Specialist", description: "Personal cricket coaching built around your goals: focused one-to-one attention, specific batting or bowling feedback, and a practice plan suited to your stage.", age: "8+", level: "All levels", schedule: "By enquiry", image: images.nets },
  { id: "fast-bowling", title: "Pace with purpose", category: "Specialist", description: "Fast bowling coaching: safe run-up mechanics, repeatable actions, seam and workload awareness.", age: "12+", level: "Intermediate+", schedule: "Mon & Wed, 5-7pm", image: images.nets },
  { id: "spin", title: "The art of deception", category: "Specialist", description: "Spin bowling coaching covering revolutions, flight, control, variations and tactical fields.", age: "10+", level: "All levels", schedule: "Tue & Fri, 5-7pm", image: images.equipment },
  { id: "summer", title: "A summer at the crease", category: "Community", description: "Summer camps combining skills, friendly games and confidence-building team activities.", age: "6-16", level: "Beginner-Intermediate", schedule: "School holidays, 8-11am", image: images.pavilion },
  { id: "high-performance", title: "Leave nothing to chance", category: "Performance", description: "High-performance training integrating technical plans, fitness, match analysis and recovery.", age: "16+", level: "Competitive", schedule: "Mon-Fri, 6-9am", image: images.nets },
  { id: "group", title: "Better, together", category: "Community", description: "Group coaching for friends and teams, with shared drills and small-sided matches.", age: "8+", level: "All levels", schedule: "Sat & Sun, 9-11am", image: images.pavilion }
];
export const batches = [
  { id: "morning", label: "Weekday mornings (sample)", programIds: ["advanced", "high-performance", "one-to-one"] },
  { id: "evening", label: "Weekday evenings (sample)", programIds: ["beginner", "batting", "fast-bowling", "spin", "one-to-one"] },
  { id: "weekend", label: "Weekend mornings (sample)", programIds: ["group", "one-to-one"] },
  { id: "holiday", label: "School holiday camp (sample)", programIds: ["summer"] }
];
export const roles = ["Batsman", "Bowler", "All-rounder", "Wicketkeeper", "Exploring"] as const;
export const specializations = ["Not sure yet", "Batting technique", "Power hitting", "Fast bowling", "Swing / seam", "Off spin", "Leg spin", "Left-arm orthodox", "Wicketkeeping"] as const;
export const levels = ["New to cricket", "School / recreational", "Club", "Representative"] as const;

export const coaches = [
  { id: "arun", name: "Arun Mehta", role: "Head coach · Batting", experience: "Sample: 18 seasons in club cricket", qualifications: "Qualification placeholder — verify before launch", specialization: "Batting technique & match awareness", bio: "A patient, detail-led mentor whose sample coaching approach puts balance and decision-making before power.", photo: images.player, contact: null as string | null },
  { id: "sara", name: "Sara Williams", role: "Bowling & development", experience: "Sample: former regional squad player", qualifications: "Qualification placeholder — verify before launch", specialization: "Pace, seam & player development", bio: "A sample specialist in repeatable actions, sensible workload planning and giving young bowlers confidence.", photo: images.player, contact: null as string | null },
  { id: "dev", name: "Dev Raman", role: "Spin & fielding", experience: "Sample: 12 seasons in league cricket", qualifications: "Qualification placeholder — verify before launch", specialization: "Spin craft, close catching & fielding", bio: "A sample coach who teaches players to solve problems with flight, patience and a clear fielding plan.", photo: images.player, contact: null as string | null }
];
export const facilities = [
  ["Main cricket ground", "Room to practise the complete game.", images.pavilion],
  ["Practice nets", "Dedicated lanes for focused repetitions.", images.nets],
  ["Turf wickets", "Learn to read pace and natural variation.", images.nets],
  ["Matting wickets", "Consistent bounce for technical sessions.", images.nets],
  ["Bowling machines", "Purposeful repetition at a suitable pace.", images.equipment],
  ["Indoor practice area", "A proposed all-weather training space.", images.equipment],
  ["Gym & fitness area", "Age-appropriate strength, movement and conditioning.", images.equipment],
  ["Video-analysis room", "See, understand and refine your technique.", images.equipment],
  ["Dressing rooms", "Space to prepare, reset and reflect.", images.pavilion],
  ["Tailor clubhouse", "The heart of the academy community.", images.pavilion],
  ["Floodlights", "A proposed setting for evening practice.", images.pavilion],
  ["Equipment", "Training aids for every stage of development.", images.equipment]
].map(([title, description, image], index) => ({ id: `facility-${index}`, title, description, image }));

export const videoCategories = ["Batting drills", "Bowling drills", "Fielding drills", "Fitness sessions", "Match analysis", "Coach tips", "Player development", "Academy highlights"];
export const videos = videoCategories.map((category, index) => ({
  id: `video-${index}`,
  title: ["Watch the setup", "Read the delivery", "Follow the field", "Movement before contact", "A moment at the MCG", "Observe, then discuss", "Build a viewing habit", "The atmosphere of cricket"][index],
  category, coach: "Editorial sample · no academy coach",
  duration: "0:16", thumbnail: index % 2 ? images.nets : images.pavilion,
  description: "Same licensed archival cricket sample in each category, demonstrating the player only. Not a drill, lesson or academy footage. Replace with approved category-specific content.",
  src: sitePath("/media/cricket-sample.webm"),
  transcript: "Archival wide view of cricket at the Melbourne Cricket Ground. Adam Gilchrist bats against India, 26 December 2007. Players are positioned around the wicket; spectators are audible. No instructional speech. This clip is not affiliated with the academy."
}));
export const achievements = {
  metrics: [{ value: 48, label: "District selections" }, { value: 12, label: "State selections" }, { value: 3, label: "National pathway invitations" }, { value: 9, label: "Competition titles" }],
  awards: [
    { title: "Regional Youth Cup", year: "2025", detail: "Sample U16 team competition title" },
    { title: "A decade of development", year: "2022", detail: "Sample academy milestone" },
    { title: "Coaching Excellence Award", year: "2024", detail: "Sample certificate — not an accreditation" }
  ]
};
export const successStories = [
  { name: "Aisha Khan", age: "U16", role: "Top-order batter", achievement: "Sample state development squad selection", quote: "I learned to trust my preparation, not just my instincts.", coach: "Her consistency grew from a simple, repeatable routine.", image: images.player },
  { name: "Kabir Shah", age: "U19", role: "Seam bowler", achievement: "Sample district team selection", quote: "A clearer plan made every practice session count.", coach: "Patience and workload awareness made the difference.", image: images.player },
  { name: "Maya Thomas", age: "U14", role: "All-rounder", achievement: "Sample club player-development award", quote: "I found my voice on the field, and a team that listened.", coach: "She brings curiosity and generous team spirit.", image: images.player }
];

export type TournamentStatus = "Upcoming" | "Ongoing" | "Past";
export type ScoreRow = { team: string; score: string; overs: string };
export type Tournament = {
  id: string; name: string; status: TournamentStatus; date: string; venue: string; age: string;
  teams: string[]; format: string; registration: string; fixtures: string[]; result: string;
  scorecard: ScoreRow[]; innings: string[]; galleryIds: string[]; image: string;
};
export const tournaments: Tournament[] = [
  { id: "winter-cup", name: "Tailor Winter Cup", status: "Upcoming", date: "12-13 December 2026", venue: "Sample academy ground — address unconfigured", age: "U16", teams: ["Tailor XI", "Meadow CC", "Orchard XI", "Riverside CC"], format: "T20 · 4 teams", registration: "Enquiries open (demo)", fixtures: ["12 Dec, 9am · Tailor XI vs Meadow CC", "12 Dec, 1pm · Orchard XI vs Riverside CC", "13 Dec, 10am · Final"], result: "Not played. This illustrative event has no result.", scorecard: [], innings: ["Scorecards become available after play. No scores have been invented for this upcoming event."], galleryIds: ["gallery-5", "gallery-4"], image: images.pavilion },
  { id: "development-league", name: "Development League", status: "Ongoing", date: "5 September-10 October 2026", venue: "Sample academy nets & ground", age: "U19", teams: ["Tailor XI", "Meadow CC", "Orchard XI"], format: "30 overs · Round robin", registration: "Registration closed", fixtures: ["26 Sep, 9am · Meadow CC vs Orchard XI", "3 Oct, 9am · Tailor XI vs Orchard XI"], result: "Sample completed match: Tailor XI won by 18 runs.", scorecard: [{ team: "Tailor XI", score: "186/7", overs: "30.0" }, { team: "Meadow CC", score: "168 all out", overs: "28.4" }], innings: ["Tailor: A. Khan 54 (62), K. Shah 31 (38). Meadow: J. Reed 3/34 (6).", "Meadow: L. Park 47 (51). Tailor: K. Shah 4/29 (5.4).", "Summary scorecard only; all players and match data are fictional."], galleryIds: ["gallery-4", "gallery-9"], image: images.nets },
  { id: "summer-shield", name: "The Summer Shield", status: "Past", date: "15-16 August 2026", venue: "Sample Tailor ground", age: "U14", teams: ["Tailor XI", "Riverside CC"], format: "T20 · Invitational final", registration: "Event completed", fixtures: ["15 Aug, 9am · Skills festival", "16 Aug, 10am · Tailor XI vs Riverside CC"], result: "Sample final: Tailor XI won by 4 wickets.", scorecard: [{ team: "Riverside CC", score: "124/8", overs: "20.0" }, { team: "Tailor XI", score: "125/6", overs: "19.2" }], innings: ["Riverside: R. Lane 42 (37). Tailor: M. Thomas 3/22 (4).", "Tailor: M. Thomas 38 (32), A. Khan 29 (24). Riverside: S. Green 2/26 (4).", "Summary scorecard only; all players and match data are fictional."], galleryIds: ["gallery-6", "gallery-7"], image: images.pavilion }
];
export const galleryCategories = ["Ground", "Training", "Coaches", "Players", "Match day", "Tournaments", "Awards", "Celebrations", "Infrastructure", "Camps"];
export const gallery = galleryCategories.map((category, index) => ({
  id: `gallery-${index}`, category,
  src: ["Ground", "Match day", "Tournaments", "Celebrations", "Infrastructure"].includes(category) ? images.pavilion : ["Coaches", "Players"].includes(category) ? images.player : ["Awards"].includes(category) ? images.equipment : images.nets,
  alt: ["Coaches", "Players"].includes(category) ? "Original cricket-player silhouette, not a real person" : category === "Awards" ? "Original cricket equipment illustration" : ["Training", "Camps"].includes(category) ? "Practice nets at Bayford Cricket Club" : "Walker Cricket Ground clubhouse and outfield",
  caption: `${category} collection · replaceable sample; not our academy${["Coaches", "Players", "Awards"].includes(category) ? " photography" : " venue"}.`
}));
export const testimonials = [
  { name: "Rohan", role: "Player", quote: "The small details finally started making sense. Practice had a purpose." },
  { name: "Anita", role: "Parent", quote: "Confidence and enjoyment mattered as much as the runs. That is what we valued." },
  { name: "Priya", role: "Former student", quote: "The habits I built at the crease stayed with me long after the season." },
  { name: "Alex", role: "Professional player (fictional)", quote: "A thoughtful environment gives a young player room to find their own game." },
  { name: "Jamie", role: "Guest", quote: "A welcoming place to spend an afternoon watching people grow through cricket." }
];

export const mediaCredits = [
  { name: "Virat Kohli role-choice portrait", author: "Anand Anil", license: "CC BY-SA 4.0", source: "https://commons.wikimedia.org/wiki/File:Virat_Kohli_portrait.jpg", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/", changes: "960px Wikimedia rendition; cropped, softly blurred and darkened using CSS. Inspirational editorial image only; no endorsement or academy affiliation." },
  { name: "Shane Warne role-choice portrait", author: "Tourism Victoria", license: "CC BY 2.0", source: "https://commons.wikimedia.org/wiki/File:Shane_Warne_February_2015.jpg", licenseUrl: "https://creativecommons.org/licenses/by/2.0/", changes: "960px Wikimedia rendition; cropped, softly blurred and darkened using CSS. Inspirational editorial image only; no endorsement or academy affiliation." },
  { name: "Anatomical player mesh and skin weights", author: "MakeHuman community; Data Collection AB, Joel Palmius and Jonas Hauquier", license: "CC0 1.0", source: "https://github.com/makehumancommunity/makehuman/tree/master/makehuman/data", licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/", changes: "hm08 base mesh, default rig and weights adapted into clothed cricket players with original skeletal cricket animations. Generic athletes, not Kohli or Warne digital replicas; not motion capture." },
  { name: "Clubhouse photograph", author: "Acabashi", license: "CC BY-SA 4.0", source: "https://commons.wikimedia.org/wiki/File:Walker_Cricket_Ground_pavilion,_Southgate,_London,_England.jpg", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/", changes: "1920px Wikimedia rendition; displayed cropped with a CSS colour overlay. Walker Cricket Ground, not our academy." },
  { name: "Practice nets photograph", author: "Acabashi", license: "CC BY-SA 4.0", source: "https://commons.wikimedia.org/wiki/File:Bayford_Cricket_Club_cricket_nets,_Bayford,_Hertfordshire,_England.jpg", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/", changes: "1280px Wikimedia rendition; responsive display crops. Bayford Cricket Club, not our academy." },
  { name: "Archival cricket sample video", author: "Nomadtales", license: "CC BY-SA 3.0", source: "https://commons.wikimedia.org/wiki/File:Adam_gilchrist_mcg_v_india.ogv", licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/", changes: "Wikimedia 240p VP9 transcode, 16.583 seconds. Adam Gilchrist at the MCG vs India, 26 December 2007. No endorsement or affiliation." },
  { name: "Crest, player silhouette, equipment, procedural field & synthesized sound", author: "Original assets created for this project", license: "CC0 1.0", source: "https://creativecommons.org/publicdomain/zero/1.0/", licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/", changes: "Illustrative assets, not photorealistic player models. No third-party branding." }
];
