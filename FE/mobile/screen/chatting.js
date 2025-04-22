import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Image, Alert, KeyboardAvoidingView, Platform, Modal, ScrollView } from 'react-native';
import { useTheme } from "../contexts/themeContext";
import colors from "../themeColors";
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import io from "socket.io-client";
import getIp from "../utils/getIp_notPORT";
import Entypo from "@expo/vector-icons/Entypo";
import Feather from '@expo/vector-icons/Feather';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import moment from "moment";
import getUserbySearch from "../api/api_searchUSer";
import { showLocalNotification } from "../utils/notifications";
import deleteMessage from '../api/api_deleteMessage';
import { Audio } from "expo-av";
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import sendFile from '../api/api_sendFile';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import getChatIdFromRoom from '../api/api_getChatIdbyChatRoomId';
import getChatRoom from '../api/api_getChatRoombyChatRoomId.js';
const BASE_URL = getIp();
const socket = io(`http://${BASE_URL}:3618`);
const notificationSocket = io(`http://${BASE_URL}:3515`);
import createGroupChatRoom from '../api/api_createChatRoomforGroup.js';
import useFriends from '../api/api_getListFriends.js'
import updateChatRoom from '../api/api_updateChatRoomforGroup.js';
import deleteMember from "../api/api_deleteMember.js"
import disbandGroup from '../api/api_disbandGroup.js';

