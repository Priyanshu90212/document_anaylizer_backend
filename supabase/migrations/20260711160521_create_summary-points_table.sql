create table summary_points (
    id uuid primary key default gen_random_uuid(),
    document_id uuid not null references documents_meta(id),
    document_hash_id text not null,
    summary_points JSONB,
    created_at timestamptz default now()
)