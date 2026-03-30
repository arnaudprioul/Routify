import { createI18n } from 'vue-i18n';
import en from '@/assets/locales/en.json';
import fr from '@/assets/locales/fr.json';
import ja from '@/assets/locales/ja.json';
import ko from '@/assets/locales/ko.json';
import zh from '@/assets/locales/zh.json';

export type TLocale = 'en' | 'fr' | 'ja' | 'ko' | 'zh';

export interface ILangOption {
  code: TLocale;
  label: string;   // native name
  flag: string;    // emoji flag
}

export const LANGUAGES: ILangOption[] = [
  { code: 'en', label: 'English',  flag: '🇬🇧' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'ja', label: '日本語',    flag: '🇯🇵' },
  { code: 'ko', label: '한국어',    flag: '🇰🇷' },
  { code: 'zh', label: '中文',      flag: '🇨🇳' },
];

const savedLocale = (localStorage.getItem('routify_locale') as TLocale) || 'en';

export const i18n = createI18n({
  legacy: false,
  locale: savedLocale,
  fallbackLocale: 'en',
  messages: { en, fr, ja, ko, zh },
});

export function setLocale(locale: TLocale) {
  i18n.global.locale.value = locale;
  localStorage.setItem('routify_locale', locale);
}
