const changePasswordSetting = async (oldPassword, newPassword, confirmPassword, token) => {
    try {
        if (!oldPassword || !newPassword || !confirmPassword) {
            throw new Error("Vui lòng nhập đầy đủ thông tin!");
        }

        const response = await fetch("http://localhost:3824/user/change-passwordSetting", {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ oldPassword, newPassword }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Đổi mật khẩu thất bại");
        }

        return true;
    } catch (error) {
        console.error("Lỗi API:", error);
        throw error;
    }
};
export default changePasswordSetting;