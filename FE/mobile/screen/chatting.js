import React, { useEffect, useState, useRef, memo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Linking,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Clipboard,
} from "react-native";
import { useTheme } from "../contexts/themeContext";
import colors from "../themeColors";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import io from "socket.io-client";
import getIp from "../utils/getIp_notPORT";
import Entypo from "@expo/vector-icons/Entypo";
import Feather from "@expo/vector-icons/Feather";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import moment from "moment";
import getUserbySearch from "../api/api_searchUSer";
import { showLocalNotification } from "../utils/notifications";
import deleteMessage from "../api/api_deleteMessage";
import addReaction from "../api/api_addReaction";
import { Audio } from "expo-av";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import * as MediaLibrary from "expo-media-library";
import * as Sharing from "expo-sharing";
import sendFile from "../api/api_sendFile";
import getChatIdFromRoom from "../api/api_getChatIdbyChatRoomId";
import getChatRoom from "../api/api_getChatRoombyChatRoomId.js";
const BASE_URL = getIp();
const socket = io(`http://${BASE_URL}:3618`);
const notificationSocket = io(`http://${BASE_URL}:3515`);
import createGroupChatRoom from "../api/api_createChatRoomforGroup.js";
import useFriends from "../api/api_getListFriends.js";
import updateChatRoom from "../api/api_updateChatRoomforGroup.js";
import deleteMember from "../api/api_deleteMember.js";
import disbandGroup from "../api/api_disbandGroup.js";
import setAdmin from "../api/api_setAdmin.js";
import outGroup from "../api/api_outGroup.js";

const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "😡"];

const removeAccentsAndSpaces = (str) => {
  const accentsMap = [
    { base: "A", letters: "ÀÁÂÃÄÅĀĂĄ" },
    { base: "D", letters: "Đ" },
    { base: "E", letters: "ÈÉÊËĒĔĖĘĚ" },
    { base: "I", letters: "ÌÍÎÏĨĪĬĮ" },
    { base: "O", letters: "ÒÓÔÕÖŌŎŐ" },
    { base: "U", letters: "ÙÚÛÜŨŪŬŮŰŲ" },
    { base: "Y", letters: "ÝỲỸỶỴ" },
    { base: "a", letters: "àáâãäåāăą" },
    { base: "d", letters: "đ" },
    { base: "e", letters: "èéêëēĕėęě" },
    { base: "i", letters: "ìíîïĩīĭį" },
    { base: "o", letters: "òóôõöōŏő" },
    { base: "u", letters: "ùúûüũūŭůűų" },
    { base: "y", letters: "ýỳỹỷỵ" },
  ];

  let result = str;
  for (const { base, letters } of accentsMap) {
    for (const letter of letters) {
      result = result.replace(new RegExp(letter, "g"), base);
    }
  }
  return result;
};

// Component riêng cho item tin nhắn
const MessageItem = memo(
  ({
    item,
    isCurrentUser,
    themeColors,
    handleLongPressMessage,
    handleViewImage,
    handleViewFile,
    handlePlayAudio,
    chatRoom,
    otherUser,
    thisUser,
    highlightedMessageId,
    users,
    setSelectedReaction,
    fetchReactionUsersInfo,
    setShowReactionUsers,
    setHighlightedMessageId,
    flatListRef,
    messages,
  }) => {
    const styles = getStyles(themeColors);
    const isHighlighted = highlightedMessageId === item.timestamp;

    // const getFullNameByPhoneNumber = (phoneNumber) => {
    //   const member = (chatRoom?.participantsInfo || []).find(
    //     (m) => m.phoneNumber === phoneNumber
    //   );
    //   return member?.fullName || phoneNumber; // Fallback để debug
    // };
    
    const renderMessageContent = () => {
      if (item.isRevoked) {
        return (
          <Text
            style={{
              color: "#a0a0a0",
              fontStyle: "italic",
              maxWidth: "90%",
              flexWrap: "wrap",
              backgroundColor: isCurrentUser
                ? "rgba(111, 211, 159, 0.2)"
                : "rgba(139, 185, 242, 0.2)",
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: "#a0a0a0",
              borderStyle: "dashed",
            }}
          >
            Tin nhắn đã được thu hồi
          </Text>
        );
      } else if (item.type === "text") {
      let renderedText = item.message;

    // Hàm escape regex
    const escapeRegExp = (string) => {
      return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    };

    // Thay thế số điện thoại bằng tên
    (chatRoom?.participantsInfo || []).forEach((member) => {
      const escapedPhone = escapeRegExp(member.phoneNumber);
      const pattern = `\\[@${escapedPhone}\\]`; // Thêm escape cho dấu []
      const tagRegex = new RegExp(pattern, 'g');
      
      // Sử dụng tên hiển thị ưu tiên từ các trường khác nhau
      const displayName = member.fullName || member.name || member.phoneNumber;
      renderedText = renderedText.replace(tagRegex, `[@${displayName}]`);
    });

    // Xử lý @all (case insensitive)
    if (chatRoom.isGroup) {
      renderedText = renderedText.replace(/@all/gi, (match) => {
        return match === '@all' ? '[@All]' : '[@ALL]'; // Giữ nguyên cách viết hoa
      });
    }

    // Tách các phần tag và text
    const parts = renderedText.split(/(\[@[^\]]+\])/g);
    
    const renderedParts = parts.map((part, index) => {
      if (part.startsWith("[@") && part.endsWith("]")) {
        const tagContent = part.slice(2, -1);
        
        // Kiểm tra xem có phải là tag đặc biệt không
        const isSpecialTag = tagContent.toLowerCase() === 'all';
        
        return (
          <Text 
            key={`tag-${index}`} 
            style={[
              styles.tagText,
              isSpecialTag && styles.specialTag // Thêm style đặc biệt cho @all
            ]}
          >
            @{tagContent}
          </Text>
        );
      }
      
      return (
        <Text key={`text-${index}`} style={styles.normalText}>
          {part}
        </Text>
      );
    });

    return <View style={styles.messageBubble}>{renderedParts}</View>;
      } else if (item.type === "audio") {
        return (
          <TouchableOpacity
            onPress={() => handlePlayAudio(item.fileInfo?.url || item.message)}
          >
            <Ionicons name="play-circle" size={30} color="#fff" />
          </TouchableOpacity>
        );
      } else if (item.type === "file") {
        try {
          const fileInfo = JSON.parse(item.message);
          const fileExt = fileInfo.name.split(".").pop().toLowerCase();
          const isImage = ["jpg", "jpeg", "png", "gif"].includes(fileExt);

          if (isImage) {
            return (
              <TouchableOpacity
                onPress={() => handleViewImage(fileInfo.url, fileInfo.name)}
              >
                <Image
                  source={{ uri: fileInfo.url }}
                  style={{ width: 150, height: 150, borderRadius: 10 }}
                  resizeMode="cover"
                />
                <Text style={{ color: "#fff", fontSize: 12, marginTop: 5 }}>
                  {fileInfo.name.length > 20
                    ? fileInfo.name.substring(0, 20) + "..."
                    : fileInfo.name}
                </Text>
              </TouchableOpacity>
            );
          } else {
            return (
              <TouchableOpacity
                style={{ flexDirection: "row", alignItems: "center" }}
                onPress={() => handleViewFile(fileInfo)}
              >
                <Ionicons name="document-attach" size={30} color="#fff" />
                <View style={{ marginLeft: 10 }}>
                  <Text style={{ color: "#fff" }}>
                    {fileInfo.name.length > 20
                      ? fileInfo.name.substring(0, 20) + "..."
                      : fileInfo.name}
                  </Text>
                  <Text style={{ color: "#fff", fontSize: 12 }}>
                    {Math.round(fileInfo.size / 1024)} KB
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }
        } catch (error) {
          console.log("Lỗi parse JSON:", error, "message:", item.message);
          return <Text style={{ color: "#fff" }}>[Tin nhắn file lỗi]</Text>;
        }
      } else {
        return <Text style={{ color: "#fff" }}>[Tin nhắn không hỗ trợ]</Text>;
      }
    };

    const renderReactions = () => {
      if (!item.reactions || Object.keys(item.reactions).length === 0) {
        return null;
      }

      return (
        <View style={styles.reactionContainer}>
          {Object.entries(item.reactions).map(
            ([emoji, users]) =>
              users.length > 0 && (
                <TouchableOpacity
                  key={emoji}
                  onPress={() => {
                    setSelectedReaction({ emoji, users });
                    fetchReactionUsersInfo(users);
                    setShowReactionUsers(true);
                  }}
                  style={styles.reactionTouchable}
                >
                  <Text style={styles.reactionIcon}>
                    {emoji} {users.length}
                  </Text>
                </TouchableOpacity>
              )
          )}
        </View>
      );
    };

    const user = users;

    return (
      <TouchableOpacity
        style={[
          styles.userChatting,
          { justifyContent: isCurrentUser ? "flex-end" : "flex-start" },
          isHighlighted && styles.highlightedMessage,
        ]}
        onLongPress={() => handleLongPressMessage(item)}
        delayLongPress={500}
        activeOpacity={0.8}
      >
        {!isCurrentUser && (
          <Image
            source={{ uri: user?.avatar }}
            style={{ height: 50, width: 50, marginTop: 15, borderRadius: 50 }}
          />
        )}
        <View style={{ alignItems: "center" }}>
          <View
            style={[
              styles.blockChat,
              {
                backgroundColor: item.isRevoked
                  ? isCurrentUser
                    ? "rgba(111, 211, 159, 0.2)"
                    : "rgba(139, 185, 242, 0.2)"
                  : isCurrentUser
                  ? "#6fd39f"
                  : "#8bb9f2",
                borderRadius: 15,
                padding: item.isRevoked ? 0 : 10,
                borderWidth: item.isRevoked ? 1 : 0,
                borderColor: item.isRevoked ? "#a0a0a0" : "transparent",
                borderStyle: item.isRevoked ? "dashed" : "solid",
              },
            ]}
          >
            {chatRoom.isGroup && !isCurrentUser && user?.fullName && (
              <Text
                style={{
                  color: "#000",
                  fontSize: 8,
                  fontWeight: "bold",
                  marginBottom: 3,
                }}
              >
                {user.fullName}:
              </Text>
            )}
            {item.replyTo && !item.isRevoked && (
              <TouchableOpacity
                onPress={() => {
                  const index = messages.findIndex(
                    (m) => m.timestamp === item.replyTo.timestamp
                  );
                  if (index !== -1) {
                    flatListRef.current.scrollToIndex({
                      index,
                      animated: true,
                    });
                    setHighlightedMessageId(item.replyTo.timestamp);
                  }
                }}
                style={styles.replyPreview}
              >
                <Text style={styles.replyText}>
                  {item.replyTo.sender === thisUser.phoneNumber
                    ? "Bạn"
                  : otherUser.fullName}
                </Text>
                <Text style={styles.replyMessage}>{item.replyTo.message}</Text>
              </TouchableOpacity>
            )}
            {renderMessageContent()}
          </View>
          <Text style={{ color: themeColors.text, fontSize: 10 }}>
            {moment(item.timestamp).format("HH:mm dd/MM/YY")}
          </Text>
          {!item.isRevoked && renderReactions()}
        </View>
        {isCurrentUser && (
          <Image
            source={{ uri: thisUser.avatar }}
            style={{ height: 50, width: 50, marginTop: 15, borderRadius: 50 }}
          />
        )}
      </TouchableOpacity>
    );
  }
);

