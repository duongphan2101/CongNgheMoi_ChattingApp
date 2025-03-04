const getUserInfo = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) return null;

    try {
        const response = await fetch("http://localhost:3824/user/me", {
            method: "GET",
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!response.ok) throw new Error("Không thể lấy thông tin user!");

        return await response.json();
    } catch (error) {
        console.error("Lỗi:", error);
        return null;
    }
};

export default getUserInfo;
