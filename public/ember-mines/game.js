const STORAGE_KEY = "ember-mines-meta-v1";
const RUN_SAVE_KEY = "ember-mines-run-v1";
const MAX_LEADERBOARD_ENTRIES = 50;
const STAGE_CONFIGS = [
  {
    id: "ashen_warrens",
    name: "灰の坑道",
    subtitle: "崩れた線路と煤に満ちた坑道。",
    floors: [
      { type: "normal", label: "崩落線路", width: 8, height: 8, mineCount: 8, shopAfter: false },
      { type: "normal", label: "煤煙回廊", width: 8, height: 8, mineCount: 10, shopAfter: true },
      { type: "boss", label: "監視門", bossAreaName: "監視門", width: 9, height: 9, mineCount: 11, sealCount: 2, shopAfter: false },
      { type: "boss", label: "監視者の坩堝", bossAreaName: "監視門", width: 10, height: 10, mineCount: 13, sealCount: 3, shopAfter: true },
    ],
  },
  {
    id: "flooded_archive",
    name: "水没書庫",
    subtitle: "圧力扉と遺物庫が軋む、沈んだ書庫群。",
    floors: [
      { type: "normal", label: "泥濘棚区", width: 9, height: 9, mineCount: 11, shopAfter: false },
      { type: "normal", label: "圧力保管庫", width: 9, height: 9, mineCount: 13, shopAfter: true },
      { type: "boss", label: "書庫の封鍵", bossAreaName: "書庫の封鍵", width: 10, height: 10, mineCount: 14, sealCount: 3, shopAfter: false },
      { type: "boss", label: "溺れた目録", bossAreaName: "書庫の封鍵", width: 10, height: 10, mineCount: 16, sealCount: 4, shopAfter: true },
    ],
  },
  {
    id: "ember_throne",
    name: "残り火の玉座",
    subtitle: "山の頂の地下に眠る炉の城塞。",
    floors: [
      { type: "normal", label: "玉座回廊", width: 10, height: 10, mineCount: 14, shopAfter: false },
      { type: "normal", label: "溶鉄の回廊", width: 10, height: 10, mineCount: 16, shopAfter: true },
      { type: "boss", label: "熾火の階", bossAreaName: "残り火の玉座", width: 11, height: 11, mineCount: 18, sealCount: 3, shopAfter: false },
      { type: "boss", label: "心臓炉", bossAreaName: "残り火の玉座", width: 11, height: 11, mineCount: 20, sealCount: 4, shopAfter: false },
      { type: "boss", label: "灰冠", bossAreaName: "残り火の玉座", width: 12, height: 12, mineCount: 22, sealCount: 5, shopAfter: false },
    ],
  },
];
const RUN_ROUTE = buildRunRoute();
const TOTAL_STAGES = STAGE_CONFIGS.length;
const TOTAL_FLOORS = RUN_ROUTE.length;

const CLASS_DEFS = {
  scout: {
    id: "scout",
    name: "斥候",
    title: "情報特化",
    hp: 3,
    description: "開始時にスキャンとコンパスを所持。スキャン使用時、安全マスなら数字まで分かります。",
    startingItems: { scan: 1, compass: 1 },
  },
  engineer: {
    id: "engineer",
    name: "工兵",
    title: "安定攻略",
    hp: 4,
    description: "開始時にウォードとプローブを所持。各階層で最初の被弾を無効化します。",
    startingItems: { ward: 1, probe: 1 },
  },
  treasure_hunter: {
    id: "treasure_hunter",
    name: "財宝狩り",
    title: "欲張り探索",
    hp: 3,
    description: "開始時にコンパスと地図片を所持。宝箱報酬が豪華になります。",
    startingItems: { compass: 1, map_shard: 1 },
  },
};

const ITEM_DEFS = {
  scan: {
    id: "scan",
    name: "スキャン",
    target: true,
    targetMode: "sealed",
    description: "未開封マスを1つ調査。危険・安全・特殊のいずれかが分かります。",
  },
  probe: {
    id: "probe",
    name: "プローブ",
    target: true,
    targetMode: "sealed",
    description: "未開封マスを1つ調査。安全なら数字まで分かります。",
  },
  oracle_lens: {
    id: "oracle_lens",
    name: "オラクルレンズ",
    target: true,
    targetMode: "sealed",
    description: "未開封マスを1つ完全調査。中身を正確に見抜きます。",
  },
  grappling_hook: {
    id: "grappling_hook",
    name: "グラップリングフック",
    target: true,
    targetMode: "sealed",
    description: "前線外でも関係なく、任意の未開封マスを直接開きます。",
  },
  flare: {
    id: "flare",
    name: "フレア",
    target: true,
    targetMode: "revealed_safe",
    description: "開放済みマス1つを中心に、隣接する未開封マスをまとめて調査します。",
  },
  compass: {
    id: "compass",
    name: "コンパス",
    target: false,
    description: "鍵の方角を示します。鍵取得後は階段の方角を示します。",
  },
  ward: {
    id: "ward",
    name: "ウォード",
    target: false,
    description: "次に受けるダメージを1回防ぎます。",
  },
  warding_powder: {
    id: "warding_powder",
    name: "守りの粉",
    target: false,
    description: "ウォードを2枚得ます。",
  },
  ration: {
    id: "ration",
    name: "食料",
    target: false,
    description: "HP を1回復します。",
  },
  map_shard: {
    id: "map_shard",
    name: "地図片",
    target: false,
    description: "現在の階層のどこかにある安全マスを1つ自動で開きます。",
  },
  route_pin: {
    id: "route_pin",
    name: "ルートピン",
    target: false,
    description: "現在の目的地を盤面上にマーキングします。",
  },
  hellfire_tonic: {
    id: "hellfire_tonic",
    name: "地獄火トニック",
    target: false,
    description: "強力な代償アイテム。最大HP+1、HPを2回復、ウォード+2。代わりに灼ける血を得ます。",
  },
  debt_contract: {
    id: "debt_contract",
    name: "借金契約",
    target: false,
    description: "強力な代償アイテム。ゴールド+60 と高級ツールを獲得。代わりに重い借金を得ます。",
  },
  blind_seer_map: {
    id: "blind_seer_map",
    name: "盲目の予言者の地図",
    target: false,
    description: "強力な代償アイテム。オラクルレンズ x2、ルートピン、無料開示を獲得。代わりに道迷いを得ます。",
  },
};

const DEBUFF_DEFS = {
  burning_blood: {
    id: "burning_blood",
    name: "灼ける血",
    description: "各階層の開始時に HP を1失います。ただし 1 未満にはなりません。",
  },
  heavy_debt: {
    id: "heavy_debt",
    name: "重い借金",
    description: "ショップ価格が 35% 上昇します。",
  },
  lost_bearings: {
    id: "lost_bearings",
    name: "道迷い",
    description: "コンパスと常時方角ヒントが機能しなくなります。",
  },
};

const GIMMICK_DEFS = {
  supply_cache: {
    id: "supply_cache",
    name: "補給箱",
    description: "ゴールドとランダムな補助アイテムを獲得します。",
  },
  rail_switch: {
    id: "rail_switch",
    name: "線路切替",
    description: "クリック可能な安全マスを最大2つ開きます。",
  },
  survey_beacon: {
    id: "survey_beacon",
    name: "探査ビーコン",
    description: "周囲の未開封マスを正確に調査します。",
  },
  pressure_valve: {
    id: "pressure_valve",
    name: "圧力弁",
    description: "安全マスを1つ開き、コンパスを得ます。",
  },
  forge_shrine: {
    id: "forge_shrine",
    name: "鍛冶の祭壇",
    description: "ウォードを得て、負傷していれば回復します。",
  },
  ember_altar: {
    id: "ember_altar",
    name: "残り火の祭壇",
    description: "目的地をマーキングし、高性能な探知アイテムを得ます。",
  },
};

const STAGE_GIMMICK_POOLS = {
  ashen_warrens: ["supply_cache", "rail_switch"],
  flooded_archive: ["survey_beacon", "pressure_valve"],
  ember_throne: ["forge_shrine", "ember_altar"],
};

const RELIC_DEFS = {
  survey_goggles: {
    id: "survey_goggles",
    name: "測量ゴーグル",
    description: "各階層の開始時にスキャンを得ます。",
  },
  blast_padding: {
    id: "blast_padding",
    name: "防爆パッド",
    description: "各階層で最初のダメージを防ぎます。",
  },
  ward_sigil: {
    id: "ward_sigil",
    name: "守護の印章",
    description: "各階層の開始時にウォードを得ます。",
  },
  cartographer_thread: {
    id: "cartographer_thread",
    name: "地図師の糸",
    description: "鍵を見つける前、現在地から鍵の方角を常に感じ取れます。",
  },
  stairfinder: {
    id: "stairfinder",
    name: "階段探知器",
    description: "鍵取得後、現在地から階段の方角を常に感じ取れます。",
  },
  treasure_lens: {
    id: "treasure_lens",
    name: "財宝レンズ",
    description: "宝箱の報酬テーブルが上位に変わります。",
  },
  deep_pockets: {
    id: "deep_pockets",
    name: "深いポケット",
    description: "ショップ価格が 20% 下がります。",
  },
  field_flask: {
    id: "field_flask",
    name: "野営フラスコ",
    description: "ノーダメージで階層を抜けると HP を1回復します。",
  },
  zero_theorem: {
    id: "zero_theorem",
    name: "零理論",
    description: "各階層で最初の 0 連鎖時にゴールドを 10 得ます。",
  },
  lucky_pennant: {
    id: "lucky_pennant",
    name: "幸運の旗印",
    description: "すべて正しい旗を立てた状態で抜けるとゴールドを 15 得ます。",
  },
  emergency_kit: {
    id: "emergency_kit",
    name: "緊急医療箱",
    description: "1ランにつき1回、致死ダメージを受けても HP1 で耐えます。",
  },
  echo_chalk: {
    id: "echo_chalk",
    name: "反響チョーク",
    description: "各階層で1回、コード成功時に追加で安全マスを1つ開きます。",
  },
  miner_candle: {
    id: "miner_candle",
    name: "鉱夫のろうそく",
    description: "各階層の開始時にフレアを得ます。",
  },
  grapnel_rack: {
    id: "grapnel_rack",
    name: "鉤縄ラック",
    description: "各ボス階層の開始時にグラップリングフックを得ます。",
  },
  quartermaster_ledger: {
    id: "quartermaster_ledger",
    name: "補給係の帳簿",
    description: "各階層の開始時にゴールドを 8 得ます。",
  },
  locksmith_gloves: {
    id: "locksmith_gloves",
    name: "鍵師の手袋",
    description: "鍵を見つけたとき HP を1回復します。",
  },
  sealbreaker_gauntlet: {
    id: "sealbreaker_gauntlet",
    name: "封印砕きの籠手",
    description: "ボス階層で最初の封印を開くとウォードを得ます。",
  },
  ember_compass: {
    id: "ember_compass",
    name: "残り火のコンパス",
    description: "コンパス使用時、追加でスキャンも得ます。",
  },
  salvage_core: {
    id: "salvage_core",
    name: "回収コア",
    description: "地雷ダメージを受けたとき、プローブを得ます。",
  },
  treasure_satchel: {
    id: "treasure_satchel",
    name: "財宝サッチェル",
    description: "宝箱報酬に追加でランダムな補給が1つ入ります。",
  },
  demolition_ledger: {
    id: "demolition_ledger",
    name: "爆破解体帳",
    description: "コード成功ごとにゴールドを 3 得ます。",
  },
  surveyors_twine: {
    id: "surveyors_twine",
    name: "測量士の紐",
    description: "各階層の開始時にルートピンを得ます。",
  },
  patient_pickaxe: {
    id: "patient_pickaxe",
    name: "忍耐のつるはし",
    description: "各階層で最初に手動で開いた数字マスでゴールドを 4 得ます。",
  },
};

const BOSS_POWER_DEFS = {
  foresight_matrix: {
    id: "foresight_matrix",
    name: "先見の行列",
    description: "各階層の開始時にオラクルレンズとスキャンを得ます。",
  },
  bulwark_engine: {
    id: "bulwark_engine",
    name: "城壁機関",
    description: "各階層の開始時にウォード 1 と床シールド 1 を得ます。",
  },
  ember_heart: {
    id: "ember_heart",
    name: "残り火の心臓",
    description: "鍵発見時、または最後の封印解除時に HP を1回復しゴールドを 8 得ます。",
  },
  chain_reactor: {
    id: "chain_reactor",
    name: "連鎖炉",
    description: "コード成功時にウォード 1 を得て、さらに安全な前線マスを1つ開きます。",
  },
  salvage_drive: {
    id: "salvage_drive",
    name: "回収駆動",
    description: "ダメージを受けた後、前線からランダムな安全マスを1つ開きます。",
  },
  cartographer_core: {
    id: "cartographer_core",
    name: "地図師コア",
    description: "各階層の開始時にコンパスを得て、現在の目的地をマーキングします。",
  },
  merchant_beacon: {
    id: "merchant_beacon",
    name: "商人のビーコン",
    description: "ショップの商品が 2 つ増え、レリック箱が 20 ゴールド安くなります。",
  },
  treasure_alchemy: {
    id: "treasure_alchemy",
    name: "財宝錬成",
    description: "宝箱報酬にゴールド +12 と追加のランダム補給が入ります。",
  },
};

const META_UPGRADES = {
  sturdy_boots: {
    id: "sturdy_boots",
    name: "頑丈なブーツ",
    cost: 8,
    description: "各ラン開始時の最大HPが 1 増えます。",
  },
  field_pouch: {
    id: "field_pouch",
    name: "探索ポーチ",
    cost: 6,
    description: "各ラン開始時にプローブとウォードを得ます。",
  },
  lucky_coin: {
    id: "lucky_coin",
    name: "幸運の硬貨",
    cost: 10,
    description: "各ラン開始時にゴールドを 20 所持します。",
  },
};

const SHOP_CATALOG = [
  { type: "heal", label: "応急手当キット", description: "HP を1回復します。", price: 25 },
  { type: "item", itemId: "scan", price: 18 },
  { type: "item", itemId: "probe", price: 18 },
  { type: "item", itemId: "oracle_lens", price: 28 },
  { type: "item", itemId: "grappling_hook", price: 30 },
  { type: "item", itemId: "flare", price: 24 },
  { type: "item", itemId: "compass", price: 20 },
  { type: "item", itemId: "ward", price: 20 },
  { type: "item", itemId: "warding_powder", price: 26 },
  { type: "item", itemId: "ration", price: 22 },
  { type: "item", itemId: "map_shard", price: 24 },
  { type: "item", itemId: "route_pin", price: 24 },
  { type: "item", itemId: "hellfire_tonic", price: 34 },
  { type: "item", itemId: "debt_contract", price: 32 },
  { type: "item", itemId: "blind_seer_map", price: 32 },
  {
    type: "random_relic",
    label: "レリック箱",
    description: "未取得のレリックをランダムで1つ獲得します。",
    price: 60,
  },
];

