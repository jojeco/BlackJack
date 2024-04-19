import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Button,
  TextInput,
  TouchableOpacity,
  ImageBackground,
  Vibration,
} from "react-native";
import { Link } from "expo-router";
import { useRoute } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from "react-native-vector-icons/MaterialIcons";
import styles from "../Styles/app-styles";
import BackgroundImage from "../assets/Background.jpg";
import { Audio } from "expo-av";
import Lost from "../assets/Sounds/Lost.mp3";
import Won from "../assets/Sounds/Won.mp3";

const App = () => {
  const [deck, setDeck] = useState([]);
  const [dealer, setDealer] = useState({ cards: [], count: 0 });
  const [player, setPlayer] = useState({ cards: [], count: 0 });
  const [wallet, setWallet] = useState(100); // Default wallet amount set to 100
  const [inputValue, setInputValue] = useState("");
  const [currentBet, setCurrentBet] = useState(null);
  const [betPlaced, setBetPlaced] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [message, setMessage] = useState("");
  const [isPaused, setIsPaused] = useState(false);

  const route = useRoute();
  const betLimit = parseInt(route.params?.limit, 10) || 100;
  console.log("Bet limit:", betLimit);

  useEffect(() => {
    const loadWallet = async () => {
      try {
        const savedWallet = await AsyncStorage.getItem("wallet");
        if (savedWallet !== null) {
          const parsedWallet = parseInt(savedWallet, 10);
          if (parsedWallet == 0) {
            console.log("Wallet is empty, setting to default");
            setWallet(100);
            updateWallet(100);
          }
          if (!isNaN(parsedWallet)) {
            setWallet(parsedWallet);
          } else {
            console.error("Failed to parse wallet value:", savedWallet);
            setWallet(100);
            updateWallet(100);
          }
        } else {
          console.log("No wallet found in AsyncStorage, setting to default");
          setWallet(100);
          updateWallet(100);
        }
      } catch (error) {
        console.error("Failed to load the wallet from AsyncStorage", error);
      }
    };

    loadWallet();
  }, []); // The empty array ensures this effect runs only once after the component mounts

  const updateWallet = async (newWalletValue) => {
    if (isNaN(newWalletValue)) {
      console.error("Attempted to save invalid wallet value:", newWalletValue);
      return;
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
    let betAmount;

    if (type === "rebet") {
      betAmount = currentBet; // Use the last bet amount for a rebet
    } else {
      betAmount = parseInt(inputValue, 10); // Parse a new bet amount for a new bet
      setCurrentBet(betAmount); // Store the current bet amount
    }

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
    // Draw cards for the player
    const { updatedDeck, randomCard: playerCard1 } = getRandomCard(deck);
    const { updatedDeck: deckAfterPlayerCard2, randomCard: playerCard2 } =
      getRandomCard(updatedDeck);

    // Draw cards for the dealer, but hide the second one initially
    const { updatedDeck: deckAfterDealerCard1, randomCard: dealerCard1 } =
      getRandomCard(deckAfterPlayerCard2);
    const { updatedDeck: finalDeck, randomCard: dealerCard2 } =
      getRandomCard(deckAfterDealerCard1);

    // Update the deck in the state
    setDeck(finalDeck);

    // Set up the player's state
    setPlayer({
      cards: [playerCard1, playerCard2],
      count: calculateHandValue([playerCard1, playerCard2]),
    });

    // Set up the dealer's state with the second card hidden
    setDealer({
      cards: [dealerCard1, {}], // Placeholder for hidden card
      count: calculateHandValue([dealerCard1]), // Show only the first card's value
    });

    // Set the game message
    setMessage("Bet placed. Play your hand!");

    // Reset the game over status
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
        revealDealerSecondCard(); // New function to handle revealing the dealer's card
        setMessage("BUST! Dealer wins.");
        setGameOver(true);
        playSound(Lost, 1);
      }
      if (newCount === 21) {
        stand();
      }
    }
  };

  const revealDealerSecondCard = () => {
    const newDealerCards = [...dealer.cards];
    // Check if the second card is still a placeholder
    if (Object.keys(newDealerCards[1]).length === 0) { // Assuming placeholder is an empty object {}
        const { updatedDeck, randomCard } = getRandomCard(deck);
        newDealerCards[1] = randomCard; // Replace the placeholder with the actual card
        setDeck(updatedDeck);
        const newDealerCount = calculateHandValue(newDealerCards);
        setDealer({ cards: newDealerCards, count: newDealerCount });
    }
};

  const stand = () => {
    if (!gameOver && currentBet) {
      revealDealerSecondCard(); // Use the new function to handle card revealing
      let dealerHandValue = dealer.count;
      while (dealerHandValue < 17) {
        const { updatedDeck, randomCard } = getRandomCard(deck);
        dealer.cards.push(randomCard);
        dealerHandValue = calculateHandValue(dealer.cards); // Recalculate after each card is added
        setDeck(updatedDeck);
        setDealer({ cards: dealer.cards, count: dealerHandValue }); // Update state here as well
      }

      // Compare outcomes
      compareHands(dealerHandValue);
    }
  };

  const compareHands = (dealerHandValue) => {
    if (dealerHandValue > 21) {
      setMessage("Dealer bust! You win!");
      setWallet(wallet + currentBet * 2);
      setGameOver(true);
      triggerVibration();
      playSound(Won, 1);
    } else if (player.count > dealerHandValue) {
      setMessage("You win!");
      setWallet(wallet + currentBet * 2);
      setGameOver(true);
      triggerVibration();
      playSound(Won, 1);
    } else if (dealerHandValue > player.count) {
      setMessage("Dealer wins.");
      setGameOver(true);
      playSound(Lost, 1);
    } else {
      setMessage("Push.");
      setWallet(wallet + currentBet);
      setGameOver(true);
    }
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  // Trigger vibration
  const triggerVibration = () => {
    Vibration.vibrate();
  };

  const rebet = () => {
    console.log(
      "Attempting to rebet with currentBet:",
      currentBet,
      "Wallet:",
      wallet,
      "GameOver:",
      gameOver
    );
    if (gameOver && currentBet && wallet >= currentBet) {
      console.log("Rebet conditions met, placing bet.");
      setGameOver(false); // Prepare for a new game
      placeBet("rebet");
    } else {
      console.log("Rebet conditions not met.");
      if (!gameOver) {
        setMessage("Wait until the game is over to rebet.");
      } else if (!currentBet) {
        setMessage("No current bet to rebet.");
      } else if (wallet < currentBet) {
        setMessage("Insufficient funds to rebet.");
      }
      setBetPlaced(false);
    }
  };

  const playSound = async (soundFile, volume = 1) => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        soundFile,
        { shouldPlay: true }
      );
      await sound.setVolumeAsync(volume);
      await sound.playAsync();
  
      // Optionally, unload the sound from memory after it's played to free up resources
      sound.setOnPlaybackStatusUpdate(async (status) => {
        if (status.didJustFinish) {
          await sound.unloadAsync();
        }
      });
    } catch (error) {
      console.error("Error playing sound:", error);
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
        <Text style={styles.walletText}>${wallet}</Text>
        <View style={styles.underline} />
        <Icon name="wallet" size={60} color="#000" />
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
          <Text style={styles.handText}>Your Hand ({player.count}):</Text>
        </View>
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
            disabled={!gameOver || wallet < currentBet} // Remove player.count > 21 condition
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
