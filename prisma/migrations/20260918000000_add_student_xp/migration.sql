ALTER TABLE "public"."User" ADD COLUMN "xp" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "public"."ChallengeCompletion" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChallengeCompletion_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ChallengeCompletion_studentId_challengeId_key" ON "public"."ChallengeCompletion"("studentId", "challengeId");

ALTER TABLE "public"."ChallengeCompletion" ADD CONSTRAINT "ChallengeCompletion_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."ChallengeCompletion" ADD CONSTRAINT "ChallengeCompletion_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "public"."Challenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;