// Component riêng cho MessageInput
const MessageInput = memo(
  ({
    message,
    setMessage,
    handleSend,
    pickImage,
    pickDocument,
    startRecording,
    stopRecording,
    isRecording,
    themeColors,
    replyingTo,
    handleCancelReply,
    members,
    isGroup,
    groupAvatar,
  }) => {
    const styles = getStyles(themeColors);
    const inputRef = useRef(null);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const [taggedUsers, setTaggedUsers] = useState([]);

    // Tự động lấy lại focus nếu mất
    useEffect(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, [message]);

    // Xử lý khi nhập văn bản
    const handleTextChange = (text) => {
      setMessage(text);

      const lastAt = text.lastIndexOf("@");
      if (
        lastAt !== -1 &&
        (text.length === lastAt + 1 || !text[lastAt + 1]?.match(/\s/))
      ) {
        const query = text
          .slice(lastAt + 1)
          .toLowerCase()
          .normalize("NFC");
        setShowSuggestions(true);

        const suggestionList = [];
        if (isGroup && "all".includes(query)) {
          suggestionList.push({ fullName: "All", phoneNumber: "all" });
        }

        const filteredMembers = (members || []).filter((member) =>
          removeAccentsAndSpaces(member.fullName.toLowerCase()).includes(
            removeAccentsAndSpaces(query)
          )
        );
        setSuggestions([...suggestionList, ...filteredMembers]);
      } else {
        setShowSuggestions(false);
        setSuggestions([]);
      }
    };

    // Xử lý khi chọn một gợi ý
    const handleSelectSuggestion = (member) => {
      const lastAt = message.lastIndexOf("@");
      const beforeTag = message.slice(0, lastAt);
      const tagPhoneNumber = member.phoneNumber;
      const newText = `${beforeTag}[@${tagPhoneNumber}] `;
      setMessage(newText);
      setTaggedUsers((prev) => [...prev, tagPhoneNumber]);
      setShowSuggestions(false);
      setSuggestions([]);
    };

    // Render danh sách gợi ý
    const renderSuggestionItem = ({ item }) => (
      <TouchableOpacity
        style={styles.suggestionItem}
        onPress={() => handleSelectSuggestion(item)}
      >
        <Image
          source={{
            uri:
              item.phoneNumber === "all"
                ? groupAvatar || "https://via.placeholder.com/40"
                : item.avatar || "https://via.placeholder.com/40",
          }}
          style={styles.suggestionAvatar}
        />
        <Text
          style={[
            styles.suggestionText,
            item.phoneNumber === "all" && {
              fontWeight: "bold",
              color: "#007bff",
            },
          ]}
        >
          {item.fullName}
        </Text>
      </TouchableOpacity>
    );

    const renderTextSegments = () => {
      let displayText = message;

      (members || []).forEach((member) => {
        const tagText = `[@${member.phoneNumber}]`;
        const tagRegex = new RegExp(tagText, "g");
        displayText = displayText.replace(tagRegex, `[@${member.fullName || member.phoneNumber}]`);
      });

      if (isGroup) {
        displayText = displayText.replace(/@all/gi, "[@All]");
      }

      const parts = [];
      let currentText = displayText;
      const tagRegex = /(\[@[^\]]+\])/g;
      let lastIndex = 0;
      let match;

      while ((match = tagRegex.exec(currentText)) !== null) {
        const tag = match[0];
        const startIndex = match.index;

        if (startIndex > lastIndex) {
          parts.push({
            text: currentText.slice(lastIndex, startIndex),
            type: "normal",
          });
        }

        parts.push({ text: tag, type: "tag" });

        lastIndex = startIndex + tag.length;
      }

      if (lastIndex < currentText.length) {
        parts.push({
          text: currentText.slice(lastIndex),
          type: "normal",
        });
      }

      return parts.map((segment, index) => {
        if (segment.type === "tag") {
          const tagName = segment.text.slice(2, -1);
          return (
            <Text key={index} style={styles.tagText}>
              @{tagName}
            </Text>
          );
        }
        return (
          <Text key={index} style={styles.normalText}>
            {segment.text}
          </Text>
        );
      });
    };

    return (
      <View style={styles.bottomtab}>
        {replyingTo && (
          <View style={styles.replyingTo}>
            <Text style={styles.replyingToText}>
              Đang trả lời: {replyingTo.message}
            </Text>
            <TouchableOpacity onPress={handleCancelReply}>
              <Ionicons name="close" size={20} color="#ff4d4f" />
            </TouchableOpacity>
          </View>
        )}
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
          <TouchableOpacity
            style={styles.recordingControl}
            onPress={stopRecording}
          >
            <View style={styles.stopIcon} />
          </TouchableOpacity>
        )}

        <TextInput
          ref={inputRef}
          style={styles.textInput}
          placeholder="Nhập nội dung ..."
          placeholderTextColor="#ccc"
          value={message}
          onChangeText={handleTextChange}
          editable={true}
          multiline
        />
        {message && (
          <View style={styles.textPreview} pointerEvents="none">
            {renderTextSegments()}
          </View>
        )}

        <TouchableOpacity
          style={styles.touch}
          onPress={() => handleSend(taggedUsers)}
        >
          <Ionicons name="send" size={30} color={themeColors.icon} />
        </TouchableOpacity>
        {showSuggestions && suggestions.length > 0 && (
          <View style={styles.suggestionsContainer}>
            <FlatList
              data={suggestions}
              renderItem={renderSuggestionItem}
              keyExtractor={(item) => item.phoneNumber}
              style={styles.suggestionsList}
              ListEmptyComponent={
                <Text style={styles.noSuggestions}>
                  Không tìm thấy thành viên
                </Text>
              }
            />
          </View>
        )}
      </View>
    );
  }
);

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
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [showReactionUsers, setShowReactionUsers] = useState(false);
  const [selectedReaction, setSelectedReaction] = useState({
    emoji: "",
    users: [],
  });
  const [reactionUsersInfo, setReactionUsersInfo] = useState([]);
  const [replyingTo, setReplyingTo] = useState(null);
  const [highlightedMessageId, setHighlightedMessageId] = useState(null);
  const [phongChat, setPhongChat] = useState(chatRoom);
  const [showModalAdd, setShowModalAdd] = useState(false);
  const [listFriends, setListFriends] = useState();
  const [participantsInfo, setParticipantsInfo] = useState([]);
  const [friendsNotInGroup, setFriendsNotInGroup] = useState([]);
  const [groupName, setGroupName] = useState("");
  const [newList, setNewList] = useState([]);
  const [newName, setNewName] = useState(chatRoom.fullName);
  const [modalVisible, setModalVisible] = useState(false);
  const [mediaModalVisible, setMediaModalVisible] = useState(false);
  const [imageZoomModalVisible, setImageZoomModalVisible] = useState(false);
  const [selectedImageModal, setSelectedImageModal] = useState(null);
  const chatRoomId = phongChat?.chatRoomId;
  const [listMember, setListMember] = useState(chatRoom?.participants || []);

  useEffect(() => {
    if (!thisUser?.phoneNumber) return;

    socket.emit("joinUser", thisUser.phoneNumber);

    const handleUpdateChatRoom = (data) => {
      if (data?.groupName) {
        setGroupName(data.groupName);
        setNewName(data.groupName);
      }

      if (Array.isArray(data?.participants)) {
        const cleanList = data.participants.filter(Boolean).map(String);
        setListMember(cleanList);
      }

      if (
        data.type === "GROUP_UPDATED_OUT" &&
        data.phoneNumber == thisUser.phoneNumber
      ) {
        navigation.goBack();
      }
    };

    const handleRemoveMember = (data) => {
      if (Array.isArray(data?.participants)) {
        const cleanList = data.participants.filter(Boolean).map(String);
        setListMember(cleanList);
        if (data.phoneNumber === thisUser.phoneNumber) {
          Alert.alert(`Bạn vừa được mời ra khỏi nhóm ${data.groupName}`);
          navigation.goBack();
        }
      }
    };

    const handleSetAdmin = (data) => {
      if (!data?.admin || !Array.isArray(data?.participants)) return;

      setPhongChat((prev) => {
        if (!prev) return prev;

        return {
          ...prev,
          admin: data.admin,
        };
      });
    };

    const handleDisband = (data) => {
      setPhongChat((prev) => {
        if (!prev) return prev;

        return {
          ...prev,
          status: data.status,
        };
      });
    };

    socket.on("updateChatRoom", handleUpdateChatRoom);
    socket.on("updateChatRoom_rmMem", handleRemoveMember);
    socket.on("updateChatRoom_setAdmin", handleSetAdmin);
    socket.on("updateChatRoom_outGroup", handleUpdateChatRoom);
    socket.on("updateChatRoom_disbanded", handleDisband);

    return () => {
      socket.off("updateChatRoom", handleUpdateChatRoom);
      socket.off("updateChatRoom_rmMem", handleRemoveMember);
      socket.off("updateChatRoom_setAdmin", handleSetAdmin);
      socket.off("updateChatRoom_outGroup", handleUpdateChatRoom);
      socket.off("updateChatRoom_disbanded", handleDisband);
    };
  }, [thisUser?.phoneNumber]);

  // Lọc tin nhắn ảnh
  const mediaMessages = messages.filter((msg) => {
    try {
      if (msg.type === "file") {
        const fileInfo = JSON.parse(msg.message);
        return fileInfo.type.startsWith("image/");
      }
      return false;
    } catch (error) {
      console.error("Lỗi phân tích thông tin file:", error);
      return false;
    }
  });

  // Lọc tin nhắn file
  const fileMessages = messages.filter((msg) => {
    try {
      if (msg.type === "file") {
        const fileInfo = JSON.parse(msg.message);
        return !fileInfo.type.startsWith("image/");
      }
      return false;
    } catch (error) {
      console.error("Lỗi phân tích thông tin file:", error);
      return false;
    }
  });

  // Chỉ hiển thị tối đa 3 ảnh trong modal chính
  const displayedMedia = mediaMessages.slice(0, 3);

  // Định dạng kích thước file
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    else if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    else return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Xử lý tải file
  const handleFilePress = async (msg) => {
    try {
      const fileInfo = JSON.parse(msg.message);
      const downloadUrl = `http://localhost:3618/download/${chatRoomId}/${msg.timestamp}`;
      await Linking.openURL(downloadUrl);
    } catch (error) {
      console.error("Lỗi khi tải file:", error);
    }
  };

  // Xử lý xem ảnh lớn
  const handleImagePress = (msg) => {
    let imageUrl;
    try {
      const fileInfo = JSON.parse(msg.message);
      imageUrl = fileInfo.url; // Sử dụng URL S3
    } catch (error) {
      console.error("Lỗi parse JSON trong handleImagePress:", error);
      return;
    }
    // console.log("Opening image with URL:", imageUrl);
    setSelectedImage(imageUrl);
    setImageZoomModalVisible(true);
  };

  // Render item cho ảnh
  const renderMediaItem = ({ item }) => {
    let imageUrl;
    try {
      const fileInfo = JSON.parse(item.message);
      imageUrl = fileInfo.url; // Sử dụng URL từ S3
    } catch (error) {
      console.error(
        "Lỗi parse JSON trong renderMediaItem:",
        error,
        "Message:",
        item.message
      );
      imageUrl = "https://via.placeholder.com/150";
    }
    // console.log("Rendering image with URL:", imageUrl);

    return (
      <TouchableOpacity
        style={styles.mediaItem}
        onPress={() => handleImagePress(item)}
      >
        <Image
          source={{ uri: imageUrl }}
          style={styles.mediaImage}
          resizeMode="cover"
          onError={(e) => console.log("Image load error:", e.nativeEvent.error)}
        />
      </TouchableOpacity>
    );
  };

  // Render item cho file
  const renderFileItem = ({ item }) => {
    const fileInfo = JSON.parse(item.message);
    return (
      <TouchableOpacity
        style={styles.fileItem}
        onPress={() => handleFilePress(item)}
      >
        <Entypo name="document" size={24} color="#007AFF" />
        <View style={styles.fileInfo}>
          <Text style={styles.fileName}>{fileInfo.name}</Text>
          <Text style={styles.fileSize}>{formatFileSize(fileInfo.size)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const handleReplyMessage = (msg) => {
    setReplyingTo({
      ...msg,
      message:
        msg.type === "audio"
          ? "Tin nhắn thoại"
          : msg.type === "file"
          ? "File đính kèm"
          : msg.message,
    });
    setHighlightedMessageId(msg.timestamp);
    const index = messages.findIndex((m) => m.timestamp === msg.timestamp);
    if (index !== -1) {
      flatListRef.current?.scrollToIndex({
        index,
        animated: true,
        viewPosition: 0,
      });
    }
  };

  const fetchReactionUsersInfo = async (users) => {
    try {
      const userInfoPromises = users.map(async (phoneNumber) => {
        const userInfo = await getUserbySearch(phoneNumber, phoneNumber);
        return (
          userInfo?.[0] || { phoneNumber, fullName: phoneNumber, avatar: null }
        );
      });
      const userInfos = await Promise.all(userInfoPromises);
      setReactionUsersInfo(userInfos);
    } catch (error) {
      console.error("Lỗi khi lấy thông tin người dùng:", error);
      setReactionUsersInfo(
        users.map((phoneNumber) => ({
          phoneNumber,
          fullName: phoneNumber,
          avatar: null,
        }))
      );
    }
  };

  const handleCopyMessage = () => {
    if (selectedMessage?.type === "text" && !selectedMessage.isRevoked) {
      Clipboard.setString(selectedMessage.message);
      Alert.alert("Thành công", "Đã sao chép tin nhắn!");
      setShowMessageOptions(false);
      setSelectedMessage(null);
    }
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
    setHighlightedMessageId(null);
  };

  // Hàm debounce
  const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };

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
    setListFriends(contacts);
  }, [contacts]);

  useEffect(() => {
    if (messages?.length) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  // useEffect(() => {
  //   // console.log("MediaMessages:", mediaMessages);
  //   mediaMessages.forEach((msg, index) => {
  //     console.log(`Message ${index}:`, {
  //       timestamp: msg.timestamp,
  //       id: msg.id,
  //       message: msg.message,
  //       parsed: JSON.parse(msg.message),
  //     });
  //   });
  // }, [mediaMessages]);

  useEffect(() => {
    if (!chatRoom.chatRoomId || !thisUser?.phoneNumber) return;

    setCurrentUserPhone(thisUser.phoneNumber);

    const fetchMessages = async () => {
      try {
        const res = await fetch(
          `http://${BASE_URL}:3618/messages?chatRoomId=${chatRoom.chatRoomId}&currentUserPhone=${thisUser.phoneNumber}`
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
      // console.log("Tin nhắn mới:", newMessage);
      setMessages((prev) => {
        if (prev.some((msg) => msg.timestamp === newMessage.timestamp)) {
          return prev;
        }
        socket.emit("updateLastMessage", {
          chatRoomId: chatRoom.chatRoomId,
          message: newMessage,
        });
        return [...prev, newMessage];
      });
    };

    const handleTyping = debounce(() => setTyping(true), 500);
    const handleStopTyping = debounce(() => setTyping(false), 500);

    const handleMessageRevoked = (data) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.timestamp === data.timestamp ? { ...msg, ...data } : msg
        )
      );
    };

    const handleMessageReacted = (data) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.timestamp === data.messageId
            ? { ...msg, reactions: data.reactions }
            : msg
        )
      );
    };

    const groupAvatarUpdated = (data) => {
      // console.log("Received avatar update:", data);
      if (data.chatRoomId === phongChat.chatRoomId) {
        // console.log("Updating avatar to:", data.newAvatarUrl);
        // Cập nhật state
        setPhongChat((prev) => ({
          ...prev,
          avatar: data.newAvatarUrl,
        }));

        // Force re-render image
        const timestamp = new Date().getTime();
        setPhongChat((prev) => ({
          ...prev,
          avatar: `${data.newAvatarUrl}?t=${timestamp}`,
        }));
      }
    };

    socket.on("receiveMessage", handleReceiveMessage);
    socket.on("userTyping", handleTyping);
    socket.on("userStopTyping", handleStopTyping);
    socket.on("messageRevoked", handleMessageRevoked);
    socket.on("messageReacted", handleMessageReacted);
    socket.on("groupAvatarUpdated", groupAvatarUpdated);

    return () => {
      socket.off("receiveMessage", handleReceiveMessage);
      socket.off("userTyping", handleTyping);
      socket.off("userStopTyping", handleStopTyping);
      socket.off("messageRevoked", handleMessageRevoked);
      socket.off("messageReacted", handleMessageReacted);
      socket.off("groupAvatarUpdated", groupAvatarUpdated);
    };
  }, [chatRoom?.chatRoomId, thisUser?.phoneNumber]);

  useEffect(() => {
    return () => {
      if (soundObject) {
        soundObject.unloadAsync();
      }
    };
  }, [soundObject]);

  const handleSend = async () => {
    if (phongChat.status === "DISBANDED") {
      Alert.alert("Nhóm đã bị giải tán, không thể gửi tin nhắn");
      return;
    }
    if (isRecording && recording) {
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
      replyTo: replyingTo
        ? {
            timestamp: replyingTo.timestamp,
            message: replyingTo.message,
            sender: replyingTo.sender,
          }
        : null,
    };

    setMessage("");
    setReplyingTo(null);
    setHighlightedMessageId(null);

    try {
      const response = await fetch(`http://${BASE_URL}:3618/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMsg),
      });

      const responseData = await response.json();
      console.log("Phản hồi từ API:", responseData);

      if (!response.ok) {
        throw new Error(responseData.message || "Gửi tin nhắn thất bại!");
      }

      // console.log("Tin nhắn gửi thành công:", newMsg);
      setMessage("");
    } catch (error) {
      console.error("Lỗi gửi tin nhắn:", error);
      Alert.alert("Lỗi", "Không thể gửi tin nhắn. Vui lòng thử lại sau.");
    }
  };

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
    if (item.isRevoked) return; // Không mở modal nếu tin nhắn đã thu hồi
    setSelectedMessage(item);
    setShowMessageOptions(true);
  };

  const handleAddReaction = async (emoji) => {
    if (!selectedMessage) return;

    try {
      await addReaction(
        phongChat.chatRoomId,
        selectedMessage.timestamp,
        currentUserPhone,
        emoji
      );
      setShowReactionPicker(false);
      setShowMessageOptions(false);
      setSelectedMessage(null);
    } catch (error) {
      console.error("Lỗi khi thêm reaction:", error);
      Alert.alert("Lỗi", "Không thể thêm reaction. Vui lòng thử lại sau.");
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
    if (phongChat.status === "DISBANDED") {
      Alert.alert("Nhóm đã bị giải tán, không thể gửi tin nhắn");
      return;
    }
    if (!uri) {
      Alert.alert("Lỗi", "Không có bản ghi âm để gửi.");
      return;
    }
    const chatId = await getChatIdFromRoom(phongChat.chatRoomId);
    const formData = new FormData();
    formData.append("file", {
      uri,
      name: `voice-${Date.now()}.mp3`,
      type: "audio/mp3",
    });
    formData.append("chatRoomId", chatRoom.chatRoomId);
    formData.append("sender", currentUserPhone);
    formData.append("receiver", otherUser.phoneNumber);
    formData.append("chatId", chatId);

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
          if (
            prev.some(
              (msg) => msg.timestamp === audioMessageFromServer.data.timestamp
            )
          ) {
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
    if (phongChat.status === "DISBANDED") {
      Alert.alert("Nhóm đã bị giải tán, không thể gửi tin nhắn");
      return;
    }
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert(
          "Cần quyền truy cập",
          "Ứng dụng cần quyền truy cập thư viện ảnh để gửi ảnh."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        allowsMultipleSelection: true,
        selectionLimit: 5,
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
            Alert.alert(
              "File quá lớn",
              `File ${image.fileName || "ảnh"} vượt quá 10MB`
            );
            return;
          }

          const fileType = image.mimeType || "image/jpeg";
          const fileName =
            image.fileName || `image-${Date.now()}-${fileObjects.length}.jpg`;

          fileObjects.push({
            uri: image.uri,
            type: fileType,
            name: fileName,
          });
        }

        if (totalSize > 30 * 1024 * 1024) {
          // 30MB
          Alert.alert(
            "Files quá lớn",
            "Tổng kích thước các file không được vượt quá 30MB"
          );
          return;
        }

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
            Alert.alert(
              "Lỗi Upload",
              "Không thể gửi ảnh. Lỗi kết nối đến server."
            );
          }
        }
      }
    } catch (error) {
      console.error("Lỗi khi chọn ảnh:", error);
      Alert.alert("Lỗi", "Không thể chọn ảnh. Vui lòng thử lại sau.");
    }
  };

  const pickDocument = async () => {
    if (phongChat.status === "DISBANDED") {
      Alert.alert("Nhóm đã bị giải tán, không thể gửi tin nhắn");
      return;
    }
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
        multiple: true,
      });

      if (
        result.canceled === false &&
        result.assets &&
        result.assets.length > 0
      ) {
        const selectedDocs = result.assets;

        let totalSize = 0;
        const fileObjects = [];

        for (const doc of selectedDocs) {
          const fileInfo = await FileSystem.getInfoAsync(doc.uri);
          totalSize += fileInfo.size;

          if (fileInfo.size > 10 * 1024 * 1024) {
            // 10MB
            Alert.alert("File quá lớn", `File ${doc.name} vượt quá 10MB`);
            return;
          }

          // Kiểm tra extension file
          const fileExt = doc.name.split(".").pop().toLowerCase();
          const allowedExts = [
            "jpeg",
            "jpg",
            "png",
            "gif",
            "pdf",
            "doc",
            "docx",
            "xls",
            "xlsx",
            "ppt",
            "pptx",
            "zip",
            "rar",
            "txt",
            "mp3",
            "mp4",
            "m4a",
          ];

          if (!allowedExts.includes(fileExt)) {
            Alert.alert(
              "Định dạng không hỗ trợ",
              `File ${doc.name} có định dạng không được hỗ trợ.`
            );
            return;
          }

          fileObjects.push({
            uri: doc.uri,
            type: doc.mimeType || `application/${fileExt}`,
            name: doc.name,
          });
        }

        if (totalSize > 30 * 1024 * 1024) {
          // tong kich co 30MB
          Alert.alert(
            "Files quá lớn",
            "Tổng kích thước các file không được vượt quá 30MB"
          );
          return;
        }

        if (fileObjects.length > 0) {
          try {
            // console.log(`Sending ${fileObjects.length} documents`);
            const result = await sendFile(
              chatRoom.chatRoomId,
              currentUserPhone,
              otherUser.phoneNumber,
              fileObjects
            );
            // console.log("Documents sent successfully:", result);
          } catch (uploadError) {
            console.error("Upload error details:", uploadError);
            Alert.alert(
              "Lỗi Upload",
              "Không thể gửi tài liệu. Lỗi kết nối đến server."
            );
          }
        }
      }
    } catch (error) {
      console.error("Lỗi khi chọn file:", error);
      Alert.alert("Lỗi", "Không thể chọn file. Vui lòng thử lại sau.");
    }
  };

  const downloadFile = async (fileUrl, fileName) => {
    setIsDownloading(true); // Bật trạng thái tải
    try {
      // Kiểm tra quyền truy cập
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") {
        setIsDownloading(false); // Tắt trạng thái tải nếu không có quyền
        Alert.alert(
          "Cần quyền truy cập",
          "Ứng dụng cần quyền truy cập bộ nhớ để tải xuống file."
        );
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
          const progress =
            downloadProgress.totalBytesWritten /
            downloadProgress.totalBytesExpectedToWrite;
          console.log(`Tiến độ tải: ${progress * 100}%`);
        }
      );

      const { uri } = await downloadResumable.downloadAsync();
      console.log("File đã tải xuống tại:", uri);

      if (uri) {
        // Kiểm tra loại file dựa trên phần mở rộng
        const fileExt = fileName.split(".").pop().toLowerCase();
        const mediaExts = [
          "jpg",
          "jpeg",
          "png",
          "gif",
          "mp4",
          "mov",
          "avi",
          "mp3",
          "wav",
          "m4a",
        ];

        if (mediaExts.includes(fileExt)) {
          // Nếu là file media, lưu vào MediaLibrary
          const asset = await MediaLibrary.createAssetAsync(uri);
          console.log("Asset created:", asset);
          setIsDownloading(false); // Tắt trạng thái tải
          Alert.alert("Thành công", "File media đã được lưu vào thư viện.");
        } else {
          // Nếu không phải file media, lưu vào thư mục Downloads
          const downloadsDir = `${FileSystem.documentDirectory}Downloads/`;
          await FileSystem.makeDirectoryAsync(downloadsDir, {
            intermediates: true,
          });
          const finalUri = downloadsDir + fileName;
          await FileSystem.moveAsync({
            from: uri,
            to: finalUri,
          });
          console.log("File đã được lưu tại:", finalUri);
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
          // console.log("Lỗi khi xóa file tạm:", deleteError);
        }
      }
    } catch (error) {
      setIsDownloading(false); // Tắt trạng thái tải nếu có lỗi
      // console.error("Lỗi chi tiết khi tải file:", error);
      Alert.alert(
        "Lỗi",
        `Không thể tải xuống file: ${error.message}. Vui lòng thử lại sau.`
      );
    }
  };

  const handleSendFile = async (fileObjs) => {
    setIsUploading(true);
    try {
      console.log(
        `Starting to send ${
          Array.isArray(fileObjs) ? fileObjs.length : 1
        } file(s):`,
        {
          chatRoomId,
          from: currentUserPhone,
          to: otherUser.phoneNumber,
        }
      );

      const BASE_URL = getIp();
      // console.log("Using BASE_URL:", BASE_URL);

      const result = await sendFile(
        chatRoomId,
        currentUserPhone,
        otherUser.phoneNumber,
        fileObjs
      );

      // console.log("Kết quả gửi file:", result);
      setIsUploading(false);
    } catch (error) {
      setIsUploading(false);
      console.error("Lỗi gửi file:", error);
      if (error.message && error.message.includes("Network request failed")) {
        Alert.alert(
          "Lỗi kết nối",
          "Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng và địa chỉ IP máy chủ."
        );
      } else {
        Alert.alert("Lỗi", "Không thể gửi file. Vui lòng thử lại sau.");
      }
    }
  };

  const [userMap, setUserMap] = useState({});

  useEffect(() => {
    const fetchUsers = async () => {
      const map = {};
      for (const msg of messages) {
        if (!map[msg.sender]) {
          const result = await getUserbySearch(msg.sender, "");
          if (result.length > 0) {
            map[msg.sender] = result[0];
          }
        }
      }
      setUserMap(map);
    };

    fetchUsers();
  }, [messages]);

  const renderItem = ({ item }) => {
    const isCurrentUser = item.sender === thisUser.phoneNumber;
    const users = userMap[item.sender];
    return (
      <MessageItem
        item={item}
        isCurrentUser={isCurrentUser}
        themeColors={themeColors}
        handleLongPressMessage={handleLongPressMessage}
        handleViewImage={handleViewImage}
        handleViewFile={handleViewFile}
        handlePlayAudio={handlePlayAudio}
        chatRoom={chatRoom}
        otherUser={otherUser}
        thisUser={thisUser}
        highlightedMessageId={highlightedMessageId}
        users={users}
        setSelectedReaction={setSelectedReaction}
        fetchReactionUsersInfo={fetchReactionUsersInfo}
        setShowReactionUsers={setShowReactionUsers}
        setHighlightedMessageId={setHighlightedMessageId}
        flatListRef={flatListRef}
        messages={messages}
      />
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

  // Khi listMember thay đổi => gọi API lấy thông tin user
  useEffect(() => {
    const fetchParticipantsInfo = async () => {
  try {
    const results = await Promise.all(
      listMember.map(async (phone) => {
        const res = await getUserbySearch(phone, "");
        // Kiểm tra cả 'fullName' và 'name'
        return res && res.length > 0 
          ? { 
              ...res[0], 
              fullName: res[0].fullName || res[0].name || phone 
            }
          : { 
              phoneNumber: phone, 
              fullName: phone, 
              avatar: null 
            };
      })
    );
    const validUsers = results.filter((user) => user && user.phoneNumber);
    setParticipantsInfo(validUsers);
    setPhongChat((prev) => ({
      ...prev,
      participantsInfo: validUsers,
    }));
  } catch (error) {
    console.error("Lỗi khi fetch thông tin thành viên:", error);
  }
};

    if (listMember.length > 0) fetchParticipantsInfo();
  }, [listMember]);

  // Lọc bạn bè chưa nằm trong nhóm
  useEffect(() => {
    const phonesInGroup = listMember.map(String);
    const notInGroup = (contacts || [])
      .filter((c) => !!c.phone)
      .filter((friend) => !phonesInGroup.includes(String(friend.phone)));

    setFriendsNotInGroup(notInGroup);
  }, [contacts, listMember]);

  const handleAddMemberToNewList = (phone) => {
    setNewList((prev) =>
      prev.includes(phone) ? prev.filter((p) => p !== phone) : [...prev, phone]
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
      participants: uniqueList,
    })
      .then((data) => {
        console.log("Tạo nhóm thành công:", data);
        Alert.alert("Tạo nhóm thành công!");
        return;
      })
      .catch((err) => {
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
    updateChatRoom({
      roomId: phongChat.chatRoomId,
      nameGroup: groupName,
      participants: uniqueList,
    })
      .then((data) => {
        console.log("Cập nhật nhóm thành công:", data);
        Alert.alert("Thành công", "Nhóm đã được cập nhật.");
        handleCloseModalAdd();
        return;
      })
      .catch((err) => {
        console.error("Lỗi khi cập nhật nhóm:", err);
        Alert.alert("Lỗi", "Cập nhật nhóm thất bại.");
      });
  };

  const handleRemoveMember = async (phoneToRemove, name) => {
    Alert.alert("Xác nhận", `Bạn có chắc muốn xoá ${name} khỏi nhóm?`, [
      {
        text: "Huỷ",
        style: "cancel",
      },
      {
        text: "Xoá",
        style: "destructive",
        onPress: async () => {
          try {
            const result = await deleteMember(
              phongChat.chatRoomId,
              phoneToRemove
            );
            setParticipantsInfo((prev) =>
              prev.filter((user) => user.phoneNumber !== phoneToRemove)
            );
            Alert.alert("Thành công", "Đã xoá thành viên khỏi nhóm.");
            return;
          } catch (err) {
            Alert.alert("Lỗi", err.message || "Không thể xoá thành viên.");
          }
        },
      },
    ]);
  };

  const handleSetAdmin = async (phone, name) => {
    Alert.alert(
      `Chuyển quyền Admin cho ${name}`,
      "Bạn có chắc chắn muốn chuyển quyền admin?",
      [
        {
          text: "Hủy",
          onPress: () => console.log("Hủy"),
          style: "cancel",
        },
        {
          text: "Xác nhận",
          onPress: async () => {
            const result = await setAdmin(chatRoomId, phone);
          },
          style: "default",
        },
      ],
      { cancelable: false }
    );
  };

  const handleOutGroup = async (phone) => {
    Alert.alert(
      `Rời Nhóm`,
      "Bạn có chắc chắn muốn rời nhóm?",
      [
        {
          text: "Hủy",
          onPress: () => console.log("Hủy"),
          style: "cancel",
        },
        {
          text: "Xác nhận",
          onPress: async () => {
            const result = await outGroup(chatRoomId, phone);
          },
          style: "default",
        },
      ],
      { cancelable: false }
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
              // console.log("Giải tán nhóm thành công:", result);
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
    if (phongChat.status === "DISBANDED") {
      Alert.alert("Nhóm đã bị giải tán, thao tác này đã bị khóa");
      return;
    }
    setShowModalAdd(true);
  };

  const handleCloseModalAdd = () => {
    setShowModalAdd(false);
  };

  const handleChangeGroupAvatar = async () => {
    if (phongChat.status === "DISBANDED") {
      Alert.alert("Nhóm đã bị giải tán, không thể thay đổi avatar");
      return;
    }

    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert(
          "Cần quyền truy cập",
          "Ứng dụng cần quyền truy cập thư viện ảnh để thay đổi avatar"
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0];

        const formData = new FormData();
        formData.append("avatar", {
          uri: selectedImage.uri,
          type: "image/jpeg",
          name: `avatar-${Date.now()}.jpg`,
        });
        formData.append("chatRoomId", phongChat.chatRoomId);

        const response = await fetch(
          `http://${BASE_URL}:3618/updateGroupAvatar`,
          {
            method: "POST",
            body: formData,
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Cập nhật avatar thất bại");
        }

        // Cập nhật state với timestamp để force re-render image
        const timestamp = new Date().getTime();
        setPhongChat((prev) => ({
          ...prev,
          avatar: `${data.avatarUrl}?t=${timestamp}`,
        }));

        handleCloseModalAdd();

        Alert.alert("Thành công", "Đã cập nhật avatar nhóm");
      }
    } catch (error) {
      console.error("Lỗi khi đổi avatar:", error);
      Alert.alert(
        "Lỗi",
        error.message || "Không thể cập nhật avatar. Vui lòng thử lại sau."
      );
    }
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
      behavior={Platform.OS === "ios" ? "padding" : "padding"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : -30}
    >
      <View style={styles.container}>
        <View style={styles.head}>
          <View style={styles.user}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Ionicons name="chevron-back" size={20} color="#fff" />
              </TouchableOpacity>
              <Image
                source={{
                  uri: chatRoom.isGroup
                    ? `${phongChat.avatar}?t=${new Date().getTime()}`
                    : otherUser.avatar,
                }}
                style={styles.avatar}
              />
              <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail">
                {/* {chatRoom.isGroup ? chatRoom.fullName : otherUser.fullName} */}
                {chatRoom.isGroup ? newName : otherUser.fullName}
              </Text>
            </View>
            {phongChat.status === "DISBANDED" && (
              <View
                style={{
                  backgroundColor: "red",
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 12,
                  alignSelf: "flex-end",
                  position: "absolute",
                  marginLeft: 120,
                }}
              >
                <Text
                  style={{ color: "#fff", fontSize: 12, fontWeight: "bold" }}
                >
                  Đã giải tán
                </Text>
              </View>
            )}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              {chatRoom.isGroup && (
                <TouchableOpacity
                  style={{ marginHorizontal: 10 }}
                  onPress={handleOpenModalAdd}
                >
                  <FontAwesome6 name="users" size={20} color="#fff" />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.button}
                onPress={() => setModalVisible(true)}
              >
                <Entypo name="dots-three-vertical" size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            <Modal
              animationType="slide"
              transparent={true}
              visible={modalVisible}
              onRequestClose={() => setModalVisible(false)}
            >
              <View style={styles.modalOverlayModal}>
                <View style={styles.modalContentModal}>
                  <Text style={styles.modalTitle}>Thông tin</Text>

                  {/* Phần ảnh */}
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Ảnh</Text>
                  </View>
                  {mediaMessages.length > 0 ? (
                    <FlatList
                      data={mediaMessages}
                      renderItem={renderMediaItem}
                      keyExtractor={(item) => item.timestamp.toString()}
                      numColumns={3}
                      style={styles.mediaList}
                    />
                  ) : (
                    <Text style={styles.noContentText}>Không có ảnh</Text>
                  )}

                  {/* Phần file */}
                  <Text style={styles.sectionTitle}>File</Text>
                  {fileMessages.length > 0 ? (
                    <FlatList
                      data={fileMessages}
                      renderItem={renderFileItem}
                      keyExtractor={(item) => item.timestamp.toString()}
                      style={styles.fileList}
                    />
                  ) : (
                    <Text style={styles.noContentText}>Không có file</Text>
                  )}

                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.closeButtonText}>Đóng</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>

            {/* Modal xem tất cả ảnh */}
            <Modal
              animationType="slide"
              transparent={true}
              visible={mediaModalVisible}
              onRequestClose={() => setMediaModalVisible(false)}
            >
              <View style={styles.modalOverlayModal}>
                <View style={styles.modalContentModal}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.modalTitle}>Tất cả ảnh</Text>
                    <TouchableOpacity
                      style={styles.closeIcon}
                      onPress={() => setMediaModalVisible(false)}
                    >
                      <Entypo name="cross" size={24} color="#000" />
                    </TouchableOpacity>
                  </View>
                  <FlatList
                    data={mediaMessages}
                    renderItem={renderMediaItem}
                    keyExtractor={(item) => item.timestamp.toString()}
                    numColumns={3}
                    style={styles.mediaList}
                  />
                </View>
              </View>
            </Modal>

            {/* Modal xem ảnh lớn */}
            <Modal
              animationType="fade"
              transparent={true}
              visible={imageZoomModalVisible}
              onRequestClose={() => setImageZoomModalVisible(false)}
            >
              <TouchableWithoutFeedback
                onPress={() => setImageZoomModalVisible(false)}
              >
                <View style={styles.imageModalOverlay}>
                  <Image
                    source={{ uri: selectedImage }}
                    style={styles.zoomImage}
                    resizeMode="contain"
                  />
                </View>
              </TouchableWithoutFeedback>
            </Modal>
          </View>
        </View>

        <FlatList
          ref={flatListRef}
          style={styles.content}
          data={messages}
          keyExtractor={(item) => item.timestamp.toString()}
          renderItem={renderItem}
          initialNumToRender={10}
          maxToRenderPerBatch={5}
          windowSize={5}
          getItemLayout={(data, index) => ({
            length: 100,
            offset: 100 * index,
            index,
          })}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        <MessageInput
          message={message}
          setMessage={setMessage}
          handleSend={handleSend}
          pickImage={pickImage}
          pickDocument={pickDocument}
          startRecording={startRecording}
          stopRecording={stopRecording}
          isRecording={isRecording}
          themeColors={themeColors}
          replyingTo={replyingTo}
          handleCancelReply={handleCancelReply}
          members={participantsInfo}
          isGroup={phongChat.isGroup}
          groupAvatar={phongChat.avatar}
        />

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
            <View style={styles.reactionPickerContainer}>
              {REACTION_EMOJIS.map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  style={styles.reactionOption}
                  onPress={() => handleAddReaction(emoji)}
                >
                  <Text style={styles.reactionEmoji}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalContent}>
              {selectedMessage?.sender === currentUserPhone && (
                <TouchableOpacity
                  style={styles.modalOption}
                  onPress={handleDeleteMessagePress}
                >
                  <MaterialIcons name="delete" size={24} color="red" />
                  <Text style={styles.modalOptionText}>Thu hồi tin nhắn</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.modalOption}
                onPress={() => {
                  handleReplyMessage(selectedMessage);
                  setShowMessageOptions(false);
                }}
              >
                <Ionicons
                  name="arrow-undo"
                  size={24}
                  color={themeColors.text}
                />
                <Text style={styles.modalOptionText}>Trả lời</Text>
              </TouchableOpacity>
              {selectedMessage?.type === "text" &&
                !selectedMessage?.isRevoked && (
                  <TouchableOpacity
                    style={styles.modalOption}
                    onPress={handleCopyMessage}
                  >
                    <Ionicons name="copy" size={24} color={themeColors.text} />
                    <Text style={styles.modalOptionText}>Sao chép</Text>
                  </TouchableOpacity>
                )}
              <TouchableOpacity
                style={styles.modalOption}
                onPress={() => setShowMessageOptions(false)}
              >
                <MaterialIcons
                  name="cancel"
                  size={24}
                  color={themeColors.text}
                />
                <Text style={styles.modalOptionText}>Hủy</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

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
                onPress={() =>
                  downloadFile(selectedImage?.url, selectedImage?.name)
                }
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
                <Ionicons
                  name="document-outline"
                  size={40}
                  color={themeColors.text}
                />
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

        <Modal
          visible={showModalAdd}
          transparent={true}
          animationType="slide"
          onRequestClose={handleCloseModalAdd}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.4)",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <View
              style={{
                width: "85%",
                backgroundColor: themeColors.background,
                padding: 20,
                borderRadius: 20,
              }}
            >
              {phongChat.isGroup && (
                <View style={{ marginBottom: 10, position: "relative" }}>
                  <Image
                    source={{
                      uri: `${phongChat.avatar}?t=${new Date().getTime()}`,
                    }}
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: 50,
                      alignSelf: "center",
                    }}
                  />
                  {/* {thisUser.phoneNumber === phongChat.admin && ( */}
                  <TouchableOpacity
                    style={{
                      position: "absolute",
                      right: 100,
                      top: 60,
                      backgroundColor: themeColors.primary,
                      padding: 8,
                      borderRadius: 15,
                      elevation: 3,
                    }}
                    onPress={handleChangeGroupAvatar}
                  >
                    <Feather name="edit" size={18} color="#fff" />
                  </TouchableOpacity>
                  {/* )} */}
                  <View>
                    <TextInput
                      placeholder="Nhập tên nhóm"
                      placeholderTextColor="#aaa"
                      value={groupName}
                      onChangeText={setGroupName}
                      style={{
                        borderWidth: 1,
                        borderColor: "#ccc",
                        borderRadius: 10,
                        padding: 10,
                        marginTop: 15,
                        color: themeColors.text,
                      }}
                    />
                  </View>
                </View>
              )}

              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "bold",
                  marginBottom: 10,
                  color: themeColors.text,
                }}
              >
                {phongChat?.isGroup
                  ? `Thành viên nhóm hiện tại (${phongChat.participants.length})`
                  : "Thành viên"}
              </Text>
              <FlatList
                data={participantsInfo.filter(
                  (item) => item && item.phoneNumber
                )}
                keyExtractor={(item, index) =>
                  item.phoneNumber || index.toString()
                }
                renderItem={({ item }) => (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginBottom: 8,
                    }}
                  >
                    <Image
                      source={{ uri: item.avatar }}
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        marginRight: 10,
                      }}
                    />
                    <View
                      style={{
                        flex: 1,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <Text style={{ color: themeColors.text }}>
                        {item.fullName || item.phoneNumber}
                      </Text>
                      {phongChat.isGroup &&
                        phongChat.admin === item.phoneNumber && (
                          <Text
                            style={{
                              backgroundColor: themeColors.primary,
                              fontSize: 12,
                              color: "#fff",
                              padding: 5,
                              textAlign: "center",
                              borderRadius: 10,
                              width: 100,
                              fontWeight: "bold",
                            }}
                          >
                            is admin
                          </Text>
                        )}
                      {phongChat.isGroup &&
                        thisUser.phoneNumber === phongChat.admin &&
                        item.phoneNumber !== phongChat.admin &&
                        item.phoneNumber !== thisUser.phoneNumber && (
                          <>
                            <View style={{ flexDirection: "row" }}>
                              <TouchableOpacity
                                style={{ marginHorizontal: 5 }}
                                onPress={() =>
                                  handleSetAdmin(
                                    item.phoneNumber,
                                    item.fullName
                                  )
                                }
                              >
                                <Feather
                                  name="arrow-up-right"
                                  size={24}
                                  color="#FFD700"
                                />
                              </TouchableOpacity>

                              <TouchableOpacity
                                style={{ marginHorizontal: 5 }}
                                onPress={() =>
                                  handleRemoveMember(
                                    item.phoneNumber,
                                    item.fullName
                                  )
                                }
                              >
                                <Feather name="delete" size={24} color="red" />
                              </TouchableOpacity>
                            </View>
                          </>
                        )}
                    </View>
                  </View>
                )}
              />
              <View style={{ height: 10 }} />
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "bold",
                  marginBottom: 10,
                  color: themeColors.text,
                }}
              >
                Thêm Thành Viên
              </Text>
              <FlatList
                data={friendsNotInGroup.filter((item) => item && item.phone)}
                keyExtractor={(item, index) => item.phone || index.toString()}
                style={{ maxHeight: 200 }}
                renderItem={({ item }) => {
                  const isSelected = newList.includes(item.phone);
                  return (
                    <TouchableOpacity
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginBottom: 8,
                        backgroundColor: isSelected
                          ? themeColors.primary
                          : "transparent",
                        padding: 8,
                        borderRadius: 10,
                      }}
                      onPress={() => handleAddMemberToNewList(item.phone)}
                    >
                      <Image
                        source={{ uri: item.avatar }}
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 20,
                          marginRight: 10,
                        }}
                      />
                      <Text style={{ color: themeColors.text }}>
                        {item.name}
                      </Text>
                    </TouchableOpacity>
                  );
                }}
                ListEmptyComponent={
                  <Text style={{ color: themeColors.text }}>
                    Không có bạn nào để thêm
                  </Text>
                }
              />
              {!phongChat?.isGroup && (
                <>
                  <TextInput
                    placeholder="Nhập tên nhóm"
                    placeholderTextColor="#aaa"
                    value={groupName}
                    onChangeText={setGroupName}
                    style={{
                      borderWidth: 1,
                      borderColor: "#ccc",
                      borderRadius: 10,
                      padding: 10,
                      marginTop: 15,
                      color: themeColors.text,
                    }}
                  />
                  <TouchableOpacity
                    style={{
                      marginTop: 10,
                      backgroundColor: "#2196F3",
                      padding: 10,
                      borderRadius: 10,
                    }}
                    onPress={createGroup}
                  >
                    <Text style={{ color: "#fff", textAlign: "center" }}>
                      Tạo nhóm
                    </Text>
                  </TouchableOpacity>
                </>
              )}
              {phongChat.isGroup && (
                <TouchableOpacity
                  style={{
                    marginTop: 10,
                    backgroundColor: "#2196F3",
                    padding: 10,
                    borderRadius: 10,
                  }}
                  onPress={updateGroup}
                >
                  <Text style={{ color: "#fff", textAlign: "center" }}>
                    Lưu thay đổi
                  </Text>
                </TouchableOpacity>
              )}

              {phongChat.isGroup &&
                thisUser.phoneNumber === phongChat.admin && (
                  <TouchableOpacity
                    style={{
                      backgroundColor: "#FF3B30",
                      padding: 12,
                      borderRadius: 10,
                      alignItems: "center",
                      marginVertical: 10,
                    }}
                    onPress={handleDisbandGroup}
                  >
                    <Text style={{ color: "white", fontWeight: "bold" }}>
                      Giải tán nhóm
                    </Text>
                  </TouchableOpacity>
                )}

              {phongChat.isGroup && thisUser.phoneNumber != phongChat.admin && (
                <TouchableOpacity
                  style={{
                    backgroundColor: "#FF3B30",
                    padding: 12,
                    borderRadius: 10,
                    alignItems: "center",
                    marginVertical: 10,
                  }}
                  onPress={() => handleOutGroup(thisUser?.phoneNumber)}
                >
                  <Text style={{ color: "white", fontWeight: "bold" }}>
                    Rời nhóm
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={handleCloseModalAdd}
                style={{ marginTop: 20 }}
              >
                <Text style={{ color: "red", textAlign: "right" }}>Đóng</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <Modal
          transparent={true}
          visible={showReactionUsers}
          animationType="fade"
          onRequestClose={() => setShowReactionUsers(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowReactionUsers(false)}
          >
            <View style={styles.reactionUsersModal}>
              <View style={styles.reactionUsersHeader}>
                <Text style={styles.reactionUsersTitle}>
                  Người đã thả {selectedReaction.emoji}
                </Text>
                <TouchableOpacity onPress={() => setShowReactionUsers(false)}>
                  <Ionicons name="close" size={24} color={themeColors.text} />
                </TouchableOpacity>
              </View>
              <FlatList
                data={reactionUsersInfo}
                keyExtractor={(item) => item.phoneNumber}
                renderItem={({ item }) => (
                  <View style={styles.reactionUserItem}>
                    <Image
                      source={{
                        uri: item.avatar || "https://via.placeholder.com/40",
                      }}
                      style={styles.reactionUserAvatar}
                    />
                    <Text style={styles.reactionUserName}>{item.fullName}</Text>
                  </View>
                )}
                ListEmptyComponent={
                  <Text style={styles.reactionUserEmpty}>
                    Không có người dùng nào
                  </Text>
                }
              />
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    </KeyboardAvoidingView>
  );
}

const getStyles = (themeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.background,
    },
    head: {
      width: "95%",
      backgroundColor: themeColors.primary,
      height: 65,
      marginTop: 40,
      paddingHorizontal: 20,
      alignSelf: "center",
      borderRadius: 30,
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
      borderRadius: 50,
      marginTop: 5,
      borderWidth: 1,
      borderColor: "#fff",
    },
    name: {
      fontSize: 18,
      color: "#fff",
      paddingHorizontal: 20,
      fontWeight: "bold",
      flexWrap: "wrap",
      // width: "100%",
      maxWidth: 200,
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
      borderTopLeftRadius: 30,
      borderTopRightRadius: 30,
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
      padding: 5,
    },
    blockChat: {
      backgroundColor: "#7399C3",
      padding: 15,
      borderRadius: 20,
    },
    touch: {
      marginHorizontal: 5,
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
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "center",
      alignItems: "center",
    },
    modalContent: {
      width: "85%",
      backgroundColor: themeColors.background,
      borderRadius: 20,
      padding: 20,
      elevation: 5,
    },
    modalOption: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 15,
      borderBottomWidth: 1,
      borderBottomColor: "#ddd",
    },
    modalOptionText: {
      fontSize: 16,
      marginLeft: 10,
      color: themeColors.text,
    },
    reactionPicker: {
      flexDirection: "row",
      backgroundColor: themeColors.background,
      borderRadius: 20,
      padding: 10,
      elevation: 5,
      justifyContent: "center",
    },
    reactionOption: {
      padding: 6,
      marginHorizontal: 5,
    },
    reactionEmoji: {
      fontSize: 20,
    },
    reactionContainer: {
      flexDirection: "row",
      marginTop: 5,
      backgroundColor: "rgba(0,0,0,0.1)",
      borderRadius: 10,
      padding: 5,
    },
    reactionIcon: {
      fontSize: 12,
      marginHorizontal: 3,
      color: themeColors.text,
    },
    imageViewerContainer: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.95)",
    },
    imageViewerHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingTop: 40,
      paddingBottom: 20,
      zIndex: 10,
    },
    closeButton: {
      width: 40,
      height: 40,
      justifyContent: "center",
      alignItems: "center",
    },
    downloadButton: {
      width: 40,
      height: 40,
      justifyContent: "center",
      alignItems: "center",
    },
    imageViewerContent: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    fullImage: {
      width: "100%",
      height: "80%",
    },
    imageNameContainer: {
      padding: 20,
      alignItems: "center",
    },
    imageName: {
      color: "#fff",
      fontSize: 16,
    },
    fileOptionsContainer: {
      backgroundColor: themeColors.background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      padding: 20,
      elevation: 5,
    },
    fileOptionsHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 20,
    },
    fileOptionsTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: themeColors.text,
    },
    fileDetailsContainer: {
      flexDirection: "row",
      alignItems: "center",
      padding: 15,
      borderRadius: 10,
      backgroundColor: themeColors.backgroundLight || "#f0f0f0",
      marginBottom: 20,
    },
    fileDetails: {
      marginLeft: 15,
      flex: 1,
    },
    fileName: {
      fontSize: 16,
      fontWeight: "500",
    },
    fileSize: {
      fontSize: 14,
      marginTop: 5,
      opacity: 0.7,
    },
    downloadFileButton: {
      backgroundColor: themeColors.primary,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      padding: 15,
      borderRadius: 10,
      marginBottom: 15,
    },
    downloadButtonText: {
      color: "#fff",
      fontWeight: "bold",
      fontSize: 16,
      marginLeft: 10,
    },
    cancelButton: {
      padding: 15,
      borderRadius: 10,
      alignItems: "center",
      backgroundColor: themeColors.backgroundLight || "#f0f0f0",
      marginBottom: 10,
    },
    cancelButtonText: {
      color: themeColors.text,
      fontSize: 16,
    },
    highlightedMessage: {
      backgroundColor: "rgba(255, 255, 0, 0.3)",
    },
    replyPreview: {
      backgroundColor: "#A6AEBF",
      padding: 8,
      borderRadius: 10,
      marginBottom: 5,
      width: "auto",
    },
    replyText: {
      fontSize: 13,
      color: "#fff",
      fontWeight: "bold",
    },
    replyMessage: {
      fontSize: 13,
      color: "#fff",
      opacity: 0.9,
    },
    replyingTo: {
      position: "absolute",
      bottom: 76,
      left: 130,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: "rgb(64, 59, 71)",
      padding: 10,
      width: "50%",
      borderRadius: 9,
      marginBottom: 10,
      marginHorizontal: 10,
    },
    replyingToText: {
      fontSize: 14,
      color: "#fff",
      flex: 1,
    },
    reactionTouchable: {
      padding: 2,
      marginHorizontal: 3,
    },
    reactionUsersModal: {
      width: "80%",
      maxHeight: "50%",
      backgroundColor: themeColors.background,
      borderRadius: 10,
      padding: 15,
      elevation: 5,
    },
    reactionUsersHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 10,
    },
    reactionUsersTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: themeColors.text,
    },
    reactionUserItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 8,
    },
    reactionUserAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      marginRight: 10,
    },
    reactionUserName: {
      fontSize: 16,
      color: themeColors.text,
    },
    reactionUserEmpty: {
      fontSize: 14,
      color: themeColors.text,
      textAlign: "center",
      padding: 20,
    },
    reactionPickerContainer: {
      width: "85%",
      flexDirection: "row",
      backgroundColor: themeColors.background,
      borderRadius: 20,
      padding: 10,
      marginBottom: 10,
      elevation: 5,
      justifyContent: "center",
    },
    avatarContainer: {
      marginBottom: 10,
      position: "relative",
      alignItems: "center",
    },
    groupAvatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
    },
    editAvatarButton: {
      position: "absolute",
      right: -20,
      bottom: -5,
      backgroundColor: themeColors.primary,
      padding: 8,
      borderRadius: 15,
      elevation: 3,
    },
    modalOverlayModal: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.7)",
      justifyContent: "center",
      alignItems: "center",
    },
    modalContentModal: {
      width: "90%",
      maxHeight: "70%",
      backgroundColor: themeColors.background,
      borderRadius: 20,
      padding: 20,
      elevation: 10,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.2,
      shadowRadius: 5,
    },
    modalTitle: {
      fontSize: 24,
      fontWeight: "bold",
      color: themeColors.text,
      marginBottom: 15,
    },
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 10,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: "600",
      color: themeColors.text,
    },
    closeButton: {
      backgroundColor: themeColors.primary,
      padding: 10,
      borderRadius: 10,
      alignItems: "center",
      marginTop: 90,
    },
    closeButtonText: {
      color: "#fff",
      fontWeight: "bold",
    },
    noContentText: {
      color: themeColors.text,
      textAlign: "center",
      marginTop: 20,
    },
    mediaList: {
      flexGrow: 0,
      marginBottom: 20,
    },
    mediaItem: {
      flex: 1,
      margin: 5,
      aspectRatio: 1,
    },
    mediaImage: {
      width: "100%",
      height: "100%",
      borderRadius: 10,
    },
    viewAllButton: {
      padding: 5,
    },
    viewAllText: {
      color: themeColors.primary,
      fontWeight: "bold",
    },
    noContentText: {
      color: themeColors.text,
      textAlign: "center",
      marginVertical: 20,
    },
    fileList: {
      flexGrow: 0,
      marginBottom: 20,
    },
    fileItem: {
      flexDirection: "row",
      alignItems: "center",
      padding: 10,
      borderBottomWidth: 1,
      borderBottomColor: "#ddd",
    },
    fileInfo: {
      marginLeft: 10,
      flex: 1,
    },
    fileName: {
      color: themeColors.text,
      fontSize: 16,
    },
    fileSize: {
      color: themeColors.text,
      fontSize: 14,
      opacity: 0.7,
    },
    closeIcon: {
      padding: 5,
    },
    imageModalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.9)",
      justifyContent: "center",
      alignItems: "center",
    },
    zoomImage: {
      width: "100%",
      height: "80%",
    },
    suggestionsContainer: {
      position: "absolute",
      bottom: 90,
      left: 0,
      right: 10,
      backgroundColor: themeColors.background,
      borderRadius: 10,
      maxHeight: 150,
      maxWidth: 450,
      elevation: 5,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      zIndex: 1000,
      overflow: "hidden",
    },
    suggestionsList: {
      maxHeight: 200,
    },
    suggestionItem: {
      flexDirection: "row",
      alignItems: "center",
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border || "#ccc",
    },
    suggestionAvatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      marginRight: 12,
    },
    suggestionText: {
      color: themeColors.text,
      fontSize: 16,
    },
    noSuggestions: {
      color: themeColors.text,
      textAlign: "center",
      padding: 12,
      fontSize: 14,
    },
    textSegment: {
      fontSize: 16,
      lineHeight: 20,
    },
    tagText: {
      color: "#007bff",
    },
    normalText: {
      color: "#000",
    },
    placeholderText: {
      color: "#ccc",
      fontSize: 16,
    },
    textPreview: {
      display: "none",
      position: "absolute",
      top: 0,
      left: 15,
      right: 15,
      bottom: 0,
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems: "center",
    },
  });
