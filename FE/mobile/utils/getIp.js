import Constants from 'expo-constants';

const getIp = (service = 'auth') => {
  let debugHost = null;

  // Lấy IP từ cấu hình Expo (hostUri hoặc debuggerHost)
  if (Constants?.expoConfig?.hostUri) {
    debugHost = Constants.expoConfig.hostUri.split(':')[0];
  } else if (Constants?.manifest?.debuggerHost) {
    debugHost = Constants.manifest.debuggerHost.split(':')[0];
  }

  // Nếu không lấy được IP từ Expo, sử dụng IP mặc định
  if (!debugHost) {
    console.log("Không thể lấy IP từ Expo, sử dụng IP mặc định");
    debugHost = "192.168.1.144";
  }

  const PORT = {
    auth: 3721,
    user: 3824,
  };

  // Trả về URL với IP và cổng cho dịch vụ
  return `http://${debugHost}:${PORT[service] || PORT.auth}`;
};

export default getIp;
