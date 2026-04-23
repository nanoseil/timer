# Presentation Timer

複数端末で共有できるプレゼンタイマーです。  
同じルームIDに接続した **表示画面** (`/display`) と **操作画面** (`/control`) がリアルタイムに同期します。

## ローカル起動

```bash
pnpm install
pnpm dev
```

## 使い方

1. ホーム画面でルームIDを生成します。
2. 表示端末は `/room/{roomId}/display` を開きます。
3. 操作端末は `/room/{roomId}/control` を開きます。
4. 操作画面から開始・停止・リセット・時間調整を行います。

## テスト

```bash
pnpm test
```

## ビルド

```bash
pnpm build
```

## Cloudflare へのデプロイ

このアプリは WebSocket ベースでルーム内同期を行います（状態はワーカーのメモリ上に保持されるため、再起動時にリセットされます）。

デプロイ前に型を再生成:

```bash
pnpm cf-typegen
```

デプロイ:

```bash
pnpm deploy
```
