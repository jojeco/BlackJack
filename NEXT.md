# Next increment ideas

- ✅ **Done.** `hit()`, `stand()`, `settleRound()`, and `drawCard()` are now implemented in `App.js`. A full round is playable end to end: bet → hit/stand → dealer plays out to S17 → settlement (natural/bust/dealer-bust/win/lose/push) writes the wallet and re-shows the bet input for the next round without needing "New Game".
- ✅ **Resolved.** `getCardImage`'s asset paths were verified: all 52 standard `{number|face}_of_{suit}.png` filenames exist under `assets/cards/` (the extra `*2.png` variants and `black_joker.png` in that folder are unused, not a gap).
- ~~`startNewGame`'s `"continue"` branch cleanup~~ ✅ **Done.** Grep showed zero callers of `"continue"` anywhere in the repo (the only call site is the "New Game" button, which passes `"new"`), so the dead branch was deleted rather than tightened.
- ✅ **Done.** "Out of chips" state: `render()` derives `isBroke = wallet <= 0 && !currentBet` (no new state field) and swaps the bet input for a panel with a "Restart with $100" button. `settleRound()` appends "You're out of chips." when the payout leaves the wallet at 0. The panel stays hidden mid-round (an all-in leaves wallet 0 with a live bet), and a win from 0 restores the bet input.
- Clear `message` (stale "Insufficient funds" / "Please enter a bet…") as soon as the player edits the bet field in `inputChange`, ideally with an `errorText` style.
- Double-down: allow doubling the bet on the first two cards (needs wallet >= bet, draws exactly one card, then stands).
- Split pairs, or an insurance option when the dealer shows an ace.
- Basic wallet persistence (AsyncStorage) so the balance survives an app restart.
