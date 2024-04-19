import { StatusBar } from "expo-status-bar";
import { Text, View, ImageBackground } from "react-native";
import React from "react";
import { Link } from "expo-router";
import indexStyles from "../Styles/index-styles";
import BackgroundImage from "../assets/Background.jpg";

export default function App() {
  const [limit, onChangeLimit] = React.useState("");
  
  return (
    <ImageBackground source={BackgroundImage} style={indexStyles.background}>
      <View  style={indexStyles.textContainer}>
        <Text style={indexStyles.titleStyle}>Welcome to BlackJack</Text>
      </View>
      <View >
        <Text style={indexStyles.subTitleStyle}>Select a Table Limit</Text>
      </View>
      <View style={indexStyles.buttonContainer}>
        <Link style={indexStyles.linkStyle} href={{
          pathname: "/App",
          params: { limit: "25" }}}>
          <View style={indexStyles.pressableStyle}>
            <Text style={indexStyles.textStyle}>Low Bet Table {"\n"} $25</Text>
          </View>
        </Link>
      </View>
      <View style={indexStyles.buttonContainer}>
      <Link style={indexStyles.linkStyle} href={{
          pathname: "/App",
          params: { limit: "100" }}}>
          <View style={indexStyles.pressableStyle}>
            <Text style={indexStyles.textStyle}>Mid Bet Table {"\n"} $100</Text>
          </View>
        </Link>
      </View>
      <View style={indexStyles.buttonContainer}>
      <Link style={indexStyles.linkStyle} href={{
          pathname: "/App",
          params: { limit: "200" }}}>
          <View style={indexStyles.pressableStyle}>
            <Text style={indexStyles.textStyle}>High Bet Table {"\n"} $200</Text>
          </View>
        </Link>
      </View>
      <View style={indexStyles.buttonContainer}>
      <Link style={indexStyles.linkStyle} href={{
          pathname: "/App copy",
          params: { limit: "100" }}}>
          <View style={indexStyles.pressableStyle}>
            <Text style={indexStyles.textStyle}>Test Table</Text>
          </View>
        </Link>
      </View>
     
    </ImageBackground>
  );
}