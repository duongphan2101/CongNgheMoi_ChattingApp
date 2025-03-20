import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./register_style.css";
import sendConfirmationEmail from "../../API/api_sendConfirmationEmail"; // Import the email confirmation API

function Register({ setIsRegistering }) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState(""); // State for email error message

  const validateInputs = () => {
    let errors = [];

    if (!/^\d{10}$/.test(phoneNumber)) {
      errors.push("⚠️ Số điện thoại phải có đúng 10 chữ số.");
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push("📧 Email không hợp lệ.");
    }

    if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/.test(password)) {
      errors.push("🔑 Mật khẩu phải có ít nhất 6 ký tự, bao gồm ít nhất một chữ cái và một số.");
    }

    if (!/^[a-zA-Z0-9]{3,}$/.test(userName)) {
      errors.push("👤 Tên người dùng phải có ít nhất 3 ký tự và chỉ chứa chữ cái hoặc số.");
    }

    if (errors.length > 0) {
      alert(errors.join("\n"));
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEmailError(""); // Reset email error message
  
    if (!validateInputs()) return;
  
    setLoading(true);
  
    // Gửi thêm password và fullName trong request
    const response = await sendConfirmationEmail(email, phoneNumber, password, userName);
    
    setLoading(false);
  
    if (response.success) {
      alert(response.message);
      setIsRegistering(false);
    } else {
      setEmailError(response.message || "Đã xảy ra lỗi. Vui lòng thử lại.");
    }
  };
  

  return (
    <div className="container chat-container blox">
      <form className="container-fluid chat-form" onSubmit={handleSubmit}>
        <h1 className="text-center my-4 title">Đăng ký</h1>

        <input
          className="form-control inp"
          type="tel"
          placeholder="Số điện thoại (10 chữ số)"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
        />

        <input
          className={`form-control inp mt-4 ${emailError ? "is-invalid" : ""}`}
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        {emailError && <div className="text-danger mt-1">{emailError}</div>}

        <input
          className="form-control inp mt-4"
          type="password"
          placeholder="Mật khẩu"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <input
          className="form-control inp mt-4"
          type="text"
          placeholder="Tên người dùng"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
        />

        <button
          type="submit"
          className="btn btn-login btn-primary mt-4 form-control"
          disabled={loading}
        >
          {loading ? "Đang đăng ký..." : "Đăng ký"}
        </button>

        <p className="text-center mt-4">
          Đã có tài khoản?{" "}
          <span
            onClick={() => setIsRegistering(false)}
            className="link"
            style={{ cursor: "pointer", color: "blue" }}
          >
            Đăng nhập
          </span>
        </p>
      </form>
    </div>
  );
}

export default Register;