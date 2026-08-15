import React, { Component } from "react";
import { View, Text, Button, TextInput, FlatList, Image } from "react-native";
import styles from "./Styles/app-styles.js";
import cardImages from "./assets/cardImages.js";

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
    const key = `${number}_of_${suits[card.suit]}`;
    return cardImages[key];
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
      message: null,
    });
  };
  inputChange = (text) => this.setState({ inputValue: text.replace(/[^0-9]/g, "") });

  placeBet() {
    const currentBet = Number(this.state.inputValue);

    if (!currentBet || currentBet <= 0) {
      this.setState({ message: "Please enter a valid bet." });
    } else if (currentBet > this.state.wallet) {
      this.setState({ message: "Insufficient funds to bet that amount." });
    } else if (currentBet % 1 !== 0) {
      this.setState({ message: "Please bet whole numbers only." });
    } else {
      // Deduct current bet from wallet
      const wallet = this.state.wallet - currentBet;
      this.setState({ wallet, inputValue: "", currentBet });
    }
  }

  hit = () => {
    if (this.state.gameOver || !this.state.currentBet) return;

    const { randomCard, updatedDeck } = this.getRandomCard(this.state.deck);
    const cards = [...this.state.player.cards, randomCard];
    const count = this.getCount(cards);
    const player = { cards, count };

    if (count > 21) {
      this.setState({
        deck: updatedDeck,
        player,
        gameOver: true,
        message: "Bust! You went over 21.",
      });
    } else {
      this.setState({ deck: updatedDeck, player });
    }
  };

  stand = () => {
    if (this.state.gameOver || !this.state.currentBet) return;

    const { wallet, currentBet } = this.state;
    let deck = this.state.deck;
    let dealerCards = [...this.state.dealer.cards];
    let dealerCount = this.getCount(dealerCards);

    while (dealerCount < 17) {
      const { randomCard, updatedDeck } = this.getRandomCard(deck);
      dealerCards = [...dealerCards, randomCard];
      deck = updatedDeck;
      dealerCount = this.getCount(dealerCards);
    }

    const playerCount = this.state.player.count;
    const bet = Number(currentBet);
    let message;
    let newWallet = wallet;

    if (dealerCount > 21 || playerCount > dealerCount) {
      message = "You win!";
      newWallet = wallet + bet * 2;
    } else if (playerCount === dealerCount) {
      message = "Push. Bet refunded.";
      newWallet = wallet + bet;
    } else {
      message = "Dealer wins.";
    }

    this.setState({
      deck,
      dealer: { cards: dealerCards, count: dealerCount },
      wallet: newWallet,
      gameOver: true,
      message,
    });
  };

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
      return null;  // Skip rendering this item
    }
    const cardImage = this.getCardImage(item);
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
        <View style={styles.buttons}>
          <Button title="New Game" onPress={() => this.startNewGame("new")} />
          <Button title="Hit" onPress={() => this.hit()} disabled={!currentBet || gameOver} />
          <Button title="Stand" onPress={() => this.stand()} disabled={!currentBet || gameOver} />
          <Button title="Next Hand" onPress={() => this.startNewGame("continue")} disabled={!gameOver} />
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




