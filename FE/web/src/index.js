import React, { useState } from "react";
import ReactDOM from "react-dom/client";

import Login from "./component/login/login";
import Register from "./component/register/register";
import View from "./component/view/view";
import Setting from "./component/setting/setting";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [currentView, setCurrentView] = useState("login");

  return (
    <>
      {isLoggedIn ? (
        currentView === "settings" ? (
          <Setting setIsLoggedIn={setIsLoggedIn} setCurrentView={setCurrentView} />
        ) : (
          <View setIsLoggedIn={setIsLoggedIn} setCurrentView={setCurrentView} />
        )
      ) : isRegistering ? (
        <Register setIsRegistering={setIsRegistering} setCurrentView={setCurrentView} />
      ) : (
        <Login setIsLoggedIn={setIsLoggedIn} setIsRegistering={setIsRegistering} setCurrentView={setCurrentView} />
      )}
    </>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
