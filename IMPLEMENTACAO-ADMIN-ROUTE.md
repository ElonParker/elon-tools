# 📋 IMPLEMENTAÇÃO — Rota /admin/ Exclusiva

**Data:** 2026-02-15  
**Objetivo:** Criar painel admin separado com validação de role  
**Status:** 📋 Planejado (Card Trello criado)

---

## 🎯 O PROBLEMA ATUAL

No Elon System (GitHub):

❌ Não existe rota `/admin/` separada  
❌ Não há validação de role (admin vs user)  
❌ Dashboard é genérico para todos  
❌ Login admin não mostra opções exclusivas  
❌ Sem proteção de dados sensíveis

**Resultado:** Usuários normais podem tentar acessar funcionalidades admin (inseguro!)

---

## ✅ A SOLUÇÃO

Criar uma estrutura segura com:

- Rota `/admin/` exclusiva  
- Middleware de autenticação  
- Validação de role no frontend + backend  
- Layout e componentes específicos de admin  
- Redirecionamento seguro

---

## 🏗️ ESTRUTURA DE ARQUIVOS

```
app/
├── (public)/
│   ├── page.tsx (home)
│   ├── login/
│   │   └── page.tsx
│   └── register/
│       └── page.tsx
│
├── (protected)/
│   └── dashboard/
│       └── page.tsx (user normal)
│
└── admin/
    ├── layout.tsx (middleware + validação)
    ├── page.tsx (dashboard admin)
    ├── agents/
    │   └── page.tsx (gerenciar agentes)
    ├── tasks/
    │   └── page.tsx (monitorar tarefas)
    ├── users/
    │   └── page.tsx (gerenciar usuários)
    ├── analytics/
    │   └── page.tsx (analytics detalhado)
    └── settings/
        └── page.tsx (config admin)

api/
├── auth/
│   ├── login.ts (retorna role)
│   ├── register.ts (cria com role='user')
│   └── me.ts (verifica autenticação)
└── admin/
    ├── check-role.ts (valida admin)
    ├── users.ts (CRUD users)
    └── agents.ts (gerenciar agentes)
```

---

## 🔐 FLUXO DE AUTENTICAÇÃO

### 1. Registro (cria user normal)

```
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "hashedPassword",
  "name": "User Name"
}

Retorna:
{
  "token": "jwt_token",
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "User Name",
    "role": "user"  ← Sempre 'user' no registro
  }
}
```

### 2. Login (retorna role)

```
POST /api/auth/login
{
  "email": "admin@example.com",
  "password": "password"
}

Retorna:
{
  "token": "jwt_token",
  "user": {
    "id": "admin_1",
    "email": "admin@example.com",
    "name": "Admin User",
    "role": "admin"  ← Verificado no banco
  }
}

localStorage.setItem('user', JSON.stringify(user))
localStorage.setItem('token', token)
```

### 3. Acesso a /admin/

```
Usuario tenta acessar /admin/

↓ app/admin/layout.tsx roda:

1. Verificar localStorage.user
2. Se não existe → redireciona /login
3. Se role != 'admin' → redireciona /dashboard
4. Se role == 'admin' → Renderiza painel admin

✓ Admin vê painel completo
✗ User vê /dashboard (protegido)
```

---

## 💻 CÓDIGO IMPLEMENTAÇÃO

### 1. app/admin/layout.tsx

```typescript
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userStr = localStorage.getItem('user')

    if (!token || !userStr) {
      router.push('/login')
      return
    }

    try {
      const user = JSON.parse(userStr)

      // ✓ Validação de role
      if (user.role !== 'admin') {
        console.warn('Acesso negado: não é admin')
        router.push('/dashboard')
        return
      }

      setIsAdmin(true)
      setLoading(false)
    } catch (error) {
      console.error('Erro ao parsear user:', error)
      router.push('/login')
    }
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-dark via-darker to-dark">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⚙️</div>
          <p className="text-gray-400">Carregando painel admin...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return null // Já redirecionado
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark via-darker to-dark">
      {/* Admin Navbar */}
      <nav className="bg-darker/80 border-b border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔧</span>
            <h1 className="text-2xl font-bold text-primary">Painel Admin</h1>
          </div>

          <div className="flex gap-6">
            <Link
              href="/admin"
              className="text-gray-400 hover:text-primary transition"
            >
              Dashboard
            </Link>
            <Link
              href="/admin/agents"
              className="text-gray-400 hover:text-primary transition"
            >
              Agentes
            </Link>
            <Link
              href="/admin/tasks"
              className="text-gray-400 hover:text-primary transition"
            >
              Tarefas
            </Link>
            <Link
              href="/admin/users"
              className="text-gray-400 hover:text-primary transition"
            >
              Usuários
            </Link>
            <Link
              href="/admin/settings"
              className="text-gray-400 hover:text-primary transition"
            >
              Configurações
            </Link>
          </div>

          <button
            onClick={() => {
              localStorage.removeItem('token')
              localStorage.removeItem('user')
              router.push('/login')
            }}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
          >
            Sair
          </button>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  )
}
```

### 2. app/admin/page.tsx

