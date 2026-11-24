# Crown & Chaos — The Last Throne

A browser-based **2D autonomous kingdom warfare simulator**. The Crimson army starts on the left, the Azure army on the right. When war begins, both armies march toward the centre, meet at the frontline, fight hand-to-hand, and the surviving army advances to destroy the enemy castle.

## Play

[Play Crown & Chaos on Render](https://crown-and-chaos.onrender.com)

## Battle flow

1. Use **Quick Battle · 10 vs 10** to start an automatic match immediately, or choose **Enter the Battle** to customize each kingdom.
2. In custom mode, choose 10, 50, or 100 troops and a troop class for each kingdom, then deploy them on their own side.
3. Start the invasion. Both armies automatically march toward each other.
4. Soldiers and knights engage at close range with animated weapon swings. Archers and mages support from behind with ranged projectiles.
5. Units distribute their targets across the enemy line to reduce pile-ups.
6. When one army is defeated, the surviving army advances to the enemy castle and attacks it until its integrity reaches zero.
7. The game announces the winner when the opposing stronghold falls.

## Tactical AI\n\n- Three selectable AI doctrines: Standard, Veteran, and Warlord\n- Autonomous commander states: engage and siege\n- Spatial-grid enemy acquisition and distributed target assignment\n- Staggered tactical decisions with fixed-step simulation for stable movement\n- AI status telemetry showing survivors, commander orders, and frame rate\n\n## Features

- Pure HTML, CSS, and JavaScript; no framework, package installation, backend, API key, or build step required
- Canvas-based 2D side-view battlefield
- Two opposing kingdoms with clear red/blue identity and castles
- Army sizes: 10, 50, or 100 units per side
- Four troop classes: Soldier, Archer, Knight, and Mage
- Visible heads, torsos, arms, hands, shields, weapons, and health bars
- Animated marching, melee attacks, arrows, magic bolts, hit effects, and siege damage
- Spatial-grid target acquisition and target-load balancing to keep the frontline distributed
- Automatic post-battle march toward the enemy stronghold
- Responsive interface and reduced-motion accessibility support

## Run locally

Open `index.html` in a modern browser, or run:

```bash
python -m http.server 8000
```

Then visit http://localhost:8000.

## Controls

Choose **Quick Battle** for an immediate 10-vs-10 automatic match. For custom games, deploy Red and Blue armies separately, then begin the invasion. Units move, select enemies, attack, and siege automatically. Clicking a unit and destination is optional manual control.

## Project structure

- `index.html` — game interface and overlays
- `styles.css` — responsive styling
- `game.js` — deployment turns, controls, sound, and victory UI
- `game2d.js` — active 2D canvas renderer, commander AI, spatial targeting, fixed-step combat, projectiles, and castle siege
- `game3d.js` — legacy prototype; not loaded by the game

## Deployment

This is a static site. Render should publish the repository root directly; there is no build command and no `dist` directory. Pushes to `main` should trigger the connected Render static-site deployment.

## License

MIT. See [LICENSE](LICENSE).


## Open-ended army sizes

The army-size control accepts any positive whole number rather than a fixed preset list. The default Quick Battle is 200 vs 200. Deployment formations adapt their columns and row spacing to the selected army size so large formations stay within the visible battlefield. The simulation no longer applies fixed projectile or particle count caps. Practical scale is bounded by the player's browser, CPU, memory, and graphics hardware rather than a game-imposed troop ceiling.
