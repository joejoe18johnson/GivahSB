-- Add proof of need document URLs to campaigns under review (array of public URLs)
alter table public.campaigns_under_review
  add column if not exists proof_document_urls jsonb not null default '[]'::jsonb;

comment on column public.campaigns_under_review.proof_document_urls is 'Array of public URLs for proof-of-need documents (PDFs, images) uploaded by creator.';
