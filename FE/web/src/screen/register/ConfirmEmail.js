import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

function ConfirmEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState("Đang xác nhận tài khoản...");
  const [success, setSuccess] = useState(null);

  // Lấy địa chỉ IP của máy chủ
  const SERVER_IP = window.location.hostname;
  const SERVER_PORT = 3721;
  const BASE_URL = `http://${SERVER_IP}:${SERVER_PORT}`;
  console.log("BASE ", BASE_URL);

  useEffect(() => {
    const status = searchParams.get("status");
    const messageParam = searchParams.get("message");
  
    if (status === "success") {
      setSuccess(true);
      setMessage("Xác nhận thành công!");
    } else if (status === "error") {
      setSuccess(false);
      setMessage(decodeURIComponent(messageParam || "Xác nhận thất bại."));
    } else {
      setSuccess(false);
      setMessage("Liên kết không hợp lệ hoặc đã hết hạn.");
    }
  }, [searchParams]);
  

  return (
    <div className="container text-center my-4">
      <h1>{success === null ? "Đang xác nhận..." : success ? "Thành công" : "Lỗi"}</h1>
      <p>{message}</p>

      {success === null && <div className="spinner-border text-primary my-3"></div>}

      {success && (
        <button className="btn btn-primary mt-3" onClick={() => navigate("/")}>
          Quay lại Đăng nhập
        </button>
      )}
    </div>
  );
}

export default ConfirmEmail;
