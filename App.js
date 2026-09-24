import React, { Component } from "react";
import { View, Text, Button, TextInput, FlatList, Image } from "react-native";
import styles from "./Styles/app-styles.js";
import { getCardImage } from "./lib/cardImages.js";
import { loadSave, writeSave } from "./lib/storage.js";
import {
  generateDeck,
  drawRandomCard,
  getCount,
  dealInitialHands,
  playDealer,
  resolveOutcome,
  payoutFor,
  messageFor,
  canDoubleDown,
  recordOutcome,
  DEFAULT_STATS,
  STARTING_WALLET,
} from "./lib/blackjack.js";

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      deck: [],
      dealer: { cards: [], count: 0 },
      player: { cards: [], count: 0 },
      wallet: STARTING_WALLET,
      inputValue: "",
      currentBet: null,
      gameOver: false,
      message: "",
      betError: "",
      doubled: false,
      loaded: false,
      stats: DEFAULT_STATS,
    };
  }

  componentDidMount() {
    loadSave().then(({ wallet, stats }) => {
      if (this._unmounted) return;
      this.setState({ wallet, stats, loaded: true });
    });
  }

  componentWillUnmount() {
    this._unmounted = true;
  }

  persist = () => {
    if (!this.state.loaded) return;
    writeSave({ wallet: this.state.wallet, stats: this.state.stats });
  };

  inputChange = (value) => {
    const cleaned = value.replace(/[^0-9]/g, "");
    this.setState({ inputValue: cleaned, betError: "" });
  };

  placeBet = () => {
    if (!this.state.loaded) return;

    const currentBet = parseInt(this.state.inputValue, 10);

    if (!this.state.inputValue || Number.isNaN(currentBet) || currentBet <= 0) {
      this.setState({ betError: "Please enter a bet greater than 0." });
      return;
    }

    if (currentBet > this.state.wallet) {
      this.setState({ betError: "Insufficient funds to bet that amount." });
      return;
    }

    const wallet = this.state.wallet - currentBet;

    let { deck, player, dealer } = this.state;
    let dealtNewHand = false;

    if (this.state.gameOver || player.cards.length === 0) {
      // A bet always deals its own hand — "New Game" only clears the table,
      // it never deals — so this branch covers both a fresh round after a
      // settled one and the very first bet of a session.
      let freshDeck = deck;
      if (!freshDeck || freshDeck.length < 10) {
        freshDeck = generateDeck();
      }
      const dealt = dealInitialHands(freshDeck);
      deck = dealt.deck;
      player = dealt.player;
      dealer = dealt.dealer;
      dealtNewHand = true;
    }

    const dealUpdate = dealtNewHand ? { deck, player, dealer, gameOver: false } : {};
    const isNatural = player.cards.length === 2 && player.count === 21;

    this.setState(
      {
        wallet,
        inputValue: "",
        currentBet,
        message: "",
        betError: "",
        doubled: false,
        ...dealUpdate,
      },
      () => {
        this.persist();
        if (isNatural) {
          this.settleRound("natural", { bet: currentBet, wallet });
        }
      }
    );
  };

  hit = () => {
    if (!this.state.loaded || !this.state.currentBet || this.state.gameOver) return;

    const { card, deck } = drawRandomCard(this.state.deck);
    const cards = [...this.state.player.cards, card];
    const count = getCount(cards);
    const player = { cards, count };

    // Use the setState callback (not a bare follow-on call) so hit()'s own
    // deck/player update is guaranteed flushed before stand() reads this.state.
    this.setState({ deck, player }, () => {
      if (count > 21) {
        this.settleRound("playerBust");
      } else if (count === 21) {
        this.stand();
      }
    });
  };

  stand = () => {
    if (!this.state.loaded || !this.state.currentBet || this.state.gameOver) return;

    const player = this.state.player;
    const { dealer, deck } = playDealer(this.state.dealer.cards, this.state.deck);

    this.setState({ deck, dealer });

    const outcome = resolveOutcome(player.count, dealer.count);
    this.settleRound(outcome);
  };

  doubleDown = () => {
    if (!this.state.loaded) return;

    const { currentBet, gameOver, player, wallet, deck } = this.state;
    if (!canDoubleDown({ currentBet, gameOver, playerCards: player.cards, wallet })) return;

    const { card, deck: updatedDeck } = drawRandomCard(deck);
    const cards = [...player.cards, card];
    const count = getCount(cards);
    const newPlayer = { cards, count };
    const newWallet = wallet - currentBet;
    const newBet = currentBet * 2;

    this.setState(
      { wallet: newWallet, currentBet: newBet, deck: updatedDeck, player: newPlayer, doubled: true },
      () => {
        if (count > 21) {
          this.settleRound("playerBust");
        } else {
          this.stand();
        }
      }
    );
  };

  settleRound(outcome, overrides = {}) {
    const bet = overrides.bet !== undefined ? overrides.bet : this.state.currentBet;
    const walletBeforePayout = overrides.wallet !== undefined ? overrides.wallet : this.state.wallet;
    const doubled = this.state.doubled;

    const payout = payoutFor(outcome, bet);
    const wallet = walletBeforePayout + payout;

    let message = messageFor(outcome, { doubled });
    if (wallet <= 0) {
      message += " You're out of chips.";
    }

    const stats = recordOutcome(this.state.stats, outcome, { doubled, wallet });

    this.setState({ wallet, gameOver: true, currentBet: null, message, stats }, () => {
      this.persist();
    });
  }

  startNewGame = () => {
    if (!this.state.loaded) return;
    if (this.state.currentBet && !this.state.gameOver) return;

    let deck = this.state.deck;
    if (!deck || deck.length < 10) {
      deck = generateDeck();
    }

    this.setState({
      deck,
      player: { cards: [], count: 0 },
      dealer: { cards: [], count: 0 },
      message: "",
      betError: "",
      doubled: false,
      currentBet: null,
      gameOver: false,
    });
  };

  restartWallet = () => {
    if (!this.state.loaded) return;

    this.setState(
      {
        wallet: STARTING_WALLET,
        deck: generateDeck(),
        player: { cards: [], count: 0 },
        dealer: { cards: [], count: 0 },
        message: "",
        betError: "",
        doubled: false,
        currentBet: null,
        gameOver: false,
      },
      () => this.persist()
    );
  };

  renderCard = ({ item }) => {
    if (!item.number || !item.suit) {
      console.error("Invalid item:", item);
      return null; // Skip rendering this item
    }
    const cardImage = getCardImage(item);
    if (!cardImage) {
      const isRed = item.suit === "♦" || item.suit === "♥";
      return (
        <View style={{ margin: 5 }}>
          <View style={[styles.card, isRed && styles.cardRed]}>
            <Text style={isRed ? styles.cardRed : null}>
              {item.number}
              {item.suit}
            </Text>
          </View>
        </View>
      );
    }
    return (
      <View style={{ margin: 5 }}>
        <Image source={cardImage} style={{ width: 100, height: 150 }} />
      </View>
    );
  };

  render() {
    const {
      dealer,
      player,
      wallet,
      inputValue,
      currentBet,
      message,
      betError,
      gameOver,
      loaded,
      stats,
    } = this.state;
    // Derived, not stored: broke only once no bet is live (wallet hits 0 mid-round on an all-in).
    const isBroke = wallet <= 0 && !currentBet;
    const doubleEnabled =
      loaded &&
      canDoubleDown({ currentBet, gameOver, playerCards: player.cards, wallet });

    return (
      <View style={styles.container}>
        <View style={styles.buttonContainer}>
          <Button
            title="New Game"
            onPress={this.startNewGame}
            disabled={!loaded || (!!currentBet && !gameOver)}
          />
          <Button title="Hit" onPress={this.hit} disabled={!loaded || !currentBet || gameOver} />
          <Button title="Stand" onPress={this.stand} disabled={!loaded || !currentBet || gameOver} />
          <Button title="Double" onPress={this.doubleDown} disabled={!doubleEnabled} />
        </View>
        {!loaded ? (
          <Text style={styles.loadingText}>Loading…</Text>
        ) : (
          <>
            <Text>Wallet: ${wallet}</Text>
            <Text style={styles.statsText}>
              Hands {stats.handsPlayed} · W {stats.wins} / L {stats.losses} / P {stats.pushes} · BJ{" "}
              {stats.blackjacks} · Peak ${stats.peakWallet}
            </Text>
            {isBroke ? (
              <View style={styles.brokePanel}>
                <Text style={styles.brokeText}>Out of chips! You can't place another bet.</Text>
                <Button title="Restart with $100" onPress={this.restartWallet} />
              </View>
            ) : (
              !currentBet && (
                <View style={styles.inputBet}>
                  <TextInput
                    keyboardType="numeric"
                    value={inputValue}
                    onChangeText={this.inputChange}
                    placeholder="Enter your bet"
                  />
                  <Button title="Place Bet" onPress={this.placeBet} />
                </View>
              )
            )}
            {betError ? <Text style={styles.errorText}>{betError}</Text> : null}
          </>
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