const DEFAULT_META = {
  scrap: 0,
  profileName: "",
  leaderboard: [],
  upgrades: {
    sturdy_boots: false,
    field_pouch: false,
    lucky_coin: false,
  },
  stats: {
    runs: 0,
    wins: 0,
    bestFloor: 0,
    bestScore: 0,
  },
};

const app = document.querySelector("#app");
const state = {
  screen: "title",
  meta: loadMeta(),
  savedRun: loadSavedRun(),
  run: null,
  modal: null,
  selectedItemId: null,
  lastResult: null,
};

init();

function init() {
  app.addEventListener("click", handleClick);
  app.addEventListener("contextmenu", handleContextMenu);
  render();
}

function handleClick(event) {
  const target = event.target.closest("[data-action]");
  if (!target) {
    return;
  }

  const action = target.dataset.action;
  switch (action) {
    case "start-run":
      startRun(target.dataset.classId);
      break;
    case "resume-run":
      resumeSavedRun();
      break;
    case "discard-run-save":
      clearRunSave();
      render();
      break;
    case "buy-upgrade":
      buyUpgrade(target.dataset.upgradeId);
      break;
    case "tile":
      handleTilePrimary(Number(target.dataset.tileIndex));
      break;
    case "use-item":
      handleItemButton(target.dataset.itemId);
      break;
    case "select-relic":
      chooseRelic(target.dataset.relicId);
      break;
    case "select-boss-power":
      chooseBossPower(target.dataset.powerId);
      break;
    case "leave-shop":
      leaveShop();
      break;
    case "buy-offer":
      buyShopOffer(Number(target.dataset.offerIndex));
      break;
    case "descend-stairs":
      descendStairs();
      break;
    case "stay-on-floor":
      closeStairsPrompt();
      break;
    case "back-to-title":
      state.screen = "title";
      state.run = null;
      state.modal = null;
      state.selectedItemId = null;
      render();
      break;
    case "restart-run":
      if (state.lastResult?.classId) {
        startRun(state.lastResult.classId);
      }
      break;
    case "register-ranking":
      registerLastResult();
      break;
    default:
      break;
  }
}

function handleContextMenu(event) {
  const target = event.target.closest("[data-tile-index]");
  if (!target || state.screen !== "run" || state.modal) {
    return;
  }

  event.preventDefault();
  handleTileSecondary(Number(target.dataset.tileIndex));
}

function startRun(classId) {
  const classDef = CLASS_DEFS[classId];
  if (!classDef) {
    return;
  }

  const run = {
    classId,
    relics: [],
    bossPowers: [],
    debuffs: [],
    route: RUN_ROUTE.map((entry) => ({ ...entry })),
    stats: {
      floorsCleared: 0,
      damageTaken: 0,
      safeTilesRevealed: 0,
      chestCount: 0,
      seed: Math.floor(Math.random() * 999999),
    },
    player: {
      hp: classDef.hp,
      maxHp: classDef.hp,
      gold: 0,
      wardCharges: 0,
      items: createEmptyInventory(),
    },
    currentFloorIndex: 0,
    floor: null,
    log: [],
    usedEmergencyKit: false,
  };

  addItems(run.player.items, classDef.startingItems);
  applyMetaUpgradesToRun(run);
  pushLog(run, `${classDef.name}で新たな探索を開始。`);
  pushLog(run, `シード ${run.stats.seed}。欲張る前に盤面を読みましょう。`);
  state.run = run;
  state.screen = "run";
  state.modal = null;
  state.selectedItemId = null;
  state.lastResult = null;
  clearRunSave();
  state.meta.stats.runs += 1;
  saveMeta();
  advanceToFloor(0);
}

function resumeSavedRun() {
  const snapshot = state.savedRun;
  if (!snapshot?.run) {
    return;
  }

  const hydratedRun = hydrateSavedRun(snapshot.run);
  if (!hydratedRun) {
    clearRunSave();
    render();
    return;
  }

  state.run = hydratedRun;
  state.modal = snapshot.modal ?? null;
  state.selectedItemId = snapshot.selectedItemId ?? null;
  state.screen = "run";
  state.lastResult = null;
  render();
}

function applyMetaUpgradesToRun(run) {
  if (state.meta.upgrades.sturdy_boots) {
    run.player.maxHp += 1;
    run.player.hp += 1;
  }
  if (state.meta.upgrades.field_pouch) {
    addItems(run.player.items, { probe: 1, ward: 1 });
  }
  if (state.meta.upgrades.lucky_coin) {
    run.player.gold += 20;
  }
}

function advanceToFloor(routeIndex) {
  const run = state.run;
  if (!run) {
    return;
  }

  const routeEntry = run.route[routeIndex];
  if (!routeEntry) {
    endRun(true);
    return;
  }

  run.currentFloorIndex = routeIndex;
  run.floor = generateFloor(routeEntry);
  run.floor.shieldCharges = 0;
  run.floor.damageTaken = 0;
  run.floor.zeroRewardClaimed = false;
  run.floor.echoUsed = false;
  run.floor.manualNumberRewardClaimed = false;
  run.floor.sealWardGranted = false;
  run.floor.cleared = false;
  state.selectedItemId = null;
  applyFloorStartEffects(run);
  revealTiles(run, [run.floor.entranceIndex], { allowFlood: false, maxDamage: 0, source: "entry" });
  if (routeEntry.stageStart) {
    pushLog(run, `ステージ ${routeEntry.stageNumber}: ${routeEntry.stageName}。${routeEntry.stageSubtitle}`);
  }
  if (routeEntry.bossAreaStart) {
    pushLog(run, `ボスエリア「${routeEntry.bossAreaName}」に到達。ここから ${routeEntry.bossLayers} 層潜ります。`);
  }
  pushLog(
    run,
    run.floor.type === "boss"
      ? `${routeEntry.label}。封印を解き、さらに深く潜ってください。`
      : `${routeEntry.label}。鍵を見つけてから階段へ向かいましょう。`
  );
  if (run.floor.gimmickKinds.length > 0) {
    pushLog(run, `この階層のギミック: ${run.floor.gimmickKinds.map((kind) => GIMMICK_DEFS[kind].name).join("、")}。`);
  }
  render();
}

function applyFloorStartEffects(run) {
  const floor = run.floor;
  const classId = run.classId;

  if (classId === "scout" && floor.route.stageStart && run.currentFloorIndex > 0) {
    addItem(run.player.items, "scan", 1);
  }
  if (classId === "engineer") {
    floor.shieldCharges += 1;
  }

  if (hasRelic(run, "survey_goggles")) {
    addItem(run.player.items, "scan", 1);
  }
  if (hasRelic(run, "blast_padding")) {
    floor.shieldCharges += 1;
  }
  if (hasRelic(run, "ward_sigil")) {
    addItem(run.player.items, "ward", 1);
  }
  if (hasRelic(run, "miner_candle")) {
    addItem(run.player.items, "flare", 1);
  }
  if (hasRelic(run, "surveyors_twine")) {
    addItem(run.player.items, "route_pin", 1);
  }
  if (hasRelic(run, "grapnel_rack") && floor.type === "boss") {
    addItem(run.player.items, "grappling_hook", 1);
  }
  if (hasRelic(run, "quartermaster_ledger")) {
    run.player.gold += 8;
  }
  if (hasBossPower(run, "foresight_matrix")) {
    addItems(run.player.items, { oracle_lens: 1, scan: 1 });
  }
  if (hasBossPower(run, "bulwark_engine")) {
    run.player.wardCharges += 1;
    floor.shieldCharges += 1;
  }
  if (hasBossPower(run, "cartographer_core")) {
    addItem(run.player.items, "compass", 1);
    markObjectiveTile(run, "cartographer_core");
  }
  if (hasDebuff(run, "burning_blood") && run.player.hp > 1) {
    run.player.hp -= 1;
    pushLog(run, "灼ける血が燃え上がる。HP を1失った。");
  }
}

function generateFloor(config) {
  const { width, height, mineCount, type } = config;
  const total = width * height;
  const tiles = Array.from({ length: total }, (_, index) => ({
    index,
    kind: "empty",
    adjacentMines: 0,
    revealed: false,
    flagged: false,
    exploded: false,
    hint: null,
    goldGranted: false,
  }));

  const entranceIndex = chooseEntranceIndex(width, height);
  const safeZone = new Set(chooseStartingPocket(entranceIndex, width, height));

  let stairsIndex;
  let keyIndex = null;
  let chestIndex = null;
  let sealIndexes = [];

  if (type === "boss") {
    const centerX = Math.floor(width / 2);
    const centerY = Math.floor(height / 2);
    stairsIndex = coordsToIndex(centerX, centerY, width);
    safeZone.add(stairsIndex);
    sealIndexes = chooseBossSeals(width, height, safeZone, entranceIndex, stairsIndex, config.sealCount ?? 3);
    for (const sealIndex of sealIndexes) {
      safeZone.add(sealIndex);
    }
  } else {
    keyIndex = chooseFarSafeIndex(width, height, safeZone, entranceIndex, []);
    safeZone.add(keyIndex);
    stairsIndex = chooseFarSafeIndex(width, height, safeZone, entranceIndex, [keyIndex]);
    safeZone.add(stairsIndex);
  }

  const mineIndexes = chooseMineIndexes(total, mineCount, safeZone);
  for (const mineIndex of mineIndexes) {
    tiles[mineIndex].kind = "mine";
  }

  for (let index = 0; index < total; index += 1) {
    tiles[index].adjacentMines = getNeighbors(index, width, height).reduce((count, neighbor) => {
      return count + (tiles[neighbor].kind === "mine" ? 1 : 0);
    }, 0);
  }

  if (type === "normal") {
    chestIndex = chooseChestIndex(width, height, tiles, entranceIndex, keyIndex, stairsIndex);
    tiles[keyIndex].kind = "key";
    tiles[stairsIndex].kind = "stairs";
    tiles[chestIndex].kind = "chest";
  } else {
    tiles[stairsIndex].kind = "stairs";
    for (const sealIndex of sealIndexes) {
      tiles[sealIndex].kind = "seal";
    }
  }

  const gimmickKinds = placeFloorGimmicks(config, tiles, entranceIndex, width, height);

  return {
    route: config,
    floorNumber: config.globalFloor,
    type,
    width,
    height,
    mineCount,
    tiles,
    entranceIndex,
    keyIndex,
    chestIndex,
    stairsIndex,
    sealIndexes,
    stairsVisible: type === "boss",
    stairsUnlocked: false,
    keyFound: false,
    chestOpened: false,
    sealsOpened: 0,
    damageTaken: 0,
    cleared: false,
    zeroRewardClaimed: false,
    echoUsed: false,
    manualNumberRewardClaimed: false,
    sealWardGranted: false,
    gimmickKinds,
  };
}

function chooseEntranceIndex(width, height) {
  const side = randomFrom(["top", "right", "bottom", "left"]);
  if (side === "top") {
    return coordsToIndex(randomEdgeOffset(width), 0, width);
  }
  if (side === "bottom") {
    return coordsToIndex(randomEdgeOffset(width), height - 1, width);
  }
  if (side === "left") {
    return coordsToIndex(0, randomEdgeOffset(height), width);
  }
  return coordsToIndex(width - 1, randomEdgeOffset(height), width);
}

function randomEdgeOffset(length) {
  if (length <= 2) {
    return randomInt(0, length - 1);
  }
  return randomInt(1, length - 2);
}

function chooseStartingPocket(entranceIndex, width, height) {
  const entrance = indexToCoords(entranceIndex, width);
  const scoredNeighbors = getNeighbors(entranceIndex, width, height)
    .map((neighbor) => {
      const coords = indexToCoords(neighbor, width);
      let score = 0;

      if (entrance.x === 0 && coords.x > entrance.x) {
        score += 2;
      }
      if (entrance.x === width - 1 && coords.x < entrance.x) {
        score += 2;
      }
      if (entrance.y === 0 && coords.y > entrance.y) {
        score += 2;
      }
      if (entrance.y === height - 1 && coords.y < entrance.y) {
        score += 2;
      }

      score += manhattan(neighbor, entranceIndex, width) * 0.1;
      return { index: neighbor, score };
    })
    .sort((left, right) => right.score - left.score);

  const safeNeighborCount = Math.min(2, scoredNeighbors.length);
  return [entranceIndex, ...scoredNeighbors.slice(0, safeNeighborCount).map((entry) => entry.index)];
}

function chooseMineIndexes(total, mineCount, blocked) {
  const candidates = [];
  for (let index = 0; index < total; index += 1) {
    if (!blocked.has(index)) {
      candidates.push(index);
    }
  }
  shuffleInPlace(candidates);
  return candidates.slice(0, mineCount);
}

function chooseFarSafeIndex(width, height, blocked, entranceIndex, extraAvoid) {
  const candidates = [];
  for (let index = 0; index < width * height; index += 1) {
    if (blocked.has(index) || extraAvoid.includes(index)) {
      continue;
    }
    const entranceDistance = manhattan(index, entranceIndex, width);
    const extraDistance = extraAvoid.reduce((sum, avoid) => sum + manhattan(index, avoid, width), 0);
    candidates.push({
      index,
      score: entranceDistance * 2 + extraDistance + Math.random() * 0.5,
    });
  }
  candidates.sort((left, right) => right.score - left.score);
  const pool = candidates.slice(0, Math.max(3, Math.ceil(candidates.length * 0.2)));
  return randomFrom(pool).index;
}

function chooseChestIndex(width, height, tiles, entranceIndex, keyIndex, stairsIndex) {
  const candidates = [];
  for (let index = 0; index < width * height; index += 1) {
    const tile = tiles[index];
    if (tile.kind !== "empty") {
      continue;
    }
    const dangerBias = tile.adjacentMines > 0 ? 6 : 0;
    const distanceScore = manhattan(index, entranceIndex, width);
    const spreadPenalty = Math.min(manhattan(index, keyIndex, width), manhattan(index, stairsIndex, width));
    candidates.push({
      index,
      score: dangerBias + distanceScore + spreadPenalty * 0.45 + Math.random(),
    });
  }
  candidates.sort((left, right) => right.score - left.score);
  return candidates[0].index;
}

function chooseBossSeals(width, height, blocked, entranceIndex, stairsIndex, sealCount) {
  const candidates = [];
  for (let index = 0; index < width * height; index += 1) {
    if (blocked.has(index) || index === stairsIndex) {
      continue;
    }
    const score = manhattan(index, entranceIndex, width) + manhattan(index, stairsIndex, width) * 0.6 + Math.random();
    candidates.push({ index, score });
  }
  candidates.sort((left, right) => right.score - left.score);
  return candidates
    .slice(0, Math.max(6, sealCount * 4))
    .sort(() => Math.random() - 0.5)
    .slice(0, sealCount)
    .map((entry) => entry.index);
}

