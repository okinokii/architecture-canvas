#!/usr/bin/env node
/* Минимальный MCP-сервер для Architecture Canvas без внешних зависимостей.
   Общается по stdio newline-delimited JSON-RPC 2.0.
   Запуск: node mcp-server.js
   Конфиг для Claude Desktop / OpenCode:
     { "mcpServers": { "architecture-canvas": { "command": "node", "args": ["C:/.../architecture-canvas/mcp-server.js"] } } }
*/
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const readline = require('node:readline');
const core = require('./core.js');
const presets = require('./presets.js');
const projectImport = require('./project-import.js');

const VERSION = '1.1.0';
const PROTOCOL = '2024-11-05';

/* Все файловые инструменты MCP работают только внутри разрешённого каталога.
   По умолчанию — рабочая директория процесса; для других каталогов задайте
   ARCHCANVAS_MCP_ROOT или (явно) ARCHCANVAS_MCP_ALLOW_EXTERNAL=1. */
const MCP_ROOT = path.resolve(process.env.ARCHCANVAS_MCP_ROOT || process.cwd());
const ALLOW_EXTERNAL = process.env.ARCHCANVAS_MCP_ALLOW_EXTERNAL === '1';
const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);

function safePath(value, label) {
  if (typeof value !== 'string' || !value.trim()) throw fail('Нужно указать ' + label, -32602);
  const target = path.resolve(value);
  if (ALLOW_EXTERNAL) return target;
  let inside = false;
  try {
    const rootReal = fs.realpathSync(MCP_ROOT);
    let targetReal = target;
    try {
      targetReal = fs.existsSync(target)
        ? fs.realpathSync(target)
        : path.join(fs.realpathSync(path.dirname(target)), path.basename(target));
    } catch (_) { /* файл ещё не существует */ }
    const rel = path.relative(rootReal, targetReal);
    inside = rel === '' || (rel !== '..' && !rel.startsWith('..' + path.sep) && !path.isAbsolute(rel));
  } catch (_) { inside = false; }
  if (!inside) {
    throw fail('Путь вне разрешённого каталога ' + MCP_ROOT +
      '. Задайте ARCHCANVAS_MCP_ROOT в конфиге MCP или ARCHCANVAS_MCP_ALLOW_EXTERNAL=1 для доступа к другим каталогам.', -32602);
  }
  return target;
}

function fail(message, code) {
  const err = new Error(message);
  err.code = code;
  return err;
}

function loadSchema(args) {
  if (args && args.schema && typeof args.schema === 'object') {
    if (!Array.isArray(args.schema.nodes)) throw fail('schema.nodes должен быть массивом', -32602);
    return core.compactSchema(args.schema);
  }
  const p = args && args.path;
  if (typeof p !== 'string' || !p.trim()) {
    throw fail('Нужно передать schema (объект) или path к architecture-schema.json', -32602);
  }
  const resolved = safePath(p, 'path к architecture-schema.json');
  let data;
  try { data = JSON.parse(fs.readFileSync(resolved, 'utf8')); }
  catch (e) { throw fail('Не удалось прочитать JSON: ' + e.message, -32602); }
  if (!Array.isArray(data && data.nodes)) {
    throw fail('Файл не похож на схему Architecture Canvas: нет поля nodes. Выгрузите architecture-schema.json из доски.', -32602);
  }
  return core.compactSchema(data);
}

function buildCustomSchema(args) {
  const spaces = Array.isArray(args && args.spaces) ? args.spaces : [];
  const cubes = Array.isArray(args && args.cubes) ? args.cubes : [];
  const links = Array.isArray(args && args.links) ? args.links : [];
  const zones = spaces.map((s, i) => ({
    title: String((s && (s.title || s.name)) || ('ПРОСТРАНСТВО ' + (i + 1))),
    x: Number.isFinite(s && s.x) ? s.x : 60 + (i % 3) * 500,
    y: Number.isFinite(s && s.y) ? s.y : 80 + Math.floor(i / 3) * 400,
    w: Number(s && s.w) > 0 ? Number(s.w) : 460,
    h: Number(s && s.h) > 0 ? Number(s.h) : 340
  }));
  const nodes = cubes.map((c, i) => {
    const raw = String((c && c.id) || '');
    return {
      id: /^[A-Za-z][A-Za-z0-9_-]*$/.test(raw) ? raw : 'c' + (i + 1),
      label: String((c && (c.label || c.name)) || ('Куб ' + (i + 1))),
      type: String((c && (c.type || c.kind)) || 'service'),
      description: String((c && (c.description || c.sub)) || ''),
      zone: String((c && (c.zone || c.space)) || ''),
      source: 'custom-constructor'
    };
  });
  const refs = id => nodes.some(n => n.id === id) || nodes.some(n => n.label === id);
  const edges = links.map(l => {
    const from = String((l && (l.from || l.fromLabel)) || '');
    const to = String((l && (l.to || l.toLabel)) || '');
    const kind = hasOwn(core.EDGE_KINDS, l && l.kind) ? l.kind : (l && l.async ? 'async' : 'sync');
    return {
      from, fromLabel: from, to, toLabel: to,
      label: String((l && (l.label || l.note)) || ''),
      kind, async: core.EDGE_KINDS[kind].async,
      fromAttached: refs(from), toAttached: refs(to)
    };
  });
  const schema = {
    version: 1,
    zones,
    nodes,
    edges,
    notes: Array.isArray(args && args.notes) ? args.notes.map(String) : []
  };
  const instruction = String((args && args.instruction) || '').trim();
  if (instruction) schema.instruction = instruction;
  return schema;
}

