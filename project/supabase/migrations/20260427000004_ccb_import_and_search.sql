-- 20260427000004_ccb_import_and_search.sql
-- P1-A: CCB document bulk import RPC + lexical/hybrid search helpers.
-- Embedding-based search relies on idx_ccb_embedding (already present).

-- 1) Bulk upsert RPC (idempotent on ccb_no)
create or replace function upsert_ccb_documents_batch(p_rows jsonb)
returns jsonb
language plpgsql
as $$
declare
  v_inserted int := 0;
  v_updated int := 0;
  v_row jsonb;
  v_existing_id uuid;
begin
  for v_row in select * from jsonb_array_elements(p_rows)
  loop
    select id into v_existing_id
    from ccb_documents
    where ccb_no = v_row->>'ccb_no';

    insert into ccb_documents (
      ccb_no, title, content, summary,
      target_model, target_module, target_part_group, country_codes,
      solution_type, action_plan, verified, verified_at,
      old_part_no, old_part_price, new_part_no, new_part_price,
      source
    ) values (
      v_row->>'ccb_no',
      v_row->>'title',
      v_row->>'content',
      v_row->>'summary',
      coalesce(
        (select array_agg(value::text) from jsonb_array_elements_text(v_row->'target_model')),
        '{}'::text[]
      ),
      coalesce(
        (select array_agg(value::text) from jsonb_array_elements_text(v_row->'target_module')),
        '{}'::text[]
      ),
      coalesce(
        (select array_agg(value::text) from jsonb_array_elements_text(v_row->'target_part_group')),
        '{}'::text[]
      ),
      coalesce(
        (select array_agg(value::text) from jsonb_array_elements_text(v_row->'country_codes')),
        '{}'::text[]
      ),
      v_row->>'solution_type',
      v_row->>'action_plan',
      coalesce((v_row->>'verified')::boolean, false),
      (v_row->>'verified_at')::date,
      v_row->>'old_part_no',
      (v_row->>'old_part_price')::numeric,
      v_row->>'new_part_no',
      (v_row->>'new_part_price')::numeric,
      coalesce(v_row->>'source', 'jsonl_import')
    )
    on conflict (ccb_no) do update set
      title = excluded.title,
      content = excluded.content,
      summary = excluded.summary,
      target_model = excluded.target_model,
      target_module = excluded.target_module,
      target_part_group = excluded.target_part_group,
      country_codes = excluded.country_codes,
      solution_type = excluded.solution_type,
      action_plan = excluded.action_plan,
      verified = excluded.verified,
      verified_at = excluded.verified_at,
      old_part_no = excluded.old_part_no,
      old_part_price = excluded.old_part_price,
      new_part_no = excluded.new_part_no,
      new_part_price = excluded.new_part_price,
      source = excluded.source,
      updated_at = now();

    if v_existing_id is null then
      v_inserted := v_inserted + 1;
    else
      v_updated := v_updated + 1;
    end if;
  end loop;

  return jsonb_build_object('inserted', v_inserted, 'updated', v_updated);
end;
$$;

comment on function upsert_ccb_documents_batch(jsonb) is
  'Bulk upsert CCB documents from JSONL. Embeddings stay null until embed_ccb_pending() is run.';

-- 2) Mark embeddings as needing recompute
create or replace function mark_ccb_embedding_dirty(p_ccb_id uuid)
returns void language sql as $$
  update ccb_documents set embedding = null where id = p_ccb_id;
$$;

-- 3) Lexical search (fallback when embedding is missing or for hybrid)
create or replace function search_ccb_by_text(
  p_query text,
  p_target_model text default null,
  p_target_module text default null,
  p_country_code text default null,
  p_top_k int default 10
) returns table (
  id uuid,
  ccb_no text,
  title text,
  summary text,
  solution_type text,
  verified boolean,
  similarity real
)
language sql stable as $$
  select
    c.id, c.ccb_no, c.title, c.summary, c.solution_type, c.verified,
    greatest(
      similarity(coalesce(c.title, ''), p_query),
      similarity(coalesce(c.summary, ''), p_query) * 0.8,
      similarity(coalesce(c.content, ''), p_query) * 0.5
    ) as similarity
  from ccb_documents c
  where
    (p_target_model is null or p_target_model = any(c.target_model))
    and (p_target_module is null or p_target_module = any(c.target_module))
    and (p_country_code is null or p_country_code = any(c.country_codes))
  order by similarity desc nulls last
  limit p_top_k;
$$;

comment on function search_ccb_by_text(text, text, text, text, int) is
  'Lexical similarity search over CCB documents using pg_trgm. Use this as fallback when embeddings are unavailable, or for hybrid search.';

-- 4) Vector search (when embedding is available)
create or replace function search_ccb_by_embedding(
  p_query_embedding vector(1024),
  p_target_model text default null,
  p_target_module text default null,
  p_country_code text default null,
  p_top_k int default 10
) returns table (
  id uuid,
  ccb_no text,
  title text,
  summary text,
  solution_type text,
  verified boolean,
  similarity real
)
language sql stable as $$
  select
    c.id, c.ccb_no, c.title, c.summary, c.solution_type, c.verified,
    1 - (c.embedding <=> p_query_embedding) as similarity
  from ccb_documents c
  where
    c.embedding is not null
    and (p_target_model is null or p_target_model = any(c.target_model))
    and (p_target_module is null or p_target_module = any(c.target_module))
    and (p_country_code is null or p_country_code = any(c.country_codes))
  order by c.embedding <=> p_query_embedding
  limit p_top_k;
$$;

comment on function search_ccb_by_embedding(vector, text, text, text, int) is
  'Cosine-similarity vector search over CCB documents. Requires embedding column to be populated.';