function placeFloorGimmicks(config, tiles, entranceIndex, width, height) {
  const pool = STAGE_GIMMICK_POOLS[config.stageId] ?? [];
  if (pool.length === 0) {
    return [];
  }

  const gimmickCount = config.type === "boss" ? Math.min(2, pool.length) : Math.min(pool.length, config.floorInStage >= 2 ? 2 : 1);
  const selectedKinds = shuffle(pool).slice(0, gimmickCount);
  const placedKinds = [];

  for (const kind of selectedKinds) {
    const gimmickIndex = chooseGimmickIndex(kind, tiles, entranceIndex, width);
    if (gimmickIndex === null) {
      continue;
    }
    tiles[gimmickIndex].kind = kind;
    placedKinds.push(kind);
  }

  return placedKinds;
}

function chooseGimmickIndex(kind, tiles, entranceIndex, width) {
  const candidates = [];

  for (const tile of tiles) {
    if (tile.kind !== "empty" || tile.index === entranceIndex) {
      continue;
    }

    const distance = manhattan(tile.index, entranceIndex, width);
    let score = distance + Math.random();

    if (kind === "supply_cache" || kind === "survey_beacon") {
      score += tile.adjacentMines > 0 ? 3 : 0;
    }
    if (kind === "rail_switch" || kind === "pressure_valve") {
      score += tile.adjacentMines === 0 ? 2 : 0;
    }
    if (kind === "forge_shrine" || kind === "ember_altar") {
      score += distance * 0.25;
    }

    candidates.push({ index: tile.index, score });
  }

  if (candidates.length === 0) {
    return null;
  }

  candidates.sort((left, right) => right.score - left.score);
  const pool = candidates.slice(0, Math.max(4, Math.ceil(candidates.length * 0.18)));
  return randomFrom(pool).index;
}

function handleTilePrimary(index) {
  if (state.screen !== "run" || state.modal) {
    return;
  }
  const run = state.run;
  const floor = run.floor;
  const tile = floor.tiles[index];

  if (state.selectedItemId) {
    useTargetedItem(state.selectedItemId, index);
    return;
  }

  if (tile.revealed) {
    if (tile.kind === "stairs") {
      handleStairsInteraction(run);
      return;
    }
    if (tile.kind !== "mine" && tile.adjacentMines > 0) {
      useChord(index);
    }
    return;
  }

  if (!canOpenTile(floor, index)) {
    pushLog(run, "You can only push deeper from your revealed frontier.");
    render();
    return;
  }

  revealTiles(run, [index], { allowFlood: true, maxDamage: 1, source: "click" });
  render();
}

function handleTileSecondary(index) {
  const run = state.run;
  const floor = run.floor;
  const tile = floor.tiles[index];
  if (tile.revealed) {
    return;
  }
  tile.flagged = !tile.flagged;
  render();
}

function canOpenTile(floor, index) {
  if (floor.tiles[index].revealed) {
    return false;
  }
  return getNeighbors(index, floor.width, floor.height).some((neighbor) => floor.tiles[neighbor].revealed);
}

function revealTiles(run, indexes, options = {}) {
  const floor = run.floor;
  const queue = [...indexes];
  const seen = new Set();
  let remainingDamage = options.maxDamage ?? 1;

  while (queue.length > 0) {
    if (floor.cleared || state.screen !== "run") {
      break;
    }

    const index = queue.shift();
    if (seen.has(index)) {
      continue;
    }
    seen.add(index);

    const tile = floor.tiles[index];
    if (!tile || tile.revealed || tile.flagged) {
      continue;
    }

    if (tile.kind === "mine") {
      tile.revealed = true;
      tile.exploded = true;
      tile.hint = null;
      if (remainingDamage > 0) {
        remainingDamage -= 1;
        applyDamage(run, 1, "A mine detonated.");
      }
      continue;
    }

    const revealedNow = revealSafeTile(run, index, options.source);
    if (!revealedNow) {
      continue;
    }

    if (options.allowFlood && tile.adjacentMines === 0) {
      if (!floor.zeroRewardClaimed && options.source !== "scan" && options.source !== "probe") {
        floor.zeroRewardClaimed = true;
        if (hasRelic(run, "zero_theorem")) {
          run.player.gold += 10;
          pushLog(run, "零理論が脈打つ。ゴールド +10。");
        }
      }
      for (const neighbor of getNeighbors(index, floor.width, floor.height)) {
        const neighborTile = floor.tiles[neighbor];
        if (neighborTile && !neighborTile.revealed && !neighborTile.flagged) {
          queue.push(neighbor);
        }
      }
    }
  }
}

function revealSafeTile(run, index, source) {
  const floor = run.floor;
  const tile = floor.tiles[index];
  if (!tile || tile.revealed || tile.kind === "mine") {
    return false;
  }

  tile.revealed = true;
  tile.hint = null;

  if (!tile.goldGranted) {
    tile.goldGranted = true;
    run.player.gold += 1;
    run.stats.safeTilesRevealed += 1;
  }

  if (
    source === "click" &&
    tile.adjacentMines > 0 &&
    !floor.manualNumberRewardClaimed &&
    hasRelic(run, "patient_pickaxe")
  ) {
    floor.manualNumberRewardClaimed = true;
    run.player.gold += 4;
    pushLog(run, "忍耐のつるはしが慎重な一手に応える。ゴールド +4。");
  }

  if (tile.kind === "key" && !floor.keyFound) {
    floor.keyFound = true;
    floor.stairsUnlocked = true;
    floor.stairsVisible = true;
    pushLog(run, "鍵を回収した。階段が起動する。");
    if (hasRelic(run, "locksmith_gloves") && run.player.hp < run.player.maxHp) {
      run.player.hp += 1;
      pushLog(run, "鍵師の手袋が手元を安定させた。HP を1回復。");
    }
    if (hasBossPower(run, "ember_heart")) {
      run.player.gold += 8;
      if (run.player.hp < run.player.maxHp) {
        run.player.hp += 1;
      }
      pushLog(run, "残り火の心臓が脈打つ。ゴールド +8、HP +1。");
    }
    if (floor.tiles[floor.stairsIndex].revealed) {
      openStairsPrompt(run, true);
    }
  }

  if (tile.kind === "chest" && !floor.chestOpened) {
    floor.chestOpened = true;
    run.stats.chestCount += 1;
    grantChestReward(run);
    if (hasRelic(run, "treasure_satchel")) {
      const bonusItem = randomFrom(["scan", "probe", "flare", "ward", "route_pin", "map_shard"]);
      addItem(run.player.items, bonusItem, 1);
      pushLog(run, `財宝サッチェルから ${ITEM_DEFS[bonusItem].name} が追加で手に入った。`);
    }
    if (hasBossPower(run, "treasure_alchemy")) {
      const bonusItem = randomFrom(["oracle_lens", "grappling_hook", "flare", "warding_powder", "route_pin"]);
      run.player.gold += 12;
      addItem(run.player.items, bonusItem, 1);
      pushLog(run, `財宝錬成が発動。ゴールド +12、${ITEM_DEFS[bonusItem].name} を獲得。`);
    }
  }

  if (isGimmickKind(tile.kind)) {
    triggerGimmick(run, tile.kind, tile.index);
  }

  if (tile.kind === "seal") {
    floor.sealsOpened += 1;
    pushLog(run, `封印を解除。${floor.sealsOpened}/${floor.sealIndexes.length} 開放済み。`);
    if (hasRelic(run, "sealbreaker_gauntlet") && !floor.sealWardGranted) {
      floor.sealWardGranted = true;
      run.player.wardCharges += 1;
      pushLog(run, "封印砕きの籠手が脈動する。ウォード +1。");
    }
    if (floor.sealsOpened >= floor.sealIndexes.length) {
      floor.stairsUnlocked = true;
      floor.stairsVisible = true;
      pushLog(run, "中央階段の封鎖が解けた。");
      if (hasBossPower(run, "ember_heart")) {
        run.player.gold += 8;
        if (run.player.hp < run.player.maxHp) {
          run.player.hp += 1;
        }
        pushLog(run, "残り火の心臓が燃え上がる。ゴールド +8、HP +1。");
      }
      if (floor.tiles[floor.stairsIndex].revealed) {
        openStairsPrompt(run, true);
      }
    }
  }

  if (tile.kind === "stairs") {
    floor.stairsVisible = true;
    if (floor.type === "normal" && floor.keyFound) {
      openStairsPrompt(run, true);
    } else if (floor.type === "boss" && floor.stairsUnlocked) {
      openStairsPrompt(run, true);
    } else if (floor.type === "boss") {
      pushLog(run, "中央階段はまだ封じられている。");
    } else if (!floor.keyFound) {
      pushLog(run, "階段を先に見つけたが、まだロックされている。");
    }
  }

  if (source === "map_shard") {
    pushLog(run, "地図片が砕け、安全地帯を示した。");
  }

  return true;
}

function triggerGimmick(run, kind, index) {
  const floor = run.floor;

  if (kind === "supply_cache") {
    const bonusItem = randomFrom(["scan", "probe", "flare", "route_pin", "ward"]);
    run.player.gold += 10;
    addItem(run.player.items, bonusItem, 1);
    pushLog(run, `補給箱を発見。ゴールド +10、${ITEM_DEFS[bonusItem].name} を獲得。`);
    return;
  }

  if (kind === "rail_switch") {
    const targets = [];
    const frontier = findRandomSafeFrontierTile(floor);
    if (frontier !== null) {
      targets.push(frontier);
    }
    const second = findRandomSafeFrontierTile(floor);
    if (second !== null && !targets.includes(second)) {
      targets.push(second);
    }
    if (targets.length > 0) {
      revealTiles(run, targets, { allowFlood: true, maxDamage: 0, source: "rail_switch" });
    }
    pushLog(run, `線路切替が作動。安全な進路を ${targets.length} か所開いた。`);
    return;
  }

  if (kind === "survey_beacon") {
    const targets = getNeighbors(index, floor.width, floor.height).filter((neighbor) => {
      const neighborTile = floor.tiles[neighbor];
      return neighborTile && !neighborTile.revealed && !neighborTile.flagged;
    });
    for (const targetIndex of targets) {
      floor.tiles[targetIndex].hint = buildTileHint(run, floor.tiles[targetIndex], "oracle_lens");
    }
    pushLog(run, `探査ビーコンが周囲 ${targets.length} マスを走査した。`);
    return;
  }

  if (kind === "pressure_valve") {
    addItem(run.player.items, "compass", 1);
    const safeTile = findRandomSafeTile(floor);
    if (safeTile !== null) {
      revealTiles(run, [safeTile], { allowFlood: true, maxDamage: 0, source: "pressure_valve" });
    }
    pushLog(run, "圧力弁が作動。コンパスを得て、安全マスを1つ開いた。");
    return;
  }

  if (kind === "forge_shrine") {
    run.player.wardCharges += 1;
    if (run.player.hp < run.player.maxHp) {
      run.player.hp += 1;
      pushLog(run, "鍛冶の祭壇が装備を鍛えた。ウォード +1、HP +1。");
    } else {
      run.player.gold += 8;
      pushLog(run, "鍛冶の祭壇が装備を鍛えた。ウォード +1、ゴールド +8。");
    }
    return;
  }

  if (kind === "ember_altar") {
    addItems(run.player.items, { oracle_lens: 1, scan: 1 });
    markObjectiveTile(run, "ember_altar");
    pushLog(run, "残り火の祭壇が進路を刻む。オラクルレンズ、スキャンを得て、目的地が表示された。");
  }
}

function useChord(index) {
  const run = state.run;
  const floor = run.floor;
  const tile = floor.tiles[index];
  if (!tile || !tile.revealed || tile.kind === "mine" || tile.adjacentMines === 0) {
    return;
  }

  const neighbors = getNeighbors(index, floor.width, floor.height);
  const flagCount = neighbors.reduce((count, neighbor) => count + (floor.tiles[neighbor].flagged ? 1 : 0), 0);
  if (flagCount !== tile.adjacentMines) {
    pushLog(run, "コード失敗。旗の数が合っていない。");
    render();
    return;
  }

  revealTiles(run, neighbors, { allowFlood: true, maxDamage: 1, source: "chord" });
  if (hasRelic(run, "demolition_ledger") && !floor.cleared) {
    run.player.gold += 3;
    pushLog(run, "爆破解体帳が反応。ゴールド +3。");
  }
  if (hasBossPower(run, "chain_reactor") && !floor.cleared) {
    run.player.wardCharges += 1;
    pushLog(run, "連鎖炉が唸る。ウォード +1。");
    const extraIndex = findRandomSafeFrontierTile(floor);
    if (extraIndex !== null) {
      revealTiles(run, [extraIndex], { allowFlood: true, maxDamage: 0, source: "chain_reactor" });
      pushLog(run, "連鎖炉が追加の安全ルートを開いた。");
    }
  }
  if (hasRelic(run, "echo_chalk") && !floor.echoUsed && !floor.cleared) {
    const bonusIndex = findRandomSafeFrontierTile(floor);
    if (bonusIndex !== null) {
      floor.echoUsed = true;
      revealTiles(run, [bonusIndex], { allowFlood: true, maxDamage: 0, source: "echo" });
      pushLog(run, "反響チョークが追加の安全ルートを示した。");
    }
  }
  render();
}

function findRandomSafeFrontierTile(floor) {
  const candidates = [];
  for (const tile of floor.tiles) {
    if (tile.revealed || tile.flagged || tile.kind === "mine") {
      continue;
    }
    if (canOpenTile(floor, tile.index)) {
      candidates.push(tile.index);
    }
  }
  return candidates.length > 0 ? randomFrom(candidates) : null;
}

function findRandomSafeTile(floor) {
  const candidates = floor.tiles
    .filter((tile) => !tile.revealed && !tile.flagged && tile.kind !== "mine")
    .map((tile) => tile.index);
  return candidates.length > 0 ? randomFrom(candidates) : null;
}

function applyDamage(run, amount, message) {
  let remaining = amount;
  const floor = run.floor;

  if (floor.shieldCharges > 0 && remaining > 0) {
    floor.shieldCharges -= 1;
    remaining -= 1;
    pushLog(run, "床シールドが爆発を吸収した。");
  }

  if (run.player.wardCharges > 0 && remaining > 0) {
    run.player.wardCharges -= 1;
    remaining -= 1;
    pushLog(run, "ウォードが砕けてあなたを守った。");
  }

  if (remaining <= 0) {
    return;
  }

  if (run.player.hp - remaining <= 0 && hasRelic(run, "emergency_kit") && !run.usedEmergencyKit) {
    run.usedEmergencyKit = true;
    run.player.hp = 1;
    floor.damageTaken += 1;
    run.stats.damageTaken += 1;
    pushLog(run, "緊急医療箱が発動。HP 1 で踏みとどまった。");
    return;
  }

  run.player.hp -= remaining;
  floor.damageTaken += remaining;
  run.stats.damageTaken += remaining;
  pushLog(run, message);
  if (hasRelic(run, "salvage_core")) {
    addItem(run.player.items, "probe", 1);
    pushLog(run, "回収コアが爆発からプローブを回収した。");
  }
  if (hasBossPower(run, "salvage_drive")) {
    const rescueIndex = findRandomSafeFrontierTile(floor) ?? findRandomSafeTile(floor);
    if (rescueIndex !== null) {
      revealTiles(run, [rescueIndex], { allowFlood: true, maxDamage: 0, source: "salvage_drive" });
      pushLog(run, "回収駆動が安全ルートをこじ開けた。");
    }
  }
  if (run.player.hp <= 0) {
    endRun(false);
  }
}

