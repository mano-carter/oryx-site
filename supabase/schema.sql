create table profiles (
  id uuid primary key references auth.users on delete cascade,
  plan text not null default 'free',
  stripe_customer text,
  period_start date not null default date_trunc('month', now())::date,
  used int not null default 0
);
alter table profiles enable row level security;
create policy "own profile read" on profiles for select using (auth.uid() = id);
create function handle_new_user() returns trigger language plpgsql security definer as $$
begin insert into profiles(id) values (new.id); return new; end $$;
create trigger on_signup after insert on auth.users for each row execute function handle_new_user();
