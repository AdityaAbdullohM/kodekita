ALTER TABLE "Challenge" ADD COLUMN "mode" TEXT NOT NULL DEFAULT 'coding';
ALTER TABLE "Challenge" ADD COLUMN "questions" JSONB;
