# Crown & Chaos — The Last Throne

A cinematic, browser-based two-kingdom drawing battle. Command the Crimson and Azure realms, sketch unit paths, and unleash the clash.

![Crown & Chaos](https://img.shields.io/badge/genre-strategy%20battle-c7a66a) ![Vanilla JS](https://img.shields.io/badge/stack-HTML%20%2F%20CSS%20%2F%20JS-5b87b7) ![License](https://img.shields.io/badge/license-MIT-green)

## Play

Open **[Crown & Chaos](https://aayusholi57-pixel.github.io/crown-and-chaos/)** after GitHub Pages is enabled.

## Features

- Cinematic medieval-fantasy landing screen and battlefield
- Local two-player, hot-seat gameplay
- Draw-to-command controls with mouse, pen, or touch
- Four unit classes: Soldier, Archer, Knight, and Mage
- Alternating Red and Blue command phases
- Animated unit movement, combat damage, health bars, and victory screen
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

Damage includes a small random battle modifier. Longer routes earn a small tactical bonus.

## Project structure

- `index.html` — semantic game interface and overlays
- `styles.css` — responsive visual system, battlefield, and animations
- `game.js` — pointer input, turn flow, unit movement, combat, and sound
- `LICENSE` — MIT License

## Deploy with GitHub Pages

1. Open repository **Settings → Pages**.
2. Under **Build and deployment**, choose **Deploy from a branch**.
3. Select branch **main** and folder **/(root)**, then save.
4. Wait for the Pages deployment, then open the Play link above.

## License

MIT. See [LICENSE](LICENSE).