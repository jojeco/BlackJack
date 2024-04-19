Blackjack Game App
Overview
This Blackjack game app is built using React Native and Expo, designed to provide a mobile-friendly gaming experience. It includes three main components:

Index Page (index.js): This serves as the entry point to the app, allowing users to select a betting limit and view the current UTC time, updated every second.
Main Game Logic (App.js): This file contains the core game mechanics, including card handling, betting, and gameplay rules.
Alternate Game Version (App copy.js): This version offers an alternative set of rules or features, including sound effects for winning or losing and a different UI interaction pattern.
File Descriptions
1. index.js
This is the landing page of the Blackjack game app. It provides users with options to select their table limit and displays the current UTC time, which updates every second.

Features:
Fetch and display UTC time every 500ms.
Navigation links to the game with different betting limits.
2. App.js
The main game component where users play Blackjack. It handles game state, deck management, betting, and the play logic.

Features:
Card shuffling and dealing.
Bet placement with validation based on the wallet balance and predefined limits.
Game outcomes like wins, losses, and draws, with appropriate messaging.
AsyncStorage is used to persist wallet balance across sessions.
Pausing and resuming game states.
Vibration feedback for specific game events.
3. App copy.js
An alternative version of the game logic, potentially used for testing new features or different gameplay rules. It includes additional multimedia features like sound effects.

Features:
Similar gameplay logic to App.js.
Sound effects for winning and losing scenarios.
Use of hooks (useState, useEffect) instead of class-based state management.
Setup and Running
To run these components in a development environment, follow these steps:

Installation:
Ensure you have node, npm, and expo-cli installed.
Clone the repository and navigate into your project directory.
Run npm install to install dependencies.
Running the App:
Use expo start to run the app in development mode.
Open it in an iOS or Android simulator, or on a physical device using the Expo Go app.
Environment Setup:
Ensure that the Expo development environment is set up correctly.
Any external dependencies or services (like APIs used in index.js) should be accessible from your development environment.
Additional Notes
Dependencies: The project requires several external libraries and APIs, such as react-native-vector-icons for icons, expo-audio for sound playback, and @react-navigation/native for routing.
Configuration: Make sure to replace placeholders and demo URIs with actual data and endpoints as needed.
API Usage: Monitor usage as per the terms and conditions of the external APIs used (e.g., World Clock API).