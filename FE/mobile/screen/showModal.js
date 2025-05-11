import React, { useState } from 'react';
import {
  View,
  Modal,
  TouchableOpacity,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableWithoutFeedback,
  Linking,
} from 'react-native';
import { Entypo } from '@expo/vector-icons';

const showModal = ({ messages = [] }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  // Lọc tin nhắn ảnh
  const mediaMessages = messages.filter((msg) => {
    try {
      if (msg.type === 'file') {
        const fileInfo = JSON.parse(msg.message);
        return fileInfo.type.startsWith('image/');
      }
      return false;
    } catch (error) {
      console.error('Lỗi phân tích thông tin file:', error);
      return false;
    }
  });

  // Lọc tin nhắn file
  const fileMessages = messages.filter((msg) => {
    try {
      if (msg.type === 'file') {
        const fileInfo = JSON.parse(msg.message);
        return !fileInfo.type.startsWith('image/');
      }
      return false;
    } catch (error) {
      console.error('Lỗi phân tích thông tin file:', error);
      return false;
    }
  });

  // Định dạng kích thước file
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    else if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    else return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Xử lý mở file
  const handleFilePress = async (url) => {
    try {
      await Linking.openURL(url);
    } catch (error) {
      console.error('Lỗi khi mở file:', error);
    }
  };

  // Xử lý mở ảnh lớn
  const handleImagePress = (url) => {
    setSelectedImage(url);
    setImageModalVisible(true);
  };

  // Render item cho ảnh
  const renderMediaItem = ({ item }) => {
    const fileInfo = JSON.parse(item.message);
    return (
      <TouchableOpacity
        style={styles.mediaItem}
        onPress={() => handleImagePress(fileInfo.url)}
      >
        <Image
          source={{ uri: fileInfo.url }}
          style={styles.mediaImage}
          resizeMode="cover"
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
        onPress={() => handleFilePress(fileInfo.url)}
      >
        <Entypo name="document" size={24} color="#007AFF" />
        <View style={styles.fileInfo}>
          <Text style={styles.fileName}>{fileInfo.name}</Text>
          <Text style={styles.fileSize}>{formatFileSize(fileInfo.size)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.button}
        onPress={() => setModalVisible(true)}
      >
        <Entypo name="list" size={20} color="#fff" />
      </TouchableOpacity>

      {/* Modal chính */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Menu</Text>

            {/* Phần ảnh */}
            <Text style={styles.sectionTitle}>Ảnh</Text>
            {mediaMessages.length > 0 ? (
              <FlatList
                data={mediaMessages}
                renderItem={renderMediaItem}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
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
                keyExtractor={(item) => item.id}
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

      {/* Modal xem ảnh lớn */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={imageModalVisible}
        onRequestClose={() => setImageModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setImageModalVisible(false)}>
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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    padding: 5,
    backgroundColor: '#007AFF',
    borderRadius: 5,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
  mediaList: {
    marginBottom: 20,
  },
  mediaItem: {
    marginRight: 10,
  },
  mediaImage: {
    width: 100,
    height: 100,
    borderRadius: 5,
  },
  fileList: {
    width: '100%',
    marginBottom: 20,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  fileInfo: {
    marginLeft: 10,
    flex: 1,
  },
  fileName: {
    fontSize: 16,
    color: '#000',
  },
  fileSize: {
    fontSize: 14,
    color: '#666',
  },
  noContentText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  closeButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  imageModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomImage: {
    width: '90%',
    height: '90%',
  },
});

export default showModal;