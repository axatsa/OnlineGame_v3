
export interface Game {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  rating: number;
  coverImage: string;
  route: string;
  howToPlay: string;
}

export const GAMES_CONFIG: Game[] = [
  {
    id: "tug-of-war",
    title: "Перетягивание каната",
    subtitle: "Битва знаний",
    category: "Team Battle",
    rating: 4.9,
    coverImage: "tug-of-war",
    route: "/games/tug-of-war",
    howToPlay: "Two teams compete by answering math/logic questions. Each correct answer pulls the rope toward your side. First team to pull the rope to their end wins! Teacher sets the topic, AI generates questions.",
  },
  {
    id: "jeopardy",
    title: "Своя игра",
    subtitle: "Jeopardy-style Quiz",
    category: "Quiz Game",
    rating: 4.8,
    coverImage: "jeopardy",
    route: "/games/jeopardy",
    howToPlay: "Teacher sets up 2-4 teams. A grid of categories and point values appears. Click a cell to reveal a question. Teacher reads the question aloud and manually awards points to the team that answers correctly.",
  },
  {
    id: "memory",
    title: "Мемори",
    subtitle: "Card Matching Game",
    category: "Memory",
    rating: 4.7,
    coverImage: "memory",
    route: "/games/memory",
    howToPlay: "A grid of face-down cards is shown. Players take turns flipping two cards at a time. If they match, they stay face-up! Find all matching pairs to win. Choose topic and grid size for difficulty.",
  },
  {
    id: "scales",
    title: "Весы",
    subtitle: "Math Logic Game",
    category: "Mathematics",
    rating: 4.6,
    coverImage: "scales",
    route: "/games/scales",
    howToPlay: "A target weight is shown on one side of the scale. Click math problem weights to add them to the other side. Solve the problems to reach the exact target weight and balance the scale!",
  },
  {
    id: "word-search",
    title: "Филворд",
    subtitle: "Word Search Game",
    category: "Language",
    rating: 4.5,
    coverImage: "word-search",
    route: "/games/word-search",
    howToPlay: "A grid of letters hides hidden words related to your chosen topic. Drag across letters to highlight and find words. Found words are crossed off the list. Find all words to win! Choose difficulty for more directions.",
  },
];

export const mathProblems = [
  "1)  24 + 37 = ___",
  "2)  56 − 18 = ___",
  "3)  8 × 7 = ___",
  "4)  63 ÷ 9 = ___",
  "5)  123 + 89 = ___",
  "6)  200 − 45 = ___",
  "7)  12 × 5 = ___",
  "8)  48 ÷ 6 = ___",
  "9)  345 + 167 = ___",
  "10) 500 − 238 = ___",
];

export const crosswordWords = [
  { word: "APPLE", clue: "A red or green fruit" },
  { word: "BANANA", clue: "A yellow curved fruit" },
  { word: "ORANGE", clue: "A citrus fruit" },
  { word: "GRAPE", clue: "Small round fruit, grows in bunches" },
  { word: "MANGO", clue: "Tropical sweet fruit" },
];
