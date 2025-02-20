// App.js
import React from "react";
import { View, StyleSheet, Text } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import started from "./component/started";
import login from "./component/login";
import register from "./component/register";
import profile from "./component/profile";
import ProfileScreen from "./component/profile";

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function TabNavigator({ navigation, route }) {
  const { userData } = route.params;
  return (
    <Tab.Navigator
      initialRouteName="Profile"
      screenOptions={{
        tabBarActiveTintColor: "pink",
        tabBarInactiveTintColor: "black",
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        initialParams={{ userData }}
        options={{
          header: () => (
            <View style={styles.headerContainer}>
              <Text style={styles.headerTitle}>Video Sharing App</Text>
              <Icon2 name="bell-o" size={25} color="black" />
            </View>
          ),
          tabBarIcon: ({ color }) => (
            <Icon2 name="home" size={30} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          header: () => (
            <View style={styles.headerProfileContainer}>
              <View style={{ flexDirection: "row" }}>
                <AntDesign
                  style={{ paddingHorizontal: 10 }}
                  name="navicon"
                  size={20}
                  color="black"
                  onPress={() => navigation.navigate("Login")}
                />
                <AntDesign
                  style={{ paddingHorizontal: 10 }}
                  name="userplus"
                  size={20}
                  color="black"
                />
              </View>
              <TouchableOpacity
                style={{ flexDirection: "row", alignItems: "center" }}
                onPress={() => navigation.navigate("EditProfile")}
              >
                <AntDesign
                  style={{ color: "pink", paddingHorizontal: 5 }}
                  name="edit"
                  size={20}
                />
                <Text style={{ color: "pink", paddingHorizontal: 5 }}>
                  Edit Profile
                </Text>
              </TouchableOpacity>
            </View>
          ),
          tabBarIcon: ({ color }) => (
            <AntDesign name="user" size={30} color={color} />
          ),
        }}
      />

      <Tab.Screen
        name="Search"
        initialParams={{ userData }}
        component={SearchScreen}
        options={{
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <Icon2 name="search" size={30} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Plus"
        initialParams={{ userData }}
        component={plus}
        options={{
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <Icon3 name="circle-with-plus" size={35} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Friends"
        initialParams={{ userData }}
        component={FriendsScreen}
        options={{
          // headerShown: false,
          tabBarIcon: ({ color }) => (
            <Icon2 name="users" size={25} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color }) => <AntDesign name="user" size={30} color={color} />, 
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="profile">
        <Stack.Screen
          name="started"
          component={started}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="login"
          component={login}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="register"
          component={register}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="profile"
          component={profile}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
