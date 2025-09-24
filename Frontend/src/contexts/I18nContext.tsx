import { createContext, useContext, useMemo, useState, ReactNode } from 'react';

type Lang = 'en' | 'hi' | 'mr';

type Dict = Record<string, string>;

const dictionaries: Record<Lang, Dict> = {
  en: {
    app_title: 'HarvestIQ',
    app_subtitle: 'AI-Powered Crop Prediction for Indian Agriculture',
    scenario: 'Scenario',
    mock_api: 'Mock API',
    sign_out: 'Sign out',
    location_selection: 'Location Selection',
    crop_selection: 'Crop Selection',
    growing_season: 'Growing Season',
    selected_location: 'Selected Location:',
    choose_crop: 'Choose crop type',
    select_season: 'Select season',
    generate_forecast: 'Generate Forecast',
  },
  hi: {
    app_title: 'HarvestIQ',
    app_subtitle: 'भारतीय कृषि के लिए एआई-सक्षम फसल पूर्वानुमान',
    scenario: 'परिदृश्य',
    mock_api: 'मॉक API',
    sign_out: 'साइन आउट',
    location_selection: 'स्थान चयन',
    crop_selection: 'फसल चयन',
    growing_season: 'फसल मौसम',
    selected_location: 'चयनित स्थान:',
    choose_crop: 'फसल प्रकार चुनें',
    select_season: 'मौसम चुनें',
    generate_forecast: 'पूर्वानुमान बनाएं',
  },
  mr: {
    app_title: 'HarvestIQ',
    app_subtitle: 'भारतीय कृषीसाठी एआय-आधारित पीक भाकीत',
    scenario: 'परिस्थिती',
    mock_api: 'मॉक API',
    sign_out: 'साइन आउट',
    location_selection: 'स्थान निवड',
    crop_selection: 'पीक निवड',
    growing_season: 'हंगाम',
    selected_location: 'निवडलेले स्थान:',
    choose_crop: 'पीक प्रकार निवडा',
    select_season: 'हंगाम निवडा',
    generate_forecast: 'भाकीत तयार करा',
  },
};

interface I18nContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLang] = useState<Lang>('en');
  const t = useMemo(() => (key: string) => dictionaries[lang][key] ?? dictionaries.en[key] ?? key, [lang]);
  const value = useMemo(() => ({ lang, setLang, t }), [lang, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = (): I18nContextType => {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
};


