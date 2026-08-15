// Static map of card key -> require()'d image module.
// React Native's Metro bundler needs static require() calls for local
// images; it cannot resolve dynamically-built `{ uri: './...' }` strings.
// Keys match the format built by App.js's getCardImage: "<name>_of_<suit>".
// Only the 52 base cards are included (the "*2.png" duplicate variants and
// joker images in assets/cards/ are intentionally excluded).

const cardImages = {
  // Clubs
  "2_of_clubs": require("./cards/2_of_clubs.png"),
  "3_of_clubs": require("./cards/3_of_clubs.png"),
  "4_of_clubs": require("./cards/4_of_clubs.png"),
  "5_of_clubs": require("./cards/5_of_clubs.png"),
  "6_of_clubs": require("./cards/6_of_clubs.png"),
  "7_of_clubs": require("./cards/7_of_clubs.png"),
  "8_of_clubs": require("./cards/8_of_clubs.png"),
  "9_of_clubs": require("./cards/9_of_clubs.png"),
  "10_of_clubs": require("./cards/10_of_clubs.png"),
  "jack_of_clubs": require("./cards/jack_of_clubs.png"),
  "queen_of_clubs": require("./cards/queen_of_clubs.png"),
  "king_of_clubs": require("./cards/king_of_clubs.png"),
  "ace_of_clubs": require("./cards/ace_of_clubs.png"),

  // Diamonds
  "2_of_diamonds": require("./cards/2_of_diamonds.png"),
  "3_of_diamonds": require("./cards/3_of_diamonds.png"),
  "4_of_diamonds": require("./cards/4_of_diamonds.png"),
  "5_of_diamonds": require("./cards/5_of_diamonds.png"),
  "6_of_diamonds": require("./cards/6_of_diamonds.png"),
  "7_of_diamonds": require("./cards/7_of_diamonds.png"),
  "8_of_diamonds": require("./cards/8_of_diamonds.png"),
  "9_of_diamonds": require("./cards/9_of_diamonds.png"),
  "10_of_diamonds": require("./cards/10_of_diamonds.png"),
  "jack_of_diamonds": require("./cards/jack_of_diamonds.png"),
  "queen_of_diamonds": require("./cards/queen_of_diamonds.png"),
  "king_of_diamonds": require("./cards/king_of_diamonds.png"),
  "ace_of_diamonds": require("./cards/ace_of_diamonds.png"),

  // Hearts
  "2_of_hearts": require("./cards/2_of_hearts.png"),
  "3_of_hearts": require("./cards/3_of_hearts.png"),
  "4_of_hearts": require("./cards/4_of_hearts.png"),
  "5_of_hearts": require("./cards/5_of_hearts.png"),
  "6_of_hearts": require("./cards/6_of_hearts.png"),
  "7_of_hearts": require("./cards/7_of_hearts.png"),
  "8_of_hearts": require("./cards/8_of_hearts.png"),
  "9_of_hearts": require("./cards/9_of_hearts.png"),
  "10_of_hearts": require("./cards/10_of_hearts.png"),
  "jack_of_hearts": require("./cards/jack_of_hearts.png"),
  "queen_of_hearts": require("./cards/queen_of_hearts.png"),
  "king_of_hearts": require("./cards/king_of_hearts.png"),
  "ace_of_hearts": require("./cards/ace_of_hearts.png"),

  // Spades
  "2_of_spades": require("./cards/2_of_spades.png"),
  "3_of_spades": require("./cards/3_of_spades.png"),
  "4_of_spades": require("./cards/4_of_spades.png"),
  "5_of_spades": require("./cards/5_of_spades.png"),
  "6_of_spades": require("./cards/6_of_spades.png"),
  "7_of_spades": require("./cards/7_of_spades.png"),
  "8_of_spades": require("./cards/8_of_spades.png"),
  "9_of_spades": require("./cards/9_of_spades.png"),
  "10_of_spades": require("./cards/10_of_spades.png"),
  "jack_of_spades": require("./cards/jack_of_spades.png"),
  "queen_of_spades": require("./cards/queen_of_spades.png"),
  "king_of_spades": require("./cards/king_of_spades.png"),
  "ace_of_spades": require("./cards/ace_of_spades.png"),
};

export default cardImages;