```typescript
'use client'

export default function AdminDashboard() {
  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/20 to-secondary/20 border border-primary/50 rounded-2xl p-8 mb-8">
        <h1 className="text-4xl font-bold text-primary mb-2">
          🤖 Painel de Controle Admin
        </h1>
        <p className="text-gray-400">
          Monitore e controle todos os 9 agentes em tempo real
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <div className="bg-darker/50 border border-gray-700 rounded-xl p-6">
          <p className="text-gray-400 text-sm mb-2">Agentes Ativos</p>
          <p className="text-4xl font-bold text-primary">9</p>
          <p className="text-xs text-gray-500 mt-2">Todos online</p>
        </div>

        <div className="bg-darker/50 border border-gray-700 rounded-xl p-6">
          <p className="text-gray-400 text-sm mb-2">Tarefas em Andamento</p>
          <p className="text-4xl font-bold text-primary">0</p>
          <p className="text-xs text-gray-500 mt-2">Aguardando início</p>
        </div>

        <div className="bg-darker/50 border border-gray-700 rounded-xl p-6">
          <p className="text-gray-400 text-sm mb-2">Usuários Registrados</p>
          <p className="text-4xl font-bold text-primary">1</p>
          <p className="text-xs text-gray-500 mt-2">Você (admin)</p>
        </div>

        <div className="bg-darker/50 border border-gray-700 rounded-xl p-6">
          <p className="text-gray-400 text-sm mb-2">Taxa de Sucesso</p>
          <p className="text-4xl font-bold text-primary">100%</p>
          <p className="text-xs text-gray-500 mt-2">Sem erros</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-darker/50 border border-gray-700 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">Agentes Online</h2>
          <div className="space-y-2">
            {[
              '💰 Financeiro',
              '📊 Mercado',
              '🔍 Concorrentes',
              '🌐 Domínios',
              '🔑 Keywords',
              '📢 Anúncios',
              '🎥 Vídeos',
              '💳 Comprador',
              '🚀 Dev',
            ].map((agent, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span className="text-gray-300">{agent}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-darker/50 border border-gray-700 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">Próximas Ações</h2>
          <div className="space-y-3">
            <button className="w-full bg-primary/20 hover:bg-primary/30 border border-primary/50 text-white p-3 rounded-lg transition">
              ➕ Criar Nova Tarefa
            </button>
            <button className="w-full bg-primary/20 hover:bg-primary/30 border border-primary/50 text-white p-3 rounded-lg transition">
              👥 Gerenciar Usuários
            </button>
            <button className="w-full bg-primary/20 hover:bg-primary/30 border border-primary/50 text-white p-3 rounded-lg transition">
              📊 Ver Analytics
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
```

### 3. api/auth/login.ts

```typescript
// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { email, password } = await request.json()

  // TODO: Validar contra D1
  // MOCK DATA:
  const adminUser = {
    id: 'admin_1',
    email: 'admin@example.com',
    name: 'Admin',
    role: 'admin', // ← Role definido aqui
  }

  const normalUser = {
    id: 'user_1',
    email: 'user@example.com',
    name: 'User',
    role: 'user', // ← Role user padrão
  }

  // Determinar se é admin ou user
  const user = email.includes('admin') ? adminUser : normalUser

  // Gerar JWT (simplificado)
  const token = `jwt_token_${user.id}`

  return NextResponse.json({
    token,
    user,
  })
}
```

### 4. api/admin/check-role.ts

```typescript
// app/api/admin/check-role/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { token } = await request.json()

  // TODO: Validar token contra D1
  // Para agora, simular validação

  if (!token || token === 'invalid') {
    return NextResponse.json(
      { isAdmin: false, error: 'Token inválido' },
      { status: 401 }
    )
  }

  return NextResponse.json({
    isAdmin: true,
    message: 'Acesso autorizado',
  })
}
```

---

## 🚀 PASSOS DE IMPLEMENTAÇÃO

### Passo 1: Estrutura de Diretórios
```bash
mkdir -p app/admin/{agents,tasks,users,analytics,settings}
mkdir -p app/api/admin
```

### Passo 2: Criar Admin Layout
- Copiar código do `app/admin/layout.tsx` acima
- Implementar validação de role
- Testar redirecionamento

### Passo 3: Criar Admin Pages
- `/admin/page.tsx` (dashboard)
- `/admin/agents/page.tsx` (agentes)
- `/admin/tasks/page.tsx` (tarefas)
- `/admin/users/page.tsx` (usuários)
- `/admin/settings/page.tsx` (config)

### Passo 4: Atualizar APIs
- Modificar `/api/auth/login` para retornar role
- Criar `/api/admin/check-role`
- Adicionar validação no backend

### Passo 5: Testes
- Admin consegue entrar em /admin/
- User normal é redirecionado para /dashboard
- Logout funciona corretamente
- Sem acesso a dados sensíveis sem role

---

## ⏰ TIMELINE

| Etapa | Tempo | Status |
|-------|-------|--------|
| Criar estrutura de dirs | 15 min | ⏳ |
| Implementar layout/validação | 1.5h | ⏳ |
| Criar pages admin | 1h | ⏳ |
| Atualizar APIs | 1.5h | ⏳ |
| Testes + debug | 1.5h | ⏳ |
| **TOTAL** | **~6h** | ⏳ |

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

- [ ] Pastas criadas
- [ ] `app/admin/layout.tsx` implementado
- [ ] `app/admin/page.tsx` criado
- [ ] Subpastas de admin criadas
- [ ] `/api/auth/login` atualizado
- [ ] `/api/admin/check-role` criado
- [ ] Testes manuais (admin consegue entrar)
- [ ] Testes de segurança (user é bloqueado)
- [ ] Logout funciona
- [ ] Documentação atualizada
- [ ] Git commit feito

---

## 🔗 REFERÊNCIAS

- Trello Card: [DEV] Criar rota /admin/
- Elon System: GitHub elon-parker-clean
- ARCHITECTURE.md (Elon System docs)

---

**Pronto para começar? Qual é o status?** 🚀
