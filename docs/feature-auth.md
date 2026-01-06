# Feature: Autentisering med Secret Key

## Sammanfattning
Implementera enkel autentisering för single-user deployment. Användaren loggar in med en hemlig nyckel som valideras mot en environment variable. Sessionen sparas som en JWT i en httpOnly cookie och valideras via middleware.

## Bakgrund
Skymning är en personlig journaling-app som kommer innehålla känslig data om användarens dagliga reflektioner och mående. Innan appen deployeras till Cloudflare Pages behöver vi skydda all data bakom autentisering.

Eftersom appen bara har en användare (mig) behövs ingen komplex auth-lösning med databas, OAuth eller liknande. En enkel secret key som sätts som environment variable räcker.

## Krav

### Funktionella krav
- Login-sida där användaren anger secret key
- Validering mot `AUTH_SECRET` environment variable
- JWT-token med expiry (förslagsvis 30 dagar)
- Token sparas i httpOnly secure cookie
- Middleware som skyddar alla routes utom /login
- Redirect till /login om ej autentiserad
- Logout-funktion (rensar cookie)

### Icke-funktionella krav
- Cookie ska vara `httpOnly` (skydd mot XSS)
- Cookie ska vara `secure` (endast HTTPS)
- Cookie ska ha `sameSite=strict` (skydd mot CSRF)
- Fungera både lokalt (dev) och på Cloudflare Pages (prod)

## Teknisk design

### Nya filer
```
src/
  routes/
    login.tsx              # Login-sida
  server/
    auth/
      index.ts             # Auth-logik (signera/verifiera JWT, cookie-hantering)
      middleware.ts        # TanStack Start middleware
```

### Environment variables
```
AUTH_SECRET=<hemlig-nyckel-för-login>
JWT_SECRET=<separat-nyckel-för-jwt-signering>
```

Lägg till i `.env.example`:
```
AUTH_SECRET=your-secret-login-key
JWT_SECRET=your-jwt-signing-secret
```

### Login-flöde
```
1. Användaren besöker valfri skyddad route
2. Middleware upptäcker att ingen giltig session finns
3. Redirect till /login
4. Användaren anger secret key i formulär
5. POST till server function validateLogin
6. Server jämför mot AUTH_SECRET env var
7. Om korrekt: skapa JWT med expiry, sätt cookie, redirect till /
8. Om fel: visa felmeddelande
```

### JWT-struktur
```typescript
type JWTPayload = {
  iat: number    // issued at (unix timestamp)
  exp: number    // expiry (unix timestamp, iat + 30 dagar)
}
```

Vi behöver ingen extra data i JWT:en eftersom det bara finns en användare. Tokenens existens och giltighet är tillräcklig för att bevisa autentisering.

### Middleware-implementation

```typescript
// src/server/auth/middleware.ts
import { createMiddleware } from '@tanstack/start'
import { verifyToken, getSessionCookie } from './index'

const PUBLIC_ROUTES = ['/login']

export const authMiddleware = createMiddleware().server(async ({ next, request }) => {
  const url = new URL(request.url)
  
  // Tillåt publika routes utan auth
  if (PUBLIC_ROUTES.includes(url.pathname)) {
    return next()
  }
  
  // Tillåt statiska assets
  if (url.pathname.startsWith('/_build') || url.pathname.startsWith('/assets')) {
    return next()
  }
  
  const token = getSessionCookie(request)
  
  if (!token) {
    return new Response(null, {
      status: 302,
      headers: { Location: '/login' }
    })
  }
  
  const payload = verifyToken(token)
  
  if (!payload) {
    // Token ogiltig eller expired - rensa cookie och redirect
    return new Response(null, {
      status: 302,
      headers: {
        Location: '/login',
        'Set-Cookie': 'session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT'
      }
    })
  }
  
  return next()
})
```

### Auth-hjälpfunktioner

```typescript
// src/server/auth/index.ts
import { SignJWT, jwtVerify } from 'jose'

const COOKIE_NAME = 'skymning_session'
const TOKEN_EXPIRY_DAYS = 30

export const createToken = async (): Promise<string> => {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET)
  
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${TOKEN_EXPIRY_DAYS}d`)
    .sign(secret)
  
  return token
}

