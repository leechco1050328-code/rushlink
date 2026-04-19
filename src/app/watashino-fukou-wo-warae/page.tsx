import type { Metadata } from "next";
import Link from "next/link";
import styles from "./page.module.css";

const routePath = "/watashino-fukou-wo-warae";

const feedSummary: Record<FeedKey, string> = {
  recommended: "いま読まれている不幸を、ほどよく混ぜて表示しています。",
  new: "投稿された順に、新しいやらかしを上から表示しています。",
  popular: "リアクション数の多い不幸を中心に並べています。",
  rising: "直近で一気に反応が伸びた不幸を集めています。",
  random: "深刻すぎない不幸を、気分転換向けにランダム表示しています。",
};

type FeedKey = "recommended" | "new" | "popular" | "rising" | "random";

type Post = {
  title: string;
  body: string;
  category: string;
  tags: string[];
  reactions: Record<string, number>;
  views: number;
  age: string;
  thumb: "warm" | "cool" | "night" | "none";
  imageLabel: string;
};

const posts: Record<FeedKey, Post[]> = {
  recommended: [
    {
      title: "顔を洗おうとして、メガネのまま全力で水を浴びた",
      body: "眠気が強すぎて、メガネに水滴がついた瞬間まで現実が追いつかなかった。鏡の向こうの自分もだいぶ困っていた。",
      category: "朝のうっかり",
      tags: ["#メガネのまま", "#洗面所の罠", "#起床5分以内"],
      reactions: { あるある: 248, ドンマイ: 62, わかる: 133 },
      views: 3421,
      age: "8分前",
      thumb: "cool",
      imageLabel: "写真あり",
    },
    {
      title: "卵パックを受け取った直後に、床へ一括納品した",
      body: "落ちるまでの0.6秒だけは絶対に間に合うと思っていた。床に広がる黄身が静かに勝利を宣言していた。",
      category: "料理",
      tags: ["#卵終了", "#床が朝食", "#写真で伝わる系"],
      reactions: { あるある: 304, ドンマイ: 129, わかる: 148 },
      views: 4928,
      age: "1時間前",
      thumb: "warm",
      imageLabel: "写真あり",
    },
    {
      title: "温めてもらった弁当だけレジに置いて帰った",
      body: "支払いも袋詰めも済ませて達成感だけ持ち帰った。家で袋を開けたら、主役不在だった。",
      category: "買い物事故",
      tags: ["#レジあるある", "#温め後の虚無", "#持っていたのに忘れた"],
      reactions: { あるある: 186, ドンマイ: 73, わかる: 114 },
      views: 2754,
      age: "22分前",
      thumb: "none",
      imageLabel: "テキストのみ",
    },
    {
      title: "洗濯が終わったと思ったら、洗剤を入れていなかった",
      body: "一連の家事をやりきった顔で開けたら、ただ回転した衣類たちが出てきた。誰も責めていないのにこちらだけが気まずい。",
      category: "家の中",
      tags: ["#家事の虚無", "#洗濯機は悪くない", "#二周目確定"],
      reactions: { あるある: 201, ドンマイ: 58, わかる: 120 },
      views: 2415,
      age: "2時間前",
      thumb: "none",
      imageLabel: "テキストのみ",
    },
  ],
  new: [
    {
      title: "カップ麺にお湯を入れて、フタを手に持ったまま待っていた",
      body: "なんとなく持っていたフタを、最後までなんとなく持ち続けた。3分後に一番びっくりしたのは自分だった。",
      category: "料理",
      tags: ["#フタ未装着", "#待機の無意味さ", "#昼休みの悲哀"],
      reactions: { あるある: 232, ドンマイ: 48, わかる: 109 },
      views: 3210,
      age: "12分前",
      thumb: "none",
      imageLabel: "テキストのみ",
    },
    {
      title: "片方のイヤホンを探し回ったあと、両耳についていた",
      body: "探しながら音楽は普通に聞こえていたので、状況判断が完全に追いついていなかった。落ち着いてほしいのは脳だった。",
      category: "持ち物",
      tags: ["#イヤホン消失事件", "#両耳装着済み", "#自分に敗北"],
      reactions: { あるある: 214, ドンマイ: 41, わかる: 138 },
      views: 2874,
      age: "40分前",
      thumb: "cool",
      imageLabel: "写真あり",
    },
    {
      title: "社員証を首から下げたまま、社員証を探して10分使った",
      body: "机の上もカバンの中も完璧に捜索したあとで、同僚に無言で首元を指さされた。反論の材料が一切なかった。",
      category: "仕事・勉強",
      tags: ["#見えてるのに見えない", "#午前の敗北", "#通勤後あるある"],
      reactions: { あるある: 165, ドンマイ: 37, わかる: 94 },
      views: 1987,
      age: "3時間前",
      thumb: "night",
      imageLabel: "写真あり",
    },
  ],
  popular: [
    {
      title: "卵パックを受け取った直後に、床へ一括納品した",
      body: "落ちるまでの0.6秒だけは絶対に間に合うと思っていた。床に広がる黄身が静かに勝利を宣言していた。",
      category: "料理",
      tags: ["#卵終了", "#床が朝食", "#写真で伝わる系"],
      reactions: { あるある: 304, ドンマイ: 129, わかる: 148 },
      views: 4928,
      age: "1時間前",
      thumb: "warm",
      imageLabel: "写真あり",
    },
    {
      title: "顔を洗おうとして、メガネのまま全力で水を浴びた",
      body: "眠気が強すぎて、メガネに水滴がついた瞬間まで現実が追いつかなかった。鏡の向こうの自分もだいぶ困っていた。",
      category: "朝のうっかり",
      tags: ["#メガネのまま", "#洗面所の罠", "#起床5分以内"],
      reactions: { あるある: 248, ドンマイ: 62, わかる: 133 },
      views: 3421,
      age: "8分前",
      thumb: "cool",
      imageLabel: "写真あり",
    },
    {
      title: "エコバッグを持ってきたのに、袋を買ってから思い出した",
      body: "会計を終えた直後、カバンの中で折りたたまれたままの正義と目が合った。誰より自分ががっかりした。",
      category: "買い物事故",
      tags: ["#エコバッグ忘れではない", "#持参済み敗北", "#会計後に気づく系"],
      reactions: { あるある: 220, ドンマイ: 39, わかる: 110 },
      views: 3101,
      age: "6時間前",
      thumb: "none",
      imageLabel: "テキストのみ",
    },
  ],
  rising: [
    {
      title: "顔を洗おうとして、メガネのまま全力で水を浴びた",
      body: "眠気が強すぎて、メガネに水滴がついた瞬間まで現実が追いつかなかった。鏡の向こうの自分もだいぶ困っていた。",
      category: "朝のうっかり",
      tags: ["#メガネのまま", "#洗面所の罠", "#起床5分以内"],
      reactions: { あるある: 248, ドンマイ: 62, わかる: 133 },
      views: 3421,
      age: "8分前",
      thumb: "cool",
      imageLabel: "写真あり",
    },
    {
      title: "片方のイヤホンを探し回ったあと、両耳についていた",
      body: "探しながら音楽は普通に聞こえていたので、状況判断が完全に追いついていなかった。落ち着いてほしいのは脳だった。",
      category: "持ち物",
      tags: ["#イヤホン消失事件", "#両耳装着済み", "#自分に敗北"],
      reactions: { あるある: 214, ドンマイ: 41, わかる: 138 },
      views: 2874,
      age: "40分前",
      thumb: "cool",
      imageLabel: "写真あり",
    },
    {
      title: "カップ麺にお湯を入れて、フタを手に持ったまま待っていた",
      body: "なんとなく持っていたフタを、最後までなんとなく持ち続けた。3分後に一番びっくりしたのは自分だった。",
      category: "料理",
      tags: ["#フタ未装着", "#待機の無意味さ", "#昼休みの悲哀"],
      reactions: { あるある: 232, ドンマイ: 48, わかる: 109 },
      views: 3210,
      age: "12分前",
      thumb: "none",
      imageLabel: "テキストのみ",
    },
  ],
  random: [
    {
      title: "トーストを焼いていたことを忘れ、2周目の香ばしさで気づいた",
      body: "一周目は朝食、二周目は反省会だった。キッチン全体が軽く叱ってきた。",
      category: "朝のうっかり",
      tags: ["#トースト二周目", "#匂いで気づく", "#朝は判断が遅い"],
      reactions: { あるある: 191, ドンマイ: 72, わかる: 98 },
      views: 2599,
      age: "5時間前",
      thumb: "warm",
      imageLabel: "写真あり",
    },
    {
      title: "詰め替え用だけを買って帰り、本体が存在しないことに気づいた",
      body: "節約意識だけは先に到着していた。浴室で詰め替え先を失った袋が静かに揺れていた。",
      category: "買い物事故",
      tags: ["#詰め替え難民", "#本体不在", "#買い物メモ敗北"],
      reactions: { あるある: 173, ドンマイ: 56, わかる: 81 },
      views: 2238,
      age: "昨日",
      thumb: "none",
      imageLabel: "テキストのみ",
    },
    {
      title: "会計を済ませて満足して、買った袋をレジに置いたまま出た",
      body: "自分の中では完了していたけれど、現実にはまだ受け取るべきものが残っていた。帰宅後の静かな絶望が長い。",
      category: "買い物事故",
      tags: ["#会計後の油断", "#袋だけが残る", "#帰宅後に気づく"],
      reactions: { あるある: 156, ドンマイ: 34, わかる: 77 },
      views: 1864,
      age: "一昨日",
      thumb: "none",
      imageLabel: "テキストのみ",
    },
  ],
};

