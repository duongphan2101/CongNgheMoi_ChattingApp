import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  en: {
    translation: {
      welcome: "Welcome to App",
    },
  },
  vi: {
    translation: {
      welcome: "Chào mừng bạn đến ứng dụngdụng",
    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: "en", // Mặc định là tiếng Anh
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
