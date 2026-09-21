import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const badgeCatalog = [
  { code: "first_commit", title: "First commit", description: "Menyelesaikan modul Web Fundamentals", category: "Belajar", icon: "Code2", tone: "green" },
  { code: "streak_starter", title: "Streak starter", description: "Belajar selama 7 hari berturut-turut", category: "Konsistensi", icon: "Flame", tone: "orange" },
  { code: "quick_thinker", title: "Quick thinker", description: "Menjawab 10 quick check dengan benar", category: "Skill", icon: "Zap", tone: "yellow" },
  { code: "layout_architect", title: "Layout architect", description: "Menyelesaikan semua tantangan CSS", category: "Skill", icon: "Target", tone: "blue" },
  { code: "30_day_builder", title: "30 day builder", description: "Belajar konsisten selama 30 hari", category: "Konsistensi", icon: "Trophy", tone: "purple" },
  { code: "portfolio_ready", title: "Portfolio ready", description: "Menyelesaikan jalur Frontend dengan Next.js", category: "Belajar", icon: "Award", tone: "coral" },
  { code: "challenge_sprinter", title: "Challenge sprinter", description: "Menyelesaikan challenge pertamamu", category: "Skill", icon: "Zap", tone: "yellow" },
  { code: "material_reader", title: "Material reader", description: "Membaca materi pertamamu", category: "Belajar", icon: "BookOpen", tone: "green" },
];

function getToday() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function calculateStreak(dates: Date[], today: Date) {
  const uniqueDates = new Set(dates.map((date) => date.toISOString().slice(0, 10)));
  let streak = 0;
  for (let offset = 0; ; offset += 1) {
    const date = new Date(today);
    date.setUTCDate(today.getUTCDate() - offset);
    if (!uniqueDates.has(date.toISOString().slice(0, 10))) break;
    streak += 1;
  }
  return streak;
}

export async function GET(request: Request) {
  try {
    const studentId = new URL(request.url).searchParams.get("studentId");
    if (!studentId) return NextResponse.json({ message: "Student ID wajib diisi." }, { status: 400 });

    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: { role: true, xp: true },
    });
    if (!student || student.role !== "STUDENT") {
      return NextResponse.json({ message: "Akses siswa diperlukan." }, { status: 403 });
    }

    const today = getToday();
    await prisma.studyActivity.upsert({
      where: { studentId_activityDate: { studentId, activityDate: today } },
      update: {},
      create: { studentId, activityDate: today },
    });
    await Promise.all(badgeCatalog.map((badge) => prisma.badge.upsert({
      where: { code: badge.code },
      update: badge,
      create: badge,
    })));

    const [modules, questions, activities, correctAnswers, cssCompletions, challengeCompletions, materialReads, badges, leaderboard] = await Promise.all([
      prisma.module.findMany({
        orderBy: { position: "asc" },
        include: {
          lessons: { orderBy: { position: "asc" }, select: { minutes: true } },
          progress: { where: { userId: studentId }, select: { percent: true } },
        },
      }),
      prisma.question.findMany({
        take: 1,
        orderBy: { material: { createdAt: "desc" } },
        select: {
          id: true,
          materialId: true,
          prompt: true,
          options: true,
          xp: true,
          material: { select: { title: true } },
        },
      }),
      prisma.studyActivity.findMany({ where: { studentId }, orderBy: { activityDate: "desc" }, take: 366, select: { activityDate: true } }),
      prisma.questionAnswer.count({ where: { studentId, isCorrect: true } }),
      prisma.challengeCompletion.count({ where: { studentId, challenge: { category: "CSS" } } }),
      prisma.challengeCompletion.count({ where: { studentId } }),
      prisma.materialRead.count({ where: { studentId } }),
      prisma.badge.findMany({ orderBy: { code: "asc" }, include: { userBadges: { where: { studentId }, select: { unlockedAt: true } } } }),
      prisma.user.findMany({
        where: { role: "STUDENT" },
        orderBy: { xp: "desc" },
        select: { id: true, name: true, xp: true },
      }),
    ]);

    const quickCheckAttempts = questions[0]
      ? await prisma.quickCheckAttempt.findMany({ where: { studentId, questionId: questions[0].id, attemptDate: today }, select: { isCorrect: true } })
      : [];
    const quickCheckLocked = quickCheckAttempts.some((attempt) => attempt.isCorrect) || quickCheckAttempts.length >= 2;

    const completedModules = modules.filter((module) => (module.progress[0]?.percent ?? 0) >= 100);
    const hasNextModule = modules.some((module) => module.title.toLowerCase().includes("next.js") && (module.progress[0]?.percent ?? 0) >= 100);
    const currentStreak = calculateStreak(activities.map((activity) => activity.activityDate), today);
    const unlockedCodes = new Set<string>();
    if (completedModules.length > 0) unlockedCodes.add("first_commit");
    if (currentStreak >= 7) unlockedCodes.add("streak_starter");
    if (correctAnswers >= 10) unlockedCodes.add("quick_thinker");
    if (cssCompletions >= 5) unlockedCodes.add("layout_architect");
    if (currentStreak >= 30) unlockedCodes.add("30_day_builder");
    if (hasNextModule) unlockedCodes.add("portfolio_ready");
    if (challengeCompletions >= 1) unlockedCodes.add("challenge_sprinter");
    if (materialReads >= 1) unlockedCodes.add("material_reader");
    await Promise.all(badges.filter((badge) => unlockedCodes.has(badge.code) && badge.userBadges.length === 0).map((badge) => prisma.userBadge.create({ data: { studentId, badgeId: badge.id } })));

    const unlockedBadges = badges.map((badge) => ({
      code: badge.code,
      title: badge.title,
      description: badge.description,
      category: badge.category,
      icon: badge.icon,
      tone: badge.tone,
      unlocked: badge.userBadges.length > 0 || unlockedCodes.has(badge.code),
      unlockedAt: badge.userBadges[0]?.unlockedAt?.toISOString() ?? (unlockedCodes.has(badge.code) ? new Date().toISOString() : null),
    }));

    const rankedLeaderboard = leaderboard.map((entry, index) => ({
      id: entry.id,
      name: entry.name,
      xp: entry.xp,
      rank: index + 1,
      isCurrent: entry.id === studentId,
    }));

    return NextResponse.json({
      xp: student.xp,
      currentStreak,
      activityDates: activities.map((activity) => activity.activityDate.toISOString().slice(0, 10)),
      badges: unlockedBadges,
      leaderboard: rankedLeaderboard,
      currentRank: rankedLeaderboard.find((entry) => entry.id === studentId)?.rank ?? null,
      modules: modules.map((module) => ({
        id: module.id,
        title: module.title,
        detail: module.description,
        position: module.position,
        progress: module.progress[0]?.percent ?? 0,
        lessons: module.lessons.length,
        minutes: module.lessons.reduce((total, lesson) => total + lesson.minutes, 0),
      })),
      quickCheck: questions[0] ?? null,
      quickCheckStatus: {
        attemptsUsed: quickCheckAttempts.length,
        attemptsRemaining: quickCheckLocked ? 0 : Math.max(0, 2 - quickCheckAttempts.length),
        locked: quickCheckLocked,
      },
    });
  } catch {
    return NextResponse.json({ message: "Data beranda belum dapat dimuat." }, { status: 500 });
  }
}
