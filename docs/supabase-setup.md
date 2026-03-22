# Supabase 設定手順

このプロジェクトで必要な Supabase 設定を順番にまとめています。

## 1. プロジェクト作成

1. [Supabase](https://supabase.com/) を開く
2. `New project` を押す
3. プロジェクト名を決める
4. データベースパスワードを設定する
5. リージョンを選ぶ
6. `Create new project` を押す

## 2. Email 認証を有効化

1. 左メニューで `Authentication`
2. `Sign In / Providers`
3. `Email` が有効か確認する

## 3. Project URL と Publishable key を取得

1. 左メニューで `Project Settings`
2. `Data API` か `API Keys` を開く
3. 次の 2 つをコピーする

- `Project URL`
- `Publishable key`

## 4. `.env.local` を作成

プロジェクト直下に `.env.local` を作り、次を入れます。

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT-ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
```

見本は [`.env.local.example`](C:\Users\leech\OneDrive\ドキュメント\New project\fgc-community\.env.local.example) にあります。

## 5. URL Configuration を設定

`Authentication -> URL Configuration` に次を入れます。

- `Site URL`: `http://localhost:3000`
- `Redirect URLs`: `http://localhost:3000`
- `Redirect URLs`: `http://localhost:3000/auth/update-password`

## 6. 開発サーバーを起動

```powershell
cd "C:\Users\leech\OneDrive\ドキュメント\New project\fgc-community"
cmd /c npm run dev
```

## 7. SQL を実行

Supabase の `SQL Editor` で、次のファイルの中身を順に貼り付けて実行します。

1. [profile-setup.sql](C:\Users\leech\OneDrive\ドキュメント\New project\fgc-community\docs\profile-setup.sql)
2. [recruitment-setup.sql](C:\Users\leech\OneDrive\ドキュメント\New project\fgc-community\docs\recruitment-setup.sql)
3. [coaching-setup.sql](C:\Users\leech\OneDrive\ドキュメント\New project\fgc-community\docs\coaching-setup.sql)
4. [replay-review-setup.sql](C:\Users\leech\OneDrive\ドキュメント\New project\fgc-community\docs\replay-review-setup.sql)

## 8. 注意点

- SQL Editor に貼るのはファイルパスではなく SQL 文です。
- `Publishable key` を使い、`service_role` は使いません。
- ただし、サイト内の `ユーザー削除` 機能だけはサーバー側で `SUPABASE_SERVICE_ROLE_KEY` を使います。この値は `NEXT_PUBLIC_` を付けずに `.env.local` に入れてください。
- 設定変更後は開発サーバーを再起動します。
- リプレイコーチングは `replay_url` から `replay_id` に変更しています。古い SQL を実行済みなら、最新版の [replay-review-setup.sql](C:\Users\leech\OneDrive\ドキュメント\New project\fgc-community\docs\replay-review-setup.sql) を再実行してください。
- 通報、ブロック、利用停止、管理画面を使うには [moderation-setup.sql](C:\Users\leech\OneDrive\ドキュメント\New project\fgc-community\docs\moderation-setup.sql) も実行してください。
- 管理画面を使うには `.env.local` に `ADMIN_EMAILS=あなたのメールアドレス` を追加してください。
