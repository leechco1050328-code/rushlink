# データ設計メモ

Supabase の public schema で使う主なテーブルです。

## 1. users

Supabase Auth 側で管理されます。

- `id`
- `email`
- `created_at`

## 2. profiles

ユーザープロフィール保存用です。

- `user_id`
- `display_name`
- `main_character`
- `sub_character`
- `main_character_rank`
- `main_character_mr`
- `sub_character_rank`
- `sub_character_mr`
- `platform`
- `voice_preference`
- `x_account`
- `discord_account`
- `bio`
- `created_at`
- `updated_at`

## 3. recruitment_posts

対戦募集用です。

- `id`
- `user_id`
- `author_name`
- `title`
- `character_name`
- `self_rank`
- `self_mr`
- `opponent_character_name`
- `opponent_rank`
- `opponent_mr`
- `voice_option`
- `platform`
- `availability_start`
- `availability_end`
- `body`
- `status`
- `created_at`
- `updated_at`

## 4. coaching_posts

教えたい / 教わりたい募集用です。

- `id`
- `user_id`
- `author_name`
- `post_type`
- `title`
- `character_name`
- `current_rank`
- `current_mr`
- `focus_topic`
- `lesson_method`
- `availability_start`
- `availability_end`
- `body`
- `status`
- `created_at`
- `updated_at`

## 5. replay_review_posts

リプレイコーチング依頼用です。

- `id`
- `user_id`
- `author_name`
- `title`
- `character_name`
- `current_rank`
- `current_mr`
- `replay_id`
- `body`
- `status`
- `created_at`
- `updated_at`

## 6. replay_review_comments

リプレイコーチングへのコメント用です。

- `id`
- `post_id`
- `user_id`
- `author_name`
- `body`
- `reply_to_no`
- `created_at`
- `updated_at`

## 7. user_blocks

ユーザーブロック用です。

- `blocker_user_id`
- `blocked_user_id`
- `created_at`

## 8. reports

通報保存用です。

- `id`
- `reporter_user_id`
- `reporter_name`
- `target_user_id`
- `target_name`
- `target_kind`
- `target_source`
- `target_id`
- `target_title`
- `reason`
- `detail`
- `status`
- `created_at`
- `reviewed_at`
- `reviewed_by`

## 9. banned_users

利用停止ユーザー保存用です。

- `user_id`
- `reason`
- `created_at`
- `updated_at`
- `created_by`

## 今後追加したいテーブル

- `messages`
- `applications`