function clearFloor() {
  const run = state.run;
  const floor = run.floor;
  const route = floor.route;
  if (floor.cleared || state.screen !== "run") {
    return;
  }

  floor.cleared = true;
  run.stats.floorsCleared += 1;

  if (hasRelic(run, "field_flask") && floor.damageTaken === 0 && run.player.hp < run.player.maxHp) {
    run.player.hp += 1;
    pushLog(run, "野営フラスコが清浄な踏破に応える。HP を1回復。");
  }

  if (run.classId === "treasure_hunter" && floor.chestOpened) {
    run.player.gold += 10;
    pushLog(run, "財宝狩りのボーナス。宝箱回収後の離脱でゴールド +10。");
  }

  if (hasRelic(run, "lucky_pennant") && hasPerfectFlags(floor)) {
    run.player.gold += 15;
    pushLog(run, "幸運の旗印が報酬をもたらす。ゴールド +15。");
  }

  if (route.stageEnd) {
    pushLog(run, `ステージ ${route.stageNumber}「${route.stageName}」を踏破。`);
  }

  const nextFloorIndex = run.currentFloorIndex + 1;
  const finalVictory = route.globalFloor >= run.route.length;
  const rewardOptions = finalVictory ? [] : getRelicRewardOptions(run);
  const transition = {
    nextFloorIndex,
    showShop: !finalVictory && route.shopAfter,
    rewardOptions,
    finalVictory,
  };

  if (route.stageEnd) {
    const powerOptions = getBossPowerOptions(run);
    if (powerOptions.length > 0) {
      state.modal = {
        type: "boss_power",
        powerIds: powerOptions,
        ...transition,
      };
      render();
      return;
    }
  }

  continueFloorTransition(transition);
}

function canUseStairs(floor) {
  if (!floor) {
    return false;
  }
  return floor.type === "boss" ? floor.stairsUnlocked : floor.keyFound;
}

function openStairsPrompt(run, announce = false) {
  const floor = run?.floor;
  if (!run || !floor || floor.cleared || !canUseStairs(floor)) {
    return;
  }

  if (state.modal?.type === "stairs") {
    return;
  }

  state.selectedItemId = null;
  state.modal = { type: "stairs" };

  if (announce) {
    if (floor.route.globalFloor >= TOTAL_FLOORS) {
      pushLog(run, "最終階段が使える。踏破を完了するか、この階を探索し続けるか選べる。");
    } else if (floor.type === "boss") {
      pushLog(run, "階段が使える。次の層へ進むか、この層を探索し続けるか選べる。");
    } else {
      pushLog(run, "階段が使える。次の階へ進むか、この階を探索し続けるか選べる。");
    }
  }
}

function handleStairsInteraction(run) {
  const floor = run?.floor;
  if (!run || !floor) {
    return;
  }

  if (canUseStairs(floor)) {
    openStairsPrompt(run, false);
  } else if (floor.type === "boss") {
    pushLog(run, "中央階段はまだ封印されている。");
  } else {
    pushLog(run, "鍵が必要だ。先に鍵を見つけよう。");
  }
  render();
}

function continueFloorTransition(transition) {
  const run = state.run;
  if (!run) {
    return;
  }

  if (transition.finalVictory) {
    state.modal = null;
    endRun(true);
    return;
  }

  if (transition.rewardOptions.length > 0) {
    state.modal = {
      type: "reward",
      relicIds: transition.rewardOptions,
      nextFloorIndex: transition.nextFloorIndex,
      showShop: transition.showShop,
    };
  } else if (transition.showShop) {
    state.modal = {
      type: "shop",
      nextFloorIndex: transition.nextFloorIndex,
      offers: buildShopOffers(run),
    };
  } else {
    state.modal = null;
    advanceToFloor(transition.nextFloorIndex);
    return;
  }

  render();
}

function getRelicRewardOptions(run) {
  const unowned = Object.keys(RELIC_DEFS).filter((relicId) => !run.relics.includes(relicId));
  const shuffled = [...unowned];
  shuffleInPlace(shuffled);
  return shuffled.slice(0, Math.min(3, shuffled.length));
}

function getBossPowerOptions(run) {
  const unowned = Object.keys(BOSS_POWER_DEFS).filter((powerId) => !run.bossPowers.includes(powerId));
  const shuffled = [...unowned];
  shuffleInPlace(shuffled);
  return shuffled.slice(0, Math.min(3, shuffled.length));
}

function chooseBossPower(powerId) {
  const run = state.run;
  if (!run || !state.modal || state.modal.type !== "boss_power") {
    return;
  }

  if (!run.bossPowers.includes(powerId)) {
    run.bossPowers.push(powerId);
    pushLog(run, `ボス能力獲得: ${BOSS_POWER_DEFS[powerId].name}。`);
  }

  continueFloorTransition({
    nextFloorIndex: state.modal.nextFloorIndex,
    showShop: state.modal.showShop,
    rewardOptions: state.modal.rewardOptions,
    finalVictory: state.modal.finalVictory,
  });
}

function chooseRelic(relicId) {
  const run = state.run;
  if (!run || !state.modal || state.modal.type !== "reward") {
    return;
  }
  if (!run.relics.includes(relicId)) {
    run.relics.push(relicId);
    pushLog(run, `レリック獲得: ${RELIC_DEFS[relicId].name}。`);
  }

  continueFloorTransition({
    nextFloorIndex: state.modal.nextFloorIndex,
    showShop: state.modal.showShop,
    rewardOptions: [],
    finalVictory: false,
  });
}

function buildShopOffers(run) {
  const offers = [];
  const itemOfferCount = hasBossPower(run, "merchant_beacon") ? 5 : 3;
  const chosenItems = shuffle(
    SHOP_CATALOG.filter((offer) => offer.type === "item").map((offer) => ({ ...offer }))
  ).slice(0, itemOfferCount);

  offers.push({ ...SHOP_CATALOG.find((offer) => offer.type === "heal"), sold: false });
  offers.push(...chosenItems.map((offer) => ({ ...offer, sold: false })));
  offers.push({ ...SHOP_CATALOG.find((offer) => offer.type === "random_relic"), sold: false });

  let priceMultiplier = 1;
  if (hasRelic(run, "deep_pockets")) {
    priceMultiplier *= 0.8;
  }
  if (hasDebuff(run, "heavy_debt")) {
    priceMultiplier *= 1.35;
  }
  return offers.map((offer) => ({
    ...offer,
    finalPrice: Math.max(
      1,
      Math.round(offer.price * priceMultiplier) - (offer.type === "random_relic" && hasBossPower(run, "merchant_beacon") ? 20 : 0)
    ),
  }));
}

function leaveShop() {
  if (!state.modal || state.modal.type !== "shop") {
    return;
  }
  const nextFloorIndex = state.modal.nextFloorIndex;
  state.modal = null;
  advanceToFloor(nextFloorIndex);
}

function buyShopOffer(offerIndex) {
  const run = state.run;
  const modal = state.modal;
  if (!run || !modal || modal.type !== "shop") {
    return;
  }
  const offer = modal.offers[offerIndex];
  if (!offer || offer.sold || run.player.gold < offer.finalPrice) {
    return;
  }

  if (offer.type === "heal" && run.player.hp >= run.player.maxHp) {
    pushLog(run, "すでに HP は最大です。");
    render();
    return;
  }

  if (offer.type === "random_relic") {
    const relicOptions = Object.keys(RELIC_DEFS).filter((relicId) => !run.relics.includes(relicId));
    if (relicOptions.length === 0) {
      pushLog(run, "レリック箱は空だった。");
      offer.sold = true;
      render();
      return;
    }
  }

  run.player.gold -= offer.finalPrice;

  if (offer.type === "heal") {
    run.player.hp = Math.min(run.player.maxHp, run.player.hp + 1);
    pushLog(run, "応急手当キットで HP を1回復。");
  } else if (offer.type === "item") {
    addItem(run.player.items, offer.itemId, 1);
    pushLog(run, `${ITEM_DEFS[offer.itemId].name} を購入。`);
  } else if (offer.type === "random_relic") {
    const relicId = randomFrom(Object.keys(RELIC_DEFS).filter((id) => !run.relics.includes(id)));
    run.relics.push(relicId);
    pushLog(run, `レリック箱から ${RELIC_DEFS[relicId].name} を入手。`);
  }

  offer.sold = true;
  render();
}

function descendStairs() {
  if (!state.modal || state.modal.type !== "stairs" || !state.run) {
    return;
  }

  state.modal = null;
  clearFloor();
}

function closeStairsPrompt() {
  if (!state.modal || state.modal.type !== "stairs") {
    return;
  }

  state.modal = null;
  render();
}

function handleItemButton(itemId) {
  if (state.screen !== "run" || state.modal) {
    return;
  }
  const run = state.run;
  const count = run.player.items[itemId] ?? 0;
  if (count <= 0) {
    return;
  }

  const item = ITEM_DEFS[itemId];
  if (!item) {
    return;
  }

  if (item.target) {
    state.selectedItemId = state.selectedItemId === itemId ? null : itemId;
    render();
    return;
  }

  useInstantItem(itemId);
}

function useInstantItem(itemId) {
  const run = state.run;
  if (!consumeItem(run.player.items, itemId)) {
    return;
  }

  if (itemId === "compass") {
    const hint = getCompassHint(run);
    pushLog(run, hint || "コンパスは役に立たなかった。");
    if (hasRelic(run, "ember_compass")) {
      addItem(run.player.items, "scan", 1);
      pushLog(run, "残り火のコンパスがスキャンを描き加えた。");
    }
  } else if (itemId === "ward") {
    run.player.wardCharges += 1;
    pushLog(run, "ウォードが装備を包む。次の一撃を防ぐ。");
  } else if (itemId === "warding_powder") {
    run.player.wardCharges += 2;
    pushLog(run, "守りの粉が舞い、ウォード +2。");
  } else if (itemId === "ration") {
    if (run.player.hp >= run.player.maxHp) {
      addItem(run.player.items, "ration", 1);
      pushLog(run, "今は食料を使う必要がない。");
      render();
      return;
    }
    run.player.hp = Math.min(run.player.maxHp, run.player.hp + 1);
    pushLog(run, "食料で HP を1回復。");
  } else if (itemId === "map_shard") {
    const safeCandidates = run.floor.tiles
      .filter((tile) => !tile.revealed && tile.kind !== "mine")
      .map((tile) => tile.index);
    if (safeCandidates.length === 0) {
      addItem(run.player.items, "map_shard", 1);
      pushLog(run, "地図片は新しい情報を見つけられなかった。");
      render();
      return;
    }
    revealTiles(run, [randomFrom(safeCandidates)], { allowFlood: true, maxDamage: 0, source: "map_shard" });
  } else if (itemId === "route_pin") {
    if (!markObjectiveTile(run, "route_pin")) {
      addItem(run.player.items, "route_pin", 1);
      pushLog(run, "ルートピンが未解決の目的地を見つけられなかった。");
      render();
      return;
    }
    const targetTile = run.floor.tiles[getCurrentObjectiveIndex(run)];
    pushLog(run, `ルートピンが ${getObjectiveName(targetTile.kind)} を示した。`);
  } else if (itemId === "hellfire_tonic") {
    if (hasDebuff(run, "burning_blood")) {
      addItem(run.player.items, "hellfire_tonic", 1);
      pushLog(run, "すでに血は燃えている。これ以上トニックは効かない。");
      render();
      return;
    }
    addDebuff(run, "burning_blood");
    run.player.maxHp += 1;
    run.player.hp = Math.min(run.player.maxHp, run.player.hp + 2);
    run.player.wardCharges += 2;
    pushLog(run, "地獄火トニックが駆け巡る。最大HP +1、HP を2回復、ウォード +2。");
  } else if (itemId === "debt_contract") {
    if (hasDebuff(run, "heavy_debt")) {
      addItem(run.player.items, "debt_contract", 1);
      pushLog(run, "すでに借金まみれだ。");
      render();
      return;
    }
    addDebuff(run, "heavy_debt");
    run.player.gold += 60;
    const bonusItem = randomFrom(["grappling_hook", "oracle_lens", "warding_powder", "route_pin"]);
    addItem(run.player.items, bonusItem, 1);
    pushLog(run, `借金契約の見返り。ゴールド +60、${ITEM_DEFS[bonusItem].name} を獲得。`);
  } else if (itemId === "blind_seer_map") {
    if (hasDebuff(run, "lost_bearings")) {
      addItem(run.player.items, "blind_seer_map", 1);
      pushLog(run, "すでに完全に道に迷っている。");
      render();
      return;
    }
    addDebuff(run, "lost_bearings");
    addItems(run.player.items, { oracle_lens: 2, route_pin: 1 });
    const safeTile = findRandomSafeTile(run.floor);
    if (safeTile !== null) {
      revealTiles(run, [safeTile], { allowFlood: true, maxDamage: 0, source: "blind_seer_map" });
    }
    markObjectiveTile(run, "route_pin");
    pushLog(run, "盲目の予言者の地図が確実性を奪う。オラクルレンズ x2、ルートピン、無料開示を獲得。");
  }

  state.selectedItemId = null;
  render();
}

function useTargetedItem(itemId, index) {
  const run = state.run;
  const floor = run.floor;
  const tile = floor.tiles[index];
  if (!canTargetItem(itemId, tile, floor)) {
    pushLog(run, "そのマスは対象にできない。");
    render();
    return;
  }

  if (!consumeItem(run.player.items, itemId)) {
    state.selectedItemId = null;
    render();
    return;
  }

  if (itemId === "scan") {
    tile.hint = buildTileHint(run, tile, "scan");
    pushLog(run, `スキャン結果: ${tile.hint.label}。`);
  }

  if (itemId === "probe") {
    tile.hint = buildTileHint(run, tile, "probe");
    pushLog(run, `プローブ結果: ${tile.hint.label}。`);
  }

  if (itemId === "oracle_lens") {
    tile.hint = buildTileHint(run, tile, "oracle_lens");
    pushLog(run, `オラクルレンズが ${tile.hint.label} を暴いた。`);
  }

  if (itemId === "grappling_hook") {
    pushLog(run, "フックが遠くの岩肌に食い込んだ。");
    revealTiles(run, [index], { allowFlood: true, maxDamage: 1, source: "grappling_hook" });
  }

  if (itemId === "flare") {
    const targets = getNeighbors(index, floor.width, floor.height).filter((neighbor) => {
      const neighborTile = floor.tiles[neighbor];
      return neighborTile && !neighborTile.revealed && !neighborTile.flagged;
    });
    for (const targetIndex of targets) {
      floor.tiles[targetIndex].hint = buildTileHint(run, floor.tiles[targetIndex], "flare");
    }
    pushLog(run, `フレアが周囲 ${targets.length} マスを照らした。`);
  }

  state.selectedItemId = null;
  render();
}

