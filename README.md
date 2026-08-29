# slowfi

A small lofi listening room built with Vite, React and TypeScript. It includes four curated YouTube live stations, a responsive player view, queue controls, and a volume control.

## Run locally

```bash
npm install
npm run dev
```

The app starts on the next available Vite port if `5173` is already in use.

## Add a station

Edit the `stations` array in `src/App.tsx` and provide a name, subtitle, category (`chill`, `games` or `anime`), an `images` array, and a YouTube video ID. Cover images live in `public/covers/`, so `/covers/my-station-1.png` maps to `public/covers/my-station-1.png`.

In the fullscreen view, `G` cycles through a station's images and `Esc` goes back.

Set `collection: true` for the "everything" mix of a category and leave its `images` empty; it renders with a `mix` badge and its gallery is pooled from the other stations in the same category.

Adding a new category means adding it to the `Category` type and to the `tabs` array.

## Checks

```bash
npm run build
npm run lint
```
