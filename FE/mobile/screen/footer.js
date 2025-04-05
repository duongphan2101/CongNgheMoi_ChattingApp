// TabNavigator.js
import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import chat from "../screen/chat";
import profile from "../screen/profile";
import contacts from "../screen/contacts";
import setting from "../screen/setting";
import Header from "../screen/header";

import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import Entypo from "@expo/vector-icons/Entypo";
import Ionicons from "@expo/vector-icons/Ionicons";

import { useTheme } from "../contexts/themeContext";
import colors from "../themeColors";

const Tab = createBottomTabNavigator();

const TabNavigator = () => {
    const { theme, toggleTheme } = useTheme();
    const themeColors = colors[theme];

  return (
    <Tab.Navigator
      initialRouteName="chatScr"
      screenOptions={{
        tabBarShowLabel: false,
        tabBarActiveTintColor: "white",
        tabBarInactiveTintColor: "white",
        tabBarStyle: {
          backgroundColor: themeColors.primary,
          height: 90,
          paddingTop: 20,
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
              style={{ transform: [{ translateY: focused ? -10 : 0 }] }}
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
              style={{ transform: [{ translateY: focused ? -10 : 0 }] }}
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
              style={{ transform: [{ translateY: focused ? -10 : 0 }] }}
            />
          ),
        }}
      />

      {/* <Tab.Screen
        name="cloudScr"
        component={cloud}
        options={{
          headerShown: false,
          tabBarStyle: { display: "none" },
          tabBarIcon: ({ color, focused }) => (
            <Entypo
              name="cloud"
              size={30}
              color={color}
              style={{ transform: [{ translateY: focused ? -10 : 0 }] }}
            />
          ),
        }}
      /> */}

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
              style={{ transform: [{ translateY: focused ? -10 : 0 }] }}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default TabNavigator;
