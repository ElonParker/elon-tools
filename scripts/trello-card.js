#!/usr/bin/env node

/**
 * trello-card.js - Gerenciar cards do Trello via CLI
 * 
 * Uso:
 *   node trello-card.js --action=create --list="Em andamento" --title="Nova tarefa" --desc="Descrição"
 *   node trello-card.js --action=move --cardId=xxx --list="Concluído"
 *   node trello-card.js --action=update --cardId=xxx --title="Novo título"
 *   node trello-card.js --action=add-checklist --cardId=xxx --checklist="Checklist" --items="Item 1,Item 2"
 */

const https = require('https');
require('dotenv').config();

const API_KEY = process.env.TRELLO_API_KEY;
const TOKEN = process.env.TRELLO_TOKEN;
const BOARD_ID = process.env.TRELLO_BOARD_ID;

// IDs das listas (padrão)
const LISTS = {
  'A fazer': '699157fcd5bae09d3e2ee98e',
  'Em andamento': '699157fcd5bae09d3e2ee98f',
  'Concluído': '699157fcd5bae09d3e2ee990'
};

if (!API_KEY || !TOKEN || !BOARD_ID) {
  console.error('❌ Erro: Credenciais Trello não configuradas em .env');
  console.error('Precisa de: TRELLO_API_KEY, TRELLO_TOKEN, TRELLO_BOARD_ID');
  process.exit(1);
}

/**
 * HTTP request helper
 */
function trelloRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`https://api.trello.com/1${path}`);
    url.searchParams.append('key', API_KEY);
    url.searchParams.append('token', TOKEN);

    const options = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

/**
 * Criar card
 */
async function createCard(options) {
  const { list, title, desc = '', labels = [] } = options;
  const listId = LISTS[list];

  if (!listId) {
    console.error(`❌ Lista "${list}" não encontrada`);
    console.error(`Listas disponíveis: ${Object.keys(LISTS).join(', ')}`);
    return;
  }

  const payload = {
    name: title,
    desc: desc,
    idList: listId,
    labels: labels
  };

  try {
    const card = await trelloRequest('POST', '/cards', payload);
    console.log('✅ Card criado!');
    console.log(`ID: ${card.id}`);
    console.log(`Título: ${card.name}`);
    console.log(`Lista: ${list}`);
    console.log(`URL: ${card.url}`);
    return card;
  } catch (error) {
    console.error('❌ Erro ao criar card:', error.message);
  }
}

/**
 * Mover card entre listas
 */
async function moveCard(options) {
  const { cardId, list } = options;
  const listId = LISTS[list];

  if (!listId) {
    console.error(`❌ Lista "${list}" não encontrada`);
    return;
  }

  try {
    const result = await trelloRequest('PUT', `/cards/${cardId}`, { idList: listId });
    console.log('✅ Card movido!');
    console.log(`Para: ${list}`);
    console.log(`Card: ${result.name}`);
  } catch (error) {
    console.error('❌ Erro ao mover card:', error.message);
  }
}

/**
 * Atualizar card
 */
async function updateCard(options) {
  const { cardId, title, desc } = options;
  const payload = {};

  if (title) payload.name = title;
  if (desc) payload.desc = desc;

  try {
    const result = await trelloRequest('PUT', `/cards/${cardId}`, payload);
    console.log('✅ Card atualizado!');
    console.log(`Título: ${result.name}`);
    if (desc) console.log(`Descrição: ${result.desc}`);
  } catch (error) {
    console.error('❌ Erro ao atualizar card:', error.message);
  }
}

/**
 * Adicionar checklist ao card
 */
async function addChecklist(options) {
  const { cardId, checklist, items = [] } = options;

  try {
    // Criar checklist
    const checklistResult = await trelloRequest('POST', `/cards/${cardId}/checklists`, {
      name: checklist
    });

    // Adicionar itens
    if (items.length > 0) {
      for (const item of items) {
        await trelloRequest('POST', `/checklists/${checklistResult.id}/checkItems`, {
          name: item
        });
      }
    }

    console.log('✅ Checklist adicionado!');
    console.log(`Nome: ${checklist}`);
    console.log(`Itens: ${items.length}`);
  } catch (error) {
    console.error('❌ Erro ao adicionar checklist:', error.message);
  }
}

/**
 * CLI
 */
async function main() {
  const args = require('minimist')(process.argv.slice(2));
  const action = args.action || 'help';

  switch (action) {
    case 'create':
      await createCard({
        list: args.list || 'A fazer',
        title: args.title || 'Nova tarefa',
        desc: args.desc || '',
        labels: args.labels ? args.labels.split(',') : []
      });
      break;

    case 'move':
      await moveCard({
        cardId: args.cardId,
        list: args.list || 'Em andamento'
      });
      break;

    case 'update':
      await updateCard({
        cardId: args.cardId,
        title: args.title,
        desc: args.desc
      });
      break;

    case 'add-checklist':
      await addChecklist({
        cardId: args.cardId,
        checklist: args.checklist || 'Checklist',
        items: args.items ? args.items.split(',') : []
      });
      break;

    case 'help':
    default:
      console.log(`
Uso: node trello-card.js --action=<ação> [opções]

Ações:
  create         Criar novo card
    --list="Em andamento"  (padrão: "A fazer")
    --title="Título"       (obrigatório)
    --desc="Descrição"     (opcional)
    --labels="label1,label2" (opcional)

  move           Mover card entre listas
    --cardId="xxx"         (obrigatório)
    --list="Concluído"     (obrigatório)

  update         Atualizar card
    --cardId="xxx"         (obrigatório)
    --title="Novo título"  (opcional)
    --desc="Nova desc"     (opcional)

  add-checklist  Adicionar checklist
    --cardId="xxx"         (obrigatório)
    --checklist="Nome"     (obrigatório)
    --items="Item1,Item2"  (opcional)

Listas disponíveis:
  - A fazer
  - Em andamento
  - Concluído

Exemplos:
  node trello-card.js --action=create --list="Em andamento" --title="Configurar Stripe API"
  node trello-card.js --action=move --cardId=xyz --list="Concluído"
  node trello-card.js --action=add-checklist --cardId=xyz --checklist="Setup" --items="Step1,Step2,Step3"
      `);
      break;
  }
}

main().catch(console.error);

module.exports = { createCard, moveCard, updateCard, addChecklist, trelloRequest };