export default function App({ navigation, route }) {
  const { theme } = useTheme();
  const themeColors = colors[theme];
  const { contacts, fetchFriends } = useFriends();
  const otherUser = route.params.otherUser;
  const chatRoom = route.params.chatRoom;
  const thisUser = route.params.thisUser;
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [currentUserPhone, setCurrentUserPhone] = useState();
  const flatListRef = useRef();
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showMessageOptions, setShowMessageOptions] = useState(false);
  const [soundObject, setSoundObject] = useState(null);
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [filePreview, setFilePreview] = useState(null);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showFileOptions, setShowFileOptions] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const [phongChat, setPhongChat] = useState(chatRoom);


  useEffect(() => {

    const fetchData = async () => {
      try {
        const data = await getChatRoom(chatRoom.chatRoomId);
        setPhongChat(data);
      } catch (err) {
        console.error("Lỗi fetch phòng chat:", err);
        Alert.alert("Lỗi", "Không thể tải thông tin phòng chat");
      }
    };

    if (chatRoom?.chatRoomId) {
      fetchData();
    }
  }, [chatRoom?.chatRoomId]);

  useEffect(() => {
    fetchFriends();
  }, []);

  useEffect(() => {
    setListFriends(contacts)
  }, [contacts]);

  useEffect(() => {
    if (messages?.length) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  useEffect(() => {
    if (!chatRoom.chatRoomId || !thisUser?.phoneNumber) return;

    setCurrentUserPhone(thisUser.phoneNumber);

    const fetchMessages = async () => {
      try {
        const res = await fetch(
          `http://${BASE_URL}:3618/messages?chatRoomId=${chatRoom.chatRoomId}`
        );
        const data = await res.json();

        if (Array.isArray(data)) {
          setMessages(data);
        } else {
          console.warn("Dữ liệu không phải mảng:", data);
        }
      } catch (err) {
        console.error("Lỗi khi lấy tin nhắn:", err);
        Alert.alert("Lỗi", "Không thể tải tin nhắn");
      }
    };

    fetchMessages();

    socket.emit("joinRoom", chatRoom.chatRoomId);

    const handleReceiveMessage = (newMessage) => {
      console.log("Tin nhắn mới:", newMessage);
      setMessages((prev) => {
        if (prev.some((msg) => msg.timestamp === newMessage.timestamp)) {
          return prev;
        }
        socket.emit("updateLastMessage", {
          chatRoomId: chatRoom.chatRoomId,
          message: newMessage
        });
        return [...prev, newMessage];
      });
    };

    const handleTyping = () => setTyping(true);
    const handleStopTyping = () => setTyping(false);

    const handleMessageRevoked = (data) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.timestamp === data.timestamp ? { ...msg, ...data } : msg
        )
      );
    };

    socket.on("receiveMessage", handleReceiveMessage);
    socket.on("userTyping", handleTyping);
    socket.on("userStopTyping", handleStopTyping);
    socket.on("messageRevoked", handleMessageRevoked);

    return () => {
      socket.off("receiveMessage", handleReceiveMessage);
      socket.off("userTyping", handleTyping);
      socket.off("userStopTyping", handleStopTyping);
      socket.off("messageRevoked", handleMessageRevoked);
    };
  }, [chatRoom.chatRoomId, thisUser?.phoneNumber]);

  useEffect(() => {
    return () => {
      if (soundObject) {
        soundObject.unloadAsync();
      }
    };
  }, [soundObject]);

  const handleSend = async () => {
    if (phongChat.status === 'DISBANDED') {
      Alert.alert("Nhóm đã bị giải tán, không thể gửi tin nhắn");
      return;
    }
    if (isRecording && recording) {
      // Đang ghi âm, dừng và gửi tin nhắn thoại
      try {
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        setIsRecording(false);
        setRecording(null);
        await handleSendAudio(uri);
      } catch (error) {
        console.error("Lỗi khi dừng và gửi ghi âm:", error);
        Alert.alert("Lỗi", "Không thể gửi tin nhắn thoại.");
      }
      return;
    }
    const chatId = await getChatIdFromRoom(chatRoom.chatRoomId);

    if (!message.trim()) return;

    const newMsg = {
      chatRoomId: chatRoom.chatRoomId,
      sender: currentUserPhone,
      receiver: otherUser.phoneNumber,
      message: message,
      timestamp: Date.now(),
      type: "text",
      chatId,
      replyTo: null
    };



    try {
      const response = await fetch(`http://${BASE_URL}:3618/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMsg),
      });

      if (!response.ok) throw new Error("Gửi tin nhắn thất bại!");
      console.log("Tin nhắn gửi thành công:", newMsg);
      setMessage("");
    } catch (error) {
      console.error("Lỗi gửi tin nhắn:", error);
      Alert.alert("Lỗi", "Không thể gửi tin nhắn. Vui lòng thử lại sau.");
    }
  };

  // Hàm xử lý thu hồi tin nhắn
  const handleDeleteMessagePress = async () => {
    if (!selectedMessage) return;

    try {
      await deleteMessage(chatRoom.chatRoomId, selectedMessage.timestamp);
      setShowMessageOptions(false);
      setSelectedMessage(null);
    } catch (error) {
      console.error("Lỗi thu hồi tin nhắn:", error);
      Alert.alert("Lỗi", "Không thể thu hồi tin nhắn. Vui lòng thử lại sau.");
    }
  };

  const handleLongPressMessage = (item) => {
    if (item.sender === thisUser.phoneNumber) {
      setSelectedMessage(item);
      setShowMessageOptions(true);
    }
  };

  const startRecording = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        interruptionModeIOS: 1,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
      });

      const { status } = await Audio.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Cần quyền truy cập microphone");
        return;
      }

      const recordingOptions = {
        isMeteringEnabled: true,
        android: {
          extension: ".m4a",
          outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_MPEG_4,
          audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AAC,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
        },
        ios: {
          extension: ".m4a",
          outputFormat: Audio.RECORDING_OPTION_IOS_OUTPUT_FORMAT_MPEG4AAC,
          audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_HIGH,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
        },
      };

      const { recording } = await Audio.Recording.createAsync(recordingOptions);
      setRecording(recording);
      setIsRecording(true);
    } catch (error) {
      console.error("Lỗi ghi âm:", error);
      Alert.alert("Lỗi", "Không thể bắt đầu ghi âm. Vui lòng thử lại.");
    }
  };

  const stopRecording = async () => {
    if (!recording) {
      setIsRecording(false);
      return;
    }

    try {
      await recording.stopAndUnloadAsync();
    } catch (error) {
      console.error("Lỗi khi dừng ghi âm:", error);
      Alert.alert("Lỗi", "Không thể dừng ghi âm. Vui lòng thử lại.");
    } finally {
      setIsRecording(false);
      setRecording(null);
    }
  };

  const handleSendAudio = async (uri) => {
    if (phongChat.status === 'DISBANDED') {
      Alert.alert("Nhóm đã bị giải tán, không thể gửi tin nhắn");
      return;
    }
    if (!uri) {
      Alert.alert("Lỗi", "Không có bản ghi âm để gửi.");
      return;
    }
    const formData = new FormData();
    formData.append("file", {
      uri,
      name: `voice-${Date.now()}.mp3`,
      type: "audio/mp3",
    });
    formData.append("chatRoomId", chatRoom.chatRoomId);
    formData.append("sender", currentUserPhone);
    formData.append("receiver", otherUser.phoneNumber);

    try {
      const response = await fetch(`http://${BASE_URL}:3618/sendAudio`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Gửi ghi âm thất bại");
      }
      const audioMessageFromServer = await response.json();
      if (audioMessageFromServer.success && audioMessageFromServer.data) {
        setMessages((prev) => {
          if (prev.some((msg) => msg.timestamp === audioMessageFromServer.data.timestamp)) {
            return prev;
          }
          return [...prev, audioMessageFromServer.data];
        });
        console.log("Gửi ghi âm thành công:", audioMessageFromServer);
      } else {
        throw new Error("Phản hồi server không hợp lệ");
      }
    } catch (error) {
      console.error("Lỗi khi gửi ghi âm:", error);
      Alert.alert("Lỗi", "Không thể gửi tin nhắn thoại.");
    }
  };

  useEffect(() => {
    if (!thisUser?.phoneNumber) return;

    notificationSocket.emit("join", thisUser.phoneNumber);

    notificationSocket.on("notification", async (data) => {
      try {
        let senderName = "Không rõ";
        const senderInfo = await getUserbySearch(data.from, data.from);
        if (senderInfo?.[0]?.fullName) senderName = senderInfo[0].fullName;

        let message = "";
        switch (data.type) {
          case "new_message":
            message = `Tin nhắn từ ${senderName}: ${data.message}`;
            break;
          case "file":
            message = `Bạn nhận được một file từ ${senderName}`;
            break;
          case "audio":
            message = `Bạn nhận được tin nhắn thoại từ ${senderName}`;
            break;
          default:
            message = `Thông báo mới từ ${senderName}`;
        }

        showLocalNotification("VChat", message);
      } catch (err) {
        console.error("Lỗi thông báo:", err);
      }
    });

    return () => {
      notificationSocket.off("notification");
    };
  }, [thisUser?.phoneNumber]);

  const handlePlayAudio = async (audioUrl) => {
    console.log("Bắt đầu phát:", audioUrl);
    try {
      if (!audioUrl || typeof audioUrl !== "string") {
        throw new Error("URL âm thanh không hợp lệ");
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        interruptionModeIOS: 1,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });

      const response = await fetch(audioUrl, { method: "HEAD" });
      if (!response.ok) {
        throw new Error(`Không thể truy cập file âm thanh: ${response.status}`);
      }

      if (soundObject) {
        await soundObject.unloadAsync();
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: true }
      );
      setSoundObject(sound);

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish && !status.isLooping) {
          setSoundObject(null);
          sound.unloadAsync();
        } else if (status.error) {
          console.error("Lỗi phát âm thanh:", status.error);
          Alert.alert("Lỗi", "Không thể phát âm thanh do lỗi: " + status.error);
        }
      });
    } catch (error) {
      console.error("Chi tiết lỗi khi phát âm thanh:", error.message);
      Alert.alert("Lỗi", `Không thể phát tin nhắn thoại: ${error.message}`);
    }
  };

  const pickImage = async () => {
    if (phongChat.status === 'DISBANDED') {
      Alert.alert("Nhóm đã bị giải tán, không thể gửi tin nhắn");
      return;
    }
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert("Cần quyền truy cập", "Ứng dụng cần quyền truy cập thư viện ảnh để gửi ảnh.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        allowsMultipleSelection: true,
        selectionLimit: 5, // gioi han 5 anh
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImages = result.assets;

        let totalSize = 0;
        const fileObjects = [];

        for (const image of selectedImages) {
          const fileInfo = await FileSystem.getInfoAsync(image.uri);
          totalSize += fileInfo.size;

          if (fileInfo.size > 10 * 1024 * 1024) {
            Alert.alert("File quá lớn", `File ${image.fileName || 'ảnh'} vượt quá 10MB`);
            return;
          }

          const fileType = image.mimeType || 'image/jpeg';
          const fileName = image.fileName || `image-${Date.now()}-${fileObjects.length}.jpg`;

          fileObjects.push({
            uri: image.uri,
            type: fileType,
            name: fileName
          });
        }

        if (totalSize > 30 * 1024 * 1024) { // 30MB
          Alert.alert("Files quá lớn", "Tổng kích thước các file không được vượt quá 30MB");
          return;
        }

        // gui nhieu file
        if (fileObjects.length > 0) {
          try {

            console.log(`Sending ${fileObjects.length} files`);
            const result = await sendFile(
              chatRoom.chatRoomId,
              currentUserPhone,
              otherUser.phoneNumber,
              fileObjects
            );
            console.log("Files sent successfully:", result);

          } catch (uploadError) {

            console.error("Upload error details:", uploadError);
            Alert.alert("Lỗi Upload", "Không thể gửi ảnh. Lỗi kết nối đến server.");
          }
        }
      }
    } catch (error) {
      console.error("Lỗi khi chọn ảnh:", error);
      Alert.alert("Lỗi", "Không thể chọn ảnh. Vui lòng thử lại sau.");
    }
  };

  const pickDocument = async () => {
    if (phongChat.status === 'DISBANDED') {
      Alert.alert("Nhóm đã bị giải tán, không thể gửi tin nhắn");
      return;
    }
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
        multiple: true
      });

      if (result.canceled === false && result.assets && result.assets.length > 0) {
        const selectedDocs = result.assets;

        let totalSize = 0;
        const fileObjects = [];

        for (const doc of selectedDocs) {
          // Kiểm tra kích thước file
          const fileInfo = await FileSystem.getInfoAsync(doc.uri);
          totalSize += fileInfo.size;

          if (fileInfo.size > 10 * 1024 * 1024) { // 10MB
            Alert.alert("File quá lớn", `File ${doc.name} vượt quá 10MB`);
            return;
          }

          // Kiểm tra extension file
          const fileExt = doc.name.split('.').pop().toLowerCase();
          const allowedExts = ['jpeg', 'jpg', 'png', 'gif', 'pdf', 'doc', 'docx', 'xls',
            'xlsx', 'ppt', 'pptx', 'zip', 'rar', 'txt', 'mp3', 'mp4', 'm4a'];

          if (!allowedExts.includes(fileExt)) {
            Alert.alert("Định dạng không hỗ trợ", `File ${doc.name} có định dạng không được hỗ trợ.`);
            return;
          }

          fileObjects.push({
            uri: doc.uri,
            type: doc.mimeType || `application/${fileExt}`,
            name: doc.name
          });
        }

        // 
        if (totalSize > 30 * 1024 * 1024) { // tong kich co 30MB
          Alert.alert("Files quá lớn", "Tổng kích thước các file không được vượt quá 30MB");
          return;
        }

        // gui nhieu file
        if (fileObjects.length > 0) {
          try {

            console.log(`Sending ${fileObjects.length} documents`);
            const result = await sendFile(
              chatRoom.chatRoomId,
              currentUserPhone,
              otherUser.phoneNumber,
              fileObjects
            );
            console.log("Documents sent successfully:", result);

          } catch (uploadError) {

            console.error("Upload error details:", uploadError);
            Alert.alert("Lỗi Upload", "Không thể gửi tài liệu. Lỗi kết nối đến server.");
          }
        }
      }
    } catch (error) {
      console.error("Lỗi khi chọn file:", error);
      Alert.alert("Lỗi", "Không thể chọn file. Vui lòng thử lại sau.");
    }
  };

  const handleSendFile = async (fileObjs) => {
    if (phongChat.status === 'DISBANDED') {
      Alert.alert("Nhóm đã bị giải tán, không thể gửi tin nhắn");
      return;
    }
    setIsUploading(true);
    try {
      let chatRoomId = chatRoom.chatRoomId
      console.log(`Starting to send ${Array.isArray(fileObjs) ? fileObjs.length : 1} file(s):`, {
        chatRoomId,
        from: currentUserPhone,
        to: otherUser.phoneNumber
      });

      const BASE_URL = getIp();
      console.log("Using BASE_URL:", BASE_URL);

      const result = await sendFile(
        chatRoom.chatRoomId,
        currentUserPhone,
        otherUser.phoneNumber,
        fileObjs
      );

      console.log("Kết quả gửi file:", result);
      setIsUploading(false);
    } catch (error) {
      setIsUploading(false);
      console.error("Lỗi gửi file:", error);
      if (error.message && error.message.includes("Network request failed")) {
        Alert.alert("Lỗi kết nối", "Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng và địa chỉ IP máy chủ.");
      } else {
        Alert.alert("Lỗi", "Không thể gửi file. Vui lòng thử lại sau.");
      }
    }
  };

  const renderItem = async ({ item }) => {
    const isCurrentUser = item.sender === thisUser.phoneNumber;
    const renderMessageContent = () => {
      if (item.isRevoked) {
        return (
          <Text style={{
            color: '#a0a0a0',
            fontStyle: 'italic',
            maxWidth: '90%',
            flexWrap: 'wrap',
            backgroundColor: isCurrentUser ? 'rgba(111, 211, 159, 0.2)' : 'rgba(139, 185, 242, 0.2)',
            paddingHorizontal: 10,
            paddingVertical: 5,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: '#a0a0a0',
            borderStyle: 'dashed',
          }}>
            Tin nhắn đã được thu hồi
          </Text>
        );
      } else if (item.type === "text") {
        return (
          <Text style={{
            color: '#fff',
            maxWidth: '90%',
            flexWrap: 'wrap'
          }}>
            {item.message}
          </Text>
        );
      } else if (item.type === "audio") {
        return (
          <TouchableOpacity onPress={() => handlePlayAudio(item.fileInfo?.url || item.message)}>
            <Ionicons name="play-circle" size={30} color="#fff" />
          </TouchableOpacity>
        );
      } else if (item.type === "file") {
        try {
          const fileInfo = JSON.parse(item.message);
          const fileExt = fileInfo.name.split('.').pop().toLowerCase();
          const isImage = ['jpg', 'jpeg', 'png', 'gif'].includes(fileExt);

          if (isImage) {
            return (
              <TouchableOpacity onPress={() => handleViewImage(fileInfo.url, fileInfo.name)}>
                <Image
                  source={{ uri: fileInfo.url }}
                  style={{ width: 150, height: 150, borderRadius: 10 }}
                  resizeMode="cover"
                />
                <Text style={{ color: '#fff', fontSize: 12, marginTop: 5 }}>
                  {fileInfo.name.length > 20 ? fileInfo.name.substring(0, 20) + '...' : fileInfo.name}
                </Text>
              </TouchableOpacity>
            );
          } else {
            return (
              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center' }}
                onPress={() => handleViewFile(fileInfo)}
              >
                <Ionicons name="document-attach" size={30} color="#fff" />
                <View style={{ marginLeft: 10 }}>
                  <Text style={{ color: '#fff' }}>
                    {fileInfo.name.length > 20 ? fileInfo.name.substring(0, 20) + '...' : fileInfo.name}
                  </Text>
                  <Text style={{ color: '#fff', fontSize: 12 }}>
                    {Math.round(fileInfo.size / 1024)} KB
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }
        } catch (error) {
          console.log("Lỗi parse JSON:", error, "message:", item.message);
          return <Text style={{ color: '#fff' }}>[Tin nhắn file lỗi]</Text>;
        }
      } else {
        return <Text style={{ color: '#fff' }}>[Tin nhắn không hỗ trợ]</Text>;
      }
    };
    const users = await getUserbySearch(item.sender, "");
    const user = users[0];
    return (
      <TouchableOpacity
        style={[
          styles.userChatting,
          { justifyContent: isCurrentUser ? 'flex-end' : 'flex-start' }
        ]}
        onLongPress={() => handleLongPressMessage(item)}
        delayLongPress={500}
      >
        {!isCurrentUser && (
          <Image source={{ uri: chatRoom.isGroup ? user.avatar : otherUser.avatar }} style={{ height: 50, width: 50, marginTop: 15, borderRadius: 50 }} />
        )}
        <View style={{ alignItems: 'center' }}>

          <View
            style={[
              styles.blockChat,
              {
                backgroundColor: item.isRevoked
                  ? (isCurrentUser ? 'rgba(111, 211, 159, 0.2)' : 'rgba(139, 185, 242, 0.2)')
                  : (isCurrentUser ? '#6fd39f' : '#8bb9f2'),
                borderRadius: 15,
                padding: item.isRevoked ? 0 : 10,
                borderWidth: item.isRevoked ? 1 : 0,
                borderColor: item.isRevoked ? '#a0a0a0' : 'transparent',
                borderStyle: item.isRevoked ? 'dashed' : 'solid',
              },
            ]}
          >
            {
              chatRoom.isGroup && !isCurrentUser && user?.fullName && (
                <Text style={{ color: '#000', fontSize: 8, fontWeight: 'bold', marginBottom: 3 }}>
                  {user.fullName}:
                </Text>
              )
            }
            {renderMessageContent()}
          </View>
          <Text style={{ color: themeColors.text, fontSize: 10 }}>
            {moment(item.timestamp).format('HH:mm dd/MM/YY')}
          </Text>
        </View>
        {isCurrentUser && (
          <Image source={{ uri: thisUser.avatar }} style={{ height: 50, width: 50, marginTop: 15, borderRadius: 50 }} />
        )}
      </TouchableOpacity>
    );
  };

  const handleViewImage = (imageUrl, imageName) => {
    setSelectedImage({ url: imageUrl, name: imageName });
    setShowImageViewer(true);
  };

  const handleViewFile = (fileInfo) => {
    setSelectedFile(fileInfo);
    setShowFileOptions(true);
  };

  const downloadFile = async (fileUrl, fileName) => {
    setIsDownloading(true); // Bật trạng thái tải
    try {
      // Kiểm tra quyền truy cập
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        setIsDownloading(false); // Tắt trạng thái tải nếu không có quyền
        Alert.alert('Cần quyền truy cập', 'Ứng dụng cần quyền truy cập bộ nhớ để tải xuống file.');
        return;
      }

      // Tạo đường dẫn lưu file tạm thời
      const tempFileUri = FileSystem.cacheDirectory + fileName;

      // Tải file xuống
      const downloadResumable = FileSystem.createDownloadResumable(
        fileUrl,
        tempFileUri,
        {},
        (downloadProgress) => {
          const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
          console.log(`Tiến độ tải: ${progress * 100}%`);
        }
      );

      const { uri } = await downloadResumable.downloadAsync();
      console.log('File đã tải xuống tại:', uri);

      if (uri) {
        // Kiểm tra loại file dựa trên phần mở rộng
        const fileExt = fileName.split('.').pop().toLowerCase();
        const mediaExts = ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'mov', 'avi', 'mp3', 'wav', 'm4a'];

        if (mediaExts.includes(fileExt)) {
          // Nếu là file media, lưu vào MediaLibrary
          const asset = await MediaLibrary.createAssetAsync(uri);
          console.log('Asset created:', asset);
          setIsDownloading(false); // Tắt trạng thái tải
          Alert.alert('Thành công', 'File media đã được lưu vào thư viện.');
        } else {
          // Nếu không phải file media, lưu vào thư mục Downloads
          const downloadsDir = `${FileSystem.documentDirectory}Downloads/`;
          await FileSystem.makeDirectoryAsync(downloadsDir, { intermediates: true });
          const finalUri = downloadsDir + fileName;
          await FileSystem.moveAsync({
            from: uri,
            to: finalUri,
          });
          console.log('File đã được lưu tại:', finalUri);
          setIsDownloading(false); // Tắt trạng thái tải
          // Nếu muốn thông báo thành công, bạn có thể bật lại dòng này:
          // Alert.alert('Thành công', `File đã được lưu tại: ${finalUri}`);

          // Nếu có thể chia sẻ, cung cấp tùy chọn chia sẻ file
          if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(finalUri);
          }
        }

        // Xóa file tạm nếu cần
        try {
          await FileSystem.deleteAsync(tempFileUri, { idempotent: true });
        } catch (deleteError) {
          console.log('Lỗi khi xóa file tạm:', deleteError);
        }
      }
    } catch (error) {
      setIsDownloading(false); // Tắt trạng thái tải nếu có lỗi
      console.error('Lỗi chi tiết khi tải file:', error);
      Alert.alert('Lỗi', `Không thể tải xuống file: ${error.message}. Vui lòng thử lại sau.`);
    }
  };

  const [showModalAdd, setShowModalAdd] = useState(false);
  const [listFriends, setListFriends] = useState()

  const [participantsInfo, setParticipantsInfo] = useState([]);
  const [friendsNotInGroup, setFriendsNotInGroup] = useState([]);
  const [groupName, setGroupName] = useState("");

  // Lấy danh sách thành viên hiện tại từ participants (sử dụng getUserbySearch)
  useEffect(() => {
    const fetchParticipantsInfo = async () => {
      if (!phongChat?.participants) return;

      const results = await Promise.all(
        phongChat.participants.map(phone => getUserbySearch(phone, ""))
      );
      setParticipantsInfo(results.map(res => res[0])); // mỗi res là mảng 1 phần tử
    };

    fetchParticipantsInfo();
  }, [phongChat]);

  // Lọc bạn bè chưa nằm trong participants
  useEffect(() => {
    const phonesInGroup = phongChat?.participants || [];
    const notInGroup = contacts.filter(friend => !phonesInGroup.includes(friend.phone));
    setFriendsNotInGroup(notInGroup);
  }, [contacts, phongChat]);

  const [newList, setNewList] = useState([]);

  const handleAddMemberToNewList = (phone) => {
    setNewList((prev) =>
      prev.includes(phone)
        ? prev.filter(p => p !== phone) // Bỏ ra
        : [...prev, phone]              // Thêm vào
    );
  };

  const createGroup = () => {
    const mergedList = [...phongChat.participants, ...newList];
    const uniqueList = [...new Set(mergedList)];

    if (!groupName.trim() || !/^(?! )[A-Za-zÀ-ỹ0-9 ]{3,50}$/.test(groupName)) {
      Alert.alert("Tên nhóm không hợp lệ.");
      return;
    }

    if (uniqueList.length < 3) {
      Alert.alert("Một nhóm phải có ít nhất ba thành viên.");
      return;
    }

    createGroupChatRoom({
      nameGroup: groupName,
      createdBy: thisUser.phoneNumber,
      participants: uniqueList
    }).then((data) => {
      console.log("Tạo nhóm thành công:", data);
      return;
    }).catch((err) => {
      console.error("Lỗi khi tạo nhóm:", err);
      Alert.alert("Lỗi", "Tạo nhóm thất bại.");
    });
  };

  const updateGroup = () => {
    const mergedList = [...phongChat.participants, ...newList];
    const uniqueList = [...new Set(mergedList)];

    if (!groupName.trim() || !/^(?! )[A-Za-zÀ-ỹ0-9 ]{3,50}$/.test(groupName)) {
      Alert.alert("Tên nhóm không hợp lệ.");
      return;
    }

    if (uniqueList.length < 3) {
      Alert.alert("Một nhóm phải có ít nhất ba thành viên.");
      return;
    }
    console.log("unique ", uniqueList)
    console.log("id ", phongChat.chatRoomId);

    updateChatRoom({
      roomId: phongChat.chatRoomId,
      nameGroup: groupName,
      participants: uniqueList,
    }).then((data) => {
      console.log("Cập nhật nhóm thành công:", data);
      Alert.alert("Thành công", "Nhóm đã được cập nhật.");
      handleCloseModalAdd();
      return;
    }).catch((err) => {
      console.error("Lỗi khi cập nhật nhóm:", err);
      Alert.alert("Lỗi", "Cập nhật nhóm thất bại.");
    });
  };

  const handleRemoveMember = async (phoneToRemove, name) => {
    Alert.alert(
      "Xác nhận",
      `Bạn có chắc muốn xoá ${name} khỏi nhóm?`,
      [
        {
          text: "Huỷ",
          style: "cancel"
        },
        {
          text: "Xoá",
          style: "destructive",
          onPress: async () => {
            try {
              const result = await deleteMember(phongChat.chatRoomId, phoneToRemove);

              // Cập nhật lại UI nếu cần
              setParticipantsInfo((prev) =>
                prev.filter((user) => user.phoneNumber !== phoneToRemove)
              );

              Alert.alert("Thành công", "Đã xoá thành viên khỏi nhóm.");
              return;
            } catch (err) {
              Alert.alert("Lỗi", err.message || "Không thể xoá thành viên.");
            }
          }
        }
      ]
    );
  };

  const handleDisbandGroup = async () => {
    Alert.alert(
      "Xác nhận",
      "Bạn có chắc chắn muốn giải tán nhóm không? Sau khi giải tán, không thể gửi tin nhắn nữa.",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Đồng ý",
          style: "destructive",
          onPress: async () => {
            try {
              const result = await disbandGroup(phongChat.chatRoomId);
              console.log("Giải tán nhóm thành công:", result);
              Alert.alert("Thành công", "Nhóm đã được giải tán.");
              navigation.goBack();
            } catch (error) {
              console.error("Lỗi giải tán nhóm:", error);
              Alert.alert("Lỗi", error.message || "Không thể giải tán nhóm.");
            }
          },
        },
      ]
    );
  };

  const handleOpenModalAdd = () => {
    if (phongChat.status === 'DISBANDED') {
      Alert.alert("Nhóm đã bị giải tán, thao tác này đã bị khóa");
      return;
    }
    setShowModalAdd(true);
  };

  const handleCloseModalAdd = () => {
    setShowModalAdd(false);
  };

  useEffect(() => {
    if (phongChat.isGroup) {
      setGroupName(phongChat.nameGroup || "");
    }
  }, [phongChat]);

  const styles = getStyles(themeColors);
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.container}>
        <View style={styles.head}>
          <View style={styles.user}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Ionicons name="chevron-back" size={20} color="#fff" />
              </TouchableOpacity>
              <Image source={{ uri: chatRoom.isGroup ? chatRoom.avatar : otherUser.avatar }} style={styles.avatar} />
              <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail">{chatRoom.isGroup ? chatRoom.fullName : otherUser.fullName}</Text>
            </View>


            {phongChat.status === "DISBANDED" && (
              <View
                style={{
                  backgroundColor: "red",
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 12,
                  alignSelf: "center",
                }}
              >
                <Text style={{ color: "#fff", fontSize: 12, fontWeight: "bold" }}>Đã giải tán</Text>
              </View>
            )}
            {!phongChat.isGroup && (
              <>
                <TouchableOpacity style={{ padding: 5, marginLeft: 20 }} onPress={handleOpenModalAdd}>
                  <FontAwesome6 name="users" size={20} color="#fff" />
                </TouchableOpacity>
              </>
            )}
            {phongChat.isGroup && (
              <>
                <TouchableOpacity style={{ padding: 5 }} onPress={handleOpenModalAdd}>
                  <Entypo name="dots-three-vertical" size={20} color="#fff" />
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        <FlatList
          ref={flatListRef}
          style={styles.content}
          data={messages}
          keyExtractor={(item, index) => index.toString()}
          renderItem={renderItem}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />


        <View style={styles.bottomtab}>
          <TouchableOpacity style={styles.touch} onPress={pickImage}>
            <Ionicons name="image" size={30} color={themeColors.icon} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.touch} onPress={pickDocument}>
            <Ionicons name="document-attach" size={30} color={themeColors.icon} />
          </TouchableOpacity>
          {!isRecording ? (
            <TouchableOpacity style={styles.touch} onPress={startRecording}>
              <Ionicons name="mic" size={30} color={themeColors.icon} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.recordingControl} onPress={stopRecording}>
              <View style={styles.stopIcon} />
            </TouchableOpacity>
          )}
          <TextInput
            style={styles.textInput}
            placeholder="Nhập nội dung ..."
            placeholderTextColor="#ccc"
            value={message}
            onChangeText={setMessage}
            editable={true}
          />
          <TouchableOpacity style={styles.touch} onPress={handleSend}>
            <Ionicons name="send" size={30} color={themeColors.icon} />
          </TouchableOpacity>
        </View>




        {/* Modal tùy chọn tin nhắn */}
        <Modal
          transparent={true}
          visible={showMessageOptions}
          animationType="fade"
          onRequestClose={() => setShowMessageOptions(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowMessageOptions(false)}
          >
            <View style={styles.modalContent}>
              <TouchableOpacity
                style={styles.modalOption}
                onPress={handleDeleteMessagePress}
              >
                <MaterialIcons name="delete" size={24} color="red" />
                <Text style={styles.modalOptionText}>Thu hồi tin nhắn</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalOption}
                onPress={() => setShowMessageOptions(false)}
              >
                <MaterialIcons name="cancel" size={24} color={themeColors.text} />
                <Text style={styles.modalOptionText}>Hủy</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Modal xem ảnh toàn màn hình */}
        <Modal
          transparent={true}
          visible={showImageViewer}
          animationType="fade"
          onRequestClose={() => setShowImageViewer(false)}
        >
          <View style={styles.imageViewerContainer}>
            <View style={styles.imageViewerHeader}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowImageViewer(false)}
              >
                <Ionicons name="close" size={28} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.downloadButton}
                onPress={() => downloadFile(selectedImage?.url, selectedImage?.name)}
              >
                <Ionicons name="download-outline" size={28} color="#fff" />
              </TouchableOpacity>
            </View>
            <View style={styles.imageViewerContent}>
              {selectedImage && (
                <Image
                  source={{ uri: selectedImage.url }}
                  style={styles.fullImage}
                  resizeMode="contain"
                />
              )}
            </View>
            <View style={styles.imageNameContainer}>
              <Text style={styles.imageName}>{selectedImage?.name}</Text>
            </View>
          </View>
        </Modal>

        {/* Modal tùy chọn tải xuống file */}
        <Modal
          transparent={true}
          visible={showFileOptions}
          animationType="slide"
          onRequestClose={() => setShowFileOptions(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowFileOptions(false)}
          >
            <View style={styles.fileOptionsContainer}>
              <View style={styles.fileOptionsHeader}>
                <Text style={styles.fileOptionsTitle}>Tùy chọn file</Text>
                <TouchableOpacity onPress={() => setShowFileOptions(false)}>
                  <Ionicons name="close" size={24} color={themeColors.text} />
                </TouchableOpacity>
              </View>
              <View style={styles.fileDetailsContainer}>
                <Ionicons name="document-outline" size={40} color={themeColors.text} />
                <View style={styles.fileDetails}>
                  <Text style={[styles.fileName, { color: themeColors.text }]}>
                    {selectedFile?.name}
                  </Text>
                  <Text style={[styles.fileSize, { color: themeColors.text }]}>
                    {selectedFile && Math.round(selectedFile.size / 1024)} KB
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.downloadFileButton}
                onPress={() => {
                  downloadFile(selectedFile?.url, selectedFile?.name);
                  setShowFileOptions(false);
                }}
              >
                <Ionicons name="download-outline" size={24} color="#fff" />
                <Text style={styles.downloadButtonText}>Tải xuống</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowFileOptions(false)}
              >
                <Text style={styles.cancelButtonText}>Hủy</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Modal add member */}
        <Modal
          visible={showModalAdd}
          transparent={true}
          animationType="slide"
          onRequestClose={handleCloseModalAdd}
        >
          <View style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.4)',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <View style={{
              width: '85%',
              backgroundColor: themeColors.background,
              padding: 20,
              borderRadius: 20
            }}>

              {
                phongChat.isGroup && (
                  <View style={{ marginBottom: 10, position: 'relative' }}>
                    <Image
                      source={{ uri: phongChat.avatar }}
                      style={{ width: 80, height: 80, borderRadius: 50, alignSelf: 'center' }}
                    />
                    <TouchableOpacity style={{ position: 'absolute', right: 100, top: 60 }}>
                      <Feather name="edit" size={18} color={themeColors.icon2} />
                    </TouchableOpacity>
                    <View>
                      <TextInput
                        placeholder="Nhập tên nhóm"
                        placeholderTextColor="#aaa"
                        value={groupName}
                        onChangeText={setGroupName}
                        style={{
                          borderWidth: 1,
                          borderColor: '#ccc',
                          borderRadius: 10,
                          padding: 10,
                          marginTop: 15,
                          color: themeColors.text
                        }}
                      />
                    </View>
                  </View>
                )
              }

              {
                phongChat.isGroup && thisUser.phoneNumber === phongChat.admin && (
                  <TouchableOpacity
                    style={{
                      backgroundColor: '#FF3B30',
                      padding: 12,
                      borderRadius: 10,
                      alignItems: 'center',
                      marginBottom: 20
                    }}
                    onPress={handleDisbandGroup}
                  >
                    <Text style={{ color: 'white', fontWeight: 'bold' }}>Giải tán nhóm</Text>
                  </TouchableOpacity>

                )
              }

              <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 10, color: themeColors.text }}>
                {phongChat?.isGroup ? `Thành viên nhóm hiện tại (${phongChat.participants.length})` : 'Thành viên'}
              </Text>

              {/* Danh sách thành viên hiện tại */}
              <FlatList
                data={participantsInfo}
                keyExtractor={(item) => item.phoneNumber}
                renderItem={({ item }) => (
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    <Image
                      source={{ uri: item.avatar }}
                      style={{ width: 40, height: 40, borderRadius: 20, marginRight: 10 }}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: themeColors.text }}>
                        {item.fullName || item.phoneNumber}
                      </Text>
                      {phongChat.isGroup && phongChat.admin === item.phoneNumber && <Text style={{
                        backgroundColor: themeColors.primary, fontSize: 12, color: '#fff', padding: 5, textAlign: 'center', borderRadius: 10, width: 100, fontWeight: 'bold'
                      }}>is admin</Text>}

                      {phongChat.isGroup &&
                        thisUser.phoneNumber === phongChat.admin && // chỉ admin mới thấy
                        item.phoneNumber !== phongChat.admin &&     // không hiển thị để xoá admin
                        item.phoneNumber !== thisUser.phoneNumber && // không xoá chính mình
                        (
                          <TouchableOpacity style={{ alignSelf: 'flex-end' }} onPress={() => handleRemoveMember(item.phoneNumber, item.fullName)}>
                            <Feather name="delete" size={18} color="red" />
                          </TouchableOpacity>
                        )
                      }
                    </View>
                  </View>
                )}
              />


              <View style={{ height: 10 }} />

              <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 10, color: themeColors.text }}>Thêm Thành Viên</Text>

              {/* Danh sách bạn bè chưa là thành viên */}
              <FlatList
                data={friendsNotInGroup}
                keyExtractor={(item) => item.phone}
                style={{ maxHeight: 200 }}
                renderItem={({ item }) => {
                  const isSelected = newList.includes(item.phone);

                  return (
                    <TouchableOpacity
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginBottom: 8,
                        backgroundColor: isSelected ? themeColors.primary : 'transparent',
                        padding: 8,
                        borderRadius: 10,
                      }}
                      onPress={() => handleAddMemberToNewList(item.phone)}
                    >
                      <Image
                        source={{ uri: item.avatar }}
                        style={{ width: 40, height: 40, borderRadius: 20, marginRight: 10 }}
                      />
                      <Text style={{ color: themeColors.text }}>{item.name}</Text>
                    </TouchableOpacity>
                  );
                }}
                ListEmptyComponent={
                  <Text style={{ color: themeColors.text }}>Không có bạn nào để thêm</Text>
                }
              />


              {/* Nếu không phải nhóm thì có thêm input + nút tạo nhóm */}
              {!phongChat?.isGroup && (
                <>
                  <TextInput
                    placeholder="Nhập tên nhóm"
                    placeholderTextColor="#aaa"
                    value={groupName}
                    onChangeText={setGroupName}
                    style={{
                      borderWidth: 1,
                      borderColor: '#ccc',
                      borderRadius: 10,
                      padding: 10,
                      marginTop: 15,
                      color: themeColors.text
                    }}
                  />

                  <TouchableOpacity style={{ marginTop: 10, backgroundColor: '#2196F3', padding: 10, borderRadius: 10 }} onPress={createGroup}>
                    <Text style={{ color: '#fff', textAlign: 'center' }}>Tạo nhóm</Text>
                  </TouchableOpacity>
                </>
              )}

              {
                phongChat.isGroup && (
                  <>
                    <TouchableOpacity style={{ marginTop: 10, backgroundColor: '#2196F3', padding: 10, borderRadius: 10 }} onPress={updateGroup}>
                      <Text style={{ color: '#fff', textAlign: 'center' }}>Lưu thay đổi</Text>
                    </TouchableOpacity>
                  </>
                )
              }

              <TouchableOpacity onPress={handleCloseModalAdd} style={{ marginTop: 20 }}>
                <Text style={{ color: 'red', textAlign: 'right' }}>Đóng</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>


      </View>
    </KeyboardAvoidingView>
  );
}

