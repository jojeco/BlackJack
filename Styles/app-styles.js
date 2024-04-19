import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',  // Align items from the top
    alignItems: 'center',
    width: '100%',
    height: '105%',  // Ensure container covers full screen
    position: 'absolute',  // Overlay on top of the background image
  },
  pauseButton: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    top: 35,
    left: 15,
    zIndex: 10,
    borderRadius: 10,
  },
  walletContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    textAlign: 'bottom',
    top: 20,
    right: 20,  
    
  },
  playArea: {
    flex: 1,
    padding: 50,
    alignItems: 'center',
    marginTop: 140,  // Lower the cards a bit from the top
    
  },
  handText : {
    fontSize: 20,
    color: 'white',
    fontWeight: 'bold',
  },
  dealerCards: {
    marginTop: 20,
    textAlign: 'center',
    backgroundColor: 'hsl(207, 95%, 8%)',

  },
  playerCards: {
    marginTop: 20,
    textAlign: 'center',
    backgroundColor: 'hsl(207, 95%, 8%)',
    width: '100%',
  },
  cardsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  actionContainer: {
    position: 'absolute',
    bottom: 30,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hitStandContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
  },
  hitButton: {
    alignItems: 'center',
    backgroundColor: '#006400',
    borderRadius: 10,
    padding: 10,
  },
  StandButton: {
    alignItems: 'center',
    backgroundColor: '#8b0000',
    borderRadius: 10,
    padding: 10,
  },
  rebetButton: {
    alignItems: 'center',
    backgroundColor: '#696969',
    borderRadius: 10,
    padding: 10,
  },
  betContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 10,
    width: '90%',
  },
  inputBet: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  input: {
    backgroundColor: '#fff',
    width: '75%',
    padding: 10,
    borderRadius: 5,
  },
  hitStandText: {
    fontSize: 20,
    color: 'white',
  },
  
  walletText: {
    fontSize: 22,
  },
  
  card: {
    height: 150,
    width: 100,
    backgroundColor: '#BFBFBF',
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cardText: {
    fontSize: 20,
    color: "black",
  },
  cardRed: {
    color: "red",
  },
  buttons: {
    position: "absolute",
    bottom: 0, // Anchors the button container to the bottom
    left: 0,
    right: 0,
    justifyContent: "center",
    alignItems: "center",
    padding: 10,
  },
 
  pauseContainer: {
    position: "absolute",
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,

  },
  pauseMenu: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
    zIndex: 2, // Ensure it's above the pauseContainer overlay
  },
  underline: {
    position: 'absolute',
    height: 2, 
    backgroundColor: 'black', 
    bottom: 0, 
    width: '90%', 
  },
  pauseButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    textAlign: 'center',
    marginTop: 20,
    backgroundColor: 'grey',
    padding: 10,
    borderRadius: 5,
    width: '60%',

  },
  pauseButtonText: {
    fontSize: 20,
  },
  
});

export default styles;