const TOOLS = [
  {
    name: 'build_schema',
    description: 'Конструктор схемы для запроса к ИИ: собрать кастомные пространства (зоны), кубики (блоки) и связи по спискам, сразу получить JSON, Mermaid, C4-валидацию и готовый промпт. Можно добавить instruction — дополнительную инструкцию заказчика, она попадёт в промпт и в JSON.',
    inputSchema: {
      type: 'object',
      properties: {
        spaces: {
          type: 'array',
          description: 'Пространства/зоны. Каждое: {title, x?, y?, w?, h?}.',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' }, x: { type: 'number' }, y: { type: 'number' },
              w: { type: 'number' }, h: { type: 'number' }
            },
            required: ['title']
          }
        },
        cubes: {
          type: 'array',
          description: 'Кубики/блоки. Каждый: {id?, label, description?, type?, zone?}. type — service/gateway/db/queue/monitoring/daemon/worker/scheduler/ai и т.д.; zone — название пространства.',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' }, label: { type: 'string' }, description: { type: 'string' },
              type: { type: 'string' }, zone: { type: 'string' }
            },
            required: ['label']
          }
        },
        links: {
          type: 'array',
          description: 'Связи. Каждая: {from, to, label?, kind?, async?}. from/to — id или название куба; kind — sync/async/data/auth/event/dependency.',
          items: {
            type: 'object',
            properties: {
              from: { type: 'string' }, to: { type: 'string' }, label: { type: 'string' },
              kind: { type: 'string', enum: ['sync', 'async', 'data', 'auth', 'event', 'dependency'] },
              async: { type: 'boolean' }
            },
            required: ['from', 'to']
          }
        },
        notes: { type: 'array', items: { type: 'string' }, description: 'Необязательные пояснения/легенда.' },
        instruction: { type: 'string', description: 'Дополнительная инструкция заказчика для модели.' },
        variant: { type: 'string', enum: ['combo', 'png', 'mermaid', 'json', 'prose'], default: 'combo' }
      },
      required: ['cubes']
    }
  },
  {
    name: 'import_project',
    description: 'Импортировать уже созданный проект: проанализировать каталог с кодом (манифесты, модули, зависимости, docker-compose) и вернуть готовую схему Architecture Canvas. Результат содержит schema (nodes/edges/zones/notes), Mermaid, C4-валидацию и список найденных файлов/фреймворков. Схему можно сразу импортировать в доску кнопкой «📂 Импорт» — она понимает формат nodes/edges; либо указать output, чтобы сервер записал JSON сам. Используйте этот инструмент, когда ИИ должна нарисовать схему существующего проекта по его исходникам.',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Абсолютный или относительный путь к каталогу проекта' },
        output: { type: 'string', description: 'Необязательно: путь к новому файлу внутри каталога path (перезапись запрещена)' },
        maxFiles: { type: 'number', description: 'Необязательно: сколько файлов просмотреть (50–2000, по умолчанию 600)' }
      },
      required: ['path']
    }
  },
  {
    name: 'read_schema',
    description: 'Прочитать выгруженную из доски схему и вернуть компактный JSON (nodes/edges/notes) с числами.',
    inputSchema: {
      type: 'object',
      properties: { path: { type: 'string', description: 'Путь к architecture-schema.json' } },
      required: ['path']
    }
  },
  {
    name: 'validate_c4',
    description: 'Мягкая C4-валидация схемы: пустые названия, дубли id, неподписанные связи, отсутствие зон/заголовка/легенды.',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Путь к architecture-schema.json (альтернатива schema)' },
        schema: { type: 'object', description: 'Схема напрямую' }
      }
    }
  },
  {
    name: 'export_mermaid',
    description: 'Преобразовать схему в Mermaid flowchart. Полезно для вставки в Markdown/GitHub README.',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string' },
        schema: { type: 'object' },
        validate: { type: 'boolean', description: 'Добавить результат C4-валидации в конце' }
      }
    }
  },
  {
    name: 'build_ai_prompt',
    description: 'Собрать готовый промпт для Qwen/Claude/GPT: combo (PNG + Mermaid + JSON), png, mermaid, json или prose.',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string' },
        schema: { type: 'object' },
        variant: { type: 'string', enum: ['combo', 'png', 'mermaid', 'json', 'prose'], default: 'combo' }
      }
    }
  },
  {
    name: 'make_gist_files',
    description: 'Сформировать набор файлов для GitHub Gist: схема, Mermaid, промпт, C4-валидация, README.',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string' },
        schema: { type: 'object' }
      }
    }
  },
  {
    name: 'push_gist',
    description: 'Создать или обновить приватный GitHub Gist со схемой. Токен берётся только из GITHUB_TOKEN окружения MCP-сервера; публичный gist требует ARCHCANVAS_ALLOW_PUBLIC_GIST=1.',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string' },
        schema: { type: 'object' },
        token: { type: 'string', description: 'Устарело и игнорируется: задайте GITHUB_TOKEN в окружении MCP-сервера' },
        gistId: { type: 'string', description: 'Необязательно: ID существующего gist для обновления' },
        public: { type: 'boolean', default: false }
      }
    }
  }
];