function grantChestReward(run) {
  const tier = (run.classId === "treasure_hunter" ? 1 : 0) + (hasRelic(run, "treasure_lens") ? 1 : 0);
  const rewardSets = [
    [
      {
        text: "ゴールド +18",
        apply: () => {
          run.player.gold += 18;
        },
      },
      {
        text: "食料 + ゴールド 6",
        apply: () => {
          run.player.gold += 6;
          addItem(run.player.items, "ration", 1);
        },
      },
      {
        text: "補給品を2つ獲得",
        apply: () => {
          addItem(run.player.items, randomFrom(["scan", "probe", "compass", "ward", "map_shard", "flare", "route_pin", "blind_seer_map"]), 1);
          addItem(run.player.items, randomFrom(["scan", "probe", "ward", "ration", "warding_powder", "hellfire_tonic"]), 1);
        },
      },
    ],
    [
      {
        text: "ゴールド +30",
        apply: () => {
          run.player.gold += 30;
        },
      },
      {
        text: "ウォード + 食料 + ゴールド 10",
        apply: () => {
          run.player.gold += 10;
          addItems(run.player.items, { ward: 1, ration: 1 });
        },
      },
      {
        text: "補給品を3つ獲得",
        apply: () => {
          addItems(run.player.items, {
            grappling_hook: 1,
            flare: 1,
            debt_contract: 1,
          });
        },
      },
    ],
    [
      {
        text: "ゴールド +42",
        apply: () => {
          run.player.gold += 42;
        },
      },
      {
        text: "HP 1回復 + ウォード + コンパス + ゴールド 12",
        apply: () => {
          run.player.gold += 12;
          run.player.hp = Math.min(run.player.maxHp, run.player.hp + 1);
          addItems(run.player.items, { ward: 1, compass: 1 });
        },
      },
      {
        text: "高級補給セット",
        apply: () => {
          addItems(run.player.items, {
            oracle_lens: 1,
            grappling_hook: 1,
            warding_powder: 1,
            route_pin: 1,
            blind_seer_map: 1,
          });
        },
      },
    ],
  ];

  const reward = randomFrom(rewardSets[Math.min(tier, rewardSets.length - 1)]);
  reward.apply();
  pushLog(run, `宝箱報酬: ${reward.text}。`);
}

function getCompassHint(run) {
  if (hasDebuff(run, "lost_bearings")) {
    return "道迷いのせいでコンパスが狂っている。";
  }
  const floor = run.floor;
  if (floor.type === "boss") {
    const targetIndex = floor.sealIndexes.find((sealIndex) => !floor.tiles[sealIndex].revealed) ?? floor.stairsIndex;
    return buildDirectionMessage(floor, targetIndex, "コンパスの指す先");
  }
  const targetIndex = floor.keyFound ? floor.stairsIndex : floor.keyIndex;
  const label = floor.keyFound ? "階段" : "鍵";
  return buildDirectionMessage(floor, targetIndex, `コンパスが示す先: ${label}`);
}

function getCurrentObjectiveIndex(run) {
  const floor = run.floor;
  if (floor.type === "boss") {
    return floor.sealIndexes.find((sealIndex) => !floor.tiles[sealIndex].revealed) ?? floor.stairsIndex ?? null;
  }
  return floor.keyFound ? floor.stairsIndex ?? null : floor.keyIndex ?? null;
}

function isGimmickKind(kind) {
  return Object.prototype.hasOwnProperty.call(GIMMICK_DEFS, kind);
}

function markObjectiveTile(run, source) {
  const targetIndex = getCurrentObjectiveIndex(run);
  if (targetIndex === null) {
    return false;
  }
  const targetTile = run.floor.tiles[targetIndex];
  if (targetTile.kind === "stairs") {
    run.floor.stairsVisible = true;
  }
  targetTile.hint = buildTileHint(run, targetTile, source);
  return true;
}

function getObjectiveName(kind) {
  if (kind === "key") return "鍵";
  if (kind === "stairs") return "階段";
  if (kind === "seal") return "封印";
  if (kind === "chest") return "宝箱";
  if (isGimmickKind(kind)) return GIMMICK_DEFS[kind].name;
  return "目標";
}

function buildTileHint(run, tile, itemId) {
  const specialName = getObjectiveName(tile.kind);
  if (itemId === "route_pin" || itemId === "cartographer_core" || itemId === "ember_altar") {
    return { tone: "special", label: specialName };
  }

  if (itemId === "scan") {
    if (tile.kind === "mine") {
      return { tone: "danger", label: "危険" };
    }
    if (tile.kind === "key" || tile.kind === "chest" || tile.kind === "stairs" || tile.kind === "seal" || isGimmickKind(tile.kind)) {
      return { tone: "special", label: "特殊" };
    }
    if (run.classId === "scout") {
      return { tone: "safe", label: String(tile.adjacentMines) };
    }
    return { tone: "safe", label: "安全" };
  }

  if (itemId === "probe" || itemId === "flare") {
    if (tile.kind === "mine") {
      return { tone: "danger", label: "危険" };
    }
    if (tile.kind === "key" || tile.kind === "chest" || tile.kind === "stairs" || tile.kind === "seal" || isGimmickKind(tile.kind)) {
      return { tone: "special", label: `${specialName} ${tile.adjacentMines}` };
    }
    return { tone: "safe", label: String(tile.adjacentMines) };
  }

  if (itemId === "oracle_lens") {
    if (tile.kind === "mine") {
      return { tone: "danger", label: "地雷" };
    }
    if (tile.kind === "key" || tile.kind === "chest" || tile.kind === "stairs" || tile.kind === "seal" || isGimmickKind(tile.kind)) {
      return { tone: "special", label: `${specialName} ${tile.adjacentMines}` };
    }
    return { tone: "safe", label: `安全 ${tile.adjacentMines}` };
  }

  return { tone: "safe", label: "安全" };
}

function canTargetItem(itemId, tile, floor) {
  if (!tile) {
    return false;
  }

  if (itemId === "flare") {
    if (!tile.revealed || tile.kind === "mine") {
      return false;
    }
    return getNeighbors(tile.index, floor.width, floor.height).some((neighbor) => {
      const neighborTile = floor.tiles[neighbor];
      return neighborTile && !neighborTile.revealed && !neighborTile.flagged;
    });
  }

  if (itemId === "scan" || itemId === "probe" || itemId === "oracle_lens" || itemId === "grappling_hook") {
    return !tile.revealed && !tile.flagged;
  }

  return false;
}

function buildDirectionMessage(floor, targetIndex, prefix) {
  if (targetIndex === null || targetIndex === undefined) {
    return "";
  }
  const anchorIndex = getAnchorIndex(floor);
  const direction = getDirection(anchorIndex, targetIndex, floor.width);
  return `${prefix}: ${direction}`;
}

function getAnchorIndex(floor) {
  const revealed = floor.tiles.filter((tile) => tile.revealed);
  if (revealed.length === 0) {
    return floor.entranceIndex;
  }

  const average = revealed.reduce(
    (sum, tile) => {
      const coords = indexToCoords(tile.index, floor.width);
      return { x: sum.x + coords.x, y: sum.y + coords.y };
    },
    { x: 0, y: 0 }
  );
  const center = {
    x: average.x / revealed.length,
    y: average.y / revealed.length,
  };

  let bestTile = revealed[0];
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const tile of revealed) {
    const coords = indexToCoords(tile.index, floor.width);
    const distance = Math.hypot(coords.x - center.x, coords.y - center.y);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestTile = tile;
    }
  }

  return bestTile.index;
}

function getDirection(fromIndex, toIndex, width) {
  const from = indexToCoords(fromIndex, width);
  const to = indexToCoords(toIndex, width);
  const dx = Math.sign(to.x - from.x);
  const dy = Math.sign(to.y - from.y);

  if (dx === 0 && dy < 0) return "北";
  if (dx > 0 && dy < 0) return "北東";
  if (dx > 0 && dy === 0) return "東";
  if (dx > 0 && dy > 0) return "南東";
  if (dx === 0 && dy > 0) return "南";
  if (dx < 0 && dy > 0) return "南西";
  if (dx < 0 && dy === 0) return "西";
  if (dx < 0 && dy < 0) return "北西";
  return "現在地";
}

function endRun(victory) {
  const run = state.run;
  if (!run) {
    return;
  }

  const scoreSummary = calculateRunScore(run, victory);
  const scrapEarned = run.stats.floorsCleared + (victory ? 3 : 0);
  state.meta.scrap += scrapEarned;
  state.meta.stats.bestFloor = Math.max(state.meta.stats.bestFloor, run.stats.floorsCleared);
  state.meta.stats.bestScore = Math.max(state.meta.stats.bestScore ?? 0, scoreSummary.total);
  if (victory) {
    state.meta.stats.wins += 1;
  }
  saveMeta();

  state.lastResult = {
    victory,
    classId: run.classId,
    floorsCleared: run.stats.floorsCleared,
    gold: run.player.gold,
    relics: [...run.relics],
    bossPowers: [...run.bossPowers],
    debuffs: [...run.debuffs],
    scrapEarned,
    score: scoreSummary.total,
    scoreBreakdown: scoreSummary.breakdown,
    safeTilesRevealed: run.stats.safeTilesRevealed,
    damageTaken: run.stats.damageTaken,
    chests: run.stats.chestCount,
    hpRemaining: run.player.hp,
    seed: run.stats.seed,
    rankingRegistered: false,
    registeredEntryId: null,
    registeredName: "",
    registeredRank: null,
    rankingMessage: "",
  };

  state.screen = "result";
  state.modal = null;
  state.selectedItemId = null;
  render();
}

function buyUpgrade(upgradeId) {
  const upgrade = META_UPGRADES[upgradeId];
  if (!upgrade) {
    return;
  }
  if (state.meta.upgrades[upgradeId] || state.meta.scrap < upgrade.cost) {
    return;
  }
  state.meta.scrap -= upgrade.cost;
  state.meta.upgrades[upgradeId] = true;
  saveMeta();
  render();
}

function render() {
  if (state.screen === "title") {
    app.innerHTML = renderTitleScreen();
    syncRunSave();
    return;
  }
  if (state.screen === "result") {
    app.innerHTML = renderResultScreen();
    syncRunSave();
    return;
  }
  app.innerHTML = renderRunScreen();
  syncRunSave();
}

function renderTitleScreen() {
  const runs = state.meta.stats.runs;
  const wins = state.meta.stats.wins;
  const bestScore = state.meta.stats.bestScore ?? 0;
  const stageSummary = STAGE_CONFIGS.map((stage) => {
    const bossLayers = stage.floors.filter((floor) => floor.type === "boss").length;
    return `<div class="legend-pill"><strong>${stage.name}</strong>全${stage.floors.length}階層 / ボス${bossLayers}層</div>`;
  }).join("");
  const savedRunCard = state.savedRun?.run ? renderSavedRunCard(state.savedRun) : "";
  const leaderboardMarkup = renderLeaderboardList(6);

  return `
    <section class="title-layout">
      <div class="panel">
        <div class="resource-line">
          <div>
            <p class="eyebrow">拠点</p>
            <h2 class="section-title">探索者を選択</h2>
          </div>
          <div class="pill-row">
            <div class="stat-pill"><strong>${state.meta.scrap}</strong> スクラップ</div>
            <div class="stat-pill"><strong>${runs}</strong> プレイ</div>
            <div class="stat-pill"><strong>${wins}</strong> 勝利</div>
            <div class="stat-pill"><strong>${bestScore}</strong> 最高スコア</div>
          </div>
        </div>
        <p class="section-copy">
          数字を読み、開放済みマスに接した場所から安全地帯を少しずつ広げていくローグライト型マインスイーパーです。
          消費アイテムで二択や行き詰まりを崩しながら、階段を目指してください。
        </p>
        ${savedRunCard}
        <div class="card-grid">
          ${Object.values(CLASS_DEFS).map(renderClassCard).join("")}
        </div>
      </div>
      <div class="screen-grid">
        <div class="panel">
          <p class="eyebrow">恒久強化</p>
          <h2 class="section-title">スクラップ工房</h2>
          <div class="card-grid">
            ${Object.values(META_UPGRADES).map(renderUpgradeCard).join("")}
          </div>
        </div>
        <div class="panel">
          <p class="eyebrow">遊び方</p>
          <h2 class="section-title">探索メモ</h2>
        <div class="legend-grid">
          <div class="legend-pill"><strong>左クリック</strong> 「可」バッジのマスを開くか、数字マスでコードします。</div>
          <div class="legend-pill"><strong>右クリック</strong> 地雷だと思うマスに旗を置きます。</div>
          <div class="legend-pill"><strong>目的</strong> 鍵を見つけ、階段を開いて次の階へ進みます。</div>
          <div class="legend-pill"><strong>ボスエリア</strong> 各ステージの最後は複数層のボス階層です。</div>
          <div class="legend-pill"><strong>ボス報酬</strong> ボスエリア踏破後に特殊能力を1つ獲得します。</div>
          <div class="legend-pill"><strong>盤面ギミック</strong> ステージごとに異なる安全マス効果があります。</div>
          <div class="legend-pill"><strong>スキャン / プローブ</strong> 離れた未開封マスも調査できます。</div>
          <div class="legend-pill"><strong>保存</strong> スクラップとランキングはこのブラウザに保存されます。</div>
          ${stageSummary}
        </div>
        <div class="sidebar-block">
          <p class="eyebrow">記録帳</p>
          <h2 class="section-title">ローカルランキング</h2>
          <p class="section-copy">結果画面からスコア登録できます。ランキングはこのブラウザ内だけに保存されます。</p>
          ${leaderboardMarkup}
        </div>
      </div>
      </div>
    </section>
  `;
}

function renderClassCard(classDef) {
  const items = Object.entries(classDef.startingItems)
    .map(([itemId, count]) => `${ITEM_DEFS[itemId].name} x${count}`)
    .join(", ");

  return `
    <article class="card class-card">
      <div class="card-head">
        <div>
          <div class="tag">${classDef.title}</div>
          <h3>${classDef.name}</h3>
        </div>
        <div class="stat-pill"><strong>${classDef.hp}</strong> HP</div>
      </div>
      <p class="section-copy">${getClassDescription(classDef.id)}</p>
      <p class="section-copy"><strong>開始装備:</strong> ${items}</p>
      <button class="button" data-action="start-run" data-class-id="${classDef.id}">探索開始</button>
    </article>
  `;
}

