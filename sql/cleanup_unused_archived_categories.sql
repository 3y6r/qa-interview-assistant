-- QA Interview Assistant
-- Удаляет только архивированные категории, на которые не ссылается ни один вопрос.

BEGIN;

CREATE OR REPLACE FUNCTION public.cleanup_unused_archived_categories()
RETURNS TABLE (
    deleted_category_id integer,
    deleted_category_name varchar
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    DELETE FROM public.categories AS c
    WHERE c.is_archived IS TRUE
      AND NOT EXISTS (
          SELECT 1
          FROM public.questions AS q
          WHERE q.category_id = c.id
      )
    RETURNING c.id, c.name;
END;
$$;

COMMENT ON FUNCTION public.cleanup_unused_archived_categories()
IS 'Удаляет архивированные категории без связанных вопросов. Категории хотя бы с одним вопросом сохраняются.';

COMMIT;
