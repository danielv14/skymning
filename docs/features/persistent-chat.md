# Feature: Spara Pågående Chatt

## Bakgrund

Chatten i Skymning lever idag endast i React state. Om användaren laddar om sidan eller byter enhet försvinner konversationen. Denna feature löser det genom att spara pågående chatt i databasen.

## Krav

- Chatten ska synkas mellan enheter (ingen localStorage)
- Endast dagens chatt sparas - gamla chattar rensas automatiskt vid ny dag
- När reflektionen sparas raderas chatten från databasen
- Användaren kan starta om en pågående chatt via en bekräftelsedialog
- Knappen "Prata med AI" uppdateras till "Fortsätt chatta" när det finns en pågående chatt

## Tekniska Upptäckter

### TanStack AI `useChat` Hook

- **Stödjer `initialMessages`** - vi kan ladda befintliga meddelanden från databasen
- **Har `setMessages`** - för att programmatiskt uppdatera meddelandelistan
- **Har `clear()`** - för att rensa alla meddelanden vid "starta om"

### Base UI AlertDialog

- Projektet använder `@base-ui-components/react`, inte Radix
- Base UI har `AlertDialog` med samma struktur som befintliga `Modal`-komponenten
- Kan återanvända samma styling (slate-800, border-slate-700, etc.)

---

## Implementation

### Fas 1: Databasschema

**Uppdatera `src/server/db/schema.ts`:**

```typescript
export const chatMessages = sqliteTable('chat_messages', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  date: text('date').notNull(), // YYYY-MM-DD
  role: text('role').notNull(), // 'user' | 'assistant'
  content: text('content').notNull(),
  orderIndex: integer('order_index').notNull(),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
})

export type ChatMessage = typeof chatMessages.$inferSelect
export type NewChatMessage = typeof chatMessages.$inferInsert
```

**Generera migration:**

```bash
bun db:migrate:generate
```

---

### Fas 2: Server Functions

**Ny fil: `src/server/functions/chat.ts`**

| Funktion | Metod | Input | Output | Beskrivning |
|----------|-------|-------|--------|-------------|
| `getTodayChat` | GET | - | `ChatMessage[]` | Hämtar dagens meddelanden + rensar gamla |
| `saveChatMessage` | POST | `{ role, content, orderIndex }` | `ChatMessage` | Sparar ett nytt meddelande |
| `clearTodayChat` | POST | - | `void` | Raderar alla dagens meddelanden |
| `hasOngoingChat` | GET | - | `boolean` | Kollar om det finns pågående chatt |

**Cleanup-logik i `getTodayChat`:**

```typescript
// 1. Radera alla meddelanden där date < idag
await db.delete(chatMessages).where(lt(chatMessages.date, today))

// 2. Returnera dagens meddelanden
return await db.query.chatMessages.findMany({
  where: eq(chatMessages.date, today),
  orderBy: [asc(chatMessages.orderIndex)]
})
```

**Uppdatera `src/server/functions/entries.ts`:**

```typescript
// I createEntry - radera chatten efter att entry skapats
await db.delete(chatMessages).where(eq(chatMessages.date, today))
```

---

### Fas 3: AlertDialog Komponent

**Ny fil: `src/components/ui/AlertDialog.tsx`**

Använder Base UI's `AlertDialog` med samma styling som befintliga `Modal`:

```typescript
import { AlertDialog as BaseAlertDialog } from '@base-ui-components/react/alert-dialog'

type AlertDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  cancelText?: string  // Default: "Avbryt"
  confirmText: string
  onConfirm: () => void | Promise<void>
  variant?: 'danger' | 'default'  // danger = röd confirm-knapp
}
```

Styling matchar befintliga modaler:

- `bg-slate-800 border border-slate-700`
- `rounded-2xl`
- Samma backdrop-blur och animationer

---

### Fas 4: Uppdatera Reflect Page

**Fil: `src/routes/_authed/reflect.tsx`**

#### Loader

```typescript
loader: async () => {
  const [todayEntry, existingChat] = await Promise.all([
    getTodayEntry(),
    getTodayChat(),
  ])
  return { todayEntry, existingChat }
}
```

#### Konvertera DB-meddelanden till UIMessage format

```typescript
const { existingChat } = Route.useLoaderData()

// Konvertera till useChat format
const initialMessages: UIMessage[] = existingChat.map(m => ({
  id: `db-${m.id}`,
  role: m.role as 'user' | 'assistant',
  parts: [{ type: 'text', content: m.content }]
}))

const { messages, sendMessage, isLoading, setMessages, clear } = useChat({
  connection: fetchServerSentEvents('/api/chat'),
  initialMessages: initialMessages.length > 0 ? initialMessages : undefined,
})
```

#### Spara meddelanden till databasen

