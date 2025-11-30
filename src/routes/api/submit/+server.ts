import { json } from "@sveltejs/kit";
import { DB } from "$lib/server/db";
import { questionPool } from "$lib/questions";
import { customAlphabet } from "nanoid";

const nanoid = customAlphabet("23456789ABCDEFGHJKLMNPQRSTUVWXYZ", 6);

export async function POST({ request, cookies }) {
  const { name, answers } = await request.json();

  const existingCode = cookies.get("quiz_code");

  if (existingCode) {
    const record = DB.get(existingCode);

    if (record) {
      return json({ success: false, message: "Zaten katıldınız." });
    }
  }

  let correctCount = 0;

  // Cevapları kontrol et
  answers.forEach((userAns: any) => {
    const realQuestion = questionPool.find((q) => q.id === userAns.id);
    if (realQuestion && realQuestion.correct === userAns.answer) {
      correctCount++;
    }
  });

  let prize = "NONE";
  if (correctCount === 8) prize = "BIG";
  else if (correctCount === 7) prize = "SMALL";

  const code = nanoid();

  DB.add(name, code, correctCount, prize);

  cookies.set("quiz_code", code, {
    path: "/",
    httpOnly: true,
    sameSite: "strict",
    maxAge: 60 * 60 * 24, // 1 gün yeterli
  });

  return json({ success: true, code, prize, correctCount });
}
