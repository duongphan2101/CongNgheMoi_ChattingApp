const updateGroupAvatar = async (chatRoomId, avatarFile) => {
    try {
        const formData = new FormData();
        formData.append("avatar", avatarFile);
        formData.append("chatRoomId", chatRoomId);
    
        const response = await fetch("http://localhost:3618/updateGroupAvatar", {
            method: "POST",
            body: formData
        });
    
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || "Cập nhật avatar thất bại!");
        }
    
        return data;
    } catch (error) {
        throw error;
    }
};

export default updateGroupAvatar;