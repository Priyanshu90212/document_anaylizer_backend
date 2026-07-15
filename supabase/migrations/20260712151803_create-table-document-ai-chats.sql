CREATE TYPE chat_message_sender AS ENUM (
    'USER',
    'AI_ASSITANT'
);
create table users_to_document_ai_chat (
    id uuid primary key default gen_random_uuid(),
    document_id uuid not null references documents_meta(id),
    document_hash_id text not null,
    messages text,
    message_sender chat_message_sender not null,
    created_at TIMESTAMPTZ DEFAULT now()
)