import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import { en, hi } from "./translations/index.js";


i18next
  .use(initReactI18next)
  .init({
    lng: "en",
    fallbackLng: "en",
    resources: {
      en: { translation: en },
      hi: { translation: hi },
    },
  });

export default i18next;