```typescript
// Håll koll på vilka meddelanden som redan är sparade
const savedMessageIds = useRef<Set<string>>(new Set(
  existingChat.map(m => `db-${m.id}`)
))

// Spara nya meddelanden när de dyker upp
useEffect(() => {
  const saveNewMessages = async () => {
    for (let i = 0; i < messages.length; i++) {
      const message = messages[i]
      
      // Skippa om redan sparad eller om AI fortfarande streamar
      if (savedMessageIds.current.has(message.id)) continue
      if (message.role === 'assistant' && isLoading && i === messages.length - 1) continue
      
      const content = getMessageText(message.parts)
      if (!content) continue
      
      await saveChatMessage({
        data: {
          role: message.role,
          content,
          orderIndex: i,
        }
      })
      savedMessageIds.current.add(message.id)
    }
  }
  
  saveNewMessages()
}, [messages, isLoading])
```

#### Starta om chatt

```typescript
const [restartDialogOpen, setRestartDialogOpen] = useState(false)

const handleRestartChat = async () => {
  await clearTodayChat()
  clear() // Rensa useChat state
  savedMessageIds.current.clear()
  setRestartDialogOpen(false)
}
```

#### UI: Lägg till restart-knapp i header

```tsx
<PageHeader
  title="Dagens reflektion"
  subtitle="Ta en stund att reflektera"
  rightContent={
    messages.length > 0 && (
      <Button 
        variant="ghost" 
        size="sm"
        onClick={() => setRestartDialogOpen(true)}
      >
        <RefreshCw className="w-4 h-4 mr-1.5" />
        Börja om
      </Button>
    )
  }
/>

<AlertDialog
  open={restartDialogOpen}
  onOpenChange={setRestartDialogOpen}
  title="Börja om chatten?"
  description="Din nuvarande konversation kommer att raderas. Du kan sedan starta en ny."
  cancelText="Avbryt"
  confirmText="Ja, börja om"
  variant="danger"
  onConfirm={handleRestartChat}
/>
```

---

### Fas 5: Uppdatera Hemsidan

**Fil: `src/routes/_authed/index.tsx`**

#### Loader

```typescript
loader: async () => {
  const [hasEntries, todayEntry, hasOngoingChat, ...rest] = await Promise.all([
    hasAnyEntries(),
    getTodayEntry(),
    hasOngoingChat(), // NY
    // ...resten
  ])
  return { hasEntries, todayEntry, hasOngoingChat, ...rest }
}
```

#### Dynamisk knaptext

```tsx
const { todayEntry, hasOngoingChat } = Route.useLoaderData()

// I komponenten
{!todayEntry && (
  <div className="flex flex-col sm:flex-row gap-3">
    <Link to="/reflect" className="flex-1">
      <Button className="w-full">
        {hasOngoingChat ? 'Fortsätt chatta' : 'Prata med AI'}
      </Button>
    </Link>
    <Link to="/quick" className="flex-1">
      <Button variant="secondary" className="w-full">Skriv själv</Button>
    </Link>
  </div>
)}
```

---

### Fas 6: Uppdatera PageHeader (valfritt)

Om `PageHeader` inte stödjer `rightContent` prop, lägg till det:

```typescript
type PageHeaderProps = {
  title: string
  subtitle?: string
  rightContent?: React.ReactNode  // NY
}
```

---

## Filöversikt

| Fil | Ändring |
|-----|---------|
| `src/server/db/schema.ts` | Lägg till `chatMessages` tabell |
| `drizzle/XXXX_*.sql` | Ny migration |
| `src/server/functions/chat.ts` | **NY FIL** - CRUD för chat |
| `src/server/functions/entries.ts` | Radera chatt i `createEntry` |
| `src/components/ui/AlertDialog.tsx` | **NY FIL** - Bekräftelse-dialog |
| `src/components/ui/PageHeader.tsx` | Lägg till `rightContent` prop |
| `src/routes/_authed/reflect.tsx` | Loader + synka meddelanden + restart |
| `src/routes/_authed/index.tsx` | Loader + dynamisk knaptext |

---

## Ordning för Implementation

1. **Schema + Migration** - Grundläggande databasstruktur
2. **Server Functions** - `chat.ts` + uppdatera `entries.ts`
3. **AlertDialog komponent** - UI för bekräftelse
4. **Reflect page** - Ladda/spara/restart chatt
5. **Homepage** - Dynamisk knaptext
6. **Testa** - Manuell testning av flödet

---

## Testscenarier

1. **Ny chatt** - Starta chatt, refresha sidan, chatten finns kvar
2. **Spara reflektion** - Chatten raderas från databasen
3. **Ny dag** - Gammal chatt rensas automatiskt
4. **Starta om** - Bekräftelse visas, chatten rensas
5. **Synk mellan enheter** - Öppna på mobil, se samma chatt
6. **Knaptext** - Visar "Fortsätt chatta" när det finns pågående chatt
