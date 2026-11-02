# شباب+ | Shabab Plus Live Event App

React + Vite + Tailwind + Firebase live registration/display app for the Shabab+ opening event.

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Screens (hash routes)

- `#/register` (default) – participant phone screen
- `#/display` – hall display screen
- `#/split` – dual preview
- `#/qr` – QR screen
- `#/config` – organizer settings & tests

## Notes

- Firebase config lives at the top of `src/App.jsx`. Make sure your Firestore security rules are set correctly, since the web API key is public by design.
