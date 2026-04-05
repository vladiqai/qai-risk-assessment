create extension if not exists pgcrypto;

create table if not exists public.assessment_submissions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  company_name text not null,
  primary_contact text not null,
  contact_title text,
  contact_email text not null,
  contact_phone text,
  country_region text,
  contributing_functions text[] not null default '{}',
  contributing_functions_other text,

  primary_workflow text not null,
  workflow_other text,

  total_score integer not null default 0,
  fit_band text not null,
  recommendation text,

  best_workflow_for_poc text,
  reason_to_proceed text,
  reason_not_to_proceed text,
  biggest_unanswered_question text,

  answers jsonb not null default '{}'::jsonb,
  notes jsonb not null default '{}'::jsonb,
  poc_gates jsonb not null default '{}'::jsonb,

  source_url text,
  user_agent text,
  partner_token text
);

create index if not exists assessment_submissions_created_at_idx
  on public.assessment_submissions (created_at desc);

create index if not exists assessment_submissions_company_name_idx
  on public.assessment_submissions (company_name);

create index if not exists assessment_submissions_contact_email_idx
  on public.assessment_submissions (contact_email);
