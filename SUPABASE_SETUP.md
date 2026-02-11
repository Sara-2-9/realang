# 🔐 Supabase Auth Setup

## ✅ Completato Automaticamente
- [x] Installate dipendenze (`@supabase/supabase-js`, etc.)
- [x] Creato `lib/supabase.ts` — client configurato
- [x] Aggiornato `context/AuthContext.tsx` — usa Supabase auth
- [x] Aggiunte credenziali a `.env.local`
- [x] Creato schema SQL in `supabase/schema.sql`
- [x] Rimosso "Demo hint" da login

## 🎯 Azione Richiesta: Configura Database

Devi eseguire lo **schema SQL** nel tuo progetto Supabase:

1. Vai su https://supabase.com/dashboard
2. Seleziona il tuo progetto **reaLang**
3. Nel menu a sinistra, clicca su **"SQL Editor"**
4. Clicca **"New query"**
5. Copia e incolla il contenuto di `supabase/schema.sql`
6. Clicca **"Run"** ▶️

## 🚀 Test

Dopo aver eseguito lo schema:

```bash
bun start
```

Poi testa:
1. **Registrazione** — Crea un nuovo account
2. **Login** — Entra con l'account creato
3. **Logout** — Dovresti tornare alla schermata di login

## 🔧 Troubleshooting

### "Invalid login credentials"
→ Verifica che lo schema SQL sia stato eseguito correttamente

### "Error fetching profile"
→ Normale al primo login, il profilo viene creato durante la registrazione

### "Missing Supabase credentials"
→ Verifica che `.env.local` contenga le variabili

## 📁 Files Modificati/Creati

```
lib/supabase.ts                    ← NUOVO (client Supabase)
supabase/schema.sql                ← NUOVO (schema database)
context/AuthContext.tsx            ← MODIFICATO (Supabase auth)
.env.local                         ← MODIFICATO (credenziali)
app/login.tsx                      ← MODIFICATO (rimosso demo)
```

---

🦉 **Prossimo step:** Esegui lo schema SQL su Supabase, poi testiamo!