function getClassDescription(classId) {
  if (classId === "scout") {
    return "安全確認に特化。スキャンで安全マスの数字まで読み取れ、ステージ切り替え時にスキャンを1つ補充します。";
  }
  if (classId === "engineer") {
    return "耐久寄りの安定型。HPが高く、各階の最初の被ダメージをシールドで1回だけ無効化します。";
  }
  if (classId === "treasure_hunter") {
    return "寄り道と回収に強い欲張り型。宝箱報酬が上位になり、宝箱を開けた階を抜けると追加のゴールドを得ます。";
  }
  return CLASS_DEFS[classId]?.description ?? "";
}

function renderUpgradeCard(upgrade) {
  const owned = state.meta.upgrades[upgrade.id];
  const affordable = state.meta.scrap >= upgrade.cost;
  return `
    <article class="card upgrade-card">
      <div class="card-head">
        <h3>${upgrade.name}</h3>
        <div class="stat-pill"><strong>${upgrade.cost}</strong> スクラップ</div>
      </div>
      <p class="section-copy">${upgrade.description}</p>
      <button
        class="${owned ? "ghost-button" : "button"}"
        data-action="buy-upgrade"
        data-upgrade-id="${upgrade.id}"
        ${owned || !affordable ? "disabled" : ""}
      >
        ${owned ? "購入済み" : affordable ? "強化を購入" : "スクラップ不足"}
      </button>
    </article>
  `;
}

function renderSavedRunCard(snapshot) {
  const summary = getSavedRunSummary(snapshot);
  if (!summary) {
    return "";
  }

  return `
    <article class="card class-card">
      <div class="card-head">
        <div>
          <div class="tag">自動保存</div>
          <h3>探索を再開</h3>
        </div>
        <div class="stat-pill"><strong>${summary.className}</strong></div>
      </div>
      <p class="section-copy">
        ${summary.stageLine}<br />
        ${summary.floorLine}<br />
        HP ${summary.hp} / ${summary.maxHp} / ゴールド ${summary.gold}
      </p>
      <div class="button-row">
        <button class="button" data-action="resume-run">続きから</button>
        <button class="ghost-button" data-action="discard-run-save">保存を破棄</button>
      </div>
    </article>
  `;
}

function getSavedRunSummary(snapshot) {
  const run = snapshot?.run;
  const route = run?.floor?.route;
  const classDef = run?.classId ? CLASS_DEFS[run.classId] : null;
  if (!run || !route || !classDef) {
    return null;
  }

  return {
    className: classDef.name,
    stageLine: `ステージ ${route.stageNumber}: ${route.stageName}`,
    floorLine: `${route.label} / 階層 ${route.globalFloor} / ${TOTAL_FLOORS}`,
    hp: run.player?.hp ?? 0,
    maxHp: run.player?.maxHp ?? 0,
    gold: run.player?.gold ?? 0,
  };
}

function renderLeaderboardList(limit = 10, highlightEntryId = null) {
  const entries = getSortedLeaderboardEntries().slice(0, limit);
  if (entries.length === 0) {
    return '<p class="empty-state">まだスコア登録はありません。</p>';
  }

  return `
    <div class="leaderboard-list">
      ${entries.map((entry, index) => renderLeaderboardEntry(entry, index, highlightEntryId)).join("")}
    </div>
  `;
}

function renderLeaderboardEntry(entry, index, highlightEntryId = null) {
  const className = CLASS_DEFS[entry.classId]?.name ?? "不明";
  const status = entry.victory ? "勝利" : `${entry.floorsCleared}階踏破`;
  const highlightClass = entry.id === highlightEntryId ? " current" : "";
  return `
    <article class="leaderboard-entry${highlightClass}">
      <div class="leaderboard-rank">#${index + 1}</div>
      <div class="leaderboard-copy">
        <strong>${escapeHtml(entry.name)}</strong>
        <p>${className} / ${status} / シード ${entry.seed}</p>
      </div>
      <div class="leaderboard-score">${entry.score}</div>
    </article>
  `;
}

function renderRunScreen() {
  const run = state.run;
  clearUnavailableSelectedItem(run);
  const floor = run.floor;
  const route = floor.route;
  const classDef = CLASS_DEFS[run.classId];
  const projectedScore = calculateRunScore(run, false).total;
  const directionHints = [];

  if (hasDebuff(run, "lost_bearings")) {
    directionHints.push("道迷いにより方角ヒントが乱れています。");
  } else if (hasRelic(run, "cartographer_thread") && !floor.keyFound && floor.keyIndex !== null) {
    directionHints.push(buildDirectionMessage(floor, floor.keyIndex, "糸の導き"));
  }
  if (!hasDebuff(run, "lost_bearings") && hasRelic(run, "stairfinder") && floor.keyFound) {
    directionHints.push(buildDirectionMessage(floor, floor.stairsIndex, "階段探知"));
  }

  if (floor.type === "boss") {
    const sealsLeft = floor.sealIndexes.filter((sealIndex) => !floor.tiles[sealIndex].revealed).length;
    directionHints.push(`残り封印: ${sealsLeft}`);
  }

  return `
    <section class="game-layout">
      <aside class="panel">
        <div class="sidebar-block">
          <p class="eyebrow">探索情報</p>
          <h2 class="section-title">${classDef.name}</h2>
          <p class="sidebar-copy">${getClassDescription(classDef.id)}</p>
        </div>
        <div class="sidebar-block">
          <h3>現在の状況</h3>
          <div class="pill-row">
            <div class="stat-pill"><strong>ステージ ${route.stageNumber}</strong> / ${TOTAL_STAGES}</div>
            <div class="stat-pill"><strong>${route.globalFloor}</strong> / ${TOTAL_FLOORS} 階</div>
            <div class="stat-pill"><strong>${route.floorInStage}</strong> / ${route.floorsInStage} 層目</div>
            <div class="stat-pill"><strong>${run.player.hp}</strong> / ${run.player.maxHp} HP</div>
            <div class="stat-pill"><strong>${run.player.gold}</strong> ゴールド</div>
            <div class="stat-pill"><strong>${projectedScore}</strong> スコア</div>
            <div class="stat-pill"><strong>${run.player.wardCharges}</strong> ウォード</div>
            <div class="stat-pill"><strong>${floor.shieldCharges}</strong> 床シールド</div>
          </div>
        </div>
        <div class="sidebar-block">
          <h3>目的</h3>
          <p class="sidebar-copy">${renderObjectiveText(floor)}</p>
          <div class="pill-row">
            ${directionHints.map((hint) => `<div class="hint-pill"><strong>ヒント</strong>${hint}</div>`).join("") || '<div class="hint-pill"><strong>ヒント</strong>常時発動の方角ヒントはありません。</div>'}
          </div>
        </div>
        <div class="sidebar-block">
          <h3>盤面ギミック</h3>
          <div class="relic-list">
            ${floor.gimmickKinds.length > 0 ? floor.gimmickKinds.map(renderGimmickEntry).join("") : '<p class="empty-state">この階層に特別なギミックはありません。</p>'}
          </div>
        </div>
        <div class="sidebar-block">
          <h3>消費アイテム</h3>
          <div class="item-grid">
            ${renderItemButtons(run)}
          </div>
          ${renderSelectedItemGuide(run)}
        </div>
        <div class="sidebar-block">
          <button class="ghost-button" data-action="back-to-title">タイトルへ戻る</button>
        </div>
      </aside>
      <main class="panel board-panel">
        <div class="status-strip">
          <div>
            <p class="eyebrow">${route.stageName} / ${floor.type === "boss" ? "ボスエリア" : "通常階層"}</p>
            <h2 class="section-title">${route.label}</h2>
            <p class="section-copy">${route.stageSubtitle}</p>
          </div>
          <div class="pill-row">
            <div class="inventory-pill"><strong>鍵</strong>${floor.keyFound ? "回収済み" : floor.type === "boss" ? "なし" : "未回収"}</div>
            <div class="inventory-pill"><strong>宝箱</strong>${floor.chestOpened ? "回収済み" : floor.type === "boss" ? "なし" : "未開封"}</div>
            <div class="inventory-pill"><strong>地雷</strong>${floor.mineCount}</div>
            ${floor.type === "boss" ? `<div class="inventory-pill"><strong>層</strong>${route.bossLayer} / ${route.bossLayers}</div>` : ""}
          </div>
        </div>
        <div class="board-frame">
          <div class="board-grid" style="grid-template-columns: repeat(${floor.width}, minmax(0, 1fr));">
            ${floor.tiles.map((tile) => renderTile(tile, floor)).join("")}
          </div>
        </div>
        <div class="footer-help">
          <div class="legend-pill"><strong>可</strong> 今クリックで開けるマスです。開放済みマスに接しています。</div>
          <div class="legend-pill"><strong>済</strong> すでに開放済みのマスです。数字を読んで次を判断します。</div>
          <div class="legend-pill"><strong>対象</strong>${state.selectedItemId ? getItemSelectionHint(state.selectedItemId) : "アイテム選択中に、使えるマスだけ「対象」と表示されます。"}</div>
        </div>
      </main>
      <aside class="panel">
        <div class="sidebar-block">
          <h3>デバフ</h3>
          <div class="relic-list">
            ${run.debuffs.length > 0 ? run.debuffs.map(renderDebuffEntry).join("") : '<p class="empty-state">現在のデバフはありません。</p>'}
          </div>
        </div>
        <div class="sidebar-block">
          <h3>ボス能力</h3>
          <div class="relic-list">
            ${run.bossPowers.length > 0 ? run.bossPowers.map(renderBossPowerEntry).join("") : '<p class="empty-state">ボスエリアを踏破すると特殊能力を獲得できます。</p>'}
          </div>
        </div>
        <div class="sidebar-block">
          <h3>レリック</h3>
          <div class="relic-list">
            ${run.relics.length > 0 ? run.relics.map(renderRelicEntry).join("") : '<p class="empty-state">まだレリックはありません。階層クリアで獲得できます。</p>'}
          </div>
        </div>
        <div class="sidebar-block">
          <h3>ログ</h3>
          <div class="log-list">
            ${run.log.slice(-6).map((entry) => `<div class="log-entry"><p>${entry}</p></div>`).join("")}
          </div>
        </div>
      </aside>
    </section>
    ${renderModal()}
  `;
}

function renderObjectiveText(floor) {
  const route = floor.route;
  if (floor.type === "boss") {
    return floor.stairsUnlocked
      ? route.globalFloor >= TOTAL_FLOORS
        ? "最終階段が使えます。踏破を完了するか、この階を探索し続けるか選べます。"
        : `階段が使えます。ボス ${route.bossLayer + 1} 層目へ進むか、この層を探索し続けるか選べます。`
      : `封印をすべて開いてください。${route.bossLayer}/${route.bossLayers} 層目で ${floor.sealsOpened}/${floor.sealIndexes.length} 個開放済みです。`;
  }
  if (floor.stairsUnlocked && floor.stairsVisible) {
    return "階段が使えます。次の階へ進むか、この階を探索し続けるか選べます。";
  }
  if (!floor.keyFound) {
    return "盤面のどこかにある鍵を見つけてください。";
  }
  return "階段は見つかっています。必要なら周囲を探索してから次の階へ進めます。";
}

function renderItemButtons(run) {
  const visibleItems = Object.values(ITEM_DEFS).filter((item) => (run.player.items[item.id] ?? 0) > 0);

  if (visibleItems.length === 0) {
    return '<p class="empty-state">まだ消費アイテムはありません。</p>';
  }

  return visibleItems
    .map((item) => {
      const count = run.player.items[item.id] ?? 0;
      const active = state.selectedItemId === item.id;
      return `
        <button
          class="item-button ${active ? "active" : ""}"
          data-action="use-item"
          data-item-id="${item.id}"
          ${count <= 0 ? "disabled" : ""}
        >
          <strong>${item.name} x${count}</strong>
          <span>${item.description}</span>
          <div class="entry-meta">
            <span class="entry-chip">${getItemTargetSummary(item.id)}</span>
            <span class="entry-chip">${getItemEffectSummary(item.id)}</span>
          </div>
        </button>
      `;
    })
    .join("");
}

function renderSelectedItemGuide(run) {
  const itemId = state.selectedItemId;
  if (!itemId) {
    return `
      <div class="item-detail">
        <strong>使い方メモ</strong>
        <p>アイテムを押すと、使えるマスだけに「対象」が付きます。即時発動アイテムは押した瞬間に効果が出ます。</p>
      </div>
    `;
  }

  const item = ITEM_DEFS[itemId];
  if (!item || (run.player.items[itemId] ?? 0) <= 0) {
    return "";
  }

  return `
    <div class="item-detail">
      <strong>選択中: ${item.name}</strong>
      <p>${item.description}</p>
      <div class="entry-meta">
        <span class="entry-chip">${getItemTargetSummary(itemId)}</span>
        <span class="entry-chip">${getItemEffectSummary(itemId)}</span>
      </div>
      <p class="item-detail-tip">${getItemSelectionHint(itemId)} もう一度押すとキャンセルできます。</p>
    </div>
  `;
}

function clearUnavailableSelectedItem(run) {
  const itemId = state.selectedItemId;
  if (!itemId) {
    return;
  }

  if (!ITEM_DEFS[itemId] || (run.player.items[itemId] ?? 0) <= 0) {
    state.selectedItemId = null;
  }
}

