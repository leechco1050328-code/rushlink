# Vercel 公開手順

`Rush Link` を `Vercel Pro + Supabase Pro` で公開するための手順です。

## 1. 先に用意するもの

- GitHub アカウント
- Vercel アカウント
- Supabase プロジェクト
- 本番で使うドメイン名

## 2. GitHub にコードを置く

1. `fgc-community` を GitHub に push します。
2. `main` ブランチに最新コードがある状態にします。

## 3. Vercel でプロジェクトを作る

1. Vercel にログインします。
2. `Add New...` → `Project` を開きます。
3. GitHub リポジトリ `fgc-community` を選びます。
4. Framework Preset は `Next.js` のままで構いません。
5. Root Directory はそのままにします。

## 4. Vercel に環境変数を入れる

次の値を `Environment Variables` に追加します。

```env
NEXT_PUBLIC_SITE_URL=https://本番ドメイン
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT-ID.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
ADMIN_EMAILS=あなたの管理者メールアドレス
NEXT_PUBLIC_ADSENSE_CLIENT_ID=ca-pub-XXXXXXXXXXXXXXXX
NEXT_PUBLIC_ADSENSE_TOP_SLOT=1234567890
NEXT_PUBLIC_ADSENSE_MID_SLOT=0987654321
```

補足:

- `SUPABASE_SERVICE_ROLE_KEY` は公開しません。
- `NEXT_PUBLIC_SITE_URL` は `https://rushlink.jp` のような本番 URL を入れます。
- AdSense をまだ使わないなら、AdSense の 3 つはあとからでも構いません。

## 5. 最初のデプロイを実行する

1. `Deploy` を押します。
2. デプロイ完了後、Vercel が発行した URL を開きます。
3. トップページ、`/auth`、`/profile`、`/board`、`/replay-review` を確認します。

## 6. Supabase 側で本番 URL を設定する

Supabase の `Authentication` → `URL Configuration` を開いて、次を設定します。

- `Site URL`: `https://本番ドメイン`
- `Redirect URLs`: `https://本番ドメイン`
- `Redirect URLs`: `https://本番ドメイン/auth/update-password`

ローカル開発も続けるなら、`http://localhost:3000` も残して構いません。

## 7. 独自ドメインをつなぐ

1. Vercel の対象プロジェクトを開きます。
2. `Settings` → `Domains` を開きます。
3. 独自ドメインを追加します。
4. ドメイン会社側で、Vercel が案内する DNS を設定します。

## 8. デプロイ後に確認すること

- ユーザー登録できるか
- ログインできるか
- パスワード再設定メールが届くか
- プロフィール保存できるか
- 募集投稿できるか
- リプレイコーチング投稿できるか
- 通報 / ブロックが動くか
- 管理画面が開けるか

## 9. AdSense を使うとき

1. Vercel の環境変数に本番の `client ID` と `slot ID` を入れます。
2. `public/ads.txt.example` を参考に `public/ads.txt` を作ります。
3. 再デプロイして広告表示を確認します。

## 10. このプロジェクトで特に重要なこと

- `NEXT_PUBLIC_SITE_URL` を本番 URL に変える
- `ADMIN_EMAILS` に自分のメールアドレスを入れる
- Supabase の `URL Configuration` を本番ドメインへ切り替える
- `service_role key` は Vercel の Environment Variables にだけ入れる
