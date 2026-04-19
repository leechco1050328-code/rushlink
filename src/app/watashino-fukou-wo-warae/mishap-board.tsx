"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import {
  MISHAP_CATEGORIES,
  normalizeMishapTags,
  type MishapCategory,
  type MishapPost,
} from "@/lib/mishap-posts";
import styles from "./page.module.css";

const routePath = "/watashino-fukou-wo-warae";

type FeedKey = "recommended" | "new" | "popular" | "rising" | "random";
type ThumbTone = "warm" | "cool" | "night" | "none";
type ReactionKey = "あるある" | "ドンマイ" | "わかる";

type DisplayPost = {
  id: string;
  title: string;
  body: string;
  category: MishapCategory;
  tags: string[];
  reactions: Record<ReactionKey, number>;
  views: number;
  createdAt: string;
  thumb: ThumbTone;
  imageLabel: string;
  isLive?: boolean;
};

type ComposerState = {
  title: string;
  body: string;
  category: MishapCategory;
  tags: string;
};

type NoticeState = {
  kind: "info" | "success" | "error";
  text: string;
};

const feedSummary: Record<FeedKey, string> = {
  recommended: "いま読まれている不幸と、たった今届いた不幸をほどよく混ぜています。",
  new: "投稿された順に、新しいやらかしを上から表示しています。",
  popular: "リアクション数の多い不幸を中心に並べています。",
  rising: "直近で一気に反応が伸びた不幸を集めています。",
  random: "深刻すぎない不幸を、気分転換向けにランダム表示しています。",
};

const defaultReactions: Record<ReactionKey, number> = {
  あるある: 0,
  ドンマイ: 0,
  わかる: 0,
};

const defaultComposer: ComposerState = {
  title: "",
  body: "",
  category: "朝のうっかり",
  tags: "",
};

const defaultNotice: NoticeState = {
  kind: "info",
  text: "ログインなしで投稿できます。まずはテキスト投稿から公開しています。",
};

