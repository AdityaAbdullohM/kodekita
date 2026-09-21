CREATE TABLE "public"."Material" (
    "id" TEXT NOT NULL,
    "pathId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Material_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "public"."Question" (
    "id" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "options" JSONB NOT NULL,
    "answer" TEXT NOT NULL,
    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "public"."MaterialRead" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MaterialRead_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "public"."QuestionAnswer" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "answeredAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "QuestionAnswer_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "MaterialRead_studentId_materialId_key" ON "public"."MaterialRead"("studentId", "materialId");
CREATE UNIQUE INDEX "QuestionAnswer_studentId_questionId_key" ON "public"."QuestionAnswer"("studentId", "questionId");
ALTER TABLE "public"."Material" ADD CONSTRAINT "Material_pathId_fkey" FOREIGN KEY ("pathId") REFERENCES "public"."LearningPath"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."Question" ADD CONSTRAINT "Question_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "public"."Material"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."MaterialRead" ADD CONSTRAINT "MaterialRead_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."MaterialRead" ADD CONSTRAINT "MaterialRead_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "public"."Material"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."QuestionAnswer" ADD CONSTRAINT "QuestionAnswer_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."QuestionAnswer" ADD CONSTRAINT "QuestionAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "public"."Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;