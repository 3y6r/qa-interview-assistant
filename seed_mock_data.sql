BEGIN;

-- Категории из mock-server
INSERT INTO categories (name, is_archived)
VALUES
  ('Java', false),
  ('SQL', false),
  ('Алгоритмы', false),
  ('Spring', false),
  ('Git', false)
ON CONFLICT (name) DO NOTHING;

-- Теги из mock-server
INSERT INTO tags (name, color, is_archived)
VALUES
  ('Core', '#1890ff', false),
  ('OOP', '#52c41a', false),
  ('Collections', '#faad14', false),
  ('Multithreading', '#f5222d', false)
ON CONFLICT (name) DO UPDATE
SET color = EXCLUDED.color;

-- Вопросы из mock-server
-- Продукты REDnote / REDpay не переносим, потому что products удалены из актуальной модели.
WITH src(text, expected_answer, category_name, level_name) AS (
  VALUES
    (
      'Что такое SOLID?',
      'Принципы ООП: Single responsibility, Open-closed, Liskov substitution, Interface segregation, Dependency inversion.',
      'Java',
      'Middle'
    ),
    (
      'Расскажите про HashMap',
      'Структура данных на основе хеш-таблицы. Хранит пары ключ-значение. Разрешает null ключи.',
      'Java',
      'Junior'
    ),
    (
      'Что такое JOIN в SQL?',
      'Операция соединения таблиц по ключу. Бывает INNER, LEFT, RIGHT, FULL JOIN.',
      'SQL',
      'Junior'
    ),
    (
      'Расскажите про ConcurrentHashMap',
      'Потокобезопасная версия HashMap. Использует сегментирование для конкурентного доступа.',
      'Java',
      'Senior'
    ),
    (
      'Что такое сложность O(log n)?',
      'Логарифмическая сложность. Пример: бинарный поиск в отсортированном массиве.',
      'Алгоритмы',
      'Middle'
    ),
    (
      'Что такое инверсия зависимостей в Spring?',
      'Dependency Injection — внедрение зависимостей через конструктор, сеттер или поле.',
      'Spring',
      'Middle'
    ),
    (
      'Чем отличается git merge от git rebase?',
      'Merge создаёт merge-коммит, rebase переписывает историю, накладывая коммиты поверх целевой ветки.',
      'Git',
      'Middle'
    )
)
INSERT INTO questions (text, expected_answer, category_id, level_id, is_archived)
SELECT
  src.text,
  src.expected_answer,
  c.id,
  l.id,
  false
FROM src
JOIN categories c ON c.name = src.category_name
JOIN levels l ON l.name = src.level_name
WHERE NOT EXISTS (
  SELECT 1
  FROM questions q
  WHERE q.text = src.text
);

-- Связи вопрос-тег
WITH rel(question_text, tag_name) AS (
  VALUES
    ('Что такое SOLID?', 'Core'),
    ('Что такое SOLID?', 'OOP'),
    ('Расскажите про HashMap', 'Collections'),
    ('Расскажите про ConcurrentHashMap', 'Multithreading'),
    ('Что такое инверсия зависимостей в Spring?', 'Core')
)
INSERT INTO question_tags (question_id, tag_id)
SELECT q.id, t.id
FROM rel
JOIN questions q ON q.text = rel.question_text
JOIN tags t ON t.name = rel.tag_name
ON CONFLICT DO NOTHING;

COMMIT;