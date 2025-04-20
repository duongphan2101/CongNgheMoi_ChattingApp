const getConversations = async () => {
    const token = localStorage.getItem("accessToken");

    if (!token) {
        console.error("Không tìm thấy token!");
        return null;
    }

    try {
        const response = await fetch("http://localhost:3618/conversations", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`, // Gửi token lên server
            },
        });

        const data = await response.json();
        console.log("data conversations ", data)
        if (!response.ok) {
            throw new Error(data.message || "Lỗi khi lấy danh sách cuộc trò chuyện!");
        }

        return data;
    } catch (error) {
        console.error("Lỗi:", error);
        return null;
    }
};

export default getConversations;