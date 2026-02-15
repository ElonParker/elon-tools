import type { Category } from '../types/category.js';

export const CATEGORIES: readonly Category[] = [
  { id: 'cat-01', slug: 'dev-sistemas',    name: 'Desenvolvimento de Sistemas',   description: 'Ferramentas de desenvolvimento, code review, arquitetura',      icon: '💻', sort_order: 1 },
  { id: 'cat-02', slug: 'captacao-cliente', name: 'Captação de Cliente',           description: 'Prospecção, lead generation, outreach, funil de aquisição',     icon: '🎯', sort_order: 2 },
  { id: 'cat-03', slug: 'kpis',            name: 'Monitoramento Principais KPIs', description: 'Dashboards, métricas-chave, alertas de performance',            icon: '📊', sort_order: 3 },
  { id: 'cat-04', slug: 'financeiro',      name: 'Financeiro',                    description: 'ROI, fluxo de caixa, análise de custos, projeções',             icon: '💰', sort_order: 4 },
  { id: 'cat-05', slug: 'ux-usabilidade',  name: 'Análise de UX / Usabilidade',   description: 'Heurísticas, acessibilidade, testes de usabilidade, heatmaps',  icon: '🎨', sort_order: 5 },
  { id: 'cat-06', slug: 'backlinks',       name: 'Backlinks',                     description: 'Análise de perfil, prospecção de links, outreach, monitoramento',icon: '🔗', sort_order: 6 },
  { id: 'cat-07', slug: 'vendas',          name: 'Vendas',                        description: 'Pipeline, conversão, scripts de venda, objeções',               icon: '💵', sort_order: 7 },
  { id: 'cat-08', slug: 'crm',             name: 'CRM',                           description: 'Gestão de contatos, follow-up, segmentação, automações',        icon: '👥', sort_order: 8 },
  { id: 'cat-09', slug: 'imagens',         name: 'Criação de Imagens',            description: 'Geração de imagens, banners, thumbnails, assets visuais',       icon: '🖼️', sort_order: 9 },
  { id: 'cat-10', slug: 'videos',          name: 'Criação de Vídeos',             description: 'Scripts de vídeo, hooks, thumbnails, edição, trending',         icon: '🎥', sort_order: 10 },
] as const;
