# Etapa 9/9 — Vectorize + RAG + Cache KV Inteligente (concluída 2026-02-15)

## Status: ✅ CONCLUÍDO

## Services Criados

| Service | O que faz |
|---------|-----------|
| `embedding.service.ts` | Workers AI embeddings (bge-base-en-v1.5), chunking com overlap, dedup por hash |
| `vectorize.service.ts` | Upsert/search/delete vectors com tenant isolation, RAG context builder, PII redaction |
| `execution-cache.service.ts` | KV cache inteligente com TTL por categoria, invalidação por project/config |

## Pipeline de Indexação

### O que é indexado
1. **Project metadata** — auto-indexado ao criar/refresh project (título, descrição, tech, social)
2. **Execution outputs** — indexados automaticamente após cada execução (≥100 chars)

### Chunking
- Max 2000 chars por chunk
- Max 5 chunks por fonte
- Overlap: 200 chars entre chunks
- Split: por parágrafos
- Dedup: FNV-1a hash por chunk

### Vector Metadata
```json
{
  "customer_id": "uuid",
  "project_id": "uuid",
  "source_type": "project_metadata | execution_output",
  "source_id": "uuid",
  "agent_id": "uuid (optional)",
  "category_slug": "string (optional)",
  "chunk_index": 0,
  "created_at": "ISO",
  "text": "chunk text (for retrieval)"
}
```

## Retrieval (RAG)

### Fluxo na execução
1. User submete input → sanitiza + injection check
2. **Cache check** → se HIT, retorna imediatamente (0 tokens)
3. **RAG search** → embed query → Vectorize topK (filtro tenant) → score ≥ 0.7
4. **Build context** → RAG results (max 3000 chars) inseridos no system prompt
5. **Call LLM** → Workers AI Llama 3 8B
6. **Save** → D1 execution + KV cache + Vectorize index (async)

### Prompt com RAG
```
[SYSTEM]
{system_prompt}

═══ CONTEXTO DO PROJETO ═══
{project metadata}
═══ FIM DO CONTEXTO ═══

═══ CONTEXTO RAG (dados indexados do projeto) ═══
[Score: 0.92 | execution_output]
{chunk text}

[Score: 0.85 | project_metadata]
{chunk text}
═══ FIM CONTEXTO RAG ═══

REGRAS ABSOLUTAS: ...

[USER]
{input sanitizado}
```

### Filtros (SEMPRE por tenant)
- `customer_id` = session.customer_id (obrigatório)
- `project_id` = request.project_id (obrigatório)
- `agent_id` = optional filter
- `source_type` = optional filter

### Limites
| Item | Valor |
|------|-------|
| topK default | 5 |
| topK max | 20 |
| Score mínimo | 0.7 |
| Max vetores/project | 500 |
| Max vetores/customer | 5000 |
| RAG context max chars | 3000 |

## Cache KV Inteligente

### Key Pattern
```
exec_cache:{customer_id}:{project_id}:{agent_id}:v{config_version}:{input_hash_16chars}
```

### TTL por Categoria
| Categoria | TTL | Motivo |
|-----------|-----|--------|
| dev-sistemas | 30min | Resultados estáveis |
| captacao-cliente | 15min | Muda moderadamente |
| kpis | 5min | Data-driven, muda rápido |
| financeiro | 10min | |
| ux-usabilidade | 30min | Estável |
| backlinks | 30min | Estável |
| vendas | 15min | |
| crm | 10min | |
| imagens | 0 (sem cache) | Criativo, sempre diferente |
| videos | 0 (sem cache) | Criativo |

### Invalidação
- **Config version** no key → config muda = key diferente = auto-miss
- **Project update** → TTL curto garante frescor (+ invalidação explícita futura)
- **Secrets** → NUNCA em KV

## Segurança

### Tenant Isolation
- [x] Toda query Vectorize filtra `customer_id` + `project_id`
- [x] Cache keys incluem `customer_id` + `project_id`
- [x] Sem cross-tenant leak possível

### PII Redaction
- [x] Emails redacted → `[email]`
- [x] Telefones redacted → `[phone]`
- [x] CPFs redacted → `[cpf]`

### Observabilidade
- [x] Log: vectorize upsert count
- [x] Log: cache HIT/SET com agent_id + project_id
- [x] Log: RAG search results count
- [x] Log: execution com flag `rag_used: true/false`
- [x] Header: `X-Rag-Used: true/false` no streaming
- [x] Sem conteúdo sensível nos logs

## Endpoints Novos/Atualizados

| Rota | Mudança |
|------|---------|
| `POST /agents/:id/execute` | + Cache check + RAG + auto-index output |
| `POST /agents/:id/stream` | + RAG + auto-index output + X-Rag-Used header |
| `POST /agents/:id/search` | NOVO — RAG search direto |
| `POST /projects` | + Auto-index metadata no Vectorize |

## Nenhuma Migration Adicional
Schema Etapa 3 já tinha `has_embedding` em `agent_executions`.