const PRESET_TOOLS = [
  {
    name: 'list_presets',
    description: 'Список пресетов (31) в двух категориях: architecture — архитектурные шаблоны, process — логические/событийные диаграммы процессов (сообщение → реакция → результат, Saga, outbox, retry/DLQ, инциденты, CI/CD, cron). Можно отфильтровать по category.',
    inputSchema: {
      type: 'object',
      properties: {
        category: { type: 'string', enum: ['architecture', 'process'], description: 'Необязательный фильтр категории' }
      }
    }
  },
  {
    name: 'get_preset',
    description: 'Полное описание пресета: зоны, блоки, связи и комфортная JSON-схема.',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string', description: 'Идентификатор из list_presets' } },
      required: ['id']
    }
  },
  {
    name: 'preset_export',
    description: 'Экспортировать пресет в schema / mermaid / prompt / gist / all.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        format: { type: 'string', enum: ['schema', 'mermaid', 'prompt', 'gist', 'all'], default: 'all' },
        variant: { type: 'string', enum: ['combo', 'png', 'mermaid', 'json', 'prose'], default: 'combo' }
      },
      required: ['id']
    }
  }
];

function presetById(id) {
  const p = presets.get(id);
  if (!p) throw fail('Неизвестный пресет: ' + id + '. Доступны: ' + presets.presets.map(x => x.id).join(', '), -32602);
  return p;
}

