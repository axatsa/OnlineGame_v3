// ── Shared ────────────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface ErrorResponse {
  error: string;
  detail?: string | Record<string, string[]>;
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: number;
  email: string;
  full_name: string;
  role: "super_admin" | "org_admin" | "teacher";
  is_active: boolean;
  onboarding_completed: boolean;
  organization_id: number | null;
  avatar_url?: string | null;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: AuthUser;
}

export interface RegisterWithInviteRequest {
  token: string;
  email: string;
  full_name: string;
  password: string;
}

export interface RegisterWithInviteResponse {
  access_token: string;
  token_type: string;
  user: AuthUser;
}

// ── Subscription / Payments ───────────────────────────────────────────────────

export interface SubscriptionMe {
  tokens_used_this_month: number;
  tokens_limit: number;
  plan?: string;
}

export interface PaymentStatus {
  id: string;
  status: "pending" | "paid" | "failed";
  plan: string;
  amount: number;
  currency: string;
}

// ── Classes ───────────────────────────────────────────────────────────────────

export interface ClassItem {
  id: number;
  name: string;
  grade: string;
  students_count?: number;
  created_at?: string;
}

// ── Materials ─────────────────────────────────────────────────────────────────

export interface Material {
  id: number;
  filename: string;
  file_type: string;
  char_count: number;
  created_at: string;
}

// ── Generation — shared ───────────────────────────────────────────────────────

export type GenerationLanguage = "Russian" | "Uzbek" | "English";

export interface GenerationStats {
  total_generations: number;
  generations_this_month: number;
  games_launched: number;
  activity_by_day: { date: string; count: number }[];
  top_features: { name: string; count: number }[];
}

export interface HistoryItem {
  id: number;
  generator_type: string;
  topic: string;
  content: string;
  created_at: string;
  /** SQLite stores as INTEGER 0/1 — treat as number, not boolean */
  is_favorite: number;
}

export interface GenerationTemplate {
  id: number;
  title: string;
  topic: string;
  config: Record<string, unknown>;
  feature: string;
}

// ── Generation — batch ────────────────────────────────────────────────────────

export interface BatchGenerateRequest {
  type: string;
  topic: string;
  language: GenerationLanguage;
  count?: number;
  class_id?: number | null;
  config?: Record<string, unknown>;
}

export interface BatchGenerateResponse {
  results: unknown[];
}

// ── Generation — quiz ─────────────────────────────────────────────────────────

export interface QuizQuestion {
  q: string;
  options: string[];
  answer: string;
  answers?: string[];
}

export interface QuizGenerateResponse {
  questions: QuizQuestion[];
}

// ── Generation — math ─────────────────────────────────────────────────────────

export type MathPuzzleType = "missing_operator" | "number_chain" | "magic_square";

export interface OperatorPuzzle {
  puzzle: string;
  answer: string;
}

export interface ChainPuzzle {
  puzzle: string;
  answer: string;
  rule: string;
}

export interface MagicPuzzle {
  puzzle: (number | "?")[][][];
  answers: string[];
  magic_sum: number;
}

export type AnyMathPuzzle = OperatorPuzzle | ChainPuzzle | MagicPuzzle;

export interface MathPuzzleGenerateResponse {
  puzzles: AnyMathPuzzle[];
  puzzle_type: MathPuzzleType;
}

// ── Generation — assignment ───────────────────────────────────────────────────

export interface AssignmentQuestion {
  num: number;
  text: string;
  options?: string[];
  answer: string;
}

export interface GeneratedAssignment {
  title: string;
  subject: string;
  grade: string;
  questions: AssignmentQuestion[];
  date: string;
}

// ── Generation — crossword ────────────────────────────────────────────────────

export interface CrosswordWordEntry {
  word: string;
  clue: string;
}

export interface CrosswordGenerateResponse {
  words: CrosswordWordEntry[];
}

// ── Generation — hangman ──────────────────────────────────────────────────────

export interface HangmanWord {
  word: string;
  hint: string;
  hints?: string[];
}

export interface HangmanGenerateResponse {
  words: HangmanWord[];
}

// ── Generation — spelling bee ─────────────────────────────────────────────────

export interface SpellingWord {
  word: string;
  definition: string;
  example: string;
  alternatives?: string[];
}

export interface SpellingGenerateResponse {
  words: SpellingWord[];
}

// ── Generation — word pairs ────────────────────────────────────────────────────

