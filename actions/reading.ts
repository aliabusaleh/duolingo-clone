"use server";

import { revalidatePath } from "next/cache";

import db from "@/db/drizzle";
import { readingMarks } from "@/db/schema";
import { getAuth } from "@/lib/auth";
import { isAyahRef, isReadPath } from "@/lib/reading";

const requireUser = async () => {
  const { userId } = await getAuth();
  if (!userId) throw new Error("Unauthorized.");
  return userId;
};

/** Where the learner is reading: saved by itself as they scroll or listen. */
export const saveReadingPosition = async (path: string, ref: string) => {
  const userId = await requireUser();
  if (!isReadPath(path) || !isAyahRef(ref))
    throw new Error("Invalid position.");

  const values = { lastRef: ref, lastPath: path, lastAt: new Date() };
  await db
    .insert(readingMarks)
    .values({ userId, ...values })
    .onConflictDoUpdate({ target: readingMarks.userId, set: values });

  // The Read page's "Continue reading" card.
  revalidatePath("/read");
};

/** Set the learner's bookmark on an ayah, or remove it (null). */
export const setBookmark = async (ref: string | null) => {
  const userId = await requireUser();
  if (ref !== null && !isAyahRef(ref)) throw new Error("Invalid bookmark.");

  const values = { bookmarkRef: ref, bookmarkAt: ref ? new Date() : null };
  await db
    .insert(readingMarks)
    .values({ userId, ...values })
    .onConflictDoUpdate({ target: readingMarks.userId, set: values });

  revalidatePath("/read");
};
