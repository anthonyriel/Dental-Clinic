-- Existing signup function and trigger supplied by the user.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (
    id,username,full_name,role,phone,birthdate,gender,region,province,municipality,
    barangay,house_number,street_name,subdivision_purok,zipcode,country
  ) values (
    new.id,new.raw_user_meta_data->>'username',new.raw_user_meta_data->>'full_name',
    coalesce(new.raw_user_meta_data->>'role','client'),new.raw_user_meta_data->>'phone',
    nullif(new.raw_user_meta_data->>'birthdate','')::date,new.raw_user_meta_data->>'gender',
    new.raw_user_meta_data->>'region',new.raw_user_meta_data->>'province',
    new.raw_user_meta_data->>'municipality',new.raw_user_meta_data->>'barangay',
    new.raw_user_meta_data->>'house_number',new.raw_user_meta_data->>'street_name',
    new.raw_user_meta_data->>'subdivision_purok',new.raw_user_meta_data->>'zipcode','Philippines'
  );
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();
