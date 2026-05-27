<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.43.0/dist/umd/supabase.js"></script>
<script src="config.js"></script>
<script src="login.js"></script> ```

### Paso 2: Corrige tu `config.js` para evitar conflictos
Para evitar que el navegador choque con los nombres, inicializa el cliente usando el prefijo global correcto (`supabase.createClient` viene dentro del objeto global `window.supabase` cuando se usa el CDN). 

Modifica tu `config.js` para que quede exactamente así:

```javascript
// config.js
const SUPABASE_URL = "https://tu-proyecto.supabase.co"; 
const SUPABASE_ANON_KEY = "tu-clave-anon-aqui";

// Forzamos el uso del objeto global del CDN para evitar el error de pantalla en blanco
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
