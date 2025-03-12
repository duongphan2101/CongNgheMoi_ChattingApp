import * as React from "react";
import { useState } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { ToastContainer} from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Login from "./component/login/login";
import Register from "./component/register/register";
import View from "./component/view/view";
import Setting from "./component/setting/setting";
import ForgotPassword from "./component/forgotpass/forgotpass";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [currentView, setCurrentView] = useState("login");
  const [isForgotPassword, setIsForgotPassword] = useState(false);

  return (
    <Router>
      <ToastContainer position="top-right" autoClose={3000} />
      <Routes>
        <Route path="/reset-password" element={<ForgotPassword setIsForgotPassword={setIsForgotPassword} />} />
        <Route path="/" element={
          isLoggedIn ? (
            currentView === "settings" ? (
              <Setting setIsLoggedIn={setIsLoggedIn} setCurrentView={setCurrentView} />
            ) : (
              <View setIsLoggedIn={setIsLoggedIn} setCurrentView={setCurrentView} />
            )
          ) : isForgotPassword ? (
            <ForgotPassword setIsForgotPassword={setIsForgotPassword} /> // Hiển thị ForgotPassword
          ) : isRegistering ? (
            <Register setIsRegistering={setIsRegistering} setCurrentView={setCurrentView} />
          ) : (
            <Login setIsLoggedIn={setIsLoggedIn} setIsRegistering={setIsRegistering} setIsForgotPassword={setIsForgotPassword} setCurrentView={setCurrentView} />
          )
        } />
      </Routes>
    </Router>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);