const rankingPosts = [
  {
    title: "卵パックを受け取った直後に、床へ一括納品した",
    category: "料理",
    score: 581,
  },
  {
    title: "顔を洗おうとして、メガネのまま全力で水を浴びた",
    category: "朝のうっかり",
    score: 443,
  },
  {
    title: "エコバッグを持ってきたのに、袋を買ってから思い出した",
    category: "買い物事故",
    score: 369,
  },
  {
    title: "片方のイヤホンを探し回ったあと、両耳についていた",
    category: "持ち物",
    score: 393,
  },
  {
    title: "洗濯が終わったと思ったら、洗剤を入れていなかった",
    category: "家の中",
    score: 379,
  },
];

const tagRanking = [
  ["#メガネのまま", 1],
  ["#洗面所の罠", 1],
  ["#起床5分以内", 1],
  ["#レジあるある", 1],
  ["#持っていたのに忘れた", 1],
  ["#卵終了", 1],
  ["#写真で伝わる系", 1],
  ["#家事の虚無", 1],
  ["#洗濯機は悪くない", 1],
  ["#二周目確定", 1],
] as const;

export const metadata: Metadata = {
  title: "私の不幸を笑え",
  description: "笑ってほしい、日常の小さなやらかしを共有する特設ページ。",
  alternates: {
    canonical: routePath,
  },
  openGraph: {
    title: "私の不幸を笑え",
    description: "笑ってほしい、日常の小さなやらかしを共有する特設ページ。",
    url: routePath,
  },
  twitter: {
    title: "私の不幸を笑え",
    description: "笑ってほしい、日常の小さなやらかしを共有する特設ページ。",
  },
};

