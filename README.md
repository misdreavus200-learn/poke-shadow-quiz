# だれのシルエットかな？ 🎮

ポケモンのシルエットを当てるクイズWebアプリです。

## 機能

- 🌑 ポケモンのシルエット表示
- 🔊 初回表示時&ボタンで鳴きごえ再生（PokéAPI Cries）
- ✅ 日本語名で回答判定（ひらがな/カタカナ両対応）
- 💡 3種類のヒント（タイプ / 初登場世代 / とくせい）
- 🎉 正解時シルエット解除アニメーション
- 🔄 つぎのポケモンボタンで連続プレイ

## 技術スタック

- **Next.js 15** (App Router)
- **TypeScript**
- **Tailwind CSS v4**
- **PokéAPI** (https://pokeapi.co)

## ローカル開発

```bash
npm install
npm run dev
```

http://localhost:3000 にアクセス。

## Vercelへのデプロイ手順

### 方法1: Vercel CLI

```bash
npm i -g vercel
vercel
```

### 方法2: GitHub経由（推奨）

1. このプロジェクトをGitHubにpushする
2. https://vercel.com にアクセス
3. 「New Project」→ GitHubリポジトリを選択
4. そのまま「Deploy」をクリック（設定不要）

## PokéAPI について

- ポケモンデータ: `https://pokeapi.co/api/v2/pokemon/{id}`
- 種族データ（日本語名）: `https://pokeapi.co/api/v2/pokemon-species/{id}`
- 鳴きごえ: `https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/{id}.ogg`
