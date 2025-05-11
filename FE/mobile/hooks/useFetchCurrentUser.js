import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { jwtDecode } from "jwt-decode";

import getUserbySearch from "../api/api_searchUSer"

const useCurrentUser = () => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCurrentUser = async () => {
            try {
                const token = await AsyncStorage.getItem("accessToken");
                if (!token) throw new Error("Không có token");

                const decoded = jwtDecode(token);
                const phoneNumber = decoded.phoneNumber;
                if (!phoneNumber) throw new Error("Không có số điện thoại trong token");

                const users = await getUserbySearch(phoneNumber, "");
                if (users.length > 0) {
                    setCurrentUser(users[0]); // Vì API trả về mảng chỉ chứa 1 user
                } else {
                    throw new Error("Không tìm thấy user");
                }
            } catch (error) {
                console.error("Lỗi lấy current user:", error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchCurrentUser();
    }, []);

    return { currentUser, loading };
};

export default useCurrentUser;