export const verifyToken = async (token: string): Promise<boolean> => {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET)
    await jwtVerify(token, secret)
    return true
  } catch {
    return false
  }
}

export const getSessionCookie = (request: Request): string | null => {
  const cookies = request.headers.get('cookie') || ''
  const match = cookies.match(new RegExp(`${COOKIE_NAME}=([^;]+)`))
  return match ? match[1] : null
}

export const createSessionCookie = (token: string): string => {
  const maxAge = TOKEN_EXPIRY_DAYS * 24 * 60 * 60 // sekunder
  const secure = process.env.NODE_ENV === 'production' ? 'Secure; ' : ''
  
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; ${secure}SameSite=Strict; Max-Age=${maxAge}`
}

export const createLogoutCookie = (): string => {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Strict; Expires=Thu, 01 Jan 1970 00:00:00 GMT`
}
```

### Server functions

```typescript
// src/server/functions/auth.ts
import { createServerFn } from '@tanstack/start'
import { z } from 'zod'
import { createToken, createSessionCookie, createLogoutCookie } from '../auth'

const loginSchema = z.object({
  secret: z.string().min(1)
})

export const validateLogin = createServerFn({ method: 'POST' })
  .validator((data: unknown) => loginSchema.parse(data))
  .handler(async ({ data }): Promise<{ success: boolean; error?: string; cookie?: string }> => {
    const authSecret = process.env.AUTH_SECRET
    
    if (!authSecret) {
      console.error('AUTH_SECRET is not configured')
      return { success: false, error: 'Serverfel: Auth ej konfigurerat' }
    }
    
    if (data.secret !== authSecret) {
      return { success: false, error: 'Fel lösenord' }
    }
    
    const token = await createToken()
    const cookie = createSessionCookie(token)
    
    return { success: true, cookie }
  })

export const logout = createServerFn({ method: 'POST' })
  .handler(async (): Promise<{ cookie: string }> => {
    return { cookie: createLogoutCookie() }
  })
```

### Login-sida

```typescript
// src/routes/login.tsx
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, FormEvent } from 'react'
import { validateLogin } from '../server/functions/auth'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'

export const Route = createFileRoute('/login')({
  component: LoginPage
})

const LoginPage = () => {
  const [secret, setSecret] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  
  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setIsLoading(true)
    
    try {
      const result = await validateLogin({ data: { secret } })
      
      if (result.success && result.cookie) {
        // Sätt cookie via document.cookie fungerar inte för httpOnly
        // Istället behöver vi hantera detta via response headers
        // Detta är en förenkling - se implementation notes nedan
        document.cookie = result.cookie
        navigate({ to: '/' })
      } else {
        setError(result.error || 'Något gick fel')
      }
    } catch (err) {
      setError('Kunde inte ansluta till servern')
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <Card className="w-full max-w-md">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-100 mb-2">Skymning</h1>
            <p className="text-slate-400">Ange lösenord för att fortsätta</p>
          </div>
          
          <div>
            <input
              type="password"
              value={secret}
              onChange={(event) => setSecret(event.target.value)}
              placeholder="Lösenord"
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              autoFocus
            />
          </div>
          
          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}
          
          <Button 
            type="submit" 
            disabled={isLoading || !secret}
            className="w-full"
          >
            {isLoading ? 'Loggar in...' : 'Logga in'}
          </Button>
        </form>
      </Card>
    </div>
  )
}
```

## Implementation notes

### httpOnly cookies från server functions

En viktig detalj: `httpOnly` cookies kan inte sättas via JavaScript (`document.cookie`). De måste sättas via `Set-Cookie` response header från servern.

I TanStack Start finns det olika sätt att hantera detta:

**Alternativ 1: API route istället för server function**
Skapa en API route (`/api/login`) som returnerar response med `Set-Cookie` header.

**Alternativ 2: Använd setCookie i server function**
TanStack Start kan ha inbyggt stöd för att sätta cookies i server functions - undersök detta.

**Alternativ 3: Form action**
Använd en form action som gör POST direkt till en API endpoint.

Rekommendation: Börja med Alternativ 1 (API route) då det ger full kontroll över response headers.

### API route för login

```typescript
// src/routes/api/auth/login.ts
import { json } from '@tanstack/start'
import { createAPIFileRoute } from '@tanstack/start/api'
import { createToken, createSessionCookie } from '../../../server/auth'