const handlers = {
  build_schema: args => {
    const schema = buildCustomSchema(args);
    return {
      schema: core.compactSchema(schema),
      mermaid: core.toMermaid(schema),
      validation: core.validateC4(schema),
      prompt: core.buildPrompt(schema, (args && args.variant) || 'combo'),
      hint: 'Готовую schema можно вставить в доску кнопкой «📂 Импорт» — она понимает nodes/edges/zones.'
    };
  },
  import_project: args => {
    const root = safePath(args && args.path, 'путь к каталогу проекта');
    const { schema, evidence } = projectImport.importProject(Object.assign({}, args, { path: root }));
    const out = {
      schema,
      mermaid: core.toMermaid(schema),
      validation: core.validateC4(schema),
      evidence,
      hint: 'Передайте schema пользователю или укажите output — доска понимает этот JSON через «📂 Импорт» на верхней панели.'
    };
    if (args && args.output) {
      out.file = projectImport.writeSchema(schema, args.output, root);
      out.hint = 'Файл записан: ' + out.file + '. Откройте доску и нажмите «📂 Импорт», чтобы загрузить схему.';
    }
    return out;
  },
  list_presets: args => {
    const category = args && args.category;
    const list = presets.presets.filter(p => !category || p.category === category);
    return {
      total: list.length,
      presets: list.map(p => ({
        id: p.id, name: p.name, description: p.description,
        category: p.category || 'architecture', tags: p.tags,
        nodes: p.nodes.length, edges: p.edges.length, zones: p.zones.length
      }))
    };
  },
  get_preset: args => {
    const p = presetById(args && args.id);
    return { preset: p, schema: presets.toSchema(p), validation: core.validateC4(presets.toSchema(p)) };
  },
  preset_export: args => {
    const p = presetById(args && args.id);
    const s = presets.toSchema(p);
    const format = (args && args.format) || 'all';
    const out = {};
    if (format === 'schema' || format === 'all') out.schema = s;
    if (format === 'mermaid' || format === 'all') out.mermaid = core.toMermaid(s);
    if (format === 'prompt' || format === 'all') out.prompt = core.buildPrompt(s, (args && args.variant) || 'combo');
    if (format === 'gist' || format === 'all') out.files = core.makeGistFiles(s);
    if (format === 'all') out.validation = core.validateC4(s);
    return out;
  },
  read_schema: args => {
    const s = loadSchema(args);
    return {
      schema: s,
      counts: { nodes: s.nodes.length, edges: s.edges.length, notes: s.notes.length, zones: s.zones.length }
    };
  },
  validate_c4: args => {
    const s = loadSchema(args);
    return { result: core.validateC4(s), mermaid: core.toMermaid(s) };
  },
  export_mermaid: args => {
    const s = loadSchema(args);
    let out = core.toMermaid(s);
    if (args && args.validate) {
      const r = core.validateC4(s);
      out += '\n%% C4: ' + (r.ok ? 'OK' : 'есть ошибки') +
        ' (ошибок ' + r.counts.error + ', предупреждений ' + r.counts.warning + ')';
    }
    return { mermaid: out };
  },
  build_ai_prompt: args => {
    const s = loadSchema(args);
    return { prompt: core.buildPrompt(s, (args && args.variant) || 'combo') };
  },
  make_gist_files: args => {
    const s = loadSchema(args);
    return { files: core.makeGistFiles(s) };
  },
  push_gist: async args => {
    const s = loadSchema(args);
    const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
    if (!token) throw fail('Нужен GITHUB_TOKEN в окружении MCP-сервера (аргумент token больше не принимается)', -32602);
    if ((args && args.public) && process.env.ARCHCANVAS_ALLOW_PUBLIC_GIST !== '1') {
      throw fail('Публичный gist требует ARCHCANVAS_ALLOW_PUBLIC_GIST=1 в окружении MCP-сервера', -32602);
    }
    const id = args && args.gistId;
    const url = 'https://api.github.com/gists' + (id ? '/' + encodeURIComponent(id) : '');
    const method = id ? 'PATCH' : 'POST';
    const body = id
      ? { files: core.makeGistFiles(s), description: 'Architecture Canvas — обновлено ' + new Date().toISOString() }
      : { files: core.makeGistFiles(s), description: 'Architecture Canvas — схема, Mermaid, JSON, C4, промпт', public: !!(args && args.public) };
    const resp = await fetch(url, {
      method,
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: 'Bearer ' + token,
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) throw fail(String(data.message || ('GitHub HTTP ' + resp.status)).replaceAll(token, '***'), -32000);
    return { id: data.id, url: data.html_url, files: Object.keys(core.makeGistFiles(s)) };
  }
};

function resultText(value) {
  return typeof value === 'string' ? value : JSON.stringify(value, null, 2);
}

async function dispatch(msg) {
  if (!msg || msg.jsonrpc !== '2.0') {
    return { jsonrpc: '2.0', id: msg && msg.id, error: { code: -32600, message: 'Invalid Request' } };
  }
  const { id, method, params } = msg;
  if (method === 'ping') return { jsonrpc: '2.0', id, result: {} };
  if (method === 'initialize') {
    return {
      jsonrpc: '2.0', id,
      result: {
        protocolVersion: PROTOCOL,
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: 'architecture-canvas', version: VERSION }
      }
    };
  }
  if (method === 'notifications/initialized' || method === 'initialized') return null;
  if (method === 'tools/list') return { jsonrpc: '2.0', id, result: { tools: TOOLS.concat(PRESET_TOOLS) } };
  if (method === 'tools/call') {
    const name = params && params.name;
    const args = (params && params.arguments) || {};
    const h = hasOwn(handlers, name) ? handlers[name] : null;
    if (!h) return { jsonrpc: '2.0', id, error: { code: -32602, message: 'Unknown tool: ' + name } };
    try {
      const value = await h(args);
      return { jsonrpc: '2.0', id, result: { content: [{ type: 'text', text: resultText(value) }] } };
    } catch (e) {
      return { jsonrpc: '2.0', id, result: { content: [{ type: 'text', text: e.message }], isError: true } };
    }
  }
  return { jsonrpc: '2.0', id, error: { code: -32601, message: 'Method not found: ' + method } };
}

const rl = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });
rl.on('line', async line => {
  const text = line.trim();
  if (!text) return;
  let msg;
  try { msg = JSON.parse(text); }
  catch (_) {
    process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } }) + '\n');
    return;
  }
  const reply = await dispatch(msg);
  if (reply) process.stdout.write(JSON.stringify(reply) + '\n');
});
