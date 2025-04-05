import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import sendLinkReset from "../../API/api_sendLinkReset"; // Import the sendLinkReset function

function SendLinkReset({ setIsForgotPassword }) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const location = useLocation();

  const validatePhoneNumber = () => {
    const phoneRegex = /^0[0-9]{9}$/;
    if (!phoneRegex.test(phoneNumber)) {
      alert("⚠️ Vui lòng nhập số điện thoại hợp lệ.");
      return false;
    }
    return true;
  };

  const handleSendLink = async () => {
    if (!validatePhoneNumber()) return;

    setLoading(true);
    try {
      await sendLinkReset(phoneNumber); // Call the sendLinkReset function
      setSuccess(true);
    } catch (error) {
      alert("Gửi link đặt lại mật khẩu thất bại. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const success = urlParams.get("success");
    if (success) {
      setSuccess(true);
    }
  }, [location.search]);

  return (
    <div className="container chat-container blox">
      {success ? (
        <div className="alert alert-success" role="alert">
          Link đặt lại mật khẩu đã được gửi đến email của bạn!
        </div>
      ) : (
        <form className="container-fluid chat-form" onSubmit={(e) => e.preventDefault()}>
          <h1 className="text-center my-4 title">Quên mật khẩu</h1>

          <div className="input-group mb-4">
            <input
              className="form-control inp"
              type="text"
              placeholder="Số điện thoại"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
            <button
              type="button"
              className="btn btn-outline-primary"
              onClick={handleSendLink}
              disabled={loading}
            >
              {loading ? "Đang gửi..." : "Gửi link đặt lại mật khẩu"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default SendLinkReset;