AG WORK TRACKER v2 — SUPABASE CONNECTED STARTER

Supabase project URL configured: https://bkvsvpuccqmlehmiqhcf.supabase.co
Client uses the publishable key supplied by the owner. It is not a secret key.
Never add a Supabase Secret key/service_role key to browser code.

Features:
- Email/password sign-in with existing Supabase Auth user.
- Cloud insert/select for public.work_entries under the user's RLS policies.
- Local IndexedDB copy and PWA offline shell.
- History, summary, weekly/monthly totals, CSV export.

IMPORTANT LIMITATIONS:
- This version saves new records to Supabase and locally when online.
- It syncs locally pending records after sign-in, but local-only offline creation is not fully implemented in this starter.
- Before public deployment, verify Supabase Auth email confirmation, password recovery, RLS, HTTPS hosting, and test on a separate account.
- Host the files on HTTPS. On iPhone Safari use Share > Add to Home Screen.
- The user must sign in using their existing Supabase email and password. Do not send the password in chat.
