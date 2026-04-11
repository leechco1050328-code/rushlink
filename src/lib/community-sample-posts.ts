type SamplePurpose = "対戦募集" | "教えたい" | "教わりたい";
type SampleSource = "recruitment_posts" | "coaching_posts";

export type CommunitySamplePost = {
  id: number;
  source: SampleSource;
  user_id: string;
  author_name: string;
  purpose: SamplePurpose;
  title: string;
  character_name: string;
  self_rank: string;
  self_mr: string;
  opponent_character_name: string;
  opponent_rank: string;
  opponent_mr: string;
  voice_option: string;
  platform: string;
  focus_topic: string;
  lesson_method: string;
  availability_start: string;
  availability_end: string;
  body: string;
  status: "open";
  created_at: string;
  isSample: true;
};

const authors = [
  "Rush Guide",
  "Set Room",
  "Drive Lab",
  "Frame Note",
  "Replay Mate",
  "Combo Route",
  "Match Desk",
  "Pulse Crew",
];

const characters = [
  "リュウ",
  "ルーク",
  "ケン",
  "春麗",
  "キャミィ",
  "JP",
  "マノン",
  "マリーザ",
  "ジュリ",
  "豪鬼",
];

const ranks = ["ブロンズ", "シルバー", "ゴールド", "プラチナ", "ダイヤ", "マスター"];
const platforms = ["PC", "PS5", "Steam", "Xbox"];
const voiceOptions = ["通話あり", "通話なし", "どちらでも可"];
const lessonMethods = ["通話あり", "通話なし", "チャット中心", "リプレイコーチング", "カスタムルーム"];
const focusTopics = [
  "対空を安定させたい",
  "インパクト返しを覚えたい",
  "中距離の差し返しを詰めたい",
  "起き攻めの組み立てを相談したい",
  "守りの選択肢を増やしたい",
  "ドライブラッシュの通し方を見直したい",
];
const recruitmentBodies = [
  "気軽に回せる相手を探しています。数戦ごとにキャラ替えも歓迎です。",
  "MR帯近い人と長めにやりたいです。対策したいキャラがあれば合わせます。",
  "仕事終わりに2先を回したいです。通話しながらでも大丈夫です。",
  "ランクは問いません。差し返しや守りを意識して対戦したいです。",
];
const teachBodies = [
  "基本の立ち回りや対空、インパクト返しあたりを一緒に整理できます。",
  "初心者向けに、負け筋の減らし方を中心に教えられます。",
  "キャラ対策やランク帯ごとの伸ばし方をゆっくり話せます。",
];
const learnBodies = [
  "画面端の守りと対空のタイミングを重点的に教えてほしいです。",
  "ラッシュを通した後の選択肢が少ないので、実戦向けに見てほしいです。",
  "ランク停滞中なので、悪い癖を見つけてもらえると助かります。",
];

function padHour(value: number) {
  return `${value}`.padStart(2, "0");
}

function pseudoPick<T>(items: T[], index: number, offset = 0) {
  return items[(index + offset) % items.length];
}

function buildTimestamp(index: number) {
  const base = new Date("2026-02-01T21:00:00+09:00");
  base.setDate(base.getDate() - (15 + (index % 28)));
  base.setHours(18 + (index % 5), (index * 11) % 60, 0, 0);
  return base.toISOString();
}

function buildRecruitmentSample(index: number): CommunitySamplePost {
  const character = pseudoPick(characters, index);
  const selfRank = pseudoPick(ranks, index, 2);
  const opponentCharacter = pseudoPick(characters, index + 3);
  const opponentRank = pseudoPick(ranks, index, 4);
  const authorName = pseudoPick(authors, index);
  const startHour = 19 + (index % 4);
  const endHour = startHour + 2;

  return {
    id: -(index + 1),
    source: "recruitment_posts",
    user_id: `sample-recruitment-${index + 1}`,
    author_name: authorName,
    purpose: "対戦募集",
    title: `${character} / ${selfRank}`,
    character_name: character,
    self_rank: selfRank,
    self_mr: selfRank === "マスター" ? `${1400 + (index % 15) * 50}` : "",
    opponent_character_name: opponentCharacter,
    opponent_rank: opponentRank,
    opponent_mr: opponentRank === "マスター" ? `${1300 + (index % 12) * 50}` : "",
    voice_option: pseudoPick(voiceOptions, index),
    platform: pseudoPick(platforms, index, 1),
    focus_topic: "",
    lesson_method: "",
    availability_start: `${padHour(startHour)}:00`,
    availability_end: `${padHour(endHour)}:00`,
    body: pseudoPick(recruitmentBodies, index),
    status: "open",
    created_at: buildTimestamp(index),
    isSample: true,
  };
}

function buildCoachingSample(index: number): CommunitySamplePost {
  const purpose = index % 2 === 0 ? "教えたい" : "教わりたい";
  const character = pseudoPick(characters, index, 5);
  const selfRank = pseudoPick(ranks, index, 1);
  const authorName = pseudoPick(authors, index, 2);
  const focusTopic = pseudoPick(focusTopics, index);

  return {
    id: -(1000 + index + 1),
    source: "coaching_posts",
    user_id: `sample-coaching-${index + 1}`,
    author_name: authorName,
    purpose,
    title: `${purpose} / ${character}`,
    character_name: character,
    self_rank: selfRank,
    self_mr: selfRank === "マスター" ? `${1450 + (index % 10) * 50}` : "",
    opponent_character_name: "",
    opponent_rank: "",
    opponent_mr: "",
    voice_option: "",
    platform: "",
    focus_topic: focusTopic,
    lesson_method: pseudoPick(lessonMethods, index),
    availability_start: index % 3 === 0 ? "何時でも可" : `${padHour(20 + (index % 3))}:00`,
    availability_end: index % 3 === 0 ? "" : `${padHour(22 + (index % 2))}:00`,
    body: purpose === "教えたい" ? pseudoPick(teachBodies, index) : pseudoPick(learnBodies, index),
    status: "open",
    created_at: buildTimestamp(index + 40),
    isSample: true,
  };
}

export const COMMUNITY_SAMPLE_POSTS: CommunitySamplePost[] = Array.from({ length: 100 }, (_, index) =>
  index < 60 ? buildRecruitmentSample(index) : buildCoachingSample(index - 60),
);
