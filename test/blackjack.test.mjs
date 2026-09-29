import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  generateDeck,
  drawRandomCard,
  getCount,
  playDealer,
  resolveOutcome,
  payoutFor,
  canDoubleDown,
  recordOutcome,
  parseSave,
  DEFAULT_STATS,
} from "../lib/blackjack.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, "..");

function card(number, suit) {
  return { number, suit };
}

test("generateDeck produces 52 unique cards", () => {
  const deck = generateDeck();
  assert.equal(deck.length, 52);
  const keys = new Set(deck.map((c) => `${c.number}${c.suit}`));
  assert.equal(keys.size, 52);
});

test("drawRandomCard does not mutate the input deck", () => {
  const deck = generateDeck();
  const snapshot = [...deck];
  const { card: drawn, deck: remaining } = drawRandomCard(deck, () => 0);
  assert.deepEqual(deck, snapshot);
  assert.equal(remaining.length, deck.length - 1);
  assert.ok(drawn);
});

test("drawRandomCard regenerates a fresh deck when given an empty one", () => {
  const { card: drawn, deck: remaining } = drawRandomCard([], () => 0);
  assert.ok(drawn);
  assert.equal(remaining.length, 51);
});

test("getCount handles ace-high and ace-low combinations", () => {
  assert.equal(getCount([card("A", "♠"), card("K", "♦")]), 21);
  assert.equal(getCount([card("A", "♠"), card("A", "♦")]), 12);
  assert.equal(getCount([card("A", "♠"), card("A", "♦"), card(9, "♥")]), 21);
  assert.equal(getCount([card("A", "♠"), card(6, "♦"), card(10, "♥")]), 17);
  assert.equal(getCount([card("K", "♠"), card("Q", "♦"), card(5, "♥")]), 25);
  assert.equal(getCount([card(10, "♠"), card("A", "♦"), card("A", "♥")]), 12);
  assert.equal(getCount([card("K", "♠"), card("A", "♦"), card("A", "♥"), card("A", "♣")]), 13);
  assert.equal(getCount([card("A", "♠"), card("A", "♦"), card("A", "♥"), card("A", "♣"), card(7, "♠")]), 21);
  assert.equal(getCount([card(5, "♠"), card("A", "♦"), card("A", "♥")]), 17);
});

test("playDealer draws until 17 and stands on soft 17", () => {
  // Stub rng always draws index 0 of the remaining deck; build a deck where
  // the dealer starts with A+6 (soft 17) and must stand immediately.
  const deck = generateDeck().filter((c) => !(c.number === "A" && c.suit === "♠") && !(c.number === 6 && c.suit === "♠"));
  const dealerCards = [card("A", "♠"), card(6, "♠")];
  const { dealer } = playDealer(dealerCards, deck, () => 0);
  assert.equal(dealer.count, 17);
  assert.equal(dealer.cards.length, 2);
});

test("playDealer keeps hitting below 17", () => {
  const dealerCards = [card(2, "♠"), card(3, "♦")];
  const deck = [card(4, "♣"), card(9, "♥")];
  // rng() => 0 picks index 0 each draw: first draw picks 4♣ (count 9), second draw
  // from remaining [9♥] picks 9♥ (count 18), then stands.
  const { dealer } = playDealer(dealerCards, deck, () => 0);
  assert.equal(dealer.count, 18);
  assert.equal(dealer.cards.length, 4);
});

test("resolveOutcome covers every branch", () => {
  assert.equal(resolveOutcome(20, 22), "dealerBust");
  assert.equal(resolveOutcome(20, 18), "playerWin");
  assert.equal(resolveOutcome(18, 20), "dealerWin");
  assert.equal(resolveOutcome(19, 19), "push");
});

test("payoutFor covers every outcome including odd-bet natural flooring", () => {
  assert.equal(payoutFor("natural", 5), 12);
  assert.equal(payoutFor("natural", 10), 25);
  assert.equal(payoutFor("dealerBust", 10), 20);
  assert.equal(payoutFor("playerWin", 10), 20);
  assert.equal(payoutFor("push", 10), 10);
  assert.equal(payoutFor("playerBust", 10), 0);
  assert.equal(payoutFor("dealerWin", 10), 0);
});