function getIsoMinutesAgo(minutes: number) {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

const samplePostsByFeed: Record<FeedKey, DisplayPost[]> = {
  recommended: [
    {
      id: "sample-megane",
      title: "顔を洗おうとして、メガネのまま全力で水を浴びた",
      body: "眠気が強すぎて、メガネに水滴がついた瞬間まで現実が追いつかなかった。鏡の向こうの自分もだいぶ困っていた。",
      category: "朝のうっかり",
      tags: ["#メガネのまま", "#洗面所の罠", "#起床5分以内"],
      reactions: { あるある: 248, ドンマイ: 62, わかる: 133 },
      views: 3421,
      createdAt: getIsoMinutesAgo(8),
      thumb: "cool",
      imageLabel: "写真あり",
    },
    {
      id: "sample-egg",
      title: "卵パックを受け取った直後に、床へ一括納品した",
      body: "落ちるまでの0.6秒だけは絶対に間に合うと思っていた。床に広がる黄身が静かに勝利を宣言していた。",
      category: "料理",
      tags: ["#卵終了", "#床が朝食", "#写真で伝わる系"],
      reactions: { あるある: 304, ドンマイ: 129, わかる: 148 },
      views: 4928,
      createdAt: getIsoMinutesAgo(60),
      thumb: "warm",
      imageLabel: "写真あり",
    },
    {
      id: "sample-bento",
      title: "温めてもらった弁当だけレジに置いて帰った",
      body: "支払いも袋詰めも済ませて達成感だけ持ち帰った。家で袋を開けたら、主役不在だった。",
      category: "買い物事故",
      tags: ["#レジあるある", "#温め後の虚無", "#持っていたのに忘れた"],
      reactions: { あるある: 186, ドンマイ: 73, わかる: 114 },
      views: 2754,
      createdAt: getIsoMinutesAgo(22),
      thumb: "none",
      imageLabel: "テキストのみ",
    },
    {
      id: "sample-wash",
      title: "洗濯が終わったと思ったら、洗剤を入れていなかった",
      body: "一連の家事をやりきった顔で開けたら、ただ回転した衣類たちが出てきた。誰も責めていないのにこちらだけが気まずい。",
      category: "家の中",
      tags: ["#家事の虚無", "#洗濯機は悪くない", "#二周目確定"],
      reactions: { あるある: 201, ドンマイ: 58, わかる: 120 },
      views: 2415,
      createdAt: getIsoMinutesAgo(120),
      thumb: "none",
      imageLabel: "テキストのみ",
    },
  ],
  new: [
    {
      id: "sample-cupmen",
      title: "カップ麺にお湯を入れて、フタを手に持ったまま待っていた",
      body: "なんとなく持っていたフタを、最後までなんとなく持ち続けた。3分後に一番びっくりしたのは自分だった。",
      category: "料理",
      tags: ["#フタ未装着", "#待機の無意味さ", "#昼休みの悲哀"],
      reactions: { あるある: 232, ドンマイ: 48, わかる: 109 },
      views: 3210,
      createdAt: getIsoMinutesAgo(12),
      thumb: "none",
      imageLabel: "テキストのみ",
    },
    {
      id: "sample-earphone",
      title: "片方のイヤホンを探し回ったあと、両耳についていた",
      body: "探しながら音楽は普通に聞こえていたので、状況判断が完全に追いついていなかった。落ち着いてほしいのは脳だった。",
      category: "持ち物",
      tags: ["#イヤホン消失事件", "#両耳装着済み", "#自分に敗北"],
      reactions: { あるある: 214, ドンマイ: 41, わかる: 138 },
      views: 2874,
      createdAt: getIsoMinutesAgo(40),
      thumb: "cool",
      imageLabel: "写真あり",
    },
    {
      id: "sample-idcard",
      title: "社員証を首から下げたまま、社員証を探して10分使った",
      body: "机の上もカバンの中も完璧に捜索したあとで、同僚に無言で首元を指さされた。反論の材料が一切なかった。",
      category: "仕事・勉強",
      tags: ["#見えてるのに見えない", "#午前の敗北", "#通勤後あるある"],
      reactions: { あるある: 165, ドンマイ: 37, わかる: 94 },
      views: 1987,
      createdAt: getIsoMinutesAgo(180),
      thumb: "night",
      imageLabel: "写真あり",
    },
  ],
  popular: [],
  rising: [],
  random: [
    {
      id: "sample-toast",
      title: "トーストを焼いていたことを忘れ、2周目の香ばしさで気づいた",
      body: "一周目は朝食、二周目は反省会だった。キッチン全体が軽く叱ってきた。",
      category: "朝のうっかり",
      tags: ["#トースト二周目", "#匂いで気づく", "#朝は判断が遅い"],
      reactions: { あるある: 191, ドンマイ: 72, わかる: 98 },
      views: 2599,
      createdAt: getIsoMinutesAgo(300),
      thumb: "warm",
      imageLabel: "写真あり",
    },
    {
      id: "sample-refill",
      title: "詰め替え用だけを買って帰り、本体が存在しないことに気づいた",
      body: "節約意識だけは先に到着していた。浴室で詰め替え先を失った袋が静かに揺れていた。",
      category: "買い物事故",
      tags: ["#詰め替え難民", "#本体不在", "#買い物メモ敗北"],
      reactions: { あるある: 173, ドンマイ: 56, わかる: 81 },
      views: 2238,
      createdAt: getIsoMinutesAgo(1440),
      thumb: "none",
      imageLabel: "テキストのみ",
    },
    {
      id: "sample-bag",
      title: "会計を済ませて満足して、買った袋をレジに置いたまま出た",
      body: "自分の中では完了していたけれど、現実にはまだ受け取るべきものが残っていた。帰宅後の静かな絶望が長い。",
      category: "買い物事故",
      tags: ["#会計後の油断", "#袋だけが残る", "#帰宅後に気づく"],
      reactions: { あるある: 156, ドンマイ: 34, わかる: 77 },
      views: 1864,
      createdAt: getIsoMinutesAgo(2880),
      thumb: "none",
      imageLabel: "テキストのみ",
    },
  ],
};

samplePostsByFeed.popular = [
  samplePostsByFeed.recommended[1],
  samplePostsByFeed.recommended[0],
  {
    id: "sample-ecobag",
    title: "エコバッグを持ってきたのに、袋を買ってから思い出した",
    body: "会計を終えた直後、カバンの中で折りたたまれたままの正義と目が合った。誰より自分ががっかりした。",
    category: "買い物事故",
    tags: ["#エコバッグ忘れではない", "#持参済み敗北", "#会計後に気づく系"],
    reactions: { あるある: 220, ドンマイ: 39, わかる: 110 },
    views: 3101,
    createdAt: getIsoMinutesAgo(360),
    thumb: "none",
    imageLabel: "テキストのみ",
  },
];

samplePostsByFeed.rising = [
  samplePostsByFeed.recommended[0],
  samplePostsByFeed.new[1],
  samplePostsByFeed.new[0],
];

const allSamplePosts = Array.from(
  new Map(
    Object.values(samplePostsByFeed)
      .flat()
      .map((post) => [post.id, post]),
  ).values(),
);

function getMessageFromError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "投稿の処理に失敗しました。";
}

