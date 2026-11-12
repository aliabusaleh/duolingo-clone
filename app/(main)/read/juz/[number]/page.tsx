import { notFound } from "next/navigation";

import { getPassage, getReadingMarks } from "@/db/queries";
import { formatNumber, messages } from "@/lib/i18n";
import { isJuz } from "@/lib/juz";
import { getLocale } from "@/lib/locale";

import { Reader } from "../../reader";

type JuzReadPageProps = {
  params: Promise<{ number: string }>;
};

const JuzReadPage = async ({ params }: JuzReadPageProps) => {
  const number = Number((await params).number);
  if (!isJuz(number)) notFound();
  const [passage, locale, marks] = await Promise.all([
    getPassage("juz", number),
    getLocale(),
    getReadingMarks(),
  ]);
  if (!passage) notFound();

  const t = messages[locale];
  const title = (n: number) => t.read.juz(formatNumber(locale, n));
  const link = (n: number) =>
    isJuz(n) ? { href: `/read/juz/${n}`, label: title(n) } : null;

  return (
    <Reader
      {...passage}
      title={title(number)}
      path={`juz/${number}`}
      previous={link(number - 1)}
      next={link(number + 1)}
      bookmark={marks.bookmarkRef}
    />
  );
};

export default JuzReadPage;
