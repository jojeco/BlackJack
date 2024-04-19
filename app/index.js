import { StatusBar } from "expo-status-bar";
import { Text, View, ImageBackground } from "react-native";
import { Link } from "expo-router";
import indexStyles from "../Styles/index-styles";
import BackgroundImage from "../assets/Background.jpg";

export default function App() {
  return (
    <ImageBackground source={BackgroundImage} style={indexStyles.background}>
      <View style={indexStyles.buttonContainer}>
        <Link style={indexStyles.linkStyle} href={"/App"}>
          <View style={indexStyles.pressableStyle}>
            <Text style={indexStyles.textStyle}>Play</Text>
          </View>
        </Link>
      </View>
     
    </ImageBackground>
  );
}