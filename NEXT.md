# Next Increments

Suggestions for future runs, based on things noticed while making the game playable
but left out of scope for this increment:

- **Split and double down** — the game only supports a single player hand per round.
  Splitting on a pair and doubling down (double the bet, take exactly one card, then
  auto-stand) are standard blackjack moves that are still missing.
- **Natural blackjack detection** — a player dealt 21 on the opening two cards should
  win immediately at the traditional 1.5x payout instead of having to press Stand.
- **Persist the wallet across sessions** — `wallet` resets to 100 whenever the app is
  reloaded. Wiring up `AsyncStorage` to save and restore the balance between launches
  would make progress feel real.
- **Tests** — there is no test suite at all. The scoring (`getCount`), bet validation
  (`placeBet`), and win/lose/push logic (`stand`) are all pure-ish and would be
  straightforward to unit test with Jest.
