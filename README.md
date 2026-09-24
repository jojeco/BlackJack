# BlackJack

Fully playable Blackjack card game built with React Native (Expo). Features real card images, betting mechanics, double down, full dealer AI logic, and a saved wallet/stats.

## Features

- Complete 52-card deck with suit/value tracking
- Player wallet with adjustable betting
- Double down on the first two cards
- Dealer AI following standard Blackjack rules (hit below 17, stand on all 17s including soft 17)
- Real card images for all suits and face cards
- Ace handling (1 or 11) with automatic soft/hard count
- Win/loss/push detection with wallet updates
- Wallet and lifetime stats (hands played, wins/losses/pushes, blackjacks, peak wallet) saved between sessions

## Tech Stack

- **React Native** (Expo) — cross-platform mobile
- **Class-based React components** — state-driven game loop
- **Custom card image assets** — full deck of PNGs
- **AsyncStorage** — persists wallet and stats across app restarts

## Running

```bash
npm install
npx expo start
```

Scan QR code with Expo Go on Android/iOS, or run in emulator.

## Tests

```bash
npm test
```

Runs the plain-Node `node --test` suite against `lib/blackjack.js` — no Expo/RN runtime needed.

## Game Logic

The core rules live in `lib/blackjack.js`, a plain module with no React/React Native imports:

```
generateDeck()      → 52-card array
drawRandomCard()     → non-mutating draw, regenerates the deck when empty
getCount()           → sum hand value, handle Ace as 1 or 11
dealInitialHands()   → deal the opening player/dealer hands
playDealer()         → dealer hits until ≥17, stands on soft 17
resolveOutcome()      → compare final counts to a result
payoutFor()           → payout for a given outcome and bet
recordOutcome()       → update lifetime stats after a hand
serializeSave() / parseSave() → wallet+stats save format, with safe defaults for corrupt data
```

Card images live in `lib/cardImages.js` as a static lookup of 52 literal `require()` calls, and persistence lives in `lib/storage.js` on top of AsyncStorage.
