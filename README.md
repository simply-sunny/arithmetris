<div align="center">

# arithmetris.

Clear the stack. Outlast the boss.

**React 19 · TypeScript · Vite**

![Arithmetris terminal homepage](docs/images/home.jpg)

## Run locally

Use Node.js 24 and npm.

```sh
npm ci
npm run dev
```

## Controls

| Key | Action |
| --- | --- |
| Numbers / `-` | Enter an estimate |
| `Enter` | Submit / select menu item |
| `Esc` | Pause / resume |
| `?` | Instructions |
| `m` | Toggle sound during a run |
| `j` / `k`, `h` / `l`, ↑ / ↓ | Navigate menus |
| `g` / `G` | First / last menu item |
| `Tab` / `Shift+Tab` | Standard keyboard navigation |

## Development

```sh
npm run lint
npm test
npm run build
npm run preview
```

The checks run on every push and pull request. Tests cover calculus answers against numerical integration, measured-height stacking, overflow, estimate damage, and boss transformations. `npm run build` creates the static site in `dist/`.

## Credits

The interface uses [JetBrains Mono](https://github.com/JetBrains/JetBrainsMono) under the SIL Open Font License and [KaTeX](https://katex.org/) for math rendering. Font license files are included in `public/fonts/`.

The included Freesound effects have individual licenses and attribution in [audio credits](public/audio/CREDITS.md). The processing sound is **CC BY-NC 4.0** and requires replacement or a separate license for commercial use. No blanket license is applied to third-party assets.
