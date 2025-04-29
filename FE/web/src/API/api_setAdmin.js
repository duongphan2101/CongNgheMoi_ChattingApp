const setAdmin = async (chatRoomId, phoneNumber) => {
    console.log("setAdmin function called with:", { chatRoomId, phoneNumber });
    try {
        const response = await fetch("http://localhost:3618/setAdmin", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ chatRoomId, phoneNumber }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Lỗi khi set admin.");
        }

        return data;
    } catch (error) {
        console.error("Lỗi setAdmin:", error);
        throw error;
    }
};

export default setAdmin;