function renderReactionScore(reactions: Record<string, number>) {
  return Object.entries(reactions).map(([label, value]) => (
    <span key={label} className={styles.reactionPill}>
      <strong>{label}</strong>
      <span>{value}</span>
    </span>
  ));
}

function renderPosts(list: Post[]) {
  return list.map((post) => (
    <article key={`${post.title}-${post.age}`} className={styles.postCard}>
      <div className={styles.postMain}>
        <div className={styles.postUserLine}>
          <span className={styles.postAvatar}>匿</span>
          <span>匿名</span>
          <span className={styles.metaPill}>{post.category}</span>
          <span className={styles.postDate}>{post.age}</span>
          <span>閲覧 {post.views.toLocaleString()}</span>
        </div>

        <h3 className={styles.postTitle}>{post.title}</h3>
        <p className={styles.postBody}>{post.body}</p>

        <div className={styles.postTags}>
          {post.tags.map((tag) => (
            <span key={tag} className={styles.tagChip}>
              {tag}
            </span>
          ))}
        </div>

        <div className={styles.postFooter}>
          <div className={styles.postReactions}>{renderReactionScore(post.reactions)}</div>
          <div className={styles.postMeta}>通報する</div>
        </div>
      </div>

      <div className={`${styles.postThumb} ${styles[`thumb${post.thumb[0].toUpperCase()}${post.thumb.slice(1)}`]}`}>
        <span className={styles.thumbLabel}>{post.imageLabel}</span>
      </div>
    </article>
  ));
}

export default function MishapLandingPage() {
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
            <button type="button" className={styles.primaryButton}>
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
                画像は任意、テキストが主役。深刻すぎない不幸だけを集めて、ちょっと肩の力が抜ける場を目指します。
              </p>
              <div className={styles.introActions}>
                <button type="button" className={styles.primaryButton}>
                  投稿する
                </button>
                <button type="button" className={styles.ghostButton}>
                  投稿ルール
                </button>
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
                <button type="button" className={styles.ghostButton}>
                  このお題で投稿
                </button>
              </div>
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

              {(Object.keys(posts) as FeedKey[]).map((key) => (
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
                  <div className={styles.feedList}>{renderPosts(posts[key])}</div>
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

            <section className={styles.railCard}>
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
