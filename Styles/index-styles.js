import { StyleSheet } from "react-native";

export const indexStyles = StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    height: "105%",
    position: "absolute",
    alignContent: "center",
  },

  buttonContainer: {
    width: "40%",
    height: "8%",
    justifyContent: "center", // Distribute items evenly along the line
    alignItems: "center", // Align items to the start of the cross axis
    textAlign: "center",
    alignContent: "center",
    margin: 10,
    borderWidth: 1,
    borderColor: "black",
    borderRadius: 10,

  },
  textContainer: {
    width: "100%",
    height: "10%",
    justifyContent: "center", // Distribute items evenly along the line
    alignItems: "center", // Align items to the start of the cross axis
    textAlign: "center",
    alignContent: "center",
    margin: 10,
    position: "absolute",
    top: 20,
  },
  titleStyle: {
    color: "white",
    fontSize: 32,
    textAlign: "center",
    alignContent: "center",
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',  // Color of the shadow; semi-transparent black
    textShadowOffset: { width: -1, height: 1 },  // X and Y offset of the shadow
    textShadowRadius: 15,  // Blur radius of the shadow
    
  },
  subTitleStyle: {
    color: "white",
    fontSize: 24,
    textAlign: "center",
    alignContent: "center",
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',  // Color of the shadow; semi-transparent black
    textShadowOffset: { width: -1, height: 1 },  // X and Y offset of the shadow
    textShadowRadius: 15,  // Blur radius of the shadow
  },
  textStyle: {
    color: "#000", // Text color for the button
    fontSize: 16, // Adjust text size as needed
    textAlign: "center",
    alignContent: "center",
    width: "100%",
    height: "100%",
    borderRadius: 10,
  },

  linkStyle: {
    backgroundColor: "#b5931a",
    width: "100%",
    height: "100%",
    textAlign: "center",
    justifyContent: "center",
    alignItems: "center",
    borderColor: "black",
    borderRadius: 10,
    padding: 20,
    
  },
});
export default indexStyles;
