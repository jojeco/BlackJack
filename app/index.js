import React, { useState, useEffect } from 'react';
import { Text, View, ImageBackground } from "react-native";
import { Link } from "expo-router";
import indexStyles from "../Styles/index-styles";
import BackgroundImage from "../assets/Background.jpg";

const IndexPage = () => {
  const [utcTime, setUtcTime] = useState('');

  useEffect(() => {
    const fetchUTCTime = async () => {
      try {
        const response = await fetch('http://worldclockapi.com/api/json/utc/now');
        const data = await response.json();
        if (data && data.currentDateTime) {
          setUtcTime(data.currentDateTime);
          console.log("UTC Time updated:", data.currentDateTime);
        } else {
          throw new Error("No currentDateTime in response");
        }
      } catch (error) {
        console.error('Error fetching UTC time:', error);
        setUtcTime('Unable to fetch time');
      }
    };

    fetchUTCTime();  // Initial fetch
    const intervalId = setInterval(fetchUTCTime, 500);  

    return () => clearInterval(intervalId);  
  }, []);

  return (
    <ImageBackground source={BackgroundImage} style={indexStyles.background}>
      <View style={indexStyles.textContainer}>
        <Text style={indexStyles.titleStyle}>Welcome to BlackJack</Text>
        <Text style={indexStyles.subtitleStyle}>Current UTC Time: {utcTime}</Text>
      </View>
      <View style={indexStyles.buttonContainer}>
        <Link style={indexStyles.linkStyle} href={{ pathname: "/App", params: { limit: "25" } }}>
          <View style={indexStyles.pressableStyle}>
            <Text style={indexStyles.textStyle}>Low Bet Table {"\n"} $25</Text>
          </View>
        </Link>
        <Link style={indexStyles.linkStyle} href={{ pathname: "/App", params: { limit: "100" } }}>
          <View style={indexStyles.pressableStyle}>
            <Text style={indexStyles.textStyle}>Mid Bet Table {"\n"} $100</Text>
          </View>
        </Link>
        <Link style={indexStyles.linkStyle} href={{ pathname: "/App", params: { limit: "200" } }}>
          <View style={indexStyles.pressableStyle}>
            <Text style={indexStyles.textStyle}>High Bet Table {"\n"} $200</Text>
          </View>
        </Link>
        <Link style={indexStyles.linkStyle} href={{ pathname: "/App copy", params: { limit: "50" } }}>
          <View style={indexStyles.pressableStyle}>
            <Text style={indexStyles.textStyle}>Test Table</Text>
          </View>
        </Link>
      </View>
      
    </ImageBackground>
  );
}

export default IndexPage;
