import React, { useState, useEffect } from "react";
import { useLocation} from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import changePassword from "../../API/api_changePass"; // Import the changePassword function
import sendLinkReset from "../../API/api_sendLinkReset"; // Import the sendLinkReset function

function ForgotPassword({ setIsForgotPassword }) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [linkSent, setLinkSent] = useState(false);
  const [token, setToken] = useState(null);

  const location = useLocation();

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const token = urlParams.get("token");
    const phoneNumber = urlParams.get("phoneNumber");
    if (token) {
      setToken(token);
    }
    if (phoneNumber) {
      setPhoneNumber(phoneNumber);
    }
  }, [location.search]);

  const validatePhoneNumber = () => {
    const phoneRegex = /^0[0-9]{9}$/;
    if (!phoneRegex.test(phoneNumber)) {
      alert("⚠️ Vui lòng nhập số điện thoại hợp lệ.");
      return false;
    }
    return true;
  };

  const validateInputs = () => {
    let errors = [];

    if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/.test(newPassword)) {
      errors.push("🔑 Mật khẩu mới phải có ít nhất 6 ký tự, bao gồm ít nhất một chữ cái và một số.");
    }

    if (newPassword !== confirmPassword) {
      errors.push("🔑 Mật khẩu xác nhận không khớp với mật khẩu mới.");
    }

    if (errors.length > 0) {
      alert(errors.join("\n"));
      return false;
    }
    return true;
  };

  const handleSendLink = async () => {
    if (!validatePhoneNumber()) return;

    setLoading(true);
    try {
      await sendLinkReset(phoneNumber); // Call the sendLinkReset function
      setLinkSent(true);
      alert("Link đặt lại mật khẩu đã được gửi đến email của bạn!");
    } catch (error) {
      alert("Gửi link đặt lại mật khẩu thất bại. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateInputs()) return;

    setLoading(true);
    try {
      await changePassword(phoneNumber, newPassword); // Call the changePassword function
      setLoading(false);
      alert("Mật khẩu đã được đặt lại thành công!");
      setIsForgotPassword(false); // Quay lại màn đăng nhập
    } catch (error) {
      setLoading(false);
      alert("Đặt lại mật khẩu thất bại. Vui lòng thử lại.");
    }
  };

  return (
    <div className="container chat-container blox">
      <form className="container-fluid chat-form" onSubmit={handleSubmit}>
        <h1 className="text-center my-4 title">Quên mật khẩu</h1>

        <div className="input-group mb-4">
          <input
            className="form-control inp"
            type="text"
            placeholder="Số điện thoại"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            disabled={linkSent}
          />
          <button
            type="button"
            className="btn btn-outline-primary"
            onClick={handleSendLink}
            disabled={loading || linkSent}
          >
            {loading && !linkSent ? "Đang gửi..." : "Gửi link đặt lại mật khẩu"}
          </button>
        </div>

        <input
          className="form-control inp mt-4"
          type="password"
          placeholder="Mật khẩu mới"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          disabled={!token}
        />

        <input
          className="form-control inp mt-4"
          type="password"
          placeholder="Xác nhận mật khẩu mới"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          disabled={!token}
        />

        <button
          type="submit"
          className="btn btn-login btn-primary mt-4 form-control"
          disabled={loading || !token}
        >
          {loading ? "Đang xử lý..." : "Đặt lại mật khẩu"}
        </button>

        <p className="text-center mt-4">
          Đã nhớ mật khẩu?{" "}
          <span
            onClick={() => setIsForgotPassword(false)}
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

export default ForgotPassword;