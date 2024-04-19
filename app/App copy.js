import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Button,
  TextInput,
  TouchableOpacity,
  ImageBackground,
} from "react-native";
import { Link, useLocalSearchParams } from "expo-router";
import { useRoute } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from "react-native-vector-icons/MaterialIcons";
import styles from "../Styles/app-styles";
import BackgroundImage from "../assets/Background.jpg";

const App = () => {
  const [deck, setDeck] = useState([]);
  const [dealer, setDealer] = useState({ cards: [], count: 0 });
  const [player, setPlayer] = useState({ cards: [], count: 0 });
  const [wallet, setWallet] = useState(100); // Default wallet amount set to 100 as in your original component
  const [inputValue, setInputValue] = useState("");
  const [currentBet, setCurrentBet] = useState(null);
  const [betPlaced, setBetPlaced] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [message, setMessage] = useState("");
  const [isPaused, setIsPaused] = useState(false);

  const route = useRoute();
  const betLimit = route.params?.limit || 100;

  const loadWallet = async () => {
    try {
      const savedWallet = await AsyncStorage.getItem("wallet");
      if (savedWallet !== null) {
        const parsedWallet = parseInt(savedWallet, 10);
        if (!isNaN(parsedWallet)) {
          setWallet(parsedWallet);
        } else {
          console.error("Failed to parse wallet value:", savedWallet);
          setWallet(100); // Set a valid default if parsing fails
          updateWallet(100); // Save the valid default
        }
      } else {
        console.log("No wallet found in AsyncStorage, setting to default");
        setWallet(100);
        updateWallet(100); // Initialize AsyncStorage with default value if not set
      }
    } catch (error) {
      console.error("Failed to load the wallet from AsyncStorage", error);
    }
  };

  const updateWallet = async (newWalletValue) => {
    if (isNaN(newWalletValue)) {
      console.error("Attempted to save invalid wallet value:", newWalletValue);
      return; // Stop saving if the value is invalid
    }
    try {
      await AsyncStorage.setItem("wallet", newWalletValue.toString());
      setWallet(newWalletValue);
    } catch (error) {
      console.error("Failed to save the wallet to AsyncStorage", error);
    }
  };

  const generateDeck = () => {
    const cards = [2, 3, 4, 5, 6, 7, 8, 9, 10, "J", "Q", "K", "A"];
    const suits = ["♦", "♣", "♥", "♠"];
    return cards.flatMap((card) =>
      suits.map((suit) => ({ number: card, suit }))
    );
  };

  const getRandomCard = (deck) => {
    const updatedDeck = [...deck];
    const randomIndex = Math.floor(Math.random() * updatedDeck.length);
    const randomCard = updatedDeck.splice(randomIndex, 1)[0];
    return { randomCard, updatedDeck };
  };

  const placeBet = async (type = "new") => {
    let betAmount = parseInt(inputValue, 10);
    if (isNaN(betAmount) || betAmount <= 0 || betAmount > betLimit) {
      setMessage("Invalid bet amount.");
      return;
    }
    if (betAmount > wallet) {
      setMessage("Insufficient funds to place that bet.");
      return;
    }

    const newWallet = wallet - betAmount;
    if (!isNaN(newWallet)) {
      setCurrentBet(betAmount);
      updateWallet(newWallet); // Use the updated wallet function
      setBetPlaced(true);
      setMessage("Bet placed. Play your hand!");
      setInputValue("");
      const newDeck = generateDeck();
      dealCards(newDeck);
    } else {
      console.error("Calculated wallet value is invalid", newWallet);
    }
  };

  const dealCards = (deck) => {
    const { updatedDeck, randomCard: playerCard1 } = getRandomCard(deck);
    const { updatedDeck: finalDeck, randomCard: dealerCard1 } =
      getRandomCard(updatedDeck);
    setDeck(finalDeck);
    setPlayer({
      cards: [playerCard1],
      count: calculateHandValue([playerCard1]),
    });
    setDealer({
      cards: [dealerCard1, {}],
      count: calculateHandValue([dealerCard1, {}]),
    });
    setMessage("Bet placed. Play your hand!");
    setGameOver(false);
  };

  const calculateHandValue = (cards) => {
    let total = 0;
    let aceCount = 0;

    cards.forEach((card) => {
      if (card.number && card.suit) {
        // Check if the card object is valid
        if (["J", "Q", "K"].includes(card.number)) {
          total += 10;
        } else if (card.number === "A") {
          aceCount += 1;
          total += 11;
        } else {
          total += parseInt(card.number, 10);
        }
      }
    });

    while (total > 21 && aceCount > 0) {
      total -= 10;
      aceCount -= 1;
    }

    return total;
  };

  const hit = () => {
    if (!gameOver && currentBet) {
      const { updatedDeck, randomCard } = getRandomCard(deck);
      const newPlayerCards = [...player.cards, randomCard];
      const newCount = calculateHandValue(newPlayerCards);
      setPlayer({ cards: newPlayerCards, count: newCount });
      setDeck(updatedDeck);
      if (newCount > 21) {
        setMessage("BUST!");
        setGameOver(true);
      }
    }
  };

  const stand = () => {
    if (!gameOver && currentBet) {
      let newDealerCards = [...dealer.cards];
      let dealerHandValue = calculateHandValue(newDealerCards);

      while (dealerHandValue < 17) {
        const { updatedDeck, randomCard } = getRandomCard(deck);
        newDealerCards.push(randomCard);
        dealerHandValue = calculateHandValue(newDealerCards);
        setDeck(updatedDeck);
      }

      setDealer({ cards: newDealerCards, count: dealerHandValue });

      if (dealerHandValue > 21) {
        setMessage("Dealer bust! You win!");
        setWallet(wallet + currentBet * 2);
        setGameOver(true);
      } else if (player.count > dealerHandValue) {
        setMessage("You win!");
        setWallet(wallet + currentBet * 2);
        setGameOver(true);
      } else if (dealerHandValue > player.count) {
        setMessage("Dealer wins.");
        setGameOver(true);
      } else {
        setMessage("Push.");
      }
    }
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  const rebet = () => {
    if (gameOver && currentBet && wallet >= currentBet) {
      placeBet("rebet");
    } else {
      setMessage("Cannot rebet. Check your balance or if the game is over.");
      setBetPlaced(false);
    }
  };

  return (
    <ImageBackground source={BackgroundImage} style={styles.container}>
      <TouchableOpacity style={styles.pauseButton} onPress={togglePause}>
        <Icon name="pause" size={50} color="#000" />
      </TouchableOpacity>
      {isPaused && (
        <View style={styles.pauseContainer}>
          <View style={styles.pauseMenu}>
            <Text style={styles.pauseTitle}>Paused</Text>
            <TouchableOpacity
              onPress={togglePause}
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
      )}
      <View style={styles.walletContainer}>
        <Icon name="wallet" size={60} color="#000" />
        <Text style={styles.walletText}>${wallet}</Text>
        <View style={styles.underline} />
      </View>

      <View style={styles.playArea}>
        <View style={styles.dealerCards}>
          <Text style={styles.handText}>Dealer's Hand ({dealer.count}):</Text>
          <View style={styles.cardsContainer}>
            {dealer.cards.map((card, index) => (
              <View style={styles.card} key={index}>
                <Text
                  style={[
                    styles.cardText,
                    card.suit === "♦" || card.suit === "♥"
                      ? styles.cardRed
                      : null,
                  ]}
                >
                  {card.number} {card.suit}
                </Text>
              </View>
            ))}
          </View>
        </View>
        <View style={styles.playerCards}>
          <Text>Your Hand ({player.count}):</Text>
          <View style={styles.cardsContainer}>
            {player.cards.map((card, index) => (
              <View style={styles.card} key={index}>
                <Text
                  style={[
                    styles.cardText,
                    card.suit === "♦" || card.suit === "♥"
                      ? styles.cardRed
                      : null,
                  ]}
                >
                  {card.number} {card.suit}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>
      <Text>{message}</Text>
      <View style={styles.actionContainer}>
        <View style={styles.hitStandContainer}>
          <TouchableOpacity
            style={styles.hitButton}
            onPress={hit}
            disabled={!currentBet || gameOver}
          >
            <Text style={styles.hitStandText}>Hit</Text>
            <Icon name="control-point" size={50} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.StandButton}
            onPress={stand}
            disabled={!currentBet || gameOver}
          >
            <Text style={styles.hitStandText}>Stand</Text>
            <Icon name="arrow-circle-down" size={50} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.rebetButton}
            onPress={rebet}
            disabled={
              !gameOver ||
              !currentBet ||
              wallet < currentBet ||
              player.count > 21
            } // Disable rebet if player has busted
          >
            <Text style={styles.hitStandText}>Rebet</Text>
            <Icon name="replay" size={50} color="#000" />
          </TouchableOpacity>
        </View>
        <View style={styles.betContainer}>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={inputValue}
            onChangeText={setInputValue}
            placeholder="Enter your bet"
          />
          {!betPlaced && (
            <Button
              title="Place Bet"
              onPress={() => placeBet("new")}
              disabled={gameOver}
            />
          )}
        </View>
      </View>
    </ImageBackground>
  );
};

export default App;
