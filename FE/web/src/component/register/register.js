import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./register_style.css";

function Chat({ setCurrentView }) {
  return (
    <div className="container chat-container blox">
      <form className="container-fluid chat-form">
        <h1 className="text-center my-4 title">Register</h1>
        <input className="form-control inp" type="tel" placeholder="Phone Number"/>
        <input className="form-control inp mt-4" type="password" placeholder="Password"/>
        <input className="form-control inp mt-4" type="text" placeholder="User Name"/>
  
        <button type="submit" className="btn btn-login btn-primary mt-4 form-control">Register</button>
        <p className="text-center mt-4">Already have an account? <span onClick={() => setCurrentView("login")} className="link">Login</span></p>
      </form>
    </div>
  );
}

export default Chat;