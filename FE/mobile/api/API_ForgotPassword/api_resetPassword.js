// import axios from "axios";

// const resetPasswordAPI = async (phoneNumber, newPassword, token) => {
//   try {
//     const response = await axios.post(
//       "http://localhost:3721/auth/reset-password-on-phone",
//       { phoneNumber, newPassword },
//       {
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       }
//     );
//     return response.data;
//   } catch (error) {
//     console.error("Lỗi khi gọi API reset password:", error.response?.data || error.message);
//     return null;
//   }
// };

// export default resetPasswordAPI;