function formatAgeLabel(value: string) {
  const diff = Date.now() - new Date(value).getTime();
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < hour) {
    const minutes = Math.max(1, Math.floor(diff / minute));
    return `${minutes}分前`;
  }

  if (diff < day) {
    return `${Math.floor(diff / hour)}時間前`;
  }

  if (diff < day * 2) {
    return "昨日";
  }

  return "一昨日";
}

function totalReactions(reactions: Record<ReactionKey, number>) {
  return Object.values(reactions).reduce((total, value) => total + value, 0);
}

function dedupePosts(posts: DisplayPost[]) {
  return Array.from(new Map(posts.map((post) => [post.id, post])).values());
}

function shufflePosts(posts: DisplayPost[]) {
  return [...posts].sort(() => Math.random() - 0.5);
}

function mapLivePost(post: MishapPost): DisplayPost {
  return {
    id: `live-${post.id}`,
    title: post.title,
    body: post.body,
    category: post.category,
    tags: post.tags,
    reactions: { ...defaultReactions },
    views: 0,
    createdAt: post.createdAt,
    thumb: "none",
    imageLabel: "テキスト投稿",
    isLive: true,
  };
}

function buildFeedPosts(livePosts: MishapPost[]) {
  const live = livePosts.map(mapLivePost);
  const merged = dedupePosts([...live, ...allSamplePosts]).sort(
    (left, right) =>
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  );

  return {
    recommended: dedupePosts([
      ...live,
      ...samplePostsByFeed.recommended,
      ...samplePostsByFeed.new,
    ]).slice(0, 8),
    new: merged,
    popular: dedupePosts([...samplePostsByFeed.popular, ...live]).sort((left, right) => {
      const reactionGap = totalReactions(right.reactions) - totalReactions(left.reactions);

      if (reactionGap !== 0) {
        return reactionGap;
      }

      return right.views - left.views;
    }),
    rising: dedupePosts([
      ...live,
      ...samplePostsByFeed.rising,
      ...samplePostsByFeed.new,
    ]).slice(0, 8),
    random: shufflePosts(merged),
  } satisfies Record<FeedKey, DisplayPost[]>;
}

function buildTagRanking(posts: DisplayPost[]) {
  return Array.from(
    posts.reduce((map, post) => {
      post.tags.forEach((tag) => {
        map.set(tag, (map.get(tag) ?? 0) + 1);
      });

      return map;
    }, new Map<string, number>()),
  )
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0], "ja"))
    .slice(0, 10);
}

function buildRankingPosts(posts: DisplayPost[]) {
  return [...posts]
    .sort((left, right) => {
      const scoreGap = totalReactions(right.reactions) - totalReactions(left.reactions);

      if (scoreGap !== 0) {
        return scoreGap;
      }

      return right.views - left.views;
    })
    .slice(0, 5)
    .map((post) => ({
      title: post.title,
      category: post.category,
      score: Math.max(totalReactions(post.reactions), post.views),
    }));
}

function renderReactionScore(post: DisplayPost) {
  if (post.isLive && totalReactions(post.reactions) === 0) {
    return (
      <span className={styles.reactionPill}>
        <strong>投稿</strong>
        <span>受付中</span>
      </span>
    );
  }

  return Object.entries(post.reactions).map(([label, value]) => (
    <span key={label} className={styles.reactionPill}>
      <strong>{label}</strong>
      <span>{value}</span>
    </span>
  ));
}

function renderPosts(list: DisplayPost[]) {
  return list.map((post) => (
    <article key={post.id} className={styles.postCard}>
      <div className={styles.postMain}>
        <div className={styles.postUserLine}>
          <span className={styles.postAvatar}>匿</span>
          <span>匿名</span>
          <span className={styles.metaPill}>{post.category}</span>
          <span className={styles.postDate}>{formatAgeLabel(post.createdAt)}</span>
          <span>{post.isLive ? "新規投稿" : `閲覧 ${post.views.toLocaleString()}`}</span>
        </div>

        <h3 className={styles.postTitle}>{post.title}</h3>
        <p className={styles.postBody}>{post.body}</p>

        <div className={styles.postTags}>
          {post.tags.map((tag) => (
            <span key={`${post.id}-${tag}`} className={styles.tagChip}>
              {tag}
            </span>
          ))}
        </div>

        <div className={styles.postFooter}>
          <div className={styles.postReactions}>{renderReactionScore(post)}</div>
          <div className={styles.postMeta}>通報する</div>
        </div>
      </div>

      <div
        className={`${styles.postThumb} ${
          styles[`thumb${post.thumb[0].toUpperCase()}${post.thumb.slice(1)}`]
        }`}
      >
        <span className={styles.thumbLabel}>{post.imageLabel}</span>
      </div>
    </article>
  ));
}

