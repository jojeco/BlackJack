import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#4CA1AF",
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 20,
  },
  buttonContainer: {
    width: "100%", // Ensures the button container uses full width
    justifyContent: "center",
    alignItems: "center",
    position: "absolute", // Ensures the button container is positioned at the bottom
    bottom: 0, // Aligns the button container at the bottom of the screen
    flexDirection: "row",
    padding: 10, // Adds padding inside the button container
    backgroundColor: "transparent", // Optional: can be set to a color to highlight the button area
  },

  hitStandContainer: {
    flexDirection: "row", // Lays out children (buttons) in a row
    justifyContent: "center", // Centers the buttons horizontally
    padding: 10, // Adds padding around the buttons
    width: "50%", // Adjust this percentage based on your design needs
  },
  form: {
    flexDirection: "row",
    justifyContent: "center",
  },
  title: {
    textAlign: "center",
    fontSize: 50,
  },
  tet: {
    textAlign: "center",
  },
  card: {
    height: 150,
    width: 100,
    backgroundColor: "#BFBFBF",
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 5, // Space between cards
  },
  cardRed: {
    color: "red",
  },
  cardsContainer: {
    flexDirection: "row", // Layout cards horizontally
    justifyContent: "center", // Center the cards horizontally
    alignItems: "center", // Center the cards vertically
    flexWrap: "wrap", // Allows for wrapping if too many cards
    marginBottom: 20,
  },
  cardText: {
    fontSize: 20,
    color: "black", // Ensure text is visible
  },
  inputBet: {
    flexDirection: "row",
    justifyContent: "center",
  },
  pauseContainer: {
    position: "absolute",
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.5)", // Semi-transparent background
    justifyContent: "center",
    alignItems: "center",
  },
  pauseMenu: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    width: 300,
    alignItems: "center",
  },
  pauseTitle: {
    fontSize: 24,
    marginBottom: 20,
  },
  pauseButton: {
   
    borderBlockColor: "black",
    borderWidth: 3,
    borderRadius: 50,
    position: "absolute", // This will take the button out of the normal flow and position it absolutely
    top: 20, // 20 pixels from the top edge of the screen
    left: 20, // 20 pixels from the left edge of the screen
  },
  hitButton: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "green",
    borderRadius: 10,
    padding: 10,
    margin: 10,
  },
  StandButton: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "red",
    borderRadius: 10,
    padding: 10,
    margin: 10,
  },
  hitStandText: {
    color: "white",
    fontSize: 20,
    alignContent: "center",
  },
  walletContainer: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    top: 20,
    right: 20,
  },
  walletText: {
    fontSize: 22,
    
  },
  underline: {
    position: 'absolute',
    height: 2, // Thickness of the underline
    backgroundColor: 'black', // Color of the underline
    bottom: 0, // Adjust this to move the underline up or down
    width: '90%', // Make sure the underline spans the width of the text container
  },
});
export default styles;

/*<Button
            title="Hit"
            onPress={() => this.hit()}
            disabled={!currentBet || gameOver}
          />
          <Button
            title="Stand"
            onPress={() => this.stand()}
            disabled={!currentBet || gameOver}
          />
          */
