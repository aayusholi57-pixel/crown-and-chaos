# Crown & Chaos — The Last Throne

A cinematic, browser-based two-kingdom drawing battle. Command the Crimson and Azure realms, sketch unit paths, and unleash the clash.

![Crown & Chaos](https://img.shields.io/badge/genre-strategy%20battle-c7a66a) ![Vanilla JS](https://img.shields.io/badge/stack-HTML%20%2F%20CSS%20%2F%20JS-5b87b7) ![License](https://img.shields.io/badge/license-MIT-green)

## Play

Play the live game: **[Crown & Chaos on Render](https://crown-and-chaos.onrender.com)**.

## Features

- Cinematic medieval-fantasy landing screen with a procedural Three.js 3D battlefield
- Local two-player, hot-seat gameplay
- Draw-to-command controls with mouse, pen, or touch
- Four stylized 3D hero classes: shield-bearing Soldier, bow-wielding Archer, mounted Knight, and arcane Mage
- Alternating Red and Blue command phases
- Animated 3D character movement, signature ability effects, siege-impact particles, damaged and collapsing strongholds, combat damage, health bars, and victory screen
- Three deliberate orders per kingdom per round, with alternating command phases
- Restrained red impact sparks and dust (non-graphic; no gore)
- Synthesized sound effects with a mute toggle
- Responsive layout and reduced-motion accessibility support
- No backend, build step, dependencies, or API keys

## Run locally

Open `index.html` in a modern browser, or start a local static server:

```bash
python -m http.server 8000
```

Visit http://localhost:8000.

## How to play

1. Click **Enter the Battle**.
2. Red chooses a unit and draws a route on the left half of the arena (up to three commands).
3. Click **End Red Turn** and pass the device to Blue.
4. Blue draws routes on the right half (up to three commands).
5. Click **Unleash Battle** to resolve both armies' commands.
6. Survive the clash and repeat until one kingdom's health reaches zero.

### Unit strengths

| Unit | Damage | Role |
| --- | ---: | --- |
| Soldier | 12 | Balanced frontline |
| Archer | 15 | High-damage ranged unit |
| Knight | 21 | Heavy assault |
| Mage | 18 | Arcane strike |

Each hero triggers a signature power when deployed. Damage includes a small random battle modifier. Longer routes earn a small tactical bonus.

## Project structure

- `index.html` — semantic game interface and overlays
- `styles.css` — responsive visual system, battlefield, and animations
- `game.js` — pointer input, turn flow, hero powers, combat, and sound\n- `game3d.js` — Three.js scene, procedural 3D heroes, castles, movement, and ability effects
- `LICENSE` — MIT License

## Deploy on Render\n\nThe project is deployed as a Render Static Site. The site publishes the repository root and loads Three.js from jsDelivr. Pushes to the connected repository can be deployed from the [Render service dashboard](https://dashboard.render.com/static/srv-dc2idcks728c73ampg80).\n\n## Deploy with GitHub Pages

1. Open repository **Settings → Pages**.
2. Under **Build and deployment**, choose **Deploy from a branch**.
3. Select branch **main** and folder **/(root)**, then save.
4. Wait for the Pages deployment, then open the Play link above.

## License

MIT. See [LICENSE](LICENSE).