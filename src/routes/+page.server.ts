import { questionPool } from "$lib/questions";
import { DB } from "$lib/server/db";

// Fisher-Yates Karıştırma Algoritması
function shuffleArray(array: any[]) {
  const shuffled = [...array]; // Orijinali bozmamak için kopyasını al
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function load({ cookies }) {
  const savedCode = cookies.get("quiz_code");
  if (savedCode) {
    const winner = DB.get(savedCode);
    if (winner) {
      return { completed: true, winner: winner };
    }
  }

  const easy = questionPool.filter((q) => q.difficulty === "easy");
  const medium = questionPool.filter((q) => q.difficulty === "medium");
  const hard = questionPool.filter((q) => q.difficulty === "hard");

  // 4 Kolay, 2 Orta, 2 Zor = Toplam 8 Soru
  const selectedEasy = shuffleArray(easy).slice(0, 4);
  const selectedMedium = shuffleArray(medium).slice(0, 2);
  const selectedHard = shuffleArray(hard).slice(0, 2);

  // Soruları birleştiriyoruz
  let rawQuestions = [...selectedEasy, ...selectedMedium, ...selectedHard];

  const safeQuestions = rawQuestions.map((q) => ({
    id: q.id,
    text: q.text,
    options: q.options,
  }));

  return {
    completed: false,
    questions: safeQuestions,
  };
}