export const Route = createAPIFileRoute('/api/auth/login')({
  POST: async ({ request }) => {
    const body = await request.json()
    const { secret } = body
    
    if (secret !== process.env.AUTH_SECRET) {
      return json({ success: false, error: 'Fel lösenord' }, { status: 401 })
    }
    
    const token = await createToken()
    const cookie = createSessionCookie(token)
    
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': cookie
      }
    })
  }
})
```

## Dependencies

Nya npm-paket:
```bash
bun add jose
```

`jose` är ett lättviktigt JWT-bibliotek som fungerar i alla JavaScript-runtimes (Node, Bun, Cloudflare Workers, etc.).

## Acceptanskriterier

- [ ] `jose` installerat som dependency
- [ ] `/login` route skapad med formulär
- [ ] API route `/api/auth/login` skapad
- [ ] API route `/api/auth/logout` skapad
- [ ] Auth-hjälpfunktioner i `src/server/auth/index.ts`
- [ ] Middleware i `src/server/auth/middleware.ts`
- [ ] Middleware registrerat i app-konfigurationen
- [ ] `AUTH_SECRET` och `JWT_SECRET` dokumenterade i `.env.example`
- [ ] JWT skapas med 30 dagars expiry
- [ ] Cookie sätts med httpOnly, secure (prod), sameSite=strict
- [ ] Alla routes utom /login skyddas
- [ ] Redirect till /login om ej autentiserad
- [ ] Redirect till / efter lyckad inloggning
- [ ] Felmeddelande vid fel lösenord
- [ ] Logout rensar cookie och redirectar till /login
- [ ] Fungerar lokalt i dev-miljö (utan secure flag)

## Testning

### Manuell testning
1. Starta appen utan att vara inloggad → ska redirectas till /login
2. Ange fel lösenord → ska visa "Fel lösenord"
3. Ange korrekt lösenord → ska redirectas till /
4. Inspektera cookie i DevTools → ska vara httpOnly
5. Refresha sidan → ska fortfarande vara inloggad
6. Öppna appen i incognito → ska redirectas till /login
7. Klicka logout → ska redirectas till /login, cookie borta

### Edge cases
- Tom lösenords-input → knappen ska vara disabled
- Serverfel (AUTH_SECRET saknas) → ska visa felmeddelande
- Expired token → ska redirectas till /login, cookie rensas

## Säkerhetsöverväganden

### Vad denna lösning skyddar mot
- Obehörig åtkomst till appen
- XSS-attacker kan inte stjäla session (httpOnly)
- CSRF-attacker (sameSite=strict)
- Man-in-the-middle (HTTPS via Cloudflare)

### Vad denna lösning INTE skyddar mot
- Brute force (ingen rate limiting) - acceptabelt för personlig app
- Session hijacking om någon får fysisk åtkomst till din dator
- Om AUTH_SECRET läcker har någon permanent åtkomst tills du byter den

### Förbättringar för framtiden (om behov uppstår)
- Rate limiting på login-endpoint
- Möjlighet att invalidera alla sessioner (byt JWT_SECRET)
- Kortare token-expiry + refresh tokens

### Extra lager: Cloudflare Access

När JWT-auth är på plats och deployad kan det vara värt att utforska **Cloudflare Access** som ett extra skyddslager. Detta ger "hängslen och livrem"-säkerhet:

```
Internet → [Cloudflare Access] → [JWT Auth] → App
```

Fördelar:
- Gratis för upp till 50 användare
- Hanteras helt av Cloudflare (ingen kod att underhålla)
- Snyggare än Basic Auth (stylad login-sida)
- Kan kräva email-verifiering eller kopplas till SSO
- Skyddar även om det finns en bugg i vår JWT-implementation

Detta är inte kritiskt för MVP, men värt att sätta upp efter att grundläggande auth fungerar.
