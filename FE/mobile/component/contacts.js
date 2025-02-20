import { StyleSheet, Text, View, Image, TouchableOpacity, FlatList } from 'react-native';
import React, {useState} from 'react';
import Ionicons from '@expo/vector-icons/Ionicons'
import MaterialIcons from '@expo/vector-icons/MaterialIcons'

export default function App({navigation}) {
  const [contacts, setContacts] = useState([
    {
      id: 1, 
      name: 'Jayson', 
      avatar: 'https://imgur.com/RLtzJy5.jpg',
      phone: '+84 123 456 789',
      status: 'online'
    },
    {
      id: 2, 
      name: 'Mađog', 
      avatar: 'https://imgur.com/RLtzJy5.jpg',
      phone: '+84 987 654 321',
      status: 'offline'
    },
    {
      id: 3, 
      name: 'Lucia', 
      avatar: 'https://imgur.com/RLtzJy5.jpg',
      phone: '+84 111 222 333',
      status: 'online'
    },
    {
      id: 4, 
      name: 'Mya', 
      avatar: 'https://imgur.com/RLtzJy5.jpg',
      phone: '+84 444 555 666',
      status: 'offline'
    },
  ]);

  const renderContact = ({ item }) => (
    <TouchableOpacity 
      style={styles.contactItem} 
      onPress={() => navigation.navigate('chatting', {user: item})}
    >
      <View style={styles.avatarContainer}>
        <Image source={{uri: item.avatar}} style={styles.avatar}/>
        <View style={[
          styles.statusIndicator, 
          {backgroundColor: item.status === 'online' ? '#4CAF50' : '#757575'}
        ]}/>
      </View>
      
      <View style={styles.contactInfo}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.phone}>{item.phone}</Text>
      </View>
      
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="call" size={20} color="#007AFF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="videocam" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* <View style={styles.addContactContainer}>
        <TouchableOpacity style={styles.addContactButton}>
          <MaterialIcons name="person-add" size={24} color="#007AFF" />
          <Text style={styles.addContactText}>Thêm liên hệ mới</Text>
        </TouchableOpacity>
      </View> */}

      <FlatList
        data={contacts}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderContact}
        style={styles.contactsList}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  addContactContainer: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  addContactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  addContactText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  contactsList: {
    flex: 1,
  },
  contactItem: {
    flexDirection: 'row',
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#fff',
  },
  contactInfo: {
    flex: 1,
    marginLeft: 15,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  phone: {
    fontSize: 14,
    color: '#757575',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginLeft: 10,
  },
});