create table public.documents_meta (
    id uuid primary key default gen_random_uuid(),
    document_file_hash text not null,
    original_name text not null,
    mime_type text not null,
    file_size bigint not null,
    blob_storage_path text not null,
    created_at timestamptz default now()
)