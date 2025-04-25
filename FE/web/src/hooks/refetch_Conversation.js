import { useEffect, useState, useCallback } from "react";
import getConversations from "../API/api_getConversation";

const useFetchUserChatList = (userId) => {
  const [userChatList, setUserChatList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getConversations(userId);
      setUserChatList(data);
    } catch (err) {
      console.error("Failed to fetch conversations:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchConversations();
    }
  }, [userId, fetchConversations]);

  return { userChatList, loading, error, refetch: fetchConversations, setUserChatList };
};

export default useFetchUserChatList;
