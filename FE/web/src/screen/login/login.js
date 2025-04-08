import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./login_style.css";
import login from "../../API/api_login";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function Login({ setIsLoggedIn}) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = await login(phoneNumber, password);
    if (data) {
      setIsLoggedIn(true);
      toast.success("Đăng nhập thành công!", { position: "top-right" });
      navigate("/");
    } else {
      toast.error("Đăng nhập thất bại, Vui lòng thử lại!", { position: "top-right" });
    }
  };

  return (
    <div className="container chat-container blox">
      <form className="container-fluid chat-form" onSubmit={handleSubmit}>
        <h1 className="text-center my-4 title">Login</h1>
        <input
          className="form-control inp"
          type="tel"
          placeholder="Phone Number"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
        />
        <input
          className="form-control inp mt-4"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <p
          className="text-end mt-2"
          style={{ cursor: "pointer", color: "blue" }}
          onClick={() => navigate("/send-reset-link")} 
        >
          Forgot Password?
        </p>
        <button type="submit" className="btn btn-login btn-primary mt-2 form-control">
          Login
        </button>
        <p className="text-center mt-4">
          Don't have an account?{" "}
          <span
            onClick={() => navigate("/register")}
            className="link"
            style={{ cursor: "pointer", color: "blue" }}
          >
            Sign Up
          </span>
        </p>
      </form>
    </div>
  );
}

export default Login;