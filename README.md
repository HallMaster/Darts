# 🎯 Dart Night!

A fun, browser-based darts scoring app. No installation, no account — just open and play.

## Getting Started

Open `index.html` in any modern web browser. That's it.

## Games

**Cricket** — Players take turns hitting 15, 16, 17, 18, 19, 20, and Bull. Hit each number 3 times to "open" it and start scoring points. Once all players have opened a number it's closed — no more points. First player to open all numbers with the highest score wins.

**Around the World** — Hit numbers 1 through 20 in order, then finish on Bull. Your current target glows on the board. First to Bull wins.

**301 / 501** — Each player starts at 301 or 501 and counts down to exactly zero. Going below zero is a bust — your turn is voided and your score resets to what it was at the start of that turn.

**Killer Darts** — Each player is randomly assigned a number. Hit the *double* of your number to become a Killer. Once a Killer, hit other players' numbers to drain their 5 lives. Last player standing wins.

## How to Play

1. Pick a game from the home screen.
2. Set the number of players (2–8) and enter names.
3. On your turn, click the dartboard segment where each dart lands.
4. The turn advances automatically after your 3rd dart, or click **End Turn** whenever you're ready.
5. Use **↩ Undo** to take back the last dart if you mis-clicked.

## Files

```
index.html          Main entry point
css/styles.css      Styles and animations
js/dartboard.js     SVG dartboard renderer
js/app.js           Main app controller
js/games/
  cricket.js        Cricket logic
  atw.js            Around the World logic
  x01.js            301 / 501 logic
  killer.js         Killer Darts logic
```

No build step, no dependencies, no internet connection required (fonts load from Google Fonts if online, otherwise fall back gracefully).
