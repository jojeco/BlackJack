# BlackJack

Fully playable Blackjack card game built with React Native (Expo). Features realistic card images, betting mechanics, and full dealer AI logic.

## Features

- Complete 52-card deck with suit/value tracking
- Player wallet with adjustable betting
- Dealer AI following standard Blackjack rules (hit on soft 16, stand on 17)
- Real card images for all suits and face cards
- Ace handling (1 or 11) with automatic soft/hard count
- Win/loss/push detection with wallet updates

## Tech Stack

- **React Native** (Expo) — cross-platform mobile
- **Class-based React components** — state-driven game loop
- **Custom card image assets** — full deck of PNGs

## Running

```bash
npm install
npx expo start
```

Scan QR code with Expo Go on Android/iOS, or run in emulator.

## Game Logic

```
generateDeck() → 52-card array
dealCard()     → pop from shuffled deck, add to hand
calcCount()    → sum hand value, handle Ace as 1 or 11
hit()          → deal card to player, check bust
stand()        → dealer hits until ≥17, evaluate winner
placeBet()     → deduct from wallet, set currentBet
```
