import React, { Component } from "react";
import { View, Text, TextInput, Image, Pressable, Animated, Modal, StyleSheet, ScrollView, useWindowDimensions, SafeAreaView } from "react-native";
import { colors, spacing, radius, type, shadow } from "./theme.js";
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

// Helper for responsive layout
const ResponsiveContainer = ({ children }) => {
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.root, isDesktop && styles.rootDesktop]}>
        <View style={[styles.appContainer, isDesktop && styles.appContainerDesktop]}>
          {children}
        </View>
      </View>
    </SafeAreaView>
  );
};

class BlackJackGame extends Component {
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
      showAbout: false,
    };
    this.animResult = new Animated.Value(0);
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

    // Reset animation
    this.animResult.setValue(0);

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
      Animated.timing(this.animResult, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    });
  }

  startNewGame = () => {
    if (!this.state.loaded) return;
    if (this.state.currentBet && !this.state.gameOver) return;

    let deck = this.state.deck;
    if (!deck || deck.length < 10) {
      deck = generateDeck();
    }

    this.animResult.setValue(0);

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
    this.animResult.setValue(0);
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

  resetStats = () => {
    // Keep peak honest: the current wallet is the floor for the new peak.
    this.setState((s) => ({ stats: { ...DEFAULT_STATS, peakWallet: Math.max(DEFAULT_STATS.peakWallet, s.wallet) } }), () => this.persist());
  };

  addChip = (amount) => {
    const current = parseInt(this.state.inputValue || "0", 10);
    this.setState({ inputValue: (current + amount).toString(), betError: "" });
  };

  clearBet = () => {
    this.setState({ inputValue: "", betError: "" });
  };

  renderCard = ({ item, index }) => {
    if (!item.number || !item.suit) return null;
    const cardImage = getCardImage(item);
    
    // Calculate overlap: index * -60 to overlap horizontally
    const size = this.props.compact ? styles.cardCompact : null;
    const overlapOffset = index > 0 ? (this.props.compact ? -40 : -50) : 0;
    
    if (!cardImage) {
      const isRed = item.suit === "♦" || item.suit === "♥";
      return (
        <View style={[styles.cardPlaceholder, size, { marginLeft: overlapOffset }]}>
          <Text style={[styles.cardPlaceholderText, isRed && { color: colors.cardRed }]}>
            {item.number}
            {item.suit}
          </Text>
        </View>
      );
    }
    return (
      <Image source={cardImage} style={[styles.cardImage, size, { marginLeft: overlapOffset }]} />
    );
  };

  renderResultBanner = () => {
    const { gameOver, message } = this.state;
    const animResult = this.animResult;
    if (!gameOver || !message) return null;

    // Outcome strings come from settleRound in lib/blackjack.js ("You win!", "Dealer wins.", "Dealer busts! You win.", "Push.").
    let bannerColor = colors.loss;
    if (/you win/i.test(message)) bannerColor = colors.win;
    else if (/push/i.test(message)) bannerColor = colors.push;

    return (
      <Animated.View style={[styles.resultBanner, { backgroundColor: bannerColor, opacity: animResult, transform: [{ scale: animResult.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) }] }]}>
        <Text style={styles.resultText}>{message}</Text>
      </Animated.View>
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
      showAbout,
    } = this.state;
    
    const isBroke = wallet <= 0 && !currentBet;
    const doubleEnabled =
      loaded &&
      canDoubleDown({ currentBet, gameOver, playerCards: player.cards, wallet });
      
    // Derived values
    const canPlay = loaded && currentBet && !gameOver;

    return (
      <ResponsiveContainer>
        {/* HUD */}
        <View style={styles.hud}>
          <View style={styles.hudStats}>
            <Text style={styles.hudTextBold}>${wallet}</Text>
            {currentBet && <Text style={styles.hudText}>Bet: ${currentBet}</Text>}
            <Text style={styles.hudTextMuted}>
              Hands {stats.handsPlayed} · W {stats.wins} / L {stats.losses} / P {stats.pushes} · BJ {stats.blackjacks} · Peak ${stats.peakWallet}
            </Text>
          </View>
          <Pressable style={styles.iconBtn} onPress={() => this.setState({ showAbout: true })}>
            <Text style={styles.iconBtnText}>ⓘ</Text>
          </Pressable>
        </View>

        {!loaded ? (
          <View style={[styles.centerTable, { flex: 1 }]}><Text style={styles.loadingText}>Loading…</Text></View>
        ) : (
          <ScrollView style={styles.tableScroll} contentContainerStyle={styles.table} showsVerticalScrollIndicator={false}>
            {/* Dealer Area */}
            <View style={styles.playerArea}>
              <Text style={styles.areaLabel}>Dealer {dealer.cards.length > 0 ? `(${dealer.count})` : ''}</Text>
              <View style={styles.cardsRow}>
                {dealer.cards.map((item, index) => (
                  <View key={`dealer-${item.suit}-${index}`}>
                    {this.renderCard({item, index})}
                  </View>
                ))}
              </View>
            </View>

            {/* Center Area: Result / Betting */}
            <View style={styles.centerTable}>
              {this.renderResultBanner()}
              
              {isBroke ? (
                <View style={styles.brokePanel}>
                  <Text style={styles.brokeText}>Out of chips!</Text>
                  <Pressable style={styles.btnSecondary} onPress={this.restartWallet}>
                    <Text style={styles.btnSecondaryText}>Restart with $100</Text>
                  </Pressable>
                </View>
              ) : (
                !currentBet && (
                  <View style={styles.bettingPanel}>
                    <View style={styles.bettingHeader}>
                      <Text style={styles.bettingLabel}>Place Your Bet</Text>
                      {gameOver ? (
                        <Pressable onPress={this.startNewGame} hitSlop={8}>
                          <Text style={styles.linkText}>Clear table</Text>
                        </Pressable>
                      ) : null}
                    </View>
                    <View style={styles.chipRow}>
                      {[5, 10, 25, 50, 100].map(amt => (
                        <Pressable key={amt} style={styles.chip} onPress={() => this.addChip(amt)}>
                          <Text style={styles.chipText}>${amt}</Text>
                        </Pressable>
                      ))}
                    </View>
                    <View style={styles.betInputRow}>
                      <TextInput
                        style={styles.betInput}
                        keyboardType="numeric"
                        value={inputValue}
                        onChangeText={this.inputChange}
                        placeholder="$0"
                        placeholderTextColor={colors.textMuted}
                      />
                      <Pressable style={styles.btnSecondary} onPress={this.clearBet}>
                        <Text style={styles.btnSecondaryText}>Clear</Text>
                      </Pressable>
                      <Pressable style={styles.btnDeal} onPress={this.placeBet}>
                        <Text style={styles.btnPrimaryText}>Deal</Text>
                      </Pressable>
                    </View>
                    {betError ? <Text style={styles.errorText}>{betError}</Text> : null}
                  </View>
                )
              )}
              
            </View>

            {/* Player Area */}
            <View style={styles.playerArea}>
              <View style={styles.cardsRow}>
                {player.cards.map((item, index) => (
                  <View key={`player-${item.suit}-${item.number}-${index}`}>
                    {this.renderCard({item, index})}
                  </View>
                ))}
              </View>
              <Text style={styles.areaLabel}>You {player.cards.length > 0 ? `(${player.count})` : ''}</Text>
            </View>
          </ScrollView>
        )}

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          <Pressable 
            style={[styles.actionBtn, !canPlay && styles.actionBtnDisabled]} 
            onPress={this.hit} disabled={!canPlay}>
            <Text style={[styles.actionBtnText, !canPlay && styles.actionBtnTextDisabled]}>Hit</Text>
          </Pressable>
          <Pressable 
            style={[styles.actionBtn, !canPlay && styles.actionBtnDisabled]} 
            onPress={this.stand} disabled={!canPlay}>
            <Text style={[styles.actionBtnText, !canPlay && styles.actionBtnTextDisabled]}>Stand</Text>
          </Pressable>
          <Pressable 
            style={[styles.actionBtn, !doubleEnabled && styles.actionBtnDisabled]} 
            onPress={this.doubleDown} disabled={!doubleEnabled}>
            <Text style={[styles.actionBtnText, !doubleEnabled && styles.actionBtnTextDisabled]}>Double</Text>
          </Pressable>
        </View>

        {/* About Modal */}
        <Modal visible={showAbout} transparent animationType="fade" onRequestClose={() => this.setState({ showAbout: false })}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>About BlackJack</Text>
              <Text style={styles.modalText}>Dealer stands on 17. Blackjack pays 3:2.</Text>
              <Text style={styles.modalText}>Built with React Native + Expo.</Text>
              <Pressable style={[styles.btnSecondary, {marginTop: spacing.s16}]} onPress={this.resetStats}>
                <Text style={styles.btnSecondaryText}>Reset Lifetime Stats</Text>
              </Pressable>
              <Pressable style={[styles.btnPrimary, {marginTop: spacing.s16}]} onPress={() => this.setState({ showAbout: false })}>
                <Text style={styles.btnPrimaryText}>Close</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </ResponsiveContainer>
    );
  }
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
  },
  root: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
    alignItems: 'center',
  },
  rootDesktop: {
    paddingVertical: spacing.s24,
  },
  appContainer: {
    flex: 1,
    width: '100%',
    backgroundColor: colors.background,
  },
  appContainerDesktop: {
    maxWidth: 520,
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadow.md,
  },
  hud: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.s16,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  hudStats: {
    flex: 1,
  },
  hudTextBold: {
    ...type.h1,
    color: colors.text,
  },
  hudText: {
    ...type.body,
    color: colors.accent,
    fontWeight: 'bold',
  },
  hudTextMuted: {
    ...type.caption,
    color: colors.textMuted,
    marginTop: spacing.s4,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnText: {
    ...type.h2,
    color: colors.text,
  },
  tableScroll: {
    flex: 1,
  },
  table: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingVertical: spacing.s16,
    gap: spacing.s12,
  },
  centerTable: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerArea: {
    alignItems: 'center',
  },
  areaLabel: {
    ...type.h2,
    color: colors.text,
    marginBottom: spacing.s8,
    marginTop: spacing.s8,
  },
  cardsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  cardCompact: {
    width: 72,
    height: 108,
  },
  cardImage: {
    width: 100,
    height: 150,
    resizeMode: 'contain',
  },
  cardPlaceholder: {
    width: 100,
    height: 150,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#CCC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardPlaceholderText: {
    ...type.h1,
    color: colors.cardBlack,
  },
  bettingHeader: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.s12,
  },
  linkText: {
    color: colors.accent,
    textDecorationLine: 'underline',
    ...type.bodySm,
  },
  bettingPanel: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    padding: spacing.s16,
    borderRadius: radius.md,
    alignItems: 'center',
    width: '80%',
  },
  bettingLabel: {
    ...type.body,
    color: colors.text,
  },
  chipRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: spacing.s8,
    marginBottom: spacing.s16,
  },
  chip: {
    backgroundColor: colors.accent,
    width: 50,
    height: 50,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.sm,
  },
  chipText: {
    ...type.body,
    fontWeight: 'bold',
    color: colors.backgroundDark,
  },
  betInputRow: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.s16,
    gap: spacing.s8,
  },
  betInput: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    color: colors.text,
    paddingHorizontal: spacing.s16,
    paddingVertical: spacing.s8,
    borderRadius: radius.md,
    flex: 1,
    minWidth: 60,
    textAlign: 'center',
    ...type.h2,
  },
  actionContainer: {
    flexDirection: 'row',
    padding: spacing.s16,
    gap: spacing.s8,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  actionBtn: {
    flex: 1,
    backgroundColor: colors.accent,
    paddingVertical: spacing.s16,
    borderRadius: radius.md,
    alignItems: 'center',
    ...shadow.sm,
  },
  actionBtnDisabled: {
    backgroundColor: colors.disabled,
  },
  actionBtnText: {
    ...type.button,
    color: colors.backgroundDark,
  },
  actionBtnTextDisabled: {
    color: 'rgba(255,255,255,0.3)',
  },
  btnDeal: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.s12,
    paddingHorizontal: spacing.s16,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  btnPrimary: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.s12,
    paddingHorizontal: spacing.s24,
    borderRadius: radius.md,
    width: '100%',
    alignItems: 'center',
  },
  btnPrimaryText: {
    ...type.button,
    color: colors.backgroundDark,
  },
  btnSecondary: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: spacing.s12,
    paddingHorizontal: spacing.s24,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  btnSecondaryText: {
    ...type.button,
    color: colors.text,
  },
  resultBanner: {
    paddingVertical: spacing.s12,
    paddingHorizontal: spacing.s24,
    borderRadius: radius.md,
    marginBottom: spacing.s16,
    ...shadow.md,
  },
  resultText: {
    ...type.h2,
    color: colors.text,
    textAlign: 'center',
  },
  errorText: {
    ...type.bodySm,
    color: colors.loss,
    marginBottom: spacing.s8,
  },
  loadingText: {
    ...type.h2,
    color: colors.text,
  },
  brokePanel: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: spacing.s24,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  brokeText: {
    ...type.h2,
    color: colors.loss,
    marginBottom: spacing.s16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.s24,
  },
  modalContent: {
    backgroundColor: colors.backgroundDark,
    padding: spacing.s24,
    borderRadius: radius.lg,
    width: '100%',
    maxWidth: 400,
    ...shadow.md,
  },
  modalTitle: {
    ...type.h1,
    color: colors.accent,
    marginBottom: spacing.s16,
  },
  modalText: {
    ...type.body,
    color: colors.text,
    marginBottom: spacing.s8,
  },
});

export default function App() {
  const { width, height } = useWindowDimensions();
  return <BlackJackGame compact={width < 768 || height < 700} />;
}
