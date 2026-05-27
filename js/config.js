<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.43.0/dist/umd/supabase.js"></script>
<script src="config.js"></script>
<script src="login.js"></script> ```

### Paso 2: Corrige tu `config.js` para evitar conflictos
Para evitar que el navegador choque con los nombres, inicializa el cliente usando el prefijo global correcto (`supabase.createClient` viene dentro del objeto global `window.supabase` cuando se usa el CDN). 

Modifica tu `config.js` para que quede exactamente así:

```javascript
// config.js
const SUPABASE_URL = "https://qynkgbgxavjgmvnskbsd.supabase.co"; 
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5bmtnYmd4YXZqZ212bnNrYnNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4NDQ5NzMsImV4cCI6MjA5NTQyMDk3M30.2lbtOLD-pgKYYrJiNsaOIsw3oM3jaZUgccDA-68Y6JI";

// Forzamos el uso del objeto global del CDN para evitar el error de pantalla en blanco
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
