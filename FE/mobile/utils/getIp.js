import Constants from 'expo-constants';

const getIp = () => {
  let debugHost = null;

  if (Constants?.expoConfig?.hostUri) {
    debugHost = Constants.expoConfig.hostUri.split(':')[0];
  } else if (Constants?.manifest?.debuggerHost) {
    debugHost = Constants.manifest.debuggerHost.split(':')[0];
  }

  if (debugHost) {
    return `http://${debugHost}:3721`;
  }

  return null;
};

export default getIp;

// Gọi hàm và log IP
const ipAddress = getIp();
console.log("Địa chỉ IP máy chủ:", ipAddress);

