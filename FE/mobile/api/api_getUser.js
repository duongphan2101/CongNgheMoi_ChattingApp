import AsyncStorage from '@react-native-async-storage/async-storage';
import getIp from '../utils/getIp.js';

const getUser = async () => {
    try {
        const token = await AsyncStorage.getItem('accessToken');
        if (!token) {
            throw new Error('Không có token, vui lòng đăng nhập lại!');
        }

        const BASE_URL = getIp('user');
        if (!BASE_URL) throw new Error("Không thể xác định BASE_URL");

        const response = await fetch(`${BASE_URL}/user/me`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Không thể lấy thông tin người dùng');
        }

        return await response.json();
    } catch (error) {
        console.error('Lỗi getUser:', error);
        throw error;
    }
};

export default getUser;