# VChat 💬

**VChat** là ứng dụng nhắn tin thời gian thực (real-time messaging app) hỗ trợ cả nền tảng web và mobile. Dự án được xây dựng với kiến trúc microservice, sử dụng ReactJS, React Native, Node.js, AWS DynamoDB và AWS S3. VChat hỗ trợ nhắn tin cá nhân, nhóm, và cập nhật thay đổi nhóm theo thời gian thực thông qua Socket.IO.

---

## 🚀 Tính năng chính

- 💬 Nhắn tin 1-1 và nhóm theo thời gian thực
- 👥 Tạo nhóm, thêm/xóa thành viên, đổi tên nhóm
- 👑 Phân quyền quản trị nhóm
- 🔄 Cập nhật nhóm theo thời gian thực (thêm/xóa thành viên, đổi admin, đổi tên nhóm)
- 🚫 Giải tán nhóm: không cho gửi tin nhắn khi nhóm đã bị đóng
- 📁 Hỗ trợ gửi hình ảnh (lưu trữ qua AWS S3)
- 🔔 Thông báo khi có thay đổi nhóm

---

## 🛠️ Công nghệ sử dụng

### Frontend
- **Web:** ReactJS + Socket.IO client
- **Mobile:** React Native (Expo)

### Backend
- **Node.js** + Express
- **Socket.IO** cho real-time communication
- **AWS DynamoDB** để lưu trữ dữ liệu
- **AWS S3** để lưu trữ ảnh và tệp tin

---

## 🧱 Kiến trúc hệ thống

- **Microservice**: Các chức năng như chat, nhóm, người dùng được tách riêng
- **Socket.IO + Redis adapter**: Hỗ trợ scale socket server
- **Stateless API**: Truy xuất dữ liệu theo RESTful

---
## 🎯 Mục tiêu phát triển trong tương lai

- ✅ **Tích hợp Chatbot AI**: Hỗ trợ người dùng trò chuyện với chatbot ngay trong phòng chat. Dự kiến sử dụng OpenAI GPT hoặc mô hình tương tự để tạo trải nghiệm phản hồi thông minh và cá nhân hóa.
  
- 🔖 **Ghim tin nhắn quan trọng**: Cho phép người dùng (hoặc quản trị viên nhóm) ghim các tin nhắn cần lưu ý để mọi người dễ dàng truy cập lại sau này. Tin nhắn được ghim sẽ hiển thị nổi bật trong giao diện trò chuyện.

- 🔍 **Tìm kiếm tin nhắn**: Cho phép tìm kiếm nhanh trong lịch sử trò chuyện theo từ khóa hoặc người gửi.

- 📞 **Tích hợp gọi video (Video Call)**: Hỗ trợ gọi video giữa các người dùng, bao gồm gọi 1-1 và gọi nhóm. Tính năng này sẽ được xây dựng bằng WebRTC hoặc các nền tảng như Agora/Twilio để đảm bảo chất lượng kết nối.


