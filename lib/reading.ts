// Read mode's reading position and bookmark: refs, pages and links.
// Pure, so the server actions, queries and pages share one definition.

/** An ayah: "surah:ayah", e.g. "2:255". */
const AYAH_REF = /^(\d{1,3}):(\d{1,3})$/;

/** A Read page: "surah/2" or "juz/30". */
const READ_PATH = /^(surah|juz)\/\d{1,3}$/;

export const isAyahRef = (value: unknown): value is string =>
  typeof value === "string" && AYAH_REF.test(value);

export const isReadPath = (value: unknown): value is string =>
  typeof value === "string" && READ_PATH.test(value);

/** "2:255" -> { surah: 2, ayah: 255 }. */
export const parseAyahRef = (ref: string) => {
  const [, surah, ayah] = AYAH_REF.exec(ref) ?? [];
  return { surah: Number(surah), ayah: Number(ayah) };
};

/** The ayah's element id on a Read page. */
export const ayahElementId = (ref: string) => `ayah-${ref}`;

/**
 * A link straight to an ayah: on the page it was read on (a juz' page keeps
 * the reader in that juz'), else on its surah's page.
 */
export const ayahHref = (ref: string, path?: string | null) =>
  `/read/${isReadPath(path) ? path : `surah/${parseAyahRef(ref).surah}`}#${ayahElementId(ref)}`;

export type ReadingMarks = {
  lastRef: string | null;
  lastPath: string | null;
  bookmarkRef: string | null;
};
