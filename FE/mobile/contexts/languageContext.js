import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: { translation: { welcome: "Welcome to App", Mode: "Mode" } },
  vi: { translation: { welcome: "Chào mừng bạn đến ứng dụng", Mode: "Chế độ" } },
};

i18n.use(initReactI18next).init({
  resources,
  lng: Localization.locale.startsWith("vi") ? "vi" : "en", // Auto detect language
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

export default i18n;

