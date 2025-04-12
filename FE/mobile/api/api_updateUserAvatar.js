import AsyncStorage from '@react-native-async-storage/async-storage';
import getIp from '../utils/getIp.js';

const updateUserAvatar = async (imageFile) => {
    try {
        const token = await AsyncStorage.getItem('accessToken');
        if (!token) {
            throw new Error('Không có token, vui lòng đăng nhập lại!');
        }

        const BASE_URL = getIp('user');
        if (!BASE_URL) throw new Error("Không thể xác định BASE_URL");

        // Tạo FormData
        const formData = new FormData();
        
        // Tạo file object cho API
        const fileUri = imageFile.uri;
        const filename = fileUri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image';
        
        formData.append('avatar', {
            uri: fileUri,
            name: filename,
            type,
        });

        const response = await fetch(`${BASE_URL}/user/update-avatar`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            body: formData,
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Cập nhật avatar thất bại: ${errorText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Lỗi updateUserAvatar:', error);
        throw error;
    }
};

export default updateUserAvatar;