import Constants from 'expo-constants';

const getIp = () => {
  let debugHost = null;

  if (Constants?.expoConfig?.hostUri) {
    debugHost = Constants.expoConfig.hostUri.split(':')[0];
  } else if (Constants?.manifest?.debuggerHost) {
    debugHost = Constants.manifest.debuggerHost.split(':')[0];
  }

  // Nếu không thể lấy được địa chỉ IP
  if (!debugHost) {
    console.log("Không thể lấy IP từ Expo, sử dụng IP mặc định");
    debugHost = "192.168.1.144";
  }

  return debugHost;
};

export default getIp;
