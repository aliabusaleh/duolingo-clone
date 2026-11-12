import { notFound } from "next/navigation";

import { getPassage, getReadingMarks, getSurahs } from "@/db/queries";
import { getLocale } from "@/lib/locale";

import { Reader } from "../../reader";

type SurahReadPageProps = {
  params: Promise<{ number: string }>;
};

const SurahReadPage = async ({ params }: SurahReadPageProps) => {
  const number = Number((await params).number);
  const [passage, surahs, locale, marks] = await Promise.all([
    getPassage("surah", number),
    getSurahs(),
    getLocale(),
    getReadingMarks(),
  ]);
  if (!passage) notFound();

  const name = (n: number) => {
    const surah = surahs.find((s) => s.number === n);
    return surah ? (locale === "ar" ? surah.name : surah.englishName) : null;
  };
  const link = (n: number) => {
    const label = name(n);
    return label ? { href: `/read/surah/${n}`, label } : null;
  };

  return (
    <Reader
      {...passage}
      title={name(number) ?? ""}
      path={`surah/${number}`}
      previous={link(number - 1)}
      next={link(number + 1)}
      bookmark={marks.bookmarkRef}
    />
  );
};

export default SurahReadPage;
