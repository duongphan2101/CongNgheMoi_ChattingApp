import React from "react";
import { View, StyleSheet } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import chat from "../screen/chat";
import profile from "../screen/profile";
import contacts from "../screen/contacts";
import setting from "../screen/setting";
import Header from "../screen/header";

import FontAwesome from "@expo/vector-icons/FontAwesome";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import Ionicons from "@expo/vector-icons/Ionicons";

import { useTheme } from "../contexts/themeContext";
import colors from "../themeColors";

const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  const { theme } = useTheme();
  const themeColors = colors[theme];

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <Tab.Navigator
        initialRouteName="chatScr"
        screenOptions={{
          tabBarShowLabel: false,
          tabBarActiveTintColor: '#fff',
          tabBarInactiveTintColor: '#fff',
          tabBarStyle: {
            backgroundColor: themeColors.primary,
            height: 55,
            alignItems: "center",
            borderRadius: 30,
            overflow: "hidden",
            marginBottom: 10,
            paddingTop: 8,
            marginHorizontal: 20,
          },
          tabBarItemStyle: {
            justifyContent: "center",
            alignItems: "center",
          },
        }}
      >
        <Tab.Screen
          name="profileScr"
          component={profile}
          options={{
            headerShown: false,
            tabBarIcon: ({ color, focused }) => (
              <FontAwesome
                name="user"
                size={30}
                color={color}
                style={{ transform: [{ translateY: focused ? -5 : 0 }] }}
              />
            ),
          }}
        />

        <Tab.Screen
          name="chatScr"
          component={chat}
          options={{
            header: () => <Header />,
            tabBarIcon: ({ color, focused }) => (
              <MaterialCommunityIcons
                name="message-processing"
                size={30}
                color={color}
                style={{ transform: [{ translateY: focused ? -5 : 0 }] }}
              />
            ),
          }}
        />

        <Tab.Screen
          name="contactsScr"
          component={contacts}
          options={{
            header: () => <Header />,
            tabBarIcon: ({ color, focused }) => (
              <MaterialIcons
                name="contacts"
                size={30}
                color={color}
                style={{ transform: [{ translateY: focused ? -5 : 0 }] }}
              />
            ),
          }}
        />

        <Tab.Screen
          name="settingScr"
          component={setting}
          options={{
            header: () => <Header />,
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name="settings"
                size={28}
                color={color}
                style={{ transform: [{ translateY: focused ? -5 : 0 }] }}
              />
            ),
          }}
        />
      </Tab.Navigator>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default TabNavigator;

