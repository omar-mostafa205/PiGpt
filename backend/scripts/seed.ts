/**
 * Seeds the demo data that used to be hardcoded in the app's sidebar and
 * progress screens, so those surfaces read from Postgres instead.
 *
 *   npm run seed              # seeds every existing user
 *   npm run seed -- <clerkId> # seeds one user, creating the row if needed
 *
 * Safe to re-run: it clears the seeded rows for that user first.
 */
import "dotenv/config";
import { prisma } from "../src/services/storage/neonStorage.js";
import type { Subject, Difficulty } from "@prisma/client";

const daysAgo = (n: number, hour = 15) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, 0, 0, 0);
  return d;
};

const PROBLEMS: {
  subject: Subject;
  question: string;
  answer: string;
  topic: string;
  correct: boolean | null;
  createdAt: Date;
}[] = [
  { subject: "math", question: "Integrate x·eˣ dx", answer: "x·eˣ − eˣ + C", topic: "Integration by parts", correct: true, createdAt: daysAgo(0, 9) },
  { subject: "physics", question: "Projectile range at 40°", answer: "R = v²sin(2θ)/g", topic: "Projectile motion", correct: true, createdAt: daysAgo(0, 12) },
  { subject: "chemistry", question: "Balance C₃H₈ + O₂ → CO₂ + H₂O", answer: "C₃H₈ + 5O₂ → 3CO₂ + 4H₂O", topic: "Balancing equations", correct: false, createdAt: daysAgo(1, 18) },
  { subject: "math", question: "Confidence interval for μ", answer: "x̄ ± z·(σ/√n)", topic: "Hypothesis testing", correct: true, createdAt: daysAgo(1, 20) },
  { subject: "math", question: "Find lim(x→0) sin x / x", answer: "1", topic: "Limits", correct: true, createdAt: daysAgo(2, 11) },
  { subject: "math", question: "Differentiate ln(3x²)", answer: "2/x", topic: "Derivatives", correct: true, createdAt: daysAgo(2, 16) },
  { subject: "chemistry", question: "Enthalpy of combustion of methane", answer: "−890 kJ/mol", topic: "Thermochemistry", correct: false, createdAt: daysAgo(3, 14) },
  { subject: "physics", question: "Kinetic energy at v = 10 m/s", answer: "½mv² = 50m J", topic: "Energy", correct: true, createdAt: daysAgo(3, 19) },
  { subject: "accounting", question: "Trial balance adjustments", answer: "Debits must equal credits", topic: "Period close", correct: true, createdAt: daysAgo(4, 10) },
  { subject: "math", question: "Evaluate ∫ x·cos x dx", answer: "x·sin x + cos x + C", topic: "Integration by parts", correct: false, createdAt: daysAgo(4, 17) },
  { subject: "physics", question: "Ohm's law: V = IR explained", answer: "Voltage is current times resistance", topic: "Circuits", correct: true, createdAt: daysAgo(5, 13) },
  { subject: "math", question: "Sum of n² from 1 to 10", answer: "385", topic: "Series", correct: true, createdAt: daysAgo(6, 15) },
];

const QUIZZES: { subject: Subject; topic: string; difficulty: Difficulty; score: number; day: number }[] = [
  { subject: "math", topic: "Integration by parts", difficulty: "medium", score: 80, day: 0 },
  { subject: "math", topic: "Limits and continuity", difficulty: "easy", score: 100, day: 2 },
  { subject: "physics", topic: "Mechanics", difficulty: "medium", score: 78, day: 3 },
  { subject: "chemistry", topic: "Stoichiometry", difficulty: "hard", score: 64, day: 5 },
];

/** Accuracy per subject, matching the graded problems above. */
function progressFor(subject: Subject) {
  const rows = PROBLEMS.filter((p) => p.subject === subject);
  const graded = rows.filter((p) => p.correct !== null);
  const correct = graded.filter((p) => p.correct).length;
  return {
    accuracy: graded.length ? Math.round((correct / graded.length) * 100) : 0,
    totalSolved: rows.length,
  };
}

async function seedUser(userId: string) {
  // Idempotent: clear anything a previous run left behind.
  await prisma.quiz.deleteMany({ where: { userId } });
  await prisma.problem.deleteMany({ where: { userId } });
  await prisma.progress.deleteMany({ where: { userId } });
  await prisma.streak.deleteMany({ where: { userId } });

  await prisma.problem.createMany({
    data: PROBLEMS.map((p) => ({ ...p, userId })),
  });

  const subjects = [...new Set(PROBLEMS.map((p) => p.subject))];
  for (const subject of subjects) {
    const { accuracy, totalSolved } = progressFor(subject);
    await prisma.progress.create({
      data: { userId, subject, accuracy, streak: 5, totalSolved },
    });
  }

  await prisma.streak.create({
    data: { userId, current: 5, longest: 12, lastSolvedAt: new Date() },
  });

  for (const q of QUIZZES) {
    await prisma.quiz.create({
      data: {
        userId,
        subject: q.subject,
        topic: q.topic,
        difficulty: q.difficulty,
        score: q.score,
        questions: [`${q.topic} — question 1`, `${q.topic} — question 2`],
        completedAt: daysAgo(q.day),
        createdAt: daysAgo(q.day),
      },
    });
  }

  console.log(
    `seeded ${userId}: ${PROBLEMS.length} problems, ${subjects.length} progress rows, ${QUIZZES.length} quizzes`
  );
}

const argId = process.argv[2];

if (argId) {
  await prisma.user.upsert({
    where: { id: argId },
    update: {},
    create: { id: argId, clerkId: argId, email: `${argId}@users.noreply.pigpt` },
  });
  await seedUser(argId);
} else {
  const users = await prisma.user.findMany({ select: { id: true } });
  if (users.length === 0) {
    console.log(
      "No users yet. Sign in on the device once (that creates the row), then re-run,\n" +
        "or pass a Clerk id: npm run seed -- user_xxx"
    );
  }
  for (const u of users) await seedUser(u.id);
}

await prisma.$disconnect();
