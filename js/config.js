// config.js
// Puedes encontrar estos valores en tu panel de Supabase: Settings > API
const SUPABASE_URL = "https://qynkgbgxavjgmvnskbsd.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5bmtnYmd4YXZqZ212bnNrYnNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4NDQ5NzMsImV4cCI6MjA5NTQyMDk3M30.2lbtOLD-pgKYYrJiNsaOIsw3oM3jaZUgccDA-68Y6JI";

// Inicializar el cliente global de Supabase
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
