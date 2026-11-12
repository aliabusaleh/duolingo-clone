"use client";

import { useMemo, useState } from "react";

import { BookOpen, Bookmark, Search } from "lucide-react";
import Link from "next/link";

import { useLocale, useMessages } from "@/components/locale-provider";
import { normalizeArabic } from "@/lib/arabic";
import { formatNumber } from "@/lib/i18n";
import { type ReadingMarks, ayahHref, parseAyahRef } from "@/lib/reading";
import { cn } from "@/lib/utils";

type ReadIndexProps = {
  marks: ReadingMarks;
  surahs: {
    number: number;
    name: string;
    englishName: string;
    englishNameTranslation: string;
    ayahCount: number;
  }[];
  ajza: {
    number: number;
    surah: { name: string; englishName: string } | null;
    ayah: number;
  }[];
};

type Tab = "surahs" | "ajza";

export const ReadIndex = ({ marks, surahs, ajza }: ReadIndexProps) => {
  const t = useMessages();
  const locale = useLocale();
  const ar = locale === "ar";
  const lastRead = marks.lastPath;
  const [tab, setTab] = useState<Tab>(
    lastRead?.startsWith("juz/") ? "ajza" : "surahs"
  );

  // "Al-Baqarah · ayah 255" for a saved place.
  const placeLabel = (ref: string) => {
    const { surah, ayah } = parseAyahRef(ref);
    const s = surahs.find((x) => x.number === surah);
    return s
      ? t.read.ayahPlace(
          ar ? s.name : s.englishName,
          formatNumber(locale, ayah)
        )
      : null;
  };
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const q = query.trim();
    if (!q) return surahs;
    const digits = q.replace(/[\u0660-\u0669]/g, (d) =>
      String(d.charCodeAt(0) - 0x0660)
    );
    const bare = normalizeArabic(q);
    const lower = q.toLowerCase();
    return surahs.filter(
      (s) =>
        String(s.number) === digits ||
        (bare && normalizeArabic(s.name).includes(bare)) ||
        s.englishName.toLowerCase().includes(lower) ||
        s.englishNameTranslation.toLowerCase().includes(lower)
    );
  }, [query, surahs]);

  const continueLabel = useMemo(() => {
    if (!lastRead) return null;
    const [by, n] = lastRead.split("/");
    const number = Number(n);
    if (by === "juz") return t.read.juz(formatNumber(locale, number));
    const surah = surahs.find((s) => s.number === number);
    return surah ? (ar ? surah.name : surah.englishName) : null;
  }, [ar, lastRead, locale, surahs, t]);

  return (
    <div className="mx-auto flex w-full max-w-[700px] flex-col gap-y-5 px-6 pb-10">
      <div className="flex flex-col items-center gap-y-2 text-center">
        <BookOpen className="h-14 w-14 text-brand-600" />
        <h1 className="text-2xl font-bold text-neutral-800">{t.read.title}</h1>
        <p className="text-muted-foreground">{t.read.intro}</p>
      </div>

      {surahs.length === 0 && (
        <p className="rounded-xl border-2 bg-amber-50 p-4 text-sm text-amber-700">
          {t.read.notImported}
        </p>
      )}

      {/* Continue at the exact ayah if it is known, else at the page. */}
      {marks.lastRef && placeLabel(marks.lastRef) ? (
        <Link
          href={ayahHref(marks.lastRef, marks.lastPath)}
          className="flex items-center justify-between rounded-xl border-2 border-b-4 border-brand-300 bg-brand-50 px-4 py-3 font-bold text-brand-700 hover:bg-brand-100"
        >
          <span>{t.read.continue}</span>
          <span className={cn(ar && "font-arabic")}>
            {placeLabel(marks.lastRef)}
          </span>
        </Link>
      ) : (
        lastRead &&
        continueLabel && (
          <Link
            href={`/read/${lastRead}`}
            className="flex items-center justify-between rounded-xl border-2 border-b-4 border-brand-300 bg-brand-50 px-4 py-3 font-bold text-brand-700 hover:bg-brand-100"
          >
            <span>{t.read.continue}</span>
            <span className={cn(ar && "font-arabic")}>{continueLabel}</span>
          </Link>
        )
      )}

      {marks.bookmarkRef && placeLabel(marks.bookmarkRef) && (
        <Link
          href={ayahHref(marks.bookmarkRef)}
          className="flex items-center justify-between rounded-xl border-2 border-b-4 border-gold-400 bg-gold-50 px-4 py-3 font-bold text-gold-700 hover:bg-gold-100"
        >
          <span className="flex items-center gap-x-2">
            <Bookmark className="h-5 w-5 fill-gold-500 text-gold-600" />
            {t.read.yourBookmark}
          </span>
          <span className={cn(ar && "font-arabic")}>
            {placeLabel(marks.bookmarkRef)}
          </span>
        </Link>
      )}

      <div role="tablist" className="grid grid-cols-2 gap-2">
        {(["surahs", "ajza"] as const).map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={cn(
              "rounded-xl border-2 border-b-4 py-2 font-bold text-neutral-500 hover:bg-black/5",
              tab === key && "border-brand-300 bg-brand-100 text-brand-600"
            )}
          >
            {t.read[key]}
          </button>
        ))}
      </div>

      {tab === "surahs" ? (
        <>
          <label className="flex items-center gap-x-3 rounded-xl border-2 border-b-4 bg-white px-4 py-2 focus-within:border-brand-300">
            <Search className="h-5 w-5 shrink-0 text-neutral-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.read.search}
              aria-label={t.read.search}
              className="w-full bg-transparent py-1 text-base text-neutral-700 outline-none placeholder:text-neutral-400"
            />
          </label>
          <ul className="flex flex-col gap-y-2">
            {results.map((s) => (
              <li key={s.number}>
                <Link
                  href={`/read/surah/${s.number}`}
                  className="flex items-center gap-x-3 rounded-xl border-2 border-b-4 px-4 py-3 hover:bg-black/5"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-2 text-sm font-bold text-neutral-500">
                    {formatNumber(locale, s.number)}
                  </span>
                  <span className="flex flex-1 flex-col">
                    <span
                      className={cn(
                        "font-bold text-neutral-700",
                        ar && "font-arabic text-lg"
                      )}
                    >
                      {ar ? s.name : s.englishName}
                    </span>
                    {!ar && (
                      <span className="text-sm text-neutral-500">
                        {s.englishNameTranslation}
                      </span>
                    )}
                  </span>
                  <span className="shrink-0 text-sm text-neutral-400">
                    {t.read.ayahCount(formatNumber(locale, s.ayahCount))}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {ajza.map((juz) => (
            <li key={juz.number}>
              <Link
                href={`/read/juz/${juz.number}`}
                className="flex h-full flex-col gap-y-1 rounded-xl border-2 border-b-4 px-4 py-3 hover:bg-black/5"
              >
                <span className="font-bold text-neutral-700">
                  {t.read.juz(formatNumber(locale, juz.number))}
                </span>
                {juz.surah && (
                  <span
                    className={cn(
                      "text-sm text-neutral-500",
                      ar && "font-arabic"
                    )}
                  >
                    {ar ? juz.surah.name : juz.surah.englishName}
                    {juz.ayah > 1 && ` · ${formatNumber(locale, juz.ayah)}`}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