export interface WordPair {
  source: string;
  target: string;
  example: string;
  alternatives?: string[];
}

export interface WordPairsGenerateResponse {
  pairs: WordPair[];
}

// ── Generation — jeopardy ─────────────────────────────────────────────────────

export interface JeopardyQuestion {
  q: string;
  a: string;
  answers?: string[];
}

export interface JeopardyCategory {
  name: string;
  questions: Record<string, JeopardyQuestion>;
}

export interface JeopardyGenerateResponse {
  categories: JeopardyCategory[];
}

// ── Library — books ────────────────────────────────────────────────────────────

export interface BookPage {
  page_number: number;
  text: string;
  illustration_prompt: string;
  image_base64?: string;
}

export interface Book {
  id: number;
  title: string;
  description: string;
  age_group: string;
  genre: string;
  language: string;
  pages: BookPage[];
  page_count?: number;
  cover_emoji: string;
  createdAt: string;
}

export interface LibraryGenerateRequest {
  title: string;
  genre: string;
  age_group: string;
  language: GenerationLanguage;
}

// ── Gamification ─────────────────────────────────────────────────────────────

export interface GamificationProfile {
  user_id: number;
  xp: number;
  level: number;
  streak_days: number;
  badges: string[];
  rank?: number;
}

export interface GamificationDailyStats {
  date: string;
  xp_earned: number;
  activities_completed: number;
}

export interface LeaderboardEntry {
  user_id: number;
  full_name: string;
  xp: number;
  level: number;
  rank: number;
}

export interface ShopItem {
  id: number;
  name: string;
  description: string;
  price: number;
  icon: string;
}

export interface ActivityCompleteResponse {
  xp_earned: number;
  new_level?: number;
  badge_unlocked?: string;
}

// ── Org-admin ─────────────────────────────────────────────────────────────────

export interface OrgMeResponse {
  id: number;
  org_id: number;
  org_name: string;
  contact_person: string;
  seats_used: number;
  seats_total: number;
  expires_at: string;
  status: string;
  tokens_this_month?: number;
}

export interface OrgTeacher {
  id: number;
  email: string;
  full_name: string | null;
  school: string | null;
  is_active: boolean;
  plan: string | null;
  expires_at: string | null;
  role: string;
  tokens_limit?: number;
}

export interface OrgInviteResponse {
  invite_link: string;
  token: string;
  expires_at?: string;
}

export interface OrgContact {
  admin_telegram: string | null;
}

// ── Resources ─────────────────────────────────────────────────────────────────

export interface ResourceCreateRequest {
  title: string;
  content: string;
  generator_type: string;
  class_id?: number | null;
}

export interface ResourceItem {
  id: number;
  title: string;
  generator_type: string;
  created_at: string;
}

// ── Sessions (Kahoot-style) ───────────────────────────────────────────────────

export interface CreateSessionRequest {
  log_id: number;
  time_per_q?: number;
}

export interface CreateSessionResponse {
  code: string;
  session_id: number;
}

export interface JoinSessionRequest {
  nickname: string;
  avatar_id?: string | null;
}

export interface JoinSessionResponse {
  participant_id: number;
  session_id: number;
  nickname: string;
  avatar_id: string | null;
}

export interface SessionInfoResponse {
  code: string;
  topic: string | null;
  generator_type: string;
  status: "waiting" | "active" | "finished";
  participant_count: number;
  time_per_q: number;
  question_count: number;
}

export interface SessionLeaderboardEntry {
  rank: number;
  nickname: string;
  avatar_id: string | null;
  score: number;
  delta?: number;
}

// WS message types — server → client
export type SessionWsMessage =
  | { type: "lobby_update"; participants: { id: number; nickname: string; avatar_id?: string }[] }
  | { type: "question_start"; index: number; question: string; options: string[]; time_limit: number; total_questions: number }
  | { type: "answer_received"; is_correct: boolean; points_earned: number; correct_answer: string }
  | { type: "answer_progress"; answered: number; total: number; distribution: number[] }
  | { type: "question_result"; correct_answer: string; leaderboard: SessionLeaderboardEntry[] }
  | { type: "game_over"; leaderboard: SessionLeaderboardEntry[] };

// WS message types — client → server
export type SessionTeacherCommand =
  | { type: "start_game" }
  | { type: "show_results" }
  | { type: "next_question" }
  | { type: "end_game" };

export type SessionStudentCommand =
  | { type: "submit_answer"; answer: string; response_time_ms: number };
