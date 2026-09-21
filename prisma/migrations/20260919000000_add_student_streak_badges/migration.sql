CREATE TABLE "public"."StudyActivity" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "activityDate" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudyActivity_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."Badge" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "tone" TEXT NOT NULL,

    CONSTRAINT "Badge_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."UserBadge" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "badgeId" TEXT NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserBadge_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StudyActivity_studentId_activityDate_key" ON "public"."StudyActivity"("studentId", "activityDate");
CREATE INDEX "StudyActivity_studentId_activityDate_idx" ON "public"."StudyActivity"("studentId", "activityDate");
CREATE UNIQUE INDEX "Badge_code_key" ON "public"."Badge"("code");
CREATE UNIQUE INDEX "UserBadge_studentId_badgeId_key" ON "public"."UserBadge"("studentId", "badgeId");

ALTER TABLE "public"."StudyActivity" ADD CONSTRAINT "StudyActivity_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."UserBadge" ADD CONSTRAINT "UserBadge_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."UserBadge" ADD CONSTRAINT "UserBadge_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "public"."Badge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "public"."Badge" ("id", "code", "title", "description", "category", "icon", "tone") VALUES
  ('badge_first_commit', 'first_commit', 'First commit', 'Menyelesaikan modul Web Fundamentals', 'Belajar', 'Code2', 'green'),
  ('badge_streak_starter', 'streak_starter', 'Streak starter', 'Belajar selama 7 hari berturut-turut', 'Konsistensi', 'Flame', 'orange'),
  ('badge_quick_thinker', 'quick_thinker', 'Quick thinker', 'Menjawab 10 quick check dengan benar', 'Skill', 'Zap', 'yellow'),
  ('badge_layout_architect', 'layout_architect', 'Layout architect', 'Menyelesaikan semua tantangan CSS', 'Skill', 'Target', 'blue'),
  ('badge_30_day_builder', '30_day_builder', '30 day builder', 'Belajar konsisten selama 30 hari', 'Konsistensi', 'Trophy', 'purple'),
  ('badge_portfolio_ready', 'portfolio_ready', 'Portfolio ready', 'Menyelesaikan jalur Frontend dengan Next.js', 'Belajar', 'Award', 'coral'),
  ('badge_challenge_sprinter', 'challenge_sprinter', 'Challenge sprinter', 'Menyelesaikan challenge pertamamu', 'Skill', 'Zap', 'yellow'),
  ('badge_material_reader', 'material_reader', 'Material reader', 'Membaca materi pertamamu', 'Belajar', 'BookOpen', 'green');