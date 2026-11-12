"use client";

import {
  Fragment,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  BookText,
  Pause,
  Play,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { saveReadingPosition, setBookmark } from "@/actions/reading";
import { useLocale, useMessages } from "@/components/locale-provider";
import { type Step, useReadAloud } from "@/components/read-aloud";
import { Button } from "@/components/ui/button";
import { type Passage } from "@/db/queries";
import { formatNumber } from "@/lib/i18n";
import {
  LAST_AYAH_COOKIE,
  LAST_READ_COOKIE,
  setPreferenceCookie,
} from "@/lib/mode";
import { ayahElementId } from "@/lib/reading";
import { cn } from "@/lib/utils";

import { TafsirSheet } from "./tafsir-sheet";

// How long the reader stays on an ayah before it counts as their place.
const SAVE_AFTER_MS = 1500;

// Holding an ayah this long opens its tafsir.
const LONG_PRESS_MS = 500;

type NavLink = { href: string; label: string } | null;

type ReaderProps = Passage & {
  title: string;
  // "surah/2" or "juz/30": remembered so the read page can continue here.
  path: string;
  previous: NavLink;
  next: NavLink;
  /** The learner's bookmark ("2:255"), wherever it is. */
  bookmark: string | null;
};

// Al-Fatiha's basmalah is its first ayah; at-Tawbah has none.
const opensWithBasmalah = (surah: number) => surah !== 1 && surah !== 9;

// Read mode: the ayat as in a mushaf, with their numbers. Tap an ayah to hear
// it recited; "Listen to all" recites from the top (or, while it is playing,
// from the ayah tapped). English adds each ayah's meaning under it: the Quran
// is read in Arabic, the meaning is a help.
export const Reader = ({
  title,
  path,
  basmalah,
  sections,
  previous,
  next,
  bookmark: initialBookmark,
}: ReaderProps) => {
  const t = useMessages();
  const locale = useLocale();
  const ar = locale === "ar";
  const { play, stop } = useReadAloud();
  const [current, setCurrent] = useState<string | null>(null);
  const [continuous, setContinuous] = useState(false);
  // The ayah last tapped: what Bookmark marks.
  const [selected, setSelected] = useState<string | null>(null);
  const [bookmark, setBookmarkRef] = useState(initialBookmark);
  // The ayah at the top of the screen: the learner's place.
  const [place, setPlace] = useState<string | null>(null);
  const header = useRef<HTMLDivElement>(null);
  // The ayah whose tafsir is open, if any.
  const [tafsirRef, setTafsirRef] = useState<string | null>(null);

  const ayat = useMemo(() => sections.flatMap((s) => s.ayat), [sections]);

  useEffect(() => {
    setPreferenceCookie(LAST_READ_COOKIE, path);
  }, [path]);

  // Opened from "Continue reading" or a bookmark (/read/surah/2#ayah-2:255):
  // bring that ayah into view, below the sticky bar, and mark it.
  useEffect(() => {
    const ref = decodeURIComponent(window.location.hash).replace(/^#ayah-/, "");
    const el = ref && document.getElementById(ayahElementId(ref));
    if (!el) return;
    const timer = setTimeout(() => {
      el.scrollIntoView({ block: "center" });
      setSelected(ref);
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  // Follow the ayah at the top of the screen as the learner scrolls (or as
  // "Listen to all" scrolls for them).
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const top = (header.current?.getBoundingClientRect().bottom ?? 0) + 8;
      const first = ayat.find(
        (a) =>
          (document
            .getElementById(ayahElementId(a.ref))
            ?.getBoundingClientRect().bottom ?? 0) > top
      );
      if (first) setPlace(first.ref);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    onScroll(); // the first measure, once the page has laid out
    document.addEventListener("scroll", onScroll, {
      capture: true,
      passive: true,
    });
    return () => {
      document.removeEventListener("scroll", onScroll, { capture: true });
      if (frame) cancelAnimationFrame(frame);
    };
  }, [ayat]);

  // Save the place once the learner settles on it: to their account, and to
  // this device so it is kept while offline too.
  useEffect(() => {
    if (!place) return;
    const timer = setTimeout(() => {
      setPreferenceCookie(LAST_AYAH_COOKIE, place);
      saveReadingPosition(path, place).catch(() => undefined);
    }, SAVE_AFTER_MS);
    return () => clearTimeout(timer);
  }, [path, place]);

  // Bookmark the ayah last tapped (else the one at the top); on the
  // bookmarked ayah, remove the bookmark.
  const target = selected ?? place;
  const isBookmarked = target !== null && target === bookmark;
  const toggleBookmark = () => {
    if (!target) return;
    const value = isBookmarked ? null : target;
    const before = bookmark;
    setBookmarkRef(value);
    setBookmark(value)
      .then(() =>
        toast.success(value ? t.read.bookmarkSaved : t.read.bookmarkRemoved)
      )
      .catch(() => {
        setBookmarkRef(before);
        toast.error(t.error);
      });
  };

  // Leaving the page stops the recitation.
  useEffect(() => stop, [stop]);

  const playFrom = useCallback(
    (index: number, all: boolean) => {
      const chosen = all ? ayat.slice(index) : [ayat[index]];
      const steps: Step[] = chosen.map((ayah) => ({
        kind: "recite",
        ref: ayah.ref,
        onStart: () => {
          setCurrent(ayah.ref);
          if (all)
            document
              .getElementById(`ayah-${ayah.ref}`)
              ?.scrollIntoView({ behavior: "smooth", block: "center" });
        },
      }));
      steps.push({
        kind: "wait",
        ms: 0,
        onStart: () => {
          setCurrent(null);
          setContinuous(false);
        },
      });
      setContinuous(all);
      play(steps);
    },
    [ayat, play]
  );

  const stopAll = () => {
    stop();
    setCurrent(null);
    setContinuous(false);
  };

  // Long-press an ayah (right-click on a computer) for its tafsir. A tap
  // still plays it; moving the finger (scrolling) cancels the long-press.
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pressStart = useRef<{ x: number; y: number } | null>(null);
  const longPressed = useRef(false);
  const cancelPress = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
    pressTimer.current = null;
    pressStart.current = null;
  };
  const openTafsir = (ref: string) => {
    setSelected(ref);
    setTafsirRef(ref);
  };

  const ayahProps = (ref: string, index: number) => ({
    id: ayahElementId(ref),
    role: "button",
    tabIndex: 0,
    onPointerDown: (e: PointerEvent) => {
      longPressed.current = false;
      pressStart.current = { x: e.clientX, y: e.clientY };
      pressTimer.current = setTimeout(() => {
        longPressed.current = true;
        pressTimer.current = null;
        navigator.vibrate?.(15);
        openTafsir(ref);
      }, LONG_PRESS_MS);
    },
    onPointerMove: (e: PointerEvent) => {
      const start = pressStart.current;
      if (start && Math.hypot(e.clientX - start.x, e.clientY - start.y) > 10)
        cancelPress();
    },
    onPointerUp: cancelPress,
    onPointerLeave: cancelPress,
    onPointerCancel: cancelPress,
    onContextMenu: (e: MouseEvent) => {
      e.preventDefault();
      cancelPress();
      openTafsir(ref);
    },
    onClick: () => {
      // The press that opened the tafsir doesn't also play the ayah.
      if (longPressed.current) {
        longPressed.current = false;
        return;
      }
      setSelected(ref);
      playFrom(index, continuous);
    },
    onKeyDown: (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setSelected(ref);
        playFrom(index, continuous);
      }
    },
  });

  // The ayah's number, with a bookmark on the bookmarked one.
  const marker = (ref: string, n: number) => (
    <span className="mx-1 text-gold-600">
      {bookmark === ref && (
        <Bookmark
          aria-label={t.read.yourBookmark}
          className="me-0.5 inline h-5 w-5 fill-gold-500 align-[-0.15em] text-gold-600"
        />
      )}
      {/* The mushaf font draws the number as its ornamented ayah marker. */}
      <span className="font-quran">{formatNumber("ar", n)}</span>
    </span>
  );

  const highlighted = (ref: string) => current === ref || selected === ref;

  // "Al-Baqarah · ayah 255": the tafsir panel's title.
  const placeName = (ref: string | null) => {
    if (!ref) return "";
    const section = sections.find((s) => s.ayat.some((a) => a.ref === ref));
    const ayah = section?.ayat.find((a) => a.ref === ref);
    if (!section || !ayah) return ref;
    return t.read.ayahPlace(
      ar ? section.name : section.englishName,
      formatNumber(locale, ayah.number)
    );
  };

  return (
    <div className="mx-auto flex w-full max-w-[760px] flex-col gap-y-6 px-6 pb-16">
      <div
        ref={header}
        className="sticky top-[56px] z-10 flex items-center justify-between gap-x-3 border-b-2 bg-white py-3 lg:top-0"
      >
        <Link href="/read">
          <Button size="sm" variant="ghost" aria-label={t.read.back}>
            <ArrowLeft className="h-5 w-5 stroke-2 text-neutral-400 rtl:rotate-180" />
          </Button>
        </Link>
        <h1
          className={cn(
            "text-lg font-bold text-neutral-700",
            ar && "font-arabic"
          )}
        >
          {title}
        </h1>
        <div className="flex items-center gap-x-2">
          <Button
            variant="secondaryOutline"
            size="sm"
            onClick={() => target && openTafsir(target)}
            disabled={!target}
            aria-label={t.read.tafsir}
          >
            <BookText className="h-4 w-4 lg:me-2" />
            <span className="hidden lg:inline">{t.read.tafsir}</span>
          </Button>
          <Button
            variant={isBookmarked ? "secondary" : "secondaryOutline"}
            size="sm"
            onClick={toggleBookmark}
            disabled={!target}
            aria-pressed={isBookmarked}
            aria-label={isBookmarked ? t.read.bookmarked : t.read.bookmark}
          >
            <Bookmark
              className={cn("h-4 w-4 lg:me-2", isBookmarked && "fill-current")}
            />
            <span className="hidden lg:inline">
              {isBookmarked ? t.read.bookmarked : t.read.bookmark}
            </span>
          </Button>
          {continuous ? (
            <Button variant="secondaryOutline" size="sm" onClick={stopAll}>
              <Pause className="me-2 h-4 w-4" />
              {t.read.stop}
            </Button>
          ) : (
            <Button
              variant="secondaryOutline"
              size="sm"
              onClick={() => playFrom(0, true)}
              disabled={ayat.length === 0}
            >
              <Play className="me-2 h-4 w-4" />
              {t.read.playAll}
            </Button>
          )}
        </div>
      </div>

      {ayat.length === 0 ? (
        <p className="rounded-xl border-2 bg-amber-50 p-4 text-sm text-amber-700">
          {t.read.notImported}
        </p>
      ) : (
        <p className="text-center text-sm text-neutral-400">
          {t.read.tapHint} {t.read.tafsirHint} {t.read.bookmarkHint}
        </p>
      )}

      {sections.map((section) => {
        const offset = ayat.findIndex((a) => a.ref === section.ayat[0]?.ref);
        return (
          <section key={section.surah} className="flex flex-col gap-y-4">
            <div className="rounded-xl border-2 border-brand-200 bg-brand-50 py-3 text-center">
              <h2
                className={cn(
                  "font-bold text-brand-700",
                  ar ? "font-arabic text-xl" : "text-lg"
                )}
              >
                {ar ? section.name : section.englishName}
              </h2>
              {(!ar || !section.fromStart) && (
                <p className="text-sm text-brand-600">
                  {[
                    !ar && section.englishNameTranslation,
                    !section.fromStart &&
                      section.ayat[0] &&
                      t.read.fromAyah(
                        formatNumber(locale, section.ayat[0].number)
                      ),
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              )}
            </div>

            {section.fromStart &&
              basmalah &&
              opensWithBasmalah(section.surah) && (
                <p
                  dir="rtl"
                  className="text-center font-quran text-2xl text-neutral-700"
                >
                  {basmalah}
                </p>
              )}

            {ar ? (
              // A mushaf page: the ayat run on, each ending with its number.
              <p
                dir="rtl"
                className="text-justify font-quran text-2xl leading-[2.6] text-neutral-700"
              >
                {section.ayat.map((ayah, i) => (
                  <Fragment key={ayah.ref}>
                    <span
                      {...ayahProps(ayah.ref, offset + i)}
                      className={cn(
                        "cursor-pointer rounded-lg px-0.5 [-webkit-touch-callout:none] hover:bg-brand-50",
                        highlighted(ayah.ref) &&
                          "bg-brand-100 hover:bg-brand-100"
                      )}
                    >
                      {ayah.arabic}
                      {marker(ayah.ref, ayah.number)}
                    </span>{" "}
                  </Fragment>
                ))}
              </p>
            ) : (
              <ol className="flex flex-col gap-y-3">
                {section.ayat.map((ayah, i) => (
                  <li
                    key={ayah.ref}
                    {...ayahProps(ayah.ref, offset + i)}
                    className={cn(
                      "cursor-pointer rounded-xl border-2 p-4 [-webkit-touch-callout:none] hover:bg-brand-50",
                      highlighted(ayah.ref) &&
                        "border-brand-300 bg-brand-100 hover:bg-brand-100"
                    )}
                  >
                    <p
                      dir="rtl"
                      className="font-quran text-2xl leading-[2.4] text-neutral-700"
                    >
                      {ayah.arabic}
                      {marker(ayah.ref, ayah.number)}
                    </p>
                    {ayah.translation && (
                      <p
                        dir="ltr"
                        className="mt-2 text-sm leading-relaxed text-neutral-500"
                      >
                        <span className="me-1 font-bold">({ayah.number})</span>
                        {ayah.translation}
                      </p>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </section>
        );
      })}

      {(previous || next) && (
        <nav className="flex items-center justify-between gap-x-3">
          {previous ? (
            <Link href={previous.href}>
              <Button variant="primaryOutline" size="sm">
                <ArrowLeft className="me-2 h-4 w-4 rtl:rotate-180" />
                <span className={cn(ar && "font-arabic")}>
                  {previous.label}
                </span>
              </Button>
            </Link>
          ) : (
            <span />
          )}
          {next && (
            <Link href={next.href}>
              <Button variant="primaryOutline" size="sm">
                <span className={cn(ar && "font-arabic")}>{next.label}</span>
                <ArrowRight className="ms-2 h-4 w-4 rtl:rotate-180" />
              </Button>
            </Link>
          )}
        </nav>
      )}

      <TafsirSheet
        ayahRef={tafsirRef}
        title={placeName(tafsirRef)}
        onClose={() => setTafsirRef(null)}
      />
    </div>
  );
};
