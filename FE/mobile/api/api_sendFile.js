import getIp from "../utils/getIp_notPORT";
import getChatId from "./api_getChatIdbyChatRoomId"

const sendFile = async (chatRoomId, sender, receiver, files) => {
    try {
        const BASE_URL = getIp();
        console.log("API sendFile using BASE_URL:", BASE_URL);
        const chatId = await getChatId(chatRoomId);
        const formData = new FormData();
        
        // Check if files is an array or single file
        const filesArray = Array.isArray(files) ? files : [files];
        
        // Append each file to formData
        filesArray.forEach((file, index) => {
            const fileToUpload = {
                uri: file.uri,
                name: file.name || `file-${Date.now()}-${index}.${file.uri.split('.').pop()}`,
                type: file.type || 'application/octet-stream'
            };
            
            console.log(`Preparing to upload file ${index + 1}:`, {
                name: fileToUpload.name,
                type: fileToUpload.type,
                uri: fileToUpload.uri.substring(0, 50) + '...'
            });
            
            formData.append('files', fileToUpload);
        });
        
        formData.append('chatRoomId', chatRoomId);
        formData.append('sender', sender);
        formData.append('receiver', receiver);
        formData.append('chatId', chatId);

        console.log(`Sending request with ${filesArray.length} files to:`, `http://${BASE_URL}:3618/uploadFile`);
        
        const fetchTimeout = 30000;
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), fetchTimeout);
        
        const response = await fetch(`http://${BASE_URL}:3618/uploadFile`, {
            method: 'POST',
            body: formData,
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            signal: controller.signal
        });
        
        clearTimeout(id);
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Lỗi: ${response.status} - ${errorText}`);
        }
        
        const result = await response.json();
        console.log("Upload successful, server response:", result);
        return result;
    } catch (error) {
        console.error("Chi tiết lỗi khi gửi file:", error);
        if (error.name === 'AbortError') {
            throw new Error('Yêu cầu bị hủy do quá thời gian chờ');
        }
        throw error;
    }
};

export default sendFile;