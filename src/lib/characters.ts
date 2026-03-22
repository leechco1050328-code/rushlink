export const CHARACTER_OPTIONS = [
  "リュウ",
  "ルーク",
  "ジェイミー",
  "春麗",
  "ガイル",
  "キンバリー",
  "ジュリ",
  "ケン",
  "ブランカ",
  "ダルシム",
  "E.本田",
  "ディージェイ",
  "マノン",
  "マリーザ",
  "JP",
  "ザンギエフ",
  "リリー",
  "キャミィ",
  "ラシード",
  "A.K.I.",
  "エド",
  "豪鬼",
  "ベガ",
  "テリー",
  "舞",
] as const;

const CHARACTER_ICON_MAP: Record<string, string> = {
  リュウ: "/character-icons/iconA01.png",
  ルーク: "/character-icons/iconA02.png",
  ジェイミー: "/character-icons/iconA03.png",
  春麗: "/character-icons/iconA04.png",
  ガイル: "/character-icons/iconA05.png",
  キンバリー: "/character-icons/iconA06.png",
  ジュリ: "/character-icons/iconA07.png",
  ケン: "/character-icons/iconA08.png",
  ブランカ: "/character-icons/iconA09.png",
  ダルシム: "/character-icons/iconA10.png",
  "E.本田": "/character-icons/iconA11.png",
  ディージェイ: "/character-icons/iconA12.png",
  マノン: "/character-icons/iconA13.png",
  マリーザ: "/character-icons/iconA14.png",
  JP: "/character-icons/iconA15.png",
  ザンギエフ: "/character-icons/iconA16.png",
  リリー: "/character-icons/iconA17.png",
  キャミィ: "/character-icons/iconA18.png",
  ラシード: "/character-icons/iconA19.png",
  "A.K.I.": "/character-icons/iconA20.png",
  エド: "/character-icons/iconA21.png",
  豪鬼: "/character-icons/iconA22.png",
  ベガ: "/character-icons/bison.svg",
  テリー: "/character-icons/terry.svg",
  舞: "/character-icons/iconA25.png",
};

export function getCharacterIconSrc(name: string | null | undefined) {
  if (!name) {
    return null;
  }

  return CHARACTER_ICON_MAP[name] ?? null;
}
