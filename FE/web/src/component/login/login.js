import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./login_style.css";

function Chat({ setCurrentView }) {
  return (
    <div className="container chat-container blox">
      <form className="container-fluid chat-form">
        <h1 className="text-center my-4 title">Login</h1>
        <input className="form-control inp" type="tel" placeholder="Phone Number"/>
        <input className="form-control inp mt-4" type="password" placeholder="Password"/>
        <p onClick={() => setCurrentView("resetpass")} className="text-end mt-2">Forgot Password?</p>
        <button type="submit" className="btn btn-login btn-primary mt-2 form-control">Login</button>
        <p className="text-center mt-4">Don't have an account? <span onClick={() => setCurrentView("register")} className="link">Sign Up</span></p>
      </form>
    </div>
  );
}

export default Chat;