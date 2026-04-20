-- ============================================================
-- Migration 001: Extensions
-- ============================================================

create extension if not exists "pg_trgm";       -- 텍스트 유사 검색용
create extension if not exists "vector";         -- pgvector (CCB 벡터검색용)
-- gen_random_uuid()는 PostgreSQL 13+ 내장, uuid-ossp 불필요