test("canDoubleDown true/false matrix", () => {
  const twoCards = [card(2, "♠"), card(3, "♦")];
  const threeCards = [card(2, "♠"), card(3, "♦"), card(4, "♥")];

  assert.equal(
    canDoubleDown({ currentBet: 10, gameOver: false, playerCards: twoCards, wallet: 10 }),
    true
  );
  assert.equal(
    canDoubleDown({ currentBet: 0, gameOver: false, playerCards: twoCards, wallet: 10 }),
    false
  );
  assert.equal(
    canDoubleDown({ currentBet: 10, gameOver: true, playerCards: twoCards, wallet: 10 }),
    false
  );
  assert.equal(
    canDoubleDown({ currentBet: 10, gameOver: false, playerCards: threeCards, wallet: 10 }),
    false
  );
  assert.equal(
    canDoubleDown({ currentBet: 10, gameOver: false, playerCards: twoCards, wallet: 5 }),
    false
  );
});

test("recordOutcome tracks counters, peakWallet, and double outcomes", () => {
  let stats = { ...DEFAULT_STATS };

  stats = recordOutcome(stats, "natural", { doubled: false, wallet: 125 });
  assert.equal(stats.handsPlayed, 1);
  assert.equal(stats.wins, 1);
  assert.equal(stats.blackjacks, 1);
  assert.equal(stats.peakWallet, 125);

  stats = recordOutcome(stats, "dealerBust", { doubled: true, wallet: 145 });
  assert.equal(stats.wins, 2);
  assert.equal(stats.doublesWon, 1);
  assert.equal(stats.peakWallet, 145);

  stats = recordOutcome(stats, "playerBust", { doubled: true, wallet: 100 });
  assert.equal(stats.losses, 1);
  assert.equal(stats.doublesLost, 1);
  assert.equal(stats.peakWallet, 145); // unchanged, wallet dropped

  stats = recordOutcome(stats, "push", { wallet: 100 });
  assert.equal(stats.pushes, 1);
  assert.equal(stats.handsPlayed, 4);
});

test("parseSave rejects corrupt data and falls back to defaults", () => {
  assert.deepEqual(parseSave(null), { wallet: 100, stats: DEFAULT_STATS });
  assert.deepEqual(parseSave("not json"), { wallet: 100, stats: DEFAULT_STATS });
  assert.deepEqual(parseSave(JSON.stringify({ v: 99, wallet: 50, stats: {} })), {
    wallet: 100,
    stats: DEFAULT_STATS,
  });
});

test("parseSave rejects negative/NaN/float-garbage wallets", () => {
  const negative = parseSave(JSON.stringify({ v: 1, wallet: -5, stats: {} }));
  assert.equal(negative.wallet, 100);

  const nanWallet = parseSave(JSON.stringify({ v: 1, wallet: "not-a-number", stats: {} }));
  assert.equal(nanWallet.wallet, 100);
});

test("parseSave merges partial stats over defaults", () => {
  const result = parseSave(JSON.stringify({ v: 1, wallet: 40, stats: { wins: 3, losses: "bad" } }));
  assert.equal(result.wallet, 40);
  assert.equal(result.stats.wins, 3);
  assert.equal(result.stats.losses, DEFAULT_STATS.losses);
  assert.equal(result.stats.pushes, DEFAULT_STATS.pushes);
});

test("parseSave round-trips a valid save", () => {
  const stats = { ...DEFAULT_STATS, handsPlayed: 10, wins: 5 };
  const raw = JSON.stringify({ v: 1, wallet: 230, stats });
  const result = parseSave(raw);
  assert.equal(result.wallet, 230);
  assert.deepEqual(result.stats, stats);
});

test("cardImages.js has exactly 52 unique keys, all paths exist on disk", () => {
  const source = fs.readFileSync(path.join(repoRoot, "lib", "cardImages.js"), "utf8");
  const requireRegex = /require\("([^"]+)"\)/g;
  const paths = [];
  let match;
  while ((match = requireRegex.exec(source)) !== null) {
    paths.push(match[1]);
  }

  assert.equal(paths.length, 52);
  assert.equal(new Set(paths).size, 52);

  for (const relativePath of paths) {
    const resolved = path.join(repoRoot, "lib", relativePath);
    assert.ok(fs.existsSync(resolved), `missing asset: ${relativePath}`);
  }
});
