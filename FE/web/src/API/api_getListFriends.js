const fetchFriends = async () => {
    try {
        const token = localStorage.getItem("accessToken");
        if (!token) return null;

        const response = await fetch("http://localhost:3824/user/friends", {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("Lỗi lấy bạn bè:", errorData.message);
            return [];
        }

        const friends = await response.json();
        return friends;
    } catch (error) {
        console.error("Lỗi fetch:", error);
        return [];
    }
};

export default fetchFriends;