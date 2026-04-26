import { useTranslation } from "react-i18next";
import { Globe, Check } from "lucide-react";
import { useState } from "react";

const LANGUAGES = [
  { code: "ru", name: "RU", label: "Русский" },
  { code: "en", name: "EN", label: "English" },
  { code: "uz", name: "UZ", label: "O'zbekcha" },
];

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const currentLang = LANGUAGES.find((l) => l.code === i18n.language) || LANGUAGES[0];

  const handleLanguageChange = (code: string) => {
    i18n.changeLanguage(code);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer bg-transparent border-none"
        title="Change language"
      >
        <Globe className="w-3.5 h-3.5" />
        <span>{currentLang.name}</span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 z-50 bg-card border border-border rounded-lg shadow-lg min-w-max">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted transition-colors flex items-center justify-between first:rounded-t-lg last:rounded-b-lg border-b last:border-b-0"
              >
                <div className="flex flex-col">
                  <span className="font-medium text-foreground">{lang.name}</span>
                  <span className="text-xs text-muted-foreground">{lang.label}</span>
                </div>
                {i18n.language === lang.code && (
                  <Check className="w-4 h-4 text-primary" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
