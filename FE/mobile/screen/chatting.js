import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  FlatList,
  TextInput,
} from "react-native";
import React from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useTheme } from "../contexts/themeContext";
import colors from "../themeColors";
export default function App({ navigation, route }) {
  const { theme, toggleTheme } = useTheme();
  const themeColors = colors[theme];

  const { user } = route.params;
  const styles = getStyles(themeColors);

  const [isRecording, setIsRecording] = React.useState(false);

  const handleMicPress = () => {
    setIsRecording(true);
  };

  const handleStopRecording = () => {
    setIsRecording(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.head}>
        <View style={styles.user}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons name="chevron-back" size={20} color="#fff" />
            </TouchableOpacity>
            <Image source={{ uri: user.avatar }} style={styles.avatar} />
            <Text style={styles.name}>{user.name}</Text>
          </View>
          {/* <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <TouchableOpacity>
                <Ionicons style={{marginRight: 20}} name="call" size={30} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity>
                <Ionicons name="videocam" size={30} color="#fff" />
              </TouchableOpacity>
            </View> */}
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.contextChat}>
          <View style={styles.userChatting}>
            <Image
              source={{ uri: user.avatar }}
              style={{ height: 35, width: 35, marginTop: 15 }}
            />
            <View style={{ alignItems: "center", paddingHorizontal: 10 }}>
              <Text style={{ color: "#ccc" }}>{user.time}</Text>
              <View style={styles.blockChat}>
                <Text style={{ color: "#fff" }}>{user.mess}</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.bottomtab}>
        <TouchableOpacity style={styles.touch}>
          <Ionicons name="image" size={40} color={themeColors.text} />
        </TouchableOpacity>
        {isRecording && (
          <View style={styles.recordingBox}>
            <Text style={styles.recordingText}> Đang ghi âm...</Text>
            <TouchableOpacity
              style={styles.stopBtn}
              onPress={handleStopRecording}
            >
              <Text style={styles.stopText}></Text>
            </TouchableOpacity>
          </View>
        )}
        <TouchableOpacity style={styles.touch} onPress={handleMicPress}>
          <Ionicons name="mic" size={40} color={themeColors.text} />
        </TouchableOpacity>
        <TextInput
          style={styles.textInput}
          placeholder="Nhập nội dung ..."
          placeholderTextColor={"#ccc"}
        />
        <TouchableOpacity style={styles.touch}>
          <Ionicons name="send" size={40} color={themeColors.text} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const getStyles = (themeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.background,
    },
    head: {
      width: "100%",
      backgroundColor: themeColors.primary,
      height: 100,
      paddingTop: 40,
      paddingHorizontal: 20,
    },
    user: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    avatar: {
      width: 55,
      height: 55,
      marginLeft: 10,
    },
    name: {
      fontSize: 24,
      color: "#fff",
      paddingHorizontal: 20,
      fontWeight: "bold",
    },
    content: {
      flex: 1,
    },
    bottomtab: {
      height: 90,
      backgroundColor: themeColors.primary,
      flexDirection: "row",
      justifyContent: "space-around",
      alignItems: "center",
      paddingHorizontal: 10,
      paddingBottom: 20,
      borderTopColor: "#ccc",
      borderTopWidth: 1,
    },
    textInput: {
      flex: 1,
      height: 50,
      borderRadius: 10,
      paddingLeft: 20,
      marginHorizontal: 10,
      borderColor: "#ccc",
      borderWidth: 1,
      color: themeColors.text,
    },
    contextChat: {
      paddingVertical: 20,
      paddingHorizontal: 10,
    },
    userChatting: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "start",
    },
    blockChat: {
      backgroundColor: "#7399C3",
      padding: 15,
      borderRadius: 20,
    },
    recordingBox: {
      position: 'absolute',
      bottom: 100,
      left: 20,
      right: 20,
      backgroundColor: '#333',
      padding: 8,
      borderRadius: 15,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      zIndex: 10,
    },
    recordingText: {
      color: '#fff',
      fontSize: 16,
    },
    stopBtn: {
      width: 40,
      height: 40,
      backgroundColor: '#ffff', 
      borderRadius: 20, 
      justifyContent: 'center',
      alignItems: 'center',
    },
    stopText: {
      width: 18,
      height: 18,
      backgroundColor: '#0066FF',
      borderRadius: 3,
    },
  });
