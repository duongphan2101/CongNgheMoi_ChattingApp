import { useEffect } from "react";
import { io } from "socket.io-client";
import { toast } from "react-toastify";

const socket = io("http://localhost:3618", {
  autoConnect: true,
});

const useSocketUpdateChatRoom = (phoneNumber) => {
  useEffect(() => {
    console.log("useEffect in chat.js running");
    if (!phoneNumber) return;
    socket.emit("join", phoneNumber);
    const handleUpdate = (data) => {
      console.log("Received updateChatRoom:", data);
      toast.success("Cập nhật thành công");
    };

    socket.on("updateChatRoom", handleUpdate);

    return () => {
      socket.off("updateChatRoom", handleUpdate);
    };
  }, [phoneNumber]);
};

export default useSocketUpdateChatRoom;
