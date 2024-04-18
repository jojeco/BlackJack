import React, { Component } from "react";
import { View, Text, Button, TextInput, FlatList } from "react-native";
import styles from "./Styles/app-styles.js";

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      deck: [],
      dealer: null,
      player: null,
      wallet: 100,
      inputValue: "",
      currentBet: null,
      betPlaced: false,
      gameOver: false,
      message: "",
    };
  }

  generateDeck() {
    const cards = [2, 3, 4, 5, 6, 7, 8, 9, 10, "J", "Q", "K", "A"];
    const suits = ["♦", "♣", "♥", "♠"];
    const deck = [];
    cards.forEach((card) =>
      suits.forEach((suit) => deck.push({ number: card, suit }))
    );
    return deck;
  }

  dealCards(deck) {
    const playerCard1 = this.getRandomCard(deck);
    const dealerCard1 = this.getRandomCard(playerCard1.updatedDeck);
    const playerCard2 = this.getRandomCard(dealerCard1.updatedDeck);
    const playerStartingHand = [playerCard1.randomCard, playerCard2.randomCard];
    const dealerStartingHand = [dealerCard1.randomCard, {}];

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

  // Simplified to include only relevant new changes
  startNewGame(type = "new") {
    let { deck, wallet } = this.state;
    if (type === "new") {
      wallet = 100;
      deck = this.generateDeck();
    } else if (type === "continue" && deck.length < 10) {
      deck = this.generateDeck();
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
  }

  getRandomCard(deck) {
    const updatedDeck = deck;
    const randomIndex = Math.floor(Math.random() * updatedDeck.length);
    const randomCard = updatedDeck[randomIndex];
    updatedDeck.splice(randomIndex, 1);
    return { randomCard, updatedDeck };
  }
  canChangeBet() {
    const { dealer, player, gameOver } = this.state;
    // Allow betting if there are no cards dealt and game is not over
    return (
      !gameOver &&
      (!player || player.cards.length === 0) &&
      (!dealer || dealer.cards.length === 0)
    );
  }

  placeBet() {
    const currentBet = parseInt(this.state.inputValue, 10);
    if (currentBet > this.state.wallet) {
      this.setState({ message: "Insufficient funds to bet that amount." });
    } else if (isNaN(currentBet) || currentBet <= 0) {
      this.setState({ message: "Please enter a valid bet amount." });
    } else {
      this.setState({
        wallet: this.state.wallet - currentBet,
        currentBet,
        betPlaced: true, // Bet is now placed
        inputValue: "",
      });
    }
  }

  hit() {
    if (!this.state.gameOver) {
      if (this.state.currentBet) {
        const { randomCard, updatedDeck } = this.getRandomCard(this.state.deck);
        const player = this.state.player;
        player.cards.push(randomCard);
        player.count = this.getCount(player.cards);

        if (player.count > 21) {
          this.setState({ player, gameOver: true, message: "BUST!" });
        } else {
          this.setState({ deck: updatedDeck, player });
        }
      } else {
        this.setState({ message: "Please place bet." });
      }
    } else {
      this.setState({ message: "Game over! Please start a new game." });
    }
  }

  dealerDraw(dealer, deck) {
    const { randomCard, updatedDeck } = this.getRandomCard(deck);
    dealer.cards.push(randomCard);
    dealer.count = this.getCount(dealer.cards);
    return { dealer, updatedDeck };
  }

  getCount(cards) {
    const rearranged = [];
    cards.forEach((card) => {
      if (card.number === "A") {
        rearranged.push(card);
      } else if (card.number) {
        rearranged.unshift(card);
      }

      // (card.number === 'A') ? rearranged.push(card) : rearranged.unshift(card);
    });

    return rearranged.reduce((total, card) => {
      if (card.number === "J" || card.number === "Q" || card.number === "K") {
        return total + 10;
      } else if (card.number === "A") {
        return total + 11 <= 21 ? total + 11 : total + 1;
      } else {
        return total + card.number;
      }
    }, 0);
  }

  stand() {
    if (!this.state.gameOver) {
      // Show dealer's 2nd card
      const randomCard = this.getRandomCard(this.state.deck);
      let deck = randomCard.updatedDeck;
      let dealer = this.state.dealer;
      dealer.cards.pop();
      dealer.cards.push(randomCard.randomCard);
      dealer.count = this.getCount(dealer.cards);

      // Keep drawing cards until count is 17 or more
      while (dealer.count < 17) {
        const draw = this.dealerDraw(dealer, deck);
        dealer = draw.dealer;
        deck = draw.updatedDeck;
      }

      if (dealer.count > 21) {
        this.setState({
          deck,
          dealer,
          wallet: this.state.wallet + this.state.currentBet * 2,
          gameOver: true,
          message: "Dealer bust! You win!",
        });
      } else {
        const winner = this.getWinner(dealer, this.state.player);
        let wallet = this.state.wallet;
        let message;

        if (winner === "dealer") {
          message = "Dealer wins...";
        } else if (
          winner === "player" &&
          this.state.player.count === 21 &&
          this.state.player.cards.length === 2
        ) {
          wallet += this.state.currentBet * 2.5;
          message = "Blackjack! You win!";
        } else if (winner === "player") {
          wallet += this.state.currentBet * 2;
          message = "You win!";
        } else {
          wallet += this.state.currentBet;
          message = "Push.";
        }

        this.setState({
          deck,
          dealer,
          wallet,
          gameOver: true,
          message,
        });
      }
    } else {
      this.setState({ message: "Game over! Please start a new game." });
    }
  }

  getWinner(dealer, player) {
    if (dealer.count > player.count) {
      return "dealer";
    } else if (dealer.count < player.count) {
      return "player";
    } else {
      return "push";
    }
  }

  inputChange = (text) => {
    this.setState({ inputValue: text });
  };

  renderCard = ({ item }) => (
    <Text
      style={[
        styles.card,
        item.suit === "♦" || item.suit === "♥" ? styles.cardRed : null,
      ]}
    >
      {item.number}
      {item.suit}
    </Text>
  );
  changeBet() {
    this.setState({ betPlaced: false, currentBet: null });
  }

  render() {
    const {
      dealer,
      player,
      wallet,
      inputValue,
      currentBet,
      message,
      gameOver,
      betPlaced,
    } = this.state;
    return (
      <View style={styles.container}>
        <View style={styles.buttons}>
          <Button title="New Game" onPress={() => this.startNewGame()} />
          {gameOver && (
            <Button
              title="Continue"
              onPress={() => this.startNewGame("continue")}
            />
          )}
          <Button
            title="Hit"
            onPress={() => this.hit()}
            disabled={!currentBet || gameOver}
          />
          <Button
            title="Stand"
            onPress={() => this.stand()}
            disabled={!currentBet || gameOver}
          />
          <Button
            title="Change Bet"
            onPress={this.changeBet.bind(this)}
            disabled={gameOver}
          />
        </View>
        <Text>Wallet: ${wallet}</Text>
        {!betPlaced && (
          <View style={styles.inputBet}>
            <TextInput
              keyboardType="numeric"
              value={inputValue}
              onChangeText={(text) => this.setState({ inputValue: text })}
              placeholder="Enter your bet"
            />
            <Button title="Place Bet" onPress={() => this.placeBet()} />
          </View>
        )}
        {player && (
          <>
            <Text>Your Hand ({player.count})</Text>
            <FlatList
              data={player.cards}
              renderItem={this.renderCard}
              keyExtractor={(item, index) => index.toString()}
            />
          </>
        )}
        {dealer && (
          <>
            <Text>Dealer's Hand ({dealer.count})</Text>
            <FlatList
              data={dealer.cards}
              renderItem={this.renderCard}
              keyExtractor={(item, index) => index.toString()}
            />
          </>
        )}
        <Text>{message}</Text>
      </View>
    );
  }
}

export default App;
