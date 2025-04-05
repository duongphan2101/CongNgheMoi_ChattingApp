const checkChatRoom = async (myPhone, userPhone) => {
    try {
        const response = await fetch(`http://localhost:3618/checkChatRoom?myPhone=${myPhone}&userPhone=${userPhone}`);
        const data = await response.json();
        return data.chatRoomId;
    } catch (error) {
        console.error("Lỗi khi kiểm tra phòng chat:", error);
        return null;
    }
};
export default checkChatRoom;