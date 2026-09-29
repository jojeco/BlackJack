// Pure game-logic helpers for Blackjack. No React/React Native imports here —
// this module is plain JS so it can be exercised directly with `node --test`.

export const RANKS = [2, 3, 4, 5, 6, 7, 8, 9, 10, "J", "Q", "K", "A"];
export const SUITS = ["♦", "♣", "♥", "♠"];

export const STARTING_WALLET = 100;
export const SAVE_VERSION = 1;

export const DEFAULT_STATS = {
  handsPlayed: 0,
  wins: 0,
  losses: 0,
  pushes: 0,
  blackjacks: 0,
  doublesWon: 0,
  doublesLost: 0,
  peakWallet: STARTING_WALLET,
};

export function generateDeck() {
  const deck = [];
  for (const card of RANKS) {
    for (const suit of SUITS) {
      deck.push({ number: card, suit });
    }
  }
  return deck;
}

export function drawRandomCard(deck, rng = Math.random) {
  const sourceDeck = deck && deck.length > 0 ? deck : generateDeck();
  const remaining = [...sourceDeck];
  const randomIndex = Math.floor(rng() * remaining.length);
  const [card] = remaining.splice(randomIndex, 1);
  return { card, deck: remaining };
}

export function getCount(cards) {
  const valid = cards.filter((card) => card.number);

  const total = valid.reduce((sum, card) => {
    if (card.number === "A") return sum + 1;
    if (card.number === "J" || card.number === "Q" || card.number === "K") return sum + 10;
    return sum + card.number;
  }, 0);

  const hasAce = valid.some((card) => card.number === "A");
  return hasAce && total + 10 <= 21 ? total + 10 : total;
}

export function dealInitialHands(deck, rng = Math.random) {
  const draw1 = drawRandomCard(deck, rng);
  const draw2 = drawRandomCard(draw1.deck, rng);
  const draw3 = drawRandomCard(draw2.deck, rng);

  const playerCards = [draw1.card, draw3.card];
  const dealerCards = [draw2.card];

  return {
    deck: draw3.deck,
    player: { cards: playerCards, count: getCount(playerCards) },
    dealer: { cards: dealerCards, count: getCount(dealerCards) },
  };
}

export function playDealer(dealerCards, deck, rng = Math.random) {
  let cards = dealerCards;
  let remainingDeck = deck;
  let count = getCount(cards);

  while (count < 17) {
    const drawn = drawRandomCard(remainingDeck, rng);
    cards = [...cards, drawn.card];
    remainingDeck = drawn.deck;
    count = getCount(cards);
  }

  return { dealer: { cards, count }, deck: remainingDeck };
}

export function resolveOutcome(playerCount, dealerCount) {
  if (dealerCount > 21) return "dealerBust";
  if (playerCount > dealerCount) return "playerWin";
  if (dealerCount > playerCount) return "dealerWin";
  return "push";
}

export function payoutFor(outcome, bet) {
  switch (outcome) {
    case "natural":
      return Math.floor(bet * 2.5);
    case "dealerBust":
    case "playerWin":
      return bet * 2;
    case "push":
      return bet;
    case "playerBust":
    case "dealerWin":
    default:
      return 0;
  }
}

export function messageFor(outcome, { doubled = false } = {}) {
  let message;
  switch (outcome) {
    case "natural":
      message = "Blackjack! You win.";
      break;
    case "playerBust":
      message = "Bust! You lose.";
      break;
    case "dealerBust":
      message = "Dealer busts! You win.";
      break;
    case "playerWin":
      message = "You win!";
      break;
    case "dealerWin":
      message = "Dealer wins.";
      break;
    case "push":
    default:
      message = "Push.";
      break;
  }
  return doubled ? `Doubled down. ${message}` : message;
}

export function canDoubleDown({ currentBet, gameOver, playerCards, wallet }) {
  return Boolean(
    currentBet &&
      !gameOver &&
      playerCards &&
      playerCards.length === 2 &&
      wallet >= currentBet
  );
}

const WIN_OUTCOMES = new Set(["natural", "dealerBust", "playerWin"]);
const LOSS_OUTCOMES = new Set(["playerBust", "dealerWin"]);

export function recordOutcome(stats, outcome, { doubled = false, wallet } = {}) {
  const next = { ...stats, handsPlayed: stats.handsPlayed + 1 };

  if (outcome === "natural") {
    next.wins += 1;
    next.blackjacks += 1;
  } else if (WIN_OUTCOMES.has(outcome)) {
    next.wins += 1;
  } else if (LOSS_OUTCOMES.has(outcome)) {
    next.losses += 1;
  } else {
    next.pushes += 1;
  }

  if (doubled) {
    if (WIN_OUTCOMES.has(outcome)) next.doublesWon += 1;
    else if (LOSS_OUTCOMES.has(outcome)) next.doublesLost += 1;
  }

  if (typeof wallet === "number") {
    next.peakWallet = Math.max(next.peakWallet, wallet);
  }

  return next;
}

export function serializeSave({ wallet, stats }) {
  return JSON.stringify({ v: SAVE_VERSION, wallet, stats });
}

export function parseSave(raw) {
  const defaults = { wallet: STARTING_WALLET, stats: { ...DEFAULT_STATS } };

  if (!raw) return defaults;

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    return defaults;
  }

  if (!parsed || typeof parsed !== "object" || parsed.v !== SAVE_VERSION) {
    return defaults;
  }

  const wallet =
    typeof parsed.wallet === "number" && Number.isFinite(parsed.wallet) && parsed.wallet >= 0
      ? parsed.wallet
      : defaults.wallet;

  const rawStats = parsed.stats && typeof parsed.stats === "object" ? parsed.stats : {};
  const stats = { ...DEFAULT_STATS };
  for (const key of Object.keys(DEFAULT_STATS)) {
    const value = rawStats[key];
    stats[key] = typeof value === "number" && Number.isFinite(value) ? value : DEFAULT_STATS[key];
  }

  return { wallet, stats };
}
