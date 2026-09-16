import React, { Component } from "react";
import { View, Text, Button, TextInput, FlatList, Image } from "react-native";
import styles from "./Styles/app-styles.js";

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      deck: [],
      dealer: { cards: [], count: 0 },
      player: { cards: [], count: 0 },
      wallet: 100,
      inputValue: "",
      currentBet: null,
      gameOver: false,
      message: "",
    };
  }

  generateDeck() {
    const cards = [2, 3, 4, 5, 6, 7, 8, 9, 10, "J", "Q", "K", "A"];
    const suits = ["♦", "♣", "♥", "♠"];
    const deck = [];
    for (const card of cards) {
      for (const suit of suits) {
        deck.push({ number: card, suit });
      }
    }
    return deck;
  }

  inputChange = (value) => {
    const cleaned = value.replace(/[^0-9]/g, "");
    this.setState({ inputValue: cleaned });
  };

  getCardImage = (card) => {
    const suits = {
      "♦": "diamonds",
      "♣": "clubs",
      "♥": "hearts",
      "♠": "spades",
    };
    
    const cardNames = {
      "J": "jack",
      "Q": "queen",
      "K": "king",
      "A": "ace"
    };
  
    const number = cardNames[card.number] || card.number.toString();  // Map face cards to their names, or convert number to string
    const uri = `./assets/cards/${number}_of_${suits[card.suit]}.png`;
    return { uri };
    
  };
  

  dealCards(deck) {
    const playerCard1 = this.getRandomCard(deck);
    const dealerCard1 = this.getRandomCard(playerCard1.updatedDeck);
    const playerCard2 = this.getRandomCard(dealerCard1.updatedDeck);
    const playerStartingHand = [playerCard1.randomCard, playerCard2.randomCard];
    const dealerStartingHand = [dealerCard1.randomCard];

    const player = {
      cards: playerStartingHand,
      count: this.getCount(playerStartingHand),
    };
    const dealer = {
      cards: dealerStartingHand,
      count: this.getCount(dealerStartingHand),
    };

    return { updatedDeck: playerCard2.updatedDeck, player, dealer };
  }

  startNewGame = (type = "new") => {
    let deck = this.state.deck;
    let wallet = this.state.wallet;

    if (type === "new") {
      wallet = 100;
      deck = this.generateDeck();
    } else if (type === "continue") {
      if (deck.length < 10 || wallet <= 0) {
        deck = this.generateDeck();
        wallet = this.state.wallet > 0 ? this.state.wallet : 100;
      }
    }

    const { updatedDeck, player, dealer } = this.dealCards(deck);
    this.setState({
      deck: updatedDeck,
      dealer,
      player,
      wallet,
      inputValue: "",
      currentBet: null,
      gameOver: false,
      message: "",
    });
  };
  placeBet() {
    const currentBet = parseInt(this.state.inputValue, 10);

    if (!this.state.inputValue || Number.isNaN(currentBet) || currentBet <= 0) {
      this.setState({ message: "Please enter a bet greater than 0." });
      return;
    }

    if (currentBet > this.state.wallet) {
      this.setState({ message: "Insufficient funds to bet that amount." });
    } else {
      // Deduct current bet from wallet
      const wallet = this.state.wallet - currentBet;

      let { deck, player, dealer } = this.state;
      let dealtNewHand = false;

      if (this.state.gameOver || player.cards.length === 0) {
        // Previous round was settled, or no hand exists yet (bet placed before
        // "New Game" was ever pressed) — deal a fresh hand for this round.
        let freshDeck = deck;
        if (freshDeck.length < 10) {
          freshDeck = this.generateDeck();
        }
        const dealt = this.dealCards(freshDeck);
        deck = dealt.updatedDeck;
        player = dealt.player;
        dealer = dealt.dealer;
        dealtNewHand = true;
      }

      const dealUpdate = dealtNewHand ? { deck, player, dealer, gameOver: false } : {};

      if (player.cards.length === 2 && player.count === 21) {
        // Natural blackjack — settle immediately (dealer holds one card, can't have a natural).
        this.setState({ wallet, inputValue: "", currentBet, message: "", ...dealUpdate });
        this.settleRound("natural", { bet: currentBet, wallet });
      } else {
        this.setState({ wallet, inputValue: "", currentBet, message: "", ...dealUpdate });
      }
    }
  }

  drawCard(deck) {
    let sourceDeck = deck;
    if (!sourceDeck || sourceDeck.length === 0) {
      sourceDeck = this.generateDeck();
    }
    const { randomCard, updatedDeck } = this.getRandomCard(sourceDeck);
    return { card: randomCard, updatedDeck };
  }

  hit() {
    if (!this.state.currentBet || this.state.gameOver) return;

    const { card, updatedDeck } = this.drawCard(this.state.deck);
    const cards = [...this.state.player.cards, card];
    const count = this.getCount(cards);
    const player = { cards, count };

    // Use the setState callback (not a bare follow-on call) so hit()'s own
    // deck/player update is guaranteed flushed before stand() reads this.state.
    this.setState({ deck: updatedDeck, player }, () => {
      if (count > 21) {
        this.settleRound("playerBust");
      } else if (count === 21) {
        this.stand();
      }
    });
  }

  stand() {
    if (!this.state.currentBet || this.state.gameOver) return;

    let deck = this.state.deck;
    const player = this.state.player;

    let cards = this.state.dealer.cards;
    let count = this.getCount(cards);

    while (count < 17) {
      const drawn = this.drawCard(deck);
      cards = [...cards, drawn.card];
      deck = drawn.updatedDeck;
      count = this.getCount(cards);
    }

    const dealer = { cards, count };
    this.setState({ deck, dealer });

    let outcome;
    if (count > 21) outcome = "dealerBust";
    else if (player.count > count) outcome = "playerWin";
    else if (count > player.count) outcome = "dealerWin";
    else outcome = "push";

    this.settleRound(outcome);
  }

  settleRound(outcome, overrides = {}) {
    const bet = overrides.bet !== undefined ? overrides.bet : this.state.currentBet;
    const walletBeforePayout = overrides.wallet !== undefined ? overrides.wallet : this.state.wallet;

    let payout = 0;
    let message = "";

    switch (outcome) {
      case "natural":
        payout = Math.floor(bet * 2.5);
        message = "Blackjack! You win.";
        break;
      case "playerBust":
        payout = 0;
        message = "Bust! You lose.";
        break;
      case "dealerBust":
        payout = bet * 2;
        message = "Dealer busts! You win.";
        break;
      case "playerWin":
        payout = bet * 2;
        message = "You win!";
        break;
      case "dealerWin":
        payout = 0;
        message = "Dealer wins.";
        break;
      case "push":
      default:
        payout = bet;
        message = "Push.";
        break;
    }

    const wallet = walletBeforePayout + payout;
    this.setState({ wallet, gameOver: true, currentBet: null, message });
  }

  getRandomCard(deck) {
    const updatedDeck = [...deck];  // Copy the deck to avoid direct mutation
    const randomIndex = Math.floor(Math.random() * updatedDeck.length);
    const randomCard = updatedDeck[randomIndex];
    updatedDeck.splice(randomIndex, 1);
    return { randomCard, updatedDeck };
  }

  getCount(cards) {
    const rearranged = cards.filter(card => card.number).reduce((acc, card) => {
      if (card.number === "A") acc.push(card);
      else acc.unshift(card);
      return acc;
    }, []);

    return rearranged.reduce((total, card) => {
      if (card.number === "J" || card.number === "Q" || card.number === "K") return total + 10;
      else if (card.number === "A") return total + 11 <= 21 ? total + 11 : total + 1;
      return total + card.number;
    }, 0);
  }

  renderCard = ({ item }) => {
    if (!item.number || !item.suit) {
      console.error("Invalid item:", item);
      return null;  // Skip rendering this item
    }
    const cardImage = this.getCardImage(item);
    console.log(cardImage.uri);
    return (
      <View style={{ margin: 5 }}>
        <Image source={cardImage} style={{ width: 100, height: 150 }} />

      </View>
    );
  };

  render() {
    const { dealer, player, wallet, inputValue, currentBet, message, gameOver } = this.state;
    return (
      <View style={styles.container}>
        <View style={styles.buttonContainer}>
          <Button title="New Game" onPress={() => this.startNewGame("new")} />
          <Button title="Hit" onPress={() => this.hit()} disabled={!currentBet || gameOver} />
          <Button title="Stand" onPress={() => this.stand()} disabled={!currentBet || gameOver} />
        </View>
        <Text>Wallet: ${wallet}</Text>
        {!currentBet && (
          <View style={styles.inputBet}>
            <TextInput
              keyboardType="numeric"
              value={inputValue}
              onChangeText={this.inputChange}
              placeholder="Enter your bet"
            />
            <Button title="Place Bet" onPress={() => this.placeBet()} />
          </View>
        )}
        {player && player.cards.length > 0 && (
          <>
            <Text>Your Hand ({player.count})</Text>
            <FlatList
              data={player.cards}
              renderItem={this.renderCard}
              keyExtractor={(item, index) => `player-${item.number}${item.suit}-${index}`}
            />
          </>
        )}
        {dealer && dealer.cards.length > 0 && (
          <>
            <Text>Dealer's Hand ({dealer.count})</Text>
            <FlatList
              data={dealer.cards}
              renderItem={this.renderCard}
              keyExtractor={(item, index) => `dealer-${item.suit}-${index}`}
            />
          </>
        )}
        <Text>{message}</Text>
      </View>
    );
  }
}

export default App;




