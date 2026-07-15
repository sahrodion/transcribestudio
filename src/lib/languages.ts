export interface LanguageOption {
  value: string;
  label: string;
  /** ISO 639-1 code passed to OpenAI, or null for auto-detect */
  code: string | null;
}

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { value: "auto", label: "Detect automatically", code: null },
  { value: "en", label: "English", code: "en" },
  { value: "fr", label: "French", code: "fr" },
  { value: "es", label: "Spanish", code: "es" },
  { value: "de", label: "German", code: "de" },
  { value: "it", label: "Italian", code: "it" },
  { value: "pt", label: "Portuguese", code: "pt" },
  { value: "ar", label: "Arabic", code: "ar" },
  { value: "hi", label: "Hindi", code: "hi" },
  { value: "yo", label: "Yoruba", code: "yo" },
  { value: "ig", label: "Igbo", code: "ig" },
  { value: "ha", label: "Hausa", code: "ha" },
  { value: "zh", label: "Mandarin Chinese", code: "zh" },
  { value: "other", label: "Other", code: null },
];

export function resolveLanguageHint(value: string | null | undefined): string | undefined {
  if (!value || value === "auto" || value === "other") return undefined;
  const option = LANGUAGE_OPTIONS.find((item) => item.value === value);
  return option?.code ?? undefined;
}
