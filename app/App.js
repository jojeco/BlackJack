import React, { Component } from "react";
import {
  View,
  Text,
  Button,
  TextInput,
  TouchableOpacity,
  ImageBackground,
  Vibration,
} from "react-native";
import { Link, useLocalSearchParams } from "expo-router";
import styles from "../Styles/app-styles.js";
import Icon from "react-native-vector-icons/MaterialIcons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import BackgroundImage from "../assets/Background.jpg";
import indexStyles from "../Styles/index-styles";

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      deck: [],
      dealer: null,
      player: null,
      wallet: 0,
      inputValue: "",
      currentBet: null,
      betPlaced: false,
      gameOver: false,
      message: "",
      isPaused: false,
    };
  }

  componentDidMount() {
    this.loadWallet();
    this.setLimit();
  }

  setLimit = () => {
    // Access the limit parameter passed via route state
    const limit = this.props.route?.state?.limit || 100; // Default to 100 if no limit set
    this.setState({ betLimit: limit });
  };

  loadWallet = async () => {
    try {
      const savedWallet = await AsyncStorage.getItem("wallet");
      if (savedWallet !== null) {
        this.setState({ wallet: parseInt(savedWallet, 10) });
      } else {
        // Set a default value if there's nothing in storage
        this.setState({ wallet: 100 });
        await AsyncStorage.setItem("wallet", "100");
      }
    } catch (error) {
      console.error(
        "Failed to load the wallet amount from AsyncStorage.",
        error
      );
    }
  };

  updateWallet = async (newWalletValue) => {
    try {
      await AsyncStorage.setItem("wallet", newWalletValue.toString());
      this.setState({ wallet: newWalletValue });
    } catch (error) {
      console.error("Failed to save the wallet amount to AsyncStorage.", error);
    }
  };

  generateDeck() {
    const cards = [2, 3, 4, 5, 6, 7, 8, 9, 10, "J", "Q", "K", "A"];
    const suits = ["♦", "♣", "♥", "♠"];
    const deck = [];
    cards.forEach((card) =>
      suits.forEach((suit) => deck.push({ number: card, suit }))
    );
    return deck;
  }
  togglePause = () => {
    this.setState((prevState) => ({ isPaused: !prevState.isPaused }));
  };

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

  canPlaceBet() {
    return this.state.gameOver || this.state.betPlaced === false;
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

  placeBet = async (type = "new") => {
    let { deck, wallet, currentBet, betLimit } = this.state;

    if (type === "new") {
      currentBet = parseInt(this.state.inputValue, 10);
      wallet = 100; // Optionally reset wallet for a new game
      deck = this.generateDeck();
      await AsyncStorage.setItem("wallet", "100"); // Save the reset wallet value
    } else if (type === "rebet") {
      if (deck.length < 10) {
        deck = this.generateDeck();
      }
    }
    console.log("Current Limit:", betLimit);
    if (isNaN(currentBet) || currentBet <= 0 || currentBet > betLimit) {
      this.setState({
        message: "Please enter a valid bet amount within the limit.",
      });
      return;
    } else if (currentBet > wallet) {
      this.setState({ message: "Insufficient funds to bet that amount." });
      return;
    }

    const newWalletValue = wallet - currentBet;
    await AsyncStorage.setItem("wallet", newWalletValue.toString());

    const { updatedDeck, player, dealer } = this.dealCards(deck);
    this.setState({
      deck: updatedDeck,
      dealer,
      player,
      wallet: newWalletValue,
      currentBet,
      betPlaced: true,
      inputValue: "",
      gameOver: false,
      message: "Bet placed. Play your hand!",
    });
  };

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
        this.triggerVibration();
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
          this.triggerVibration();
        } else if (winner === "player" && this.state.player.count === 21) {
          wallet += this.state.currentBet * 2.5;
          message = "Blackjack!";
          this.triggerVibration();
        } else if (winner === "player") {
          wallet += this.state.currentBet * 2;
          message = "You win!";
          this.triggerVibration();
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

  renderCard = (card) => (
    <View style={styles.card}>
      <Text
        style={[
          styles.cardText, // Adjusted for text styling
          card.suit === "♦" || card.suit === "♥" ? styles.cardRed : null,
        ]}
      >
        {card.number}
        {card.suit}
      </Text>
    </View>
  );

  changeBet() {
    this.setState({ betPlaced: false, currentBet: null });
  }

  rebet() {
    console.log(
      "Rebet called. Current Bet:",
      this.state.currentBet,
      "Wallet:",
      this.state.wallet,
      "Game Over:",
      this.state.gameOver
    );

    if (
      this.state.currentBet > 0 &&
      this.state.wallet >= this.state.currentBet &&
      this.state.gameOver
    ) {
      console.log("Placing bet again.");
      this.setState(
        {
          betPlaced: true,
          message: "Your bet has been placed again!",
        },
        () => {
          this.placeBet("rebet"); // Use a distinct type for rebetting
        }
      );
    } else {
      console.log("Failed to place bet.");
      alert(
        "Cannot place the bet. Check your balance, if betting is still open, or if the game is over."
      );
      this.setState({ betPlaced: false });
    }
  }

  // Trigger vibration
  triggerVibration = () => {
    Vibration.vibrate();
  };

  renderPauseScreen() {
    if (this.state.isPaused) {
      return (
        <View style={styles.pauseContainer}>
          <View style={styles.pauseMenu}>
            <Text style={styles.pauseTitle}>Paused</Text>
            <TouchableOpacity
              onPress={this.togglePause}
              style={styles.pauseButtons}
              activeOpacity={0.7} // Optional: Changes the opacity feedback on press, default is 0.2
            >
              <Text style={styles.pauseButtonText}>Resume Game</Text>
            </TouchableOpacity>
            <Link href={"/"} style={styles.pauseButtons}>
              <View>
                <Text>Home</Text>
              </View>
            </Link>
          </View>
        </View>
      );
    }
    return null;
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
      isPaused,
    } = this.state;

    return (
      <ImageBackground source={BackgroundImage} style={styles.container}>
        <TouchableOpacity style={styles.pauseButton} onPress={this.togglePause}>
          <Icon name="pause" size={50} color="#000" />
        </TouchableOpacity>
        {this.renderPauseScreen()}
        <View style={styles.walletContainer}>
          <Text style={styles.walletText}>${wallet}</Text>
          <View style={styles.underline} />
          <Icon name="wallet" size={60} color="#000" />
        </View>
        <View style={styles.playArea}>
          {dealer && (
            <>
              <View style={styles.dealerCards}>
                <Text style={styles.handText}>
                  Dealer's Hand ({dealer.count}):
                </Text>
              </View>
              <View style={styles.cardsContainer}>
                {dealer.cards.map((card, index) => this.renderCard(card))}
              </View>
            </>
          )}

          {player && (
            <>
              <View style={styles.playerCards}>
                <Text style={styles.handText}>Your Hand ({player.count}):</Text>
              </View>
              <View style={styles.cardsContainer}>
                {player.cards.map((card, index) => this.renderCard(card))}
              </View>
            </>
          )}
        </View>
        <Text>{message}</Text>
        <View style={styles.actionContainer}>
          <View style={styles.hitStandContainer}>
            <TouchableOpacity
              style={styles.hitButton}
              onPress={() => this.hit()}
              disabled={!currentBet || gameOver}
            >
              <Text style={styles.hitStandText}>Hit</Text>
              <Icon name="control-point" size={50} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.StandButton}
              onPress={() => this.stand()}
              disabled={!currentBet || gameOver}
            >
              <Text style={styles.hitStandText}>Stand</Text>
              <Icon name="arrow-circle-down" size={50} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.rebetButton}
              onPress={() => this.rebet()}
            >
              <Text style={styles.hitStandText}>Rebet</Text>
              <Icon name="replay" size={50} color="#000" />
            </TouchableOpacity>
          </View>
          <View style={styles.betContainer}>
            <Button
              title="Choose Bet"
              onPress={this.changeBet.bind(this)}
              disabled={!this.canPlaceBet()}
            />
            {!betPlaced && (
              <View style={styles.inputBet}>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={inputValue}
                  onChangeText={(text) => this.inputChange(text)}
                  placeholder="Enter your bet"
                />
                <Button
                  title="Place Bet"
                  onPress={() => this.placeBet()}
                  disabled={!this.canPlaceBet()}
                />
              </View>
            )}
          </View>
        </View>
      </ImageBackground>
    );
  }
}

export default App;
