import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

function ConfirmEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState("Đang xác nhận tài khoản...");
  const [success, setSuccess] = useState(null); // null = đang tải, true = thành công, false = thất bại

  useEffect(() => {
    const confirmEmail = async () => {
      const token = searchParams.get("token");
      console.log("Token từ URL:", token); // Kiểm tra token từ URL
      if (!token) {
        setMessage("❌ Token không hợp lệ.");
        setSuccess(false);
        return;
      }

      try {
        const response = await fetch(`http://localhost:3721/auth/confirm-email?token=${token}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        const data = await response.json();

        if (response.ok) {
          setMessage(`${data.message}`);
          setSuccess(true);
        } else {
          setMessage(`${data.message || "Xác nhận tài khoản thất bại."}`);
          setSuccess(false);
        }
      } catch (error) {
        console.error("Lỗi khi xác nhận tài khoản:", error);
        setMessage("Đã xảy ra lỗi. Vui lòng thử lại sau.");
        setSuccess(false);
      }
    };

    confirmEmail();
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
