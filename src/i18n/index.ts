import { en } from './en';
import { es } from './es';
import { pl } from './pl';
import { ru } from './ru';
import type { Dictionary, Language, TranslationKey } from './types';

type TranslationParams = Readonly<Record<string, string | number>>;

export const SUPPORTED_LANGUAGES: readonly Language[] = ['en', 'ru', 'pl', 'es'];

const LANGUAGE_STORAGE_KEY = 'state_clash_language';
const DICTIONARIES: Record<Language, Dictionary> = { en, ru, pl, es };

function isLanguage(value: unknown): value is Language {
  return SUPPORTED_LANGUAGES.includes(value as Language);
}

function readStoredLanguage(): Language | null {
  try {
    const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return isLanguage(stored) ? stored : null;
  } catch {
    return null;
  }
}

function detectLanguage(): Language {
  const stored = readStoredLanguage();
  if (stored) return stored;
  const browserLanguage = navigator.language.slice(0, 2).toLowerCase();
  return isLanguage(browserLanguage) ? browserLanguage : 'en';
}

let activeLanguage: Language = detectLanguage();
document.documentElement.lang = activeLanguage;

export function getLanguage(): Language {
  return activeLanguage;
}

export function setLanguage(language: Language): void {
  activeLanguage = language;
  document.documentElement.lang = language;
  try {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch {
    return;
  }
}

export function t(key: TranslationKey, params?: TranslationParams): string {
  const template = DICTIONARIES[activeLanguage][key];
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (placeholder: string, name: string) => String(params[name] ?? placeholder));
}

export type { Dictionary, Language, TranslationKey };