export function MishapBoard() {
  const [composer, setComposer] = useState<ComposerState>(defaultComposer);
  const [notice, setNotice] = useState<NoticeState>(defaultNotice);
  const [livePosts, setLivePosts] = useState<MishapPost[]>([]);
  const [isFeedLoading, setIsFeedLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const composerRef = useRef<HTMLDivElement | null>(null);
  const titleInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadPosts() {
      try {
        const response = await fetch("/api/watashino-fukou-wo-warae/posts", {
          cache: "no-store",
        });
        const payload = (await response.json()) as {
          error?: string;
          posts?: MishapPost[];
        };

        if (!response.ok) {
          throw new Error(payload.error ?? "投稿一覧の読み込みに失敗しました。");
        }

        if (mounted) {
          setLivePosts(payload.posts ?? []);
        }
      } catch (error: unknown) {
        if (mounted) {
          setNotice({
            kind: "error",
            text: `投稿一覧を読み込めませんでした: ${getMessageFromError(error)}`,
          });
        }
      } finally {
        if (mounted) {
          setIsFeedLoading(false);
        }
      }
    }

    void loadPosts();

    return () => {
      mounted = false;
    };
  }, []);

  function updateComposer<Key extends keyof ComposerState>(
    key: Key,
    value: ComposerState[Key],
  ) {
    setComposer((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function openComposer(seedTag?: string) {
    if (seedTag && !composer.tags.trim()) {
      setComposer((current) => ({
        ...current,
        tags: seedTag,
      }));
    }

    composerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => {
      titleInputRef.current?.focus();
    }, 140);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      try {
        const response = await fetch("/api/watashino-fukou-wo-warae/posts", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: composer.title.trim(),
            body: composer.body.trim(),
            category: composer.category,
            tags: normalizeMishapTags(composer.tags),
          }),
        });

        const payload = (await response.json()) as {
          error?: string;
          post?: MishapPost;
        };

        if (!response.ok || !payload.post) {
          throw new Error(payload.error ?? "投稿に失敗しました。");
        }

        setLivePosts((current) => [payload.post!, ...current]);
        setComposer(defaultComposer);
        setNotice({
          kind: "success",
          text: "投稿しました。タイムラインの上からすぐ読めます。",
        });
      } catch (error: unknown) {
        setNotice({
          kind: "error",
          text: `投稿に失敗しました: ${getMessageFromError(error)}`,
        });
      }
    });
  }

  const feedPosts = buildFeedPosts(livePosts);
  const rankingPosts = buildRankingPosts(feedPosts.popular);
  const tagRanking = buildTagRanking([...livePosts.map(mapLivePost), ...allSamplePosts]);
  const noticeClassName =
    notice.kind === "success"
      ? styles.noticeSuccess
      : notice.kind === "error"
        ? styles.noticeError
        : styles.noticeInfo;

  return (
    <>
      <header className={styles.siteHeader}>
        <div className={styles.headerInner}>
          <div className={styles.headerLeft}>
            <Link href={routePath} className={styles.brand}>
              <span className={styles.brandMark}>笑</span>
              <span className={styles.brandText}>私の不幸を笑え</span>
            </Link>

            <nav className={styles.headerNav} aria-label="ページ内ナビゲーション">
              <a href="#trend" className={`${styles.navLink} ${styles.navLinkActive}`}>
                Trend
              </a>
              <a href="#feed-popular" className={styles.navLink}>
                人気
              </a>
              <a href="#topics" className={styles.navLink}>
                お題
              </a>
              <a href="#tags" className={styles.navLink}>
                タグ
              </a>
            </nav>
          </div>

          <div className={styles.headerActions}>
            <button type="button" className={styles.primaryButton} onClick={() => openComposer()}>
              投稿する
            </button>
          </div>
        </div>
      </header>

      <main className={styles.pageShell}>
        <div className={styles.contentGrid}>
          <aside className={styles.leftRail}>
            <section className={styles.railCard}>
              <p className={styles.cardLabel}>About</p>
              <h1 className={styles.heroTitle}>笑ってほしい、日常の小さなやらかし。</h1>
              <p className={styles.introText}>
                自分の失敗だけを、短く置いていく共有所です。ログイン不要で匿名投稿できて、
                テキストが主役。深刻すぎない不幸だけを集めて、ちょっと肩の力が抜ける場を目指します。
              </p>
              <div className={styles.introActions}>
                <button type="button" className={styles.primaryButton} onClick={() => openComposer()}>
                  投稿する
                </button>
                <a href="#guideline" className={styles.ghostButton}>
                  投稿ルール
                </a>
              </div>
            </section>

            <section className={styles.railCard}>
              <p className={styles.cardLabel}>Explore</p>
              <div className={styles.railLinks}>
                <a href="#trend" className={`${styles.railLink} ${styles.railLinkActive}`}>
                  Trend
                </a>
                <a href="#feed-popular" className={styles.railLink}>
                  人気
                </a>
                <a href="#topics" className={styles.railLink}>
                  お題
                </a>
                <a href="#tags" className={styles.railLink}>
                  タグ
                </a>
              </div>
            </section>

            <section className={styles.backLinkCard}>
              <Link href="/" className={styles.backLink}>
                Rush Link トップへ戻る
              </Link>
            </section>
          </aside>

          <section className={styles.centerColumn}>
            <section className={`${styles.railCard} ${styles.featuredTopic}`} id="topics">
              <div>
                <p className={styles.cardLabel}>Weekly Theme</p>
                <h2 className={styles.topicHeading}>今週のお題</h2>
                <p className={styles.topicTitle}>持っていたのに忘れたもの</p>
                <p className={styles.topicBody}>
                  エコバッグ、社員証、温めてもらった弁当。思い出すだけでちょっと悔しいやつ。
                </p>
              </div>

              <div className={styles.featuredTopicAction}>
                <button
                  type="button"
                  className={styles.ghostButton}
                  onClick={() => openComposer("持っていたのに忘れた")}
                >
                  このお題で投稿
                </button>
              </div>
            </section>

            <section className={`${styles.feedColumn} ${styles.composerCard}`} id="composer" ref={composerRef}>
              <div className={styles.cardHeader}>
                <div>
                  <p className={styles.cardLabel}>Post</p>
                  <h2 className={styles.feedHeading}>匿名で投稿する</h2>
                </div>
                <span className={styles.cardHeaderMeta}>ログイン不要</span>
              </div>

              <div className={`${styles.noticeBox} ${noticeClassName}`}>
                <p>{notice.text}</p>
              </div>

              <form className={styles.composerForm} onSubmit={handleSubmit}>
                <label className={styles.fieldBlock}>
                  <span className={styles.fieldLabel}>ひとことで言うと</span>
                  <input
                    ref={titleInputRef}
                    value={composer.title}
                    onChange={(event) => updateComposer("title", event.target.value)}
                    className={styles.fieldInput}
                    placeholder="例: 卵パックを受け取った直後に、床へ一括納品した"
                    minLength={10}
                    maxLength={80}
                    required
                  />
                </label>

                <div className={styles.composerGrid}>
                  <label className={styles.fieldBlock}>
                    <span className={styles.fieldLabel}>カテゴリ</span>
                    <select
                      value={composer.category}
                      onChange={(event) =>
                        updateComposer("category", event.target.value as MishapCategory)
                      }
                      className={styles.fieldInput}
                    >
                      {MISHAP_CATEGORIES.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className={styles.fieldBlock}>
                    <span className={styles.fieldLabel}>タグ</span>
                    <input
                      value={composer.tags}
                      onChange={(event) => updateComposer("tags", event.target.value)}
                      className={styles.fieldInput}
                      placeholder="例: 卵終了 床が朝食 写真で伝わる系"
                    />
                    <span className={styles.fieldHint}>スペース区切りで最大3つまでです。</span>
                  </label>
                </div>

                <label className={styles.fieldBlock}>
                  <span className={styles.fieldLabel}>なにが起きたか</span>
                  <textarea
                    value={composer.body}
                    onChange={(event) => updateComposer("body", event.target.value)}
                    className={`${styles.fieldInput} ${styles.fieldTextarea}`}
                    placeholder="そのとき何が起きたか、あとで思い返してちょっと笑える感じで書いてください。"
                    minLength={20}
                    maxLength={280}
                    required
                  />
                  <span className={styles.fieldHint}>
                    現在はテキスト投稿のみです。顔や個人情報が写る写真の投稿は、画像対応時も不可です。
                  </span>
                </label>

                <div className={styles.composerFooter}>
                  <button type="submit" className={styles.primaryButton} disabled={isPending}>
                    {isPending ? "投稿中..." : "投稿する"}
                  </button>
                  <p className={styles.composerMeta}>
                    深刻な事故や他人が傷つく内容は掲載できません。
                  </p>
                </div>
              </form>
            </section>

            <section className={styles.feedColumn} id="trend">
              <header className={styles.feedHero}>
                <div>
                  <p className={styles.cardLabel}>Trend</p>
                  <h2 className={styles.feedHeading}>今日よく読まれている不幸</h2>
                  <p className={styles.feedHeroText}>
                    Qiitaのように整理して、でも空気はやわらかく。匿名で置かれた日常のやらかしを、
                    今の温度感がわかる順に上から読めます。
                  </p>
                  {isFeedLoading ? (
                    <p className={styles.feedMetaLine}>投稿を読み込んでいます...</p>
                  ) : livePosts.length > 0 ? (
                    <p className={styles.feedMetaLine}>
                      匿名投稿 {livePosts.length} 件を読み込みました。
                    </p>
                  ) : null}
                </div>
              </header>

              <div className={styles.feedToolbar}>
                {(["recommended", "new", "popular", "rising", "random"] as const).map((key) => (
                  <a
                    key={key}
                    href={`#feed-${key}`}
                    className={`${styles.feedTab} ${key === "recommended" ? styles.feedTabActive : ""}`}
                  >
                    {key === "recommended"
                      ? "Trend"
                      : key === "new"
                        ? "新着"
                        : key === "popular"
                          ? "人気"
                          : key === "rising"
                            ? "急上昇"
                            : "ランダム"}
                  </a>
                ))}
              </div>

              {(Object.keys(feedPosts) as FeedKey[]).map((key) => (
                <section key={key} id={`feed-${key}`} className={styles.feedBlock}>
                  <div className={styles.feedBlockHeader}>
                    <h3 className={styles.feedBlockTitle}>
                      {key === "recommended"
                        ? "Trend"
                        : key === "new"
                          ? "新着"
                          : key === "popular"
                            ? "人気"
                            : key === "rising"
                              ? "急上昇"
                              : "ランダム"}
                    </h3>
                    <p className={styles.feedSummary}>{feedSummary[key]}</p>
                  </div>
                  <div className={styles.feedList}>{renderPosts(feedPosts[key])}</div>
                </section>
              ))}
            </section>
          </section>

          <aside className={styles.rightRail}>
            <section className={styles.railCard} id="tags">
              <div className={styles.cardHeader}>
                <div>
                  <p className={styles.cardLabel}>Tag Rankings</p>
                  <h2 className={styles.sideHeading}>人気タグ</h2>
                </div>
                <span className={styles.cardHeaderMeta}>Weekly</span>
              </div>
              <div className={styles.tagCloud}>
                {tagRanking.map(([tag, count]) => (
                  <span key={tag} className={styles.tagChip}>
                    {tag}
                    <strong>{count}</strong>
                  </span>
                ))}
              </div>
            </section>

            <section className={styles.railCard}>
              <div className={styles.cardHeader}>
                <div>
                  <p className={styles.cardLabel}>Post Rankings</p>
                  <h2 className={styles.sideHeading}>今日のランキング</h2>
                </div>
                <a href="#trend" className={styles.cardHeaderLink}>
                  もっと見る
                </a>
              </div>
              <ol className={styles.rankingList}>
                {rankingPosts.map((post) => (
                  <li key={post.title}>
                    <span className={styles.rankingTitle}>{post.title}</span>
                    <span className={styles.rankingMeta}>
                      {post.category} / 反応 {post.score}
                    </span>
                  </li>
                ))}
              </ol>
            </section>

            <section className={styles.railCard} id="guideline">
              <p className={styles.cardLabel}>Guideline</p>
              <h2 className={styles.sideHeading}>投稿ルール</h2>
              <ul className={styles.ruleList}>
                <li>投稿できるのは、自分の失敗だけです。</li>
                <li>深刻な事故や他人が傷つく内容は掲載できません。</li>
                <li>写真は任意ですが、顔や個人情報が写るものはわからないように処理をしてください。</li>
              </ul>
            </section>
          </aside>
        </div>
      </main>
    </>
  );
}
