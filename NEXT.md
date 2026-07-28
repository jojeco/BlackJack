# Next increment ideas

- Convert class component to functional component with hooks (useState/useCallback) — the current class style is dated React
- Fix the bet input bug: `currentBet` is stored as string so `currentBet > wallet` is a string comparison; parse with `Number()` at placement time in `placeBet()`
- Add natural blackjack detection (player dealt 21 on opening two cards → auto-win at 1.5× payout)
- Add a "double down" button (visible only after initial deal, before any hits): doubles bet and deals exactly one more card, then auto-stands
