import * as React from "react";
import { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Screens
import Login from "./screen/login/login";
import Register from "./screen/register/register";
import View from "./screen/view/view";
import Setting from "./screen/setting/setting";
import ForgotPassword from "./screen/forgotpass/forgotpass";
import SendLinkReset from "./screen/sendLink/sendLinkReset";
import ConfirmEmail from "./screen/register/ConfirmEmail";

// PrivateRoute
import PrivateRoute from "./components/PrivateRoute";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentView, setCurrentView] = useState("login");
  console.log("isLoggedIn", isLoggedIn);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    setIsLoggedIn(!!token);
  }, []);

  return (
    <Router>
      <ToastContainer position="top-right" autoClose={3000} />
      <Routes>
        {/* Public routes */}
        <Route
          path="/login"
          element={
            <Login
              setIsLoggedIn={setIsLoggedIn}
              setCurrentView={setCurrentView}
            />
          }
        />
        <Route
          path="/register"
          element={
            <Register setCurrentView={setCurrentView} />
          }
        />
        <Route
          path="/reset-password"
          element={<ForgotPassword />}
        />
        <Route
          path="/send-reset-link"
          element={<SendLinkReset />}
        />
        <Route path="/confirm-email" element={<ConfirmEmail />} />

        {/* Protected routes */}
        <Route
          path="/"
          element={
            <PrivateRoute>
              {currentView === "settings" ? (
                <Setting setIsLoggedIn={setIsLoggedIn} setCurrentView={setCurrentView} />
              ) : (
                <View setIsLoggedIn={setIsLoggedIn} setCurrentView={setCurrentView} />
              )}
            </PrivateRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" />} />
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