function renderTile(tile, floor) {
  const isFrontier = !tile.revealed && canOpenTile(floor, tile.index);
  const isSpecial =
    tile.kind === "key" ||
    tile.kind === "chest" ||
    tile.kind === "seal" ||
    isGimmickKind(tile.kind) ||
    (tile.kind === "stairs" && floor.stairsVisible);
  const itemTargetable = state.selectedItemId ? canTargetItem(state.selectedItemId, tile, floor) : false;
  const classes = [
    "tile",
    tile.revealed ? "revealed" : "",
    tile.kind === "mine" && tile.revealed ? "mine" : "",
    tile.flagged ? "flagged" : "",
    isFrontier ? "frontier" : "",
    isSpecial ? "special" : "",
    itemTargetable ? "selected" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const disabled = state.selectedItemId ? !itemTargetable : !tile.revealed && !isFrontier;
  const content = getTileVisual(tile, floor);
  const badge = getTileBadgeMarkup(tile, isFrontier, itemTargetable);
  const hint = tile.hint
    ? `<span class="tile-hint hint-${tile.hint.tone}">${tile.hint.label}</span>`
    : "";

  return `
    <button
      class="${classes}"
      data-action="tile"
      data-tile-index="${tile.index}"
      ${disabled && !state.selectedItemId ? "disabled" : ""}
      aria-label="${getTileAriaLabel(tile, isFrontier, itemTargetable)}"
    >
      ${badge}
      <span class="tile-sub">${content.sub}</span>
      <span class="tile-main ${content.numberClass}">${content.main}</span>
      ${hint}
    </button>
  `;
}

function getTileBadgeMarkup(tile, isFrontier, itemTargetable) {
  if (itemTargetable) {
    return '<span class="tile-badge target">対象</span>';
  }
  if (tile.revealed) {
    return '<span class="tile-badge revealed">済</span>';
  }
  if (isFrontier) {
    return '<span class="tile-badge frontier">可</span>';
  }
  return "";
}

function getTileAriaLabel(tile, isFrontier, itemTargetable) {
  if (itemTargetable) {
    return `タイル ${tile.index + 1}、アイテム対象`;
  }
  if (tile.revealed) {
    return `タイル ${tile.index + 1}、開放済み`;
  }
  if (isFrontier) {
    return `タイル ${tile.index + 1}、クリック可能`;
  }
  return `タイル ${tile.index + 1}、未開放`;
}

function getTileVisual(tile, floor) {
  const isEntrance = tile.index === floor.entranceIndex;

  if (!tile.revealed) {
    if (tile.flagged) {
      return { sub: "", main: "⚑", numberClass: "" };
    }
    if (tile.kind === "stairs" && floor.stairsVisible) {
      return { sub: "階段", main: "⇣", numberClass: "" };
    }
    return { sub: "", main: "", numberClass: "" };
  }

  if (tile.kind === "mine") {
    return { sub: "爆発", main: "✹", numberClass: "" };
  }

  if (tile.kind === "key") {
    return { sub: "鍵", main: tile.adjacentMines || "✦", numberClass: tile.adjacentMines ? `number-${tile.adjacentMines}` : "" };
  }
  if (tile.kind === "chest") {
    return { sub: "宝箱", main: tile.adjacentMines || "▣", numberClass: tile.adjacentMines ? `number-${tile.adjacentMines}` : "" };
  }
  if (tile.kind === "supply_cache") {
    return { sub: "補給", main: tile.adjacentMines || "$", numberClass: tile.adjacentMines ? `number-${tile.adjacentMines}` : "" };
  }
  if (tile.kind === "rail_switch") {
    return { sub: "線路", main: tile.adjacentMines || ">", numberClass: tile.adjacentMines ? `number-${tile.adjacentMines}` : "" };
  }
  if (tile.kind === "survey_beacon") {
    return { sub: "探査", main: tile.adjacentMines || "S", numberClass: tile.adjacentMines ? `number-${tile.adjacentMines}` : "" };
  }
  if (tile.kind === "pressure_valve") {
    return { sub: "排圧", main: tile.adjacentMines || "V", numberClass: tile.adjacentMines ? `number-${tile.adjacentMines}` : "" };
  }
  if (tile.kind === "forge_shrine") {
    return { sub: "鍛冶", main: tile.adjacentMines || "+", numberClass: tile.adjacentMines ? `number-${tile.adjacentMines}` : "" };
  }
  if (tile.kind === "ember_altar") {
    return { sub: "祭壇", main: tile.adjacentMines || "*", numberClass: tile.adjacentMines ? `number-${tile.adjacentMines}` : "" };
  }
  if (tile.kind === "seal") {
    return { sub: "封印", main: tile.adjacentMines || "◇", numberClass: tile.adjacentMines ? `number-${tile.adjacentMines}` : "" };
  }
  if (tile.kind === "stairs" && floor.stairsVisible) {
    return { sub: floor.stairsUnlocked ? "階段" : "封鎖", main: tile.adjacentMines || "⇣", numberClass: tile.adjacentMines ? `number-${tile.adjacentMines}` : "" };
  }
  if (tile.adjacentMines > 0) {
    return { sub: isEntrance ? "入口" : "", main: String(tile.adjacentMines), numberClass: `number-${tile.adjacentMines}` };
  }
  return { sub: isEntrance ? "入口" : "", main: isEntrance ? "◎" : "·", numberClass: "" };
}

function renderGimmickEntry(kind) {
  const gimmick = GIMMICK_DEFS[kind];
  return `
    <div class="relic-entry">
      <strong>${gimmick.name}</strong>
      <p>${gimmick.description}</p>
      <div class="entry-meta">
        <span class="entry-chip">開くと発動</span>
        <span class="entry-chip">${getGimmickEffectSummary(kind)}</span>
      </div>
    </div>
  `;
}

function getItemTargetSummary(itemId) {
  switch (itemId) {
    case "scan":
    case "probe":
    case "oracle_lens":
    case "grappling_hook":
      return "対象: 未開封1マス";
    case "flare":
      return "対象: 開放済み安全マス";
    default:
      return "対象: すぐ発動";
  }
}

function getItemEffectSummary(itemId) {
  switch (itemId) {
    case "scan":
      return "効果: 危険・安全・特殊を判定";
    case "probe":
      return "効果: 安全なら数字まで確認";
    case "oracle_lens":
      return "効果: 正体と数字を完全に看破";
    case "grappling_hook":
      return "効果: 遠い未開封マスを直接開く";
    case "flare":
      return "効果: 周囲の未開封マスをまとめて調査";
    case "compass":
      return "効果: 鍵か階段の方向を示す";
    case "ward":
      return "効果: 次の被ダメージを1回無効化";
    case "warding_powder":
      return "効果: ウォードを2回分付与";
    case "ration":
      return "効果: HPを1回復";
    case "map_shard":
      return "効果: 安全マスを1つ自動開放";
    case "route_pin":
      return "効果: 今の目的地を盤面に表示";
    case "hellfire_tonic":
      return "効果: 強化と引き換えに燃える血";
    case "debt_contract":
      return "効果: 資金補給と引き換えに重い負債";
    case "blind_seer_map":
      return "効果: 調査支援と引き換えに方角喪失";
    default:
      return "効果: 特殊";
  }
}

function getItemSelectionHint(itemId) {
  switch (itemId) {
    case "scan":
      return "未開封で旗のないマスを1つ選ぶと、危険か安全か、特殊マスかが分かります。";
    case "probe":
      return "未開封で旗のないマスを1つ選ぶと、安全なら数字まで先読みできます。";
    case "oracle_lens":
      return "未開封で旗のないマスを1つ選ぶと、そのマスの正体と数字をはっきり見抜きます。";
    case "grappling_hook":
      return "未開封で旗のないマスを1つ選ぶと、前線の外でもその場で開けられます。";
    case "flare":
      return "すでに開いた安全マスを1つ選ぶと、その周囲の未開封マスをまとめて調べます。";
    default:
      return "使える条件を満たすマスにだけ「対象」が付きます。";
  }
}

function getGimmickEffectSummary(kind) {
  switch (kind) {
    case "supply_cache":
      return "ゴールド+10と道具1個";
    case "rail_switch":
      return "安全な前線を最大2マス開放";
    case "survey_beacon":
      return "周囲の未開封マスを精密調査";
    case "pressure_valve":
      return "安全マス1つ開示 + コンパス1個";
    case "forge_shrine":
      return "ウォード+1。負傷中なら回復、満タンならゴールド";
    case "ember_altar":
      return "調査道具を獲得し、目的地を表示";
    default:
      return "特殊効果";
  }
}

function renderRelicEntry(relicId) {
  const relic = RELIC_DEFS[relicId];
  return `
    <div class="relic-entry">
      <strong>${relic.name}</strong>
      <p>${relic.description}</p>
    </div>
  `;
}

function renderBossPowerEntry(powerId) {
  const power = BOSS_POWER_DEFS[powerId];
  return `
    <div class="relic-entry">
      <strong>${power.name}</strong>
      <p>${power.description}</p>
    </div>
  `;
}

function renderDebuffEntry(debuffId) {
  const debuff = DEBUFF_DEFS[debuffId];
  return `
    <div class="relic-entry">
      <strong>${debuff.name}</strong>
      <p>${debuff.description}</p>
    </div>
  `;
}

function renderModal() {
  if (!state.modal) {
    return "";
  }

  if (state.modal.type === "stairs") {
    const run = state.run;
    const floor = run?.floor;
    const route = floor?.route;
    const proceedLabel = route?.globalFloor >= TOTAL_FLOORS ? "踏破を完了する" : floor?.type === "boss" ? "次の層へ進む" : "次の階へ進む";
    const copy =
      route?.globalFloor >= TOTAL_FLOORS
        ? "ここで降りると、この階層をクリアして最終報酬と結果画面へ進みます。まだマスを開けてゴールドや宝箱を回収することもできます。"
        : floor?.type === "boss"
          ? "ここで降りると、この層をクリアして次の層の報酬処理へ進みます。続けて探索し、残った宝箱や安全マスを回収することもできます。"
          : "ここで降りると、この階をクリアして報酬処理へ進みます。続けて探索し、残った宝箱や安全マスを回収することもできます。";

    return `
      <div class="modal-backdrop">
        <div class="modal-card">
          <div class="modal-head">
            <p class="eyebrow">階段</p>
            <h2>${proceedLabel}？</h2>
            <p>${copy}</p>
          </div>
          <div class="button-row">
            <button class="button" data-action="descend-stairs">${proceedLabel}</button>
            <button class="ghost-button" data-action="stay-on-floor">この階を続ける</button>
          </div>
        </div>
      </div>
    `;
  }

  if (state.modal.type === "boss_power") {
    return `
      <div class="modal-backdrop">
        <div class="modal-card">
          <div class="modal-head">
            <p class="eyebrow">ボス能力</p>
            <h2>コアの力を選択</h2>
            <p>ボスエリアを突破しました。ここから先の探索に効く能力を1つ選んでください。</p>
          </div>
          <div class="card-grid reward-grid">
            ${state.modal.powerIds
              .map((powerId) => {
                const power = BOSS_POWER_DEFS[powerId];
                return `
                  <article class="card relic-card">
                    <h3>${power.name}</h3>
                    <p class="section-copy">${power.description}</p>
                    <button class="reward-button" data-action="select-boss-power" data-power-id="${powerId}">この能力を得る</button>
                  </article>
                `;
              })
              .join("")}
          </div>
        </div>
      </div>
    `;
  }

  if (state.modal.type === "reward") {
    return `
      <div class="modal-backdrop">
        <div class="modal-card">
          <div class="modal-head">
            <p class="eyebrow">報酬選択</p>
            <h2>レリックを選択</h2>
            <p>レリックで次の立ち回りが変わります。1つ選んで先へ進みましょう。</p>
          </div>
          <div class="card-grid reward-grid">
            ${state.modal.relicIds
              .map((relicId) => {
                const relic = RELIC_DEFS[relicId];
                return `
                  <article class="card relic-card">
                    <h3>${relic.name}</h3>
                    <p class="section-copy">${relic.description}</p>
                    <button class="reward-button" data-action="select-relic" data-relic-id="${relicId}">このレリックを得る</button>
                  </article>
                `;
              })
              .join("")}
          </div>
        </div>
      </div>
    `;
  }

  if (state.modal.type === "shop") {
    return `
      <div class="modal-backdrop">
        <div class="modal-card">
          <div class="modal-head">
            <p class="eyebrow">商店</p>
            <h2>ゴールドを使う</h2>
            <p>次の階層に進む前に補給できます。価格にはレリック補正が反映されています。</p>
          </div>
          <div class="card-grid shop-grid">
            ${state.modal.offers.map((offer, index) => renderShopOffer(offer, index)).join("")}
          </div>
          <div class="button-row">
            <button class="ghost-button" data-action="leave-shop">次の階へ進む</button>
          </div>
        </div>
      </div>
    `;
  }

  return "";
}

function renderShopOffer(offer, index) {
  const run = state.run;
  const label = offer.type === "item" ? ITEM_DEFS[offer.itemId].name : offer.label;
  const description = offer.type === "item" ? ITEM_DEFS[offer.itemId].description : offer.description;
  const disabled =
    offer.sold ||
    run.player.gold < offer.finalPrice ||
    (offer.type === "heal" && run.player.hp >= run.player.maxHp);

  return `
    <article class="card shop-card">
      <div class="card-head">
        <h3>${label}</h3>
        <div class="stat-pill"><strong>${offer.finalPrice}</strong> ゴールド</div>
      </div>
      <p class="section-copy">${description}</p>
      <p class="shop-meta">${offer.sold ? "売り切れ" : "1回限り"}</p>
      <button class="shop-buy" data-action="buy-offer" data-offer-index="${index}" ${disabled ? "disabled" : ""}>
        ${offer.sold ? "売り切れ" : run.player.gold < offer.finalPrice ? "ゴールド不足" : "購入"}
      </button>
    </article>
  `;
}

function renderResultScreen() {
  const result = state.lastResult;
  if (!result) {
    state.screen = "title";
    return renderTitleScreen();
  }

  const classDef = CLASS_DEFS[result.classId];
  const scorePreviewRank = result.registeredRank ?? getProjectedLeaderboardRank(result);
  const registerButtonLabel = result.rankingRegistered ? "登録済み" : "スコア登録";
  const registerHint = result.rankingRegistered
    ? result.rankingMessage || `${result.registeredRank}位として登録済みです。`
    : `現在の記録は暫定 ${scorePreviewRank} 位です。`;
  return `
    <section class="result-layout">
      <article class="panel result-hero">
        <div class="result-strip">
          <div>
            <p class="eyebrow">${result.victory ? "勝利" : "探索終了"}</p>
            <h2>${result.victory ? "エンバー・スローン制覇" : "鉱山に呑まれた"}</h2>
          </div>
          <div class="pill-row">
            <div class="stat-pill"><strong>${result.score}</strong> スコア</div>
            <div class="stat-pill"><strong>${result.scrapEarned}</strong> スクラップ</div>
            <div class="stat-pill"><strong>${result.floorsCleared}</strong> 階踏破</div>
            <div class="stat-pill"><strong>${result.gold}</strong> ゴールド</div>
          </div>
        </div>
        <p class="result-copy">
          ${classDef.name}は ${result.victory ? "すべてのステージを踏破し" : "探索の途中で倒れました"}。
          安全マスを ${result.safeTilesRevealed} 枚開き、被ダメージは ${result.damageTaken} でした。
        </p>
        <div class="button-row">
          <button class="button" data-action="restart-run">同じクラスでもう一度</button>
          <button class="ghost-button" data-action="back-to-title">タイトルへ戻る</button>
        </div>
      </article>
      <div class="summary-grid">
        <article class="card summary-card">
          <strong>スコア内訳</strong>
          <div class="score-breakdown">
            ${result.scoreBreakdown.map((part) => `
              <div class="score-line ${part.value < 0 ? "negative" : "positive"}">
                <span>${part.label}</span>
                <strong>${formatScoreDelta(part.value)}</strong>
              </div>
            `).join("")}
            <div class="score-line total">
              <span>合計</span>
              <strong>${result.score}</strong>
            </div>
          </div>
        </article>
        <article class="card summary-card">
          <strong>ランキング登録</strong>
          <p>${registerHint}</p>
          <div class="ranking-form">
            <label class="field-label" for="ranking-name">名前</label>
            <input
              id="ranking-name"
              class="text-input"
              data-role="ranking-name"
              maxlength="18"
              value="${escapeHtml(result.registeredName || state.meta.profileName || "")}"
              ${result.rankingRegistered ? "disabled" : ""}
            />
            <button class="button" data-action="register-ranking" ${result.rankingRegistered ? "disabled" : ""}>${registerButtonLabel}</button>
          </div>
        </article>
        <article class="card summary-card">
          <strong>取得したデバフ</strong>
          <p>${result.debuffs.length > 0 ? result.debuffs.map((debuffId) => DEBUFF_DEFS[debuffId].name).join(", ") : "デバフなし。"}</p>
        </article>
        <article class="card summary-card">
          <strong>ボス能力</strong>
          <p>${result.bossPowers.length > 0 ? result.bossPowers.map((powerId) => BOSS_POWER_DEFS[powerId].name).join(", ") : "獲得なし。"}</p>
        </article>
        <article class="card summary-card">
          <strong>獲得レリック</strong>
          <p>${result.relics.length > 0 ? result.relics.map((relicId) => RELIC_DEFS[relicId].name).join(", ") : "今回はなし。"}</p>
        </article>
        <article class="card summary-card">
          <strong>宝箱</strong>
          <p>${result.chests} 個の宝箱を開きました。</p>
        </article>
        <article class="card summary-card">
          <strong>拠点の記録</strong>
          <p>${state.meta.scrap} スクラップ所持。${state.meta.stats.runs} プレイ中 ${state.meta.stats.wins} 勝。最高スコアは ${state.meta.stats.bestScore ?? 0}。</p>
        </article>
        <article class="card summary-card">
          <strong>上位記録</strong>
          ${renderLeaderboardList(5, result.registeredEntryId)}
        </article>
      </div>
    </section>
  `;
}

function hasPerfectFlags(floor) {
  for (const tile of floor.tiles) {
    if (tile.kind === "mine" && !tile.flagged) {
      return false;
    }
    if (tile.kind !== "mine" && tile.flagged) {
      return false;
    }
  }
  return true;
}

function hasRelic(run, relicId) {
  return run.relics.includes(relicId);
}

function hasBossPower(run, powerId) {
  return run.bossPowers.includes(powerId);
}

function hasDebuff(run, debuffId) {
  return run.debuffs.includes(debuffId);
}

function addDebuff(run, debuffId) {
  if (!hasDebuff(run, debuffId)) {
    run.debuffs.push(debuffId);
  }
}

function pushLog(run, message) {
  run.log.push(message);
  if (run.log.length > 16) {
    run.log.shift();
  }
}

function createEmptyInventory() {
  return Object.fromEntries(Object.keys(ITEM_DEFS).map((itemId) => [itemId, 0]));
}

function addItems(inventory, items) {
  for (const [itemId, count] of Object.entries(items)) {
    addItem(inventory, itemId, count);
  }
}

function addItem(inventory, itemId, count) {
  inventory[itemId] = (inventory[itemId] ?? 0) + count;
}

function consumeItem(inventory, itemId) {
  if ((inventory[itemId] ?? 0) <= 0) {
    return false;
  }
  inventory[itemId] -= 1;
  return true;
}

function getNeighbors(index, width, height) {
  const { x, y } = indexToCoords(index, width);
  const neighbors = [];

  for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
    for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
      if (offsetX === 0 && offsetY === 0) {
        continue;
      }
      const nextX = x + offsetX;
      const nextY = y + offsetY;
      if (nextX >= 0 && nextX < width && nextY >= 0 && nextY < height) {
        neighbors.push(coordsToIndex(nextX, nextY, width));
      }
    }
  }

  return neighbors;
}

