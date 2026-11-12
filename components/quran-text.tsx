"use client";

import { createContext, useContext } from "react";

// Whether the Arabic text on screen is Quran (a question about an ayah).
// Quran is shown as the Madinah mushaf prints it (QPC Hafs text) in the
// King Fahd Complex's mushaf font (font-quran, lib/quran-font.ts);
// other Arabic (hadith, adhkar, the app's own words) in Noto Naskh.
const QuranText = createContext(false);

export const QuranTextProvider = QuranText.Provider;

/** True inside a question about an ayah. */
export const useQuranText = () => useContext(QuranText);
