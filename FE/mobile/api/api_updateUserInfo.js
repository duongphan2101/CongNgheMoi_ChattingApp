import AsyncStorage from '@react-native-async-storage/async-storage';
import getIp from '../utils/getIp.js';

const updateUserInfo = async (userInfo) => {
    try {
        const token = await AsyncStorage.getItem('accessToken');
        if (!token) {
            throw new Error('Không có token, vui lòng đăng nhập lại!');
        }

        const BASE_URL = getIp('user');
        if (!BASE_URL) throw new Error("Không thể xác định BASE_URL");

        const response = await fetch(`${BASE_URL}/user/update`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userInfo),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Cập nhật thất bại!');
        }

        return await response.json();
    } catch (error) {
        console.error('Lỗi updateUserInfo:', error);
        throw error;
    }
};

export default updateUserInfo;