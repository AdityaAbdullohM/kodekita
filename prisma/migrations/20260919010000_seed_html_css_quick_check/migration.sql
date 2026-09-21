DO $$
DECLARE
  teacher_id TEXT;
BEGIN
  SELECT "id" INTO teacher_id
  FROM "public"."User"
  WHERE "role" = 'TEACHER'
  ORDER BY "createdAt" ASC
  LIMIT 1;

  IF teacher_id IS NOT NULL THEN
    INSERT INTO "public"."LearningPath" ("id", "teacherId", "title", "description", "category", "level")
    VALUES ('path_html_css_basics', teacher_id, 'HTML & CSS Dasar', 'Latihan singkat untuk memahami struktur HTML dan layout CSS.', 'Frontend', 'Pemula')
    ON CONFLICT ("id") DO NOTHING;

    INSERT INTO "public"."Material" ("id", "pathId", "title", "description", "fileName", "fileUrl")
    VALUES ('material_html_css_quick_check', 'path_html_css_basics', 'Quick check HTML & CSS', 'Ringkasan singkat HTML dan CSS sebelum mengerjakan latihan.', 'html-css-quick-check.html', '/uploads/html-css-quick-check.html')
    ON CONFLICT ("id") DO NOTHING;

    INSERT INTO "public"."Question" ("id", "materialId", "prompt", "options", "answer")
    VALUES ('question_html_css_padding', 'material_html_css_quick_check', 'Properti CSS apa yang digunakan untuk mengatur jarak di dalam sebuah elemen?', '["margin", "padding", "gap", "spacing"]'::jsonb, 'padding')
    ON CONFLICT ("id") DO NOTHING;
  END IF;
END $$;
