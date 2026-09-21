ALTER TABLE "public"."Question" ADD COLUMN "xp" INTEGER NOT NULL DEFAULT 50;

CREATE TABLE "public"."QuickCheckAttempt" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "attemptDate" DATE NOT NULL,
    "answer" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuickCheckAttempt_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "QuickCheckAttempt_studentId_questionId_attemptDate_idx" ON "public"."QuickCheckAttempt"("studentId", "questionId", "attemptDate");

ALTER TABLE "public"."QuickCheckAttempt" ADD CONSTRAINT "QuickCheckAttempt_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."QuickCheckAttempt" ADD CONSTRAINT "QuickCheckAttempt_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "public"."Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

UPDATE "public"."Question" SET "xp" = 50 WHERE "id" = 'question_html_css_padding';