import getIp from "../utils/getIp_notPORT.js";
const getUserbySearch = async (phoneNumber, fullName) => {
    try {
        const BASE_URL = getIp();
        if (!BASE_URL) throw new Error("Không thể xác định BASE_URL");
        const params = new URLSearchParams();
        if (phoneNumber) params.append("phoneNumber", phoneNumber);
        if (fullName) params.append("fullName", fullName);

        const url = `http://${BASE_URL}:3824/user/searchUser?${params.toString()}`;

        const response = await fetch(url, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
            let errorMessage = "Có lỗi xảy ra khi tìm kiếm user";
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorMessage;
            } catch { }
            throw new Error(errorMessage);
        }

        return await response.json();
    } catch (error) {
        console.error("Lỗi tìm user:", error.message);
        return [];
    }
};

export default getUserbySearch;

