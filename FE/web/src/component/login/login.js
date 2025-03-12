import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./login_style.css";
import login from "../../API/api_login";

function Login({ setIsLoggedIn, setIsRegistering, setIsForgotPassword }) { // Thêm prop setIsForgotPassword
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = await login(phoneNumber, password);
    if (data) {
      console.log("Login successful:");
      setIsLoggedIn(true);
    } else {
      alert("Login failed");
      console.log("Login failed");
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
          onClick={() => setIsForgotPassword(true)} // Chuyển sang màn hình quên mật khẩu
        >
          Forgot Password?
        </p>
        <button type="submit" className="btn btn-login btn-primary mt-2 form-control">
          Login
        </button>
        <p className="text-center mt-4">
          Don't have an account?{" "}
          <span
            onClick={() => setIsRegistering(true)}
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