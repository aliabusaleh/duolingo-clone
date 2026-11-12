"use client";

import { useEffect, useState } from "react";

import { Loader, WifiOff } from "lucide-react";

import { useLocale, useMessages } from "@/components/locale-provider";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

// Tafsir of one ayah, loaded on request (it needs a connection; nothing is
// stored with the app). Arabic: at-Tafsir al-Muyassar. English: Ibn Kathir
// (abridged), with a jsDelivr mirror of the same text as a fallback.
type Source = {
  name: string;
  url: (ref: string) => string;
  urls: (ref: string) => string[];
  text: (json: unknown) => string;
};

const SOURCES: Record<Locale, Source> = {
  ar: {
    name: "التفسير الميسر",
    url: (ref) => `https://quran.com/${ref}/tafsirs/ar-tafsir-muyassar`,
    urls: (ref) => [`https://api.alquran.cloud/v1/ayah/${ref}/ar.muyassar`],
    text: (json) => (json as { data?: { text?: string } }).data?.text ?? "",
  },
  en: {
    name: "Ibn Kathir (abridged)",
    url: (ref) => `https://quran.com/${ref}/tafsirs/en-tafisr-ibn-kathir`,
    urls: (ref) => {
      const [surah, ayah] = ref.split(":");
      return [
        `https://api.quran.com/api/v4/tafsirs/169/by_ayah/${ref}`,
        `https://cdn.jsdelivr.net/gh/spa5k/tafsir_api@main/tafsir/en-tafisr-ibn-kathir/${surah}/${ayah}.json`,
      ];
    },
    text: (json) => {
      const j = json as { tafsir?: { text?: string }; text?: string };
      return j.tafsir?.text ?? j.text ?? "";
    },
  },
};

// The sources send HTML (headings, paragraphs). Keep only its text, as
// paragraphs: nothing from them is ever inserted as HTML.
const toParagraphs = (html: string) => {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const blocks = [...doc.body.querySelectorAll("h1,h2,h3,h4,p,li")];
  const parts = (blocks.length ? blocks : [doc.body]).map((el) =>
    (el.textContent ?? "").replace(/\s+/g, " ").trim()
  );
  return parts.filter(Boolean);
};

const cache = new Map<string, string[]>();

type State =
  | { status: "loading" }
  | { status: "done"; paragraphs: string[] }
  | { status: "offline" }
  | { status: "error" };

const load = async (source: Source, ref: string) => {
  for (const url of source.urls(ref)) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const paragraphs = toParagraphs(source.text(await res.json()));
      if (paragraphs.length) return paragraphs;
    } catch {
      // Try the next source.
    }
  }
  return null;
};

type TafsirSheetProps = {
  /** The ayah shown ("2:255"), or null when closed. */
  ayahRef: string | null;
  /** E.g. "Al-Baqarah · ayah 255". */
  title: string;
  onClose: () => void;
};

export const TafsirSheet = ({ ayahRef, title, onClose }: TafsirSheetProps) => {
  const t = useMessages();
  const locale = useLocale();
  const source = SOURCES[locale];
  const key = ayahRef ? `${locale}:${ayahRef}` : null;
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    if (!ayahRef || !key) return;
    let live = true;
    const cached = cache.get(key);
    // Settle on the next tick, so no state is set synchronously in the effect.
    const timer = setTimeout(() => {
      if (cached) return setState({ status: "done", paragraphs: cached });
      if (!navigator.onLine) return setState({ status: "offline" });
      setState({ status: "loading" });
      load(source, ayahRef).then((paragraphs) => {
        if (!live) return;
        if (!paragraphs)
          return setState({
            status: navigator.onLine ? "error" : "offline",
          });
        cache.set(key, paragraphs);
        setState({ status: "done", paragraphs });
      });
    }, 0);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [ayahRef, key, source]);

  return (
    <Sheet open={ayahRef !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="bottom"
        className="z-[100] max-h-[75vh] overflow-y-auto rounded-t-2xl"
      >
        <SheetTitle className={cn("pe-8", locale === "ar" && "font-arabic")}>
          {t.read.tafsir} · {title}
        </SheetTitle>
        <SheetDescription className="text-xs">
          {t.read.tafsirSource}:{" "}
          {ayahRef && (
            <a
              href={source.url(ayahRef)}
              target="_blank"
              rel="noreferrer noopener"
              className="font-semibold text-brand-700 underline-offset-2 hover:underline"
            >
              {source.name}
            </a>
          )}
        </SheetDescription>

        <div
          dir={locale === "ar" ? "rtl" : "ltr"}
          className="mt-4 flex flex-col gap-y-3 pb-6"
        >
          {state.status === "loading" && (
            <Loader className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
          )}
          {state.status === "offline" && (
            <p className="flex items-center gap-x-2 rounded-xl border-2 bg-neutral-50 p-4 text-sm text-neutral-600">
              <WifiOff className="h-5 w-5 shrink-0" />
              {t.read.tafsirOffline}
            </p>
          )}
          {state.status === "error" && (
            <p className="rounded-xl border-2 bg-rose-50 p-4 text-sm text-rose-700">
              {t.read.tafsirError}
            </p>
          )}
          {state.status === "done" &&
            state.paragraphs.map((p, i) => (
              <p
                key={i}
                className={cn(
                  "leading-relaxed text-neutral-700",
                  locale === "ar" ? "font-arabic text-lg" : "text-base"
                )}
              >
                {p}
              </p>
            ))}
        </div>
      </SheetContent>
    </Sheet>
  );
};