const getStyles = (themeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: themeColors.background,
  },
  head: {
    width: '95%',
    backgroundColor: themeColors.primary,
    height: 65,
    paddingHorizontal: 20,
    borderRadius: 30,
    marginTop: 45,
    alignSelf: 'center',
    top: 0
  },
  user: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 5
  },
  avatar: {
    width: 55,
    height: 55,
    marginLeft: 10,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: '#fff'
  },
  name: {
    fontSize: 14,
    color: '#fff',
    paddingHorizontal: 10,
    fontWeight: 'bold'
  },
  content: {
    flex: 1,
  },
  bottomtab: {
    height: 70,
    backgroundColor: themeColors.primary,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingTop: 5,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30
  },
  textInput: {
    flex: 1,
    height: 50,
    borderRadius: 10,
    paddingLeft: 20,
    marginHorizontal: 10,
    borderColor: '#ccc',
    borderWidth: 1,
    color: '#fff'
  },
  contextChat: {
    paddingVertical: 20,
    paddingHorizontal: 10,
  },
  userChatting: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'start',
    padding: 5
  },
  blockChat: {
    // backgroundColor: '#7399C3',
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 30,
  },
  touch: {
    marginHorizontal: 5
  },
  recordingControl: {
    marginHorizontal: 5,
    backgroundColor: "#f00",
    borderRadius: 25,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  stopIcon: {
    backgroundColor: "#fff",
    width: 20,
    height: 20,
    borderRadius: 5,
  },
  // Style cho modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContent: {
    width: '80%',
    backgroundColor: themeColors.background,
    borderRadius: 10,
    padding: 20,
    elevation: 5,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd'
  },
  modalOptionText: {
    fontSize: 16,
    marginLeft: 10,
    color: themeColors.text
  },
  // Style mới cho xem ảnh toàn màn hình
  imageViewerContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
  },
  imageViewerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 20,
    zIndex: 10,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  downloadButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageViewerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: '100%',
    height: '80%',
  },
  imageNameContainer: {
    padding: 20,
    alignItems: 'center',
  },
  imageName: {
    color: '#fff',
    fontSize: 16,
  },
  // Style cho modal tùy chọn file
  fileOptionsContainer: {
    backgroundColor: themeColors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    elevation: 5,
  },
  fileOptionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  fileOptionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: themeColors.text,
  },
  fileDetailsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    backgroundColor: themeColors.backgroundLight || '#f0f0f0',
    marginBottom: 20,
  },
  fileDetails: {
    marginLeft: 15,
    flex: 1,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '500',
  },
  fileSize: {
    fontSize: 14,
    marginTop: 5,
    opacity: 0.7,
  },
  downloadFileButton: {
    backgroundColor: themeColors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  downloadButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 10,
  },
  cancelButton: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: themeColors.backgroundLight || '#f0f0f0',
    marginBottom: 10,
  },
  cancelButtonText: {
    color: themeColors.text,
    fontSize: 16,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Nền mờ
    zIndex: 1000,
  },
  // blockChat: {
  //   padding: 15,
  //   borderRadius: 20,
  // },
  revokedMessage: {
    color: '#a0a0a0',
    fontStyle: 'italic',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#a0a0a0',
    borderStyle: 'dashed',
  },
});