function coordsToIndex(x, y, width) {
  return y * width + x;
}

function indexToCoords(index, width) {
  return {
    x: index % width,
    y: Math.floor(index / width),
  };
}

function manhattan(leftIndex, rightIndex, width) {
  const left = indexToCoords(leftIndex, width);
  const right = indexToCoords(rightIndex, width);
  return Math.abs(left.x - right.x) + Math.abs(left.y - right.y);
}

function shuffle(items) {
  const copy = [...items];
  shuffleInPlace(copy);
  return copy;
}

function shuffleInPlace(items) {
  for (let index = items.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(0, index);
    [items[index], items[swapIndex]] = [items[swapIndex], items[index]];
  }
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFrom(items) {
  return items[randomInt(0, items.length - 1)];
}

function buildRunRoute() {
  let globalFloor = 1;

  return STAGE_CONFIGS.flatMap((stage, stageIndex) => {
    const bossLayers = stage.floors.filter((floor) => floor.type === "boss").length;
    let bossLayer = 0;

    return stage.floors.map((floor, floorIndex) => {
      if (floor.type === "boss") {
        bossLayer += 1;
      }

      return {
        ...floor,
        globalFloor: globalFloor++,
        stageId: stage.id,
        stageName: stage.name,
        stageSubtitle: stage.subtitle,
        stageIndex,
        stageNumber: stageIndex + 1,
        floorInStage: floorIndex + 1,
        floorsInStage: stage.floors.length,
        stageStart: floorIndex === 0,
        stageEnd: floorIndex === stage.floors.length - 1,
        bossAreaStart: floor.type === "boss" && bossLayer === 1,
        bossLayer,
        bossLayers,
      };
    });
  });
}

function upperFirst(text) {
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : "";
}

function calculateRunScore(run, victory) {
  const breakdown = [
    { label: "踏破階層", value: run.stats.floorsCleared * 320 },
    { label: "開いた安全マス", value: run.stats.safeTilesRevealed * 11 },
    { label: "所持ゴールド", value: run.player.gold * 4 },
    { label: "宝箱", value: run.stats.chestCount * 90 },
    { label: "レリック", value: run.relics.length * 45 },
    { label: "ボス能力", value: run.bossPowers.length * 180 },
    { label: "残りHP", value: run.player.hp * 120 },
    { label: "被ダメージ", value: run.stats.damageTaken * -95 },
    { label: "デバフ", value: run.debuffs.length * -160 },
    { label: "勝利ボーナス", value: victory ? 2200 : 0 },
  ];

  const total = Math.max(
    0,
    breakdown.reduce((sum, part) => sum + part.value, 0)
  );

  return {
    breakdown,
    total,
  };
}

function formatScoreDelta(value) {
  return `${value > 0 ? "+" : ""}${value}`;
}

function registerLastResult() {
  const result = state.lastResult;
  if (!result || result.rankingRegistered) {
    return;
  }

  const input = app.querySelector('[data-role="ranking-name"]');
  const name = sanitizePlayerName(input?.value ?? state.meta.profileName);
  const entry = createLeaderboardEntry(result, name);
  const nextLeaderboard = sortLeaderboardEntries([
    ...(Array.isArray(state.meta.leaderboard) ? state.meta.leaderboard : []),
    entry,
  ]).slice(0, MAX_LEADERBOARD_ENTRIES);
  const rank = nextLeaderboard.findIndex((candidate) => candidate.id === entry.id) + 1;

  state.meta.profileName = name;
  state.meta.leaderboard = nextLeaderboard;
  saveMeta();

  result.rankingRegistered = true;
  result.registeredEntryId = entry.id;
  result.registeredName = name;
  result.registeredRank = rank > 0 ? rank : null;
  result.rankingMessage = rank > 0 ? `${rank}位としてローカルランキングに登録しました。` : "ローカルランキングに登録しました。";
  render();
}

function createLeaderboardEntry(result, name) {
  return {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    score: Math.max(0, Math.floor(result.score ?? 0)),
    classId: result.classId,
    victory: Boolean(result.victory),
    floorsCleared: Math.max(0, Math.floor(result.floorsCleared ?? 0)),
    safeTilesRevealed: Math.max(0, Math.floor(result.safeTilesRevealed ?? 0)),
    damageTaken: Math.max(0, Math.floor(result.damageTaken ?? 0)),
    gold: Math.max(0, Math.floor(result.gold ?? 0)),
    seed: Math.max(0, Math.floor(result.seed ?? 0)),
    createdAt: Date.now(),
  };
}

function sanitizePlayerName(value) {
  const normalized = String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 18);

  return normalized || "探索者";
}

function getSortedLeaderboardEntries() {
  return sortLeaderboardEntries(Array.isArray(state.meta.leaderboard) ? state.meta.leaderboard : []);
}

function sortLeaderboardEntries(entries) {
  return [...entries].sort(compareLeaderboardEntries);
}

function compareLeaderboardEntries(left, right) {
  if (right.score !== left.score) {
    return right.score - left.score;
  }
  if (Number(right.victory) !== Number(left.victory)) {
    return Number(right.victory) - Number(left.victory);
  }
  if (right.floorsCleared !== left.floorsCleared) {
    return right.floorsCleared - left.floorsCleared;
  }
  if (right.safeTilesRevealed !== left.safeTilesRevealed) {
    return right.safeTilesRevealed - left.safeTilesRevealed;
  }
  if (left.damageTaken !== right.damageTaken) {
    return left.damageTaken - right.damageTaken;
  }
  return (left.createdAt ?? 0) - (right.createdAt ?? 0);
}

function getProjectedLeaderboardRank(result) {
  const previewEntry = createLeaderboardEntry(result, "__preview__");
  previewEntry.id = "__preview__";
  const leaderboard = sortLeaderboardEntries([
    ...getSortedLeaderboardEntries(),
    previewEntry,
  ]);
  return Math.max(1, leaderboard.findIndex((entry) => entry.id === "__preview__") + 1);
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => {
    switch (character) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "\"":
        return "&quot;";
      case "'":
        return "&#39;";
      default:
        return character;
    }
  });
}

function loadSavedRun() {
  try {
    const raw = window.localStorage.getItem(RUN_SAVE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw);
    const run = hydrateSavedRun(parsed.run);
    if (!run) {
      return null;
    }
    return {
      run,
      modal: parsed.modal ?? null,
      selectedItemId: parsed.selectedItemId ?? null,
      savedAt: parsed.savedAt ?? Date.now(),
    };
  } catch (error) {
    return null;
  }
}

function syncRunSave() {
  if (state.screen === "run" && state.run) {
    const snapshot = {
      run: state.run,
      modal: state.modal,
      selectedItemId: state.selectedItemId,
      savedAt: Date.now(),
    };
    state.savedRun = snapshot;
    try {
      window.localStorage.setItem(RUN_SAVE_KEY, JSON.stringify(snapshot));
    } catch (error) {
      // Ignore storage failures in restricted browser contexts.
    }
    return;
  }

  if (state.screen === "result") {
    clearRunSave();
  }
}

function clearRunSave() {
  state.savedRun = null;
  try {
    window.localStorage.removeItem(RUN_SAVE_KEY);
  } catch (error) {
    // Ignore storage failures in restricted browser contexts.
  }
}

function hydrateSavedRun(run) {
  if (!run || !run.player || !run.floor) {
    return null;
  }

  run.relics = Array.isArray(run.relics) ? run.relics : [];
  run.bossPowers = Array.isArray(run.bossPowers) ? run.bossPowers : [];
  run.debuffs = Array.isArray(run.debuffs) ? run.debuffs : [];
  run.route = Array.isArray(run.route) && run.route.length > 0 ? run.route : RUN_ROUTE.map((entry) => ({ ...entry }));
  run.currentFloorIndex = Number.isInteger(run.currentFloorIndex) ? run.currentFloorIndex : 0;
  run.usedEmergencyKit = Boolean(run.usedEmergencyKit);
  run.log = Array.isArray(run.log) ? run.log : [];
  run.stats = {
    floorsCleared: 0,
    damageTaken: 0,
    safeTilesRevealed: 0,
    chestCount: 0,
    seed: 0,
    ...(run.stats ?? {}),
  };
  run.player = {
    hp: 1,
    maxHp: 1,
    gold: 0,
    wardCharges: 0,
    items: createEmptyInventory(),
    ...(run.player ?? {}),
    items: {
      ...createEmptyInventory(),
      ...(run.player?.items ?? {}),
    },
  };

  const fallbackRoute = run.route[run.currentFloorIndex] ?? RUN_ROUTE[run.currentFloorIndex] ?? RUN_ROUTE[0];
  run.floor = {
    ...run.floor,
    route: run.floor.route ?? fallbackRoute,
    gimmickKinds: Array.isArray(run.floor.gimmickKinds) ? run.floor.gimmickKinds : [],
    sealIndexes: Array.isArray(run.floor.sealIndexes) ? run.floor.sealIndexes : [],
    shieldCharges: run.floor.shieldCharges ?? 0,
    damageTaken: run.floor.damageTaken ?? 0,
    zeroRewardClaimed: Boolean(run.floor.zeroRewardClaimed),
    echoUsed: Boolean(run.floor.echoUsed),
    manualNumberRewardClaimed: Boolean(run.floor.manualNumberRewardClaimed),
    sealWardGranted: Boolean(run.floor.sealWardGranted),
  };

  if (!Array.isArray(run.floor.tiles)) {
    return null;
  }

  run.floor.tiles = run.floor.tiles.map((tile, index) => ({
    index,
    kind: "empty",
    adjacentMines: 0,
    revealed: false,
    flagged: false,
    exploded: false,
    hint: null,
    goldGranted: false,
    ...tile,
  }));

  return run;
}

function loadMeta() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return cloneDefaultMeta();
    }
    const parsed = JSON.parse(raw);
    const base = cloneDefaultMeta();
    return {
      ...base,
      ...parsed,
      profileName: typeof parsed.profileName === "string" ? parsed.profileName : base.profileName,
      leaderboard: hydrateLeaderboard(parsed.leaderboard),
      upgrades: {
        ...base.upgrades,
        ...(parsed.upgrades ?? {}),
      },
      stats: {
        ...base.stats,
        ...(parsed.stats ?? {}),
      },
    };
  } catch (error) {
    return cloneDefaultMeta();
  }
}

function hydrateLeaderboard(entries) {
  if (!Array.isArray(entries)) {
    return [];
  }

  return sortLeaderboardEntries(
    entries
      .map((entry) => {
        if (!entry || typeof entry !== "object") {
          return null;
        }

        return {
          id: typeof entry.id === "string" ? entry.id : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
          name: sanitizePlayerName(entry.name),
          score: Math.max(0, Math.floor(Number(entry.score) || 0)),
          classId: typeof entry.classId === "string" ? entry.classId : "scout",
          victory: Boolean(entry.victory),
          floorsCleared: Math.max(0, Math.floor(Number(entry.floorsCleared) || 0)),
          safeTilesRevealed: Math.max(0, Math.floor(Number(entry.safeTilesRevealed) || 0)),
          damageTaken: Math.max(0, Math.floor(Number(entry.damageTaken) || 0)),
          gold: Math.max(0, Math.floor(Number(entry.gold) || 0)),
          seed: Math.max(0, Math.floor(Number(entry.seed) || 0)),
          createdAt: Math.max(0, Math.floor(Number(entry.createdAt) || 0)),
        };
      })
      .filter(Boolean)
  ).slice(0, MAX_LEADERBOARD_ENTRIES);
}

function saveMeta() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.meta));
  } catch (error) {
    // Ignore storage failures in restricted browser contexts.
  }
}

function cloneDefaultMeta() {
  return JSON.parse(JSON.stringify(DEFAULT_META));
}
