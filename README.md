# Rush Link

格闘ゲーム向けコミュニティーサイトの試作です。Next.js と Supabase を使って、対戦募集、教えたい / 教わりたい募集、プロフィール、リプレイコーチング依頼、通報 / ブロック / 管理画面を扱います。

## できること

- メールアドレスとパスワードでユーザー登録 / ログイン
- プロフィール保存
- 対戦募集と教えたい / 教わりたい募集の投稿
- リプレイコーチング依頼の投稿
- 通報、ブロック、利用停止
- 管理画面での通報確認と投稿削除
- Google AdSense を入れられる構成

## ローカル起動

```powershell
cd "C:\Users\leech\OneDrive\ドキュメント\New project\fgc-community"
cmd /c npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開きます。

## Supabase の環境変数

`.env.local` に次を入れます。

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT-ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
```

見本は [.env.local.example](C:\Users\leech\OneDrive\ドキュメント\New project\fgc-community\.env.local.example) にあります。

`Authentication -> URL Configuration` には次を設定してください。

- `http://localhost:3000`
- `http://localhost:3000/auth/update-password`

## Supabase の SQL 実行

Supabase の `SQL Editor` で、次のファイルの中身を順に貼って実行します。

1. [profile-setup.sql](C:\Users\leech\OneDrive\ドキュメント\New project\fgc-community\docs\profile-setup.sql)
2. [recruitment-setup.sql](C:\Users\leech\OneDrive\ドキュメント\New project\fgc-community\docs\recruitment-setup.sql)
3. [coaching-setup.sql](C:\Users\leech\OneDrive\ドキュメント\New project\fgc-community\docs\coaching-setup.sql)
4. [replay-review-setup.sql](C:\Users\leech\OneDrive\ドキュメント\New project\fgc-community\docs\replay-review-setup.sql)

注意:

- SQL Editor に貼るのはファイルパスではなく、SQL 文そのものです。
- スキーマを変えたときは、同じ SQL を再実行して問題ありません。
- リプレイコーチングは `replay_url` から `replay_id` に変わっています。以前の SQL を実行済みなら、最新版の [replay-review-setup.sql](C:\Users\leech\OneDrive\ドキュメント\New project\fgc-community\docs\replay-review-setup.sql) をもう一度実行してください。
- 通報とブロック機能を使うには [moderation-setup.sql](C:\Users\leech\OneDrive\ドキュメント\New project\fgc-community\docs\moderation-setup.sql) を実行してください。
- 管理画面を使うには `.env.local` に `ADMIN_EMAILS=管理者メールアドレス` を追加してください。
- ユーザー削除を使うには `SUPABASE_SERVICE_ROLE_KEY` も `.env.local` に設定してください。

## Google AdSense

`.env.local` に次を追加すると、広告スクリプトと広告枠を有効化できます。

```env
NEXT_PUBLIC_ADSENSE_CLIENT_ID=ca-pub-XXXXXXXXXXXXXXXX
NEXT_PUBLIC_ADSENSE_TOP_SLOT=1234567890
NEXT_PUBLIC_ADSENSE_MID_SLOT=0987654321
```

`ads.txt` の見本は [ads.txt.example](C:\Users\leech\OneDrive\ドキュメント\New project\fgc-community\public\ads.txt.example) にあります。

## 主なファイル

- [page.tsx](C:\Users\leech\OneDrive\ドキュメント\New project\fgc-community\src\app\page.tsx)
- [auth-panel.tsx](C:\Users\leech\OneDrive\ドキュメント\New project\fgc-community\src\components\auth-panel.tsx)
- [profile-editor.tsx](C:\Users\leech\OneDrive\ドキュメント\New project\fgc-community\src\components\profile-editor.tsx)
- [profile-setup-gate.tsx](C:\Users\leech\OneDrive\ドキュメント\New project\fgc-community\src\components\profile-setup-gate.tsx)
- [community-board.tsx](C:\Users\leech\OneDrive\ドキュメント\New project\fgc-community\src\components\community-board.tsx)
- [replay-review-board.tsx](C:\Users\leech\OneDrive\ドキュメント\New project\fgc-community\src\components\replay-review-board.tsx)
- [client.ts](C:\Users\leech\OneDrive\ドキュメント\New project\fgc-community\src\lib\supabase\client.ts)
