import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import Chat from "./component/chatting/chat";
import Setting from "./component/setting/setting";
import Cloud from "./component/cloud/cloud";
import Contacts from "./component/contacts/contacts";

function App() {
  const [currentView, setCurrentView] = useState("chat");

  const renderView = () => {
    switch (currentView) {
      case "chat":
        return <Chat setCurrentView={setCurrentView} />;
      case "setting":
        return <Setting setCurrentView={setCurrentView} />;
      case "cloud":
        return <Cloud setCurrentView={setCurrentView} />;
      case "contacts":
        return <Contacts setCurrentView={setCurrentView} />;
      default:
        return <Chat setCurrentView={setCurrentView} />;
    }
  };

  return <div>{renderView()}</div>;
}
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
