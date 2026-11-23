/* Статический импорт готового проекта в схему Architecture Canvas.
   Без внешних зависимостей: читает манифесты, исходники и docker-compose,
   возвращает nodes/edges/zones/notes, пригодные для доски и MCP. */
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const core = require('./core.js');

const IGNORE_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', 'out', 'coverage', 'vendor',
  'target', '__pycache__', '.venv', 'venv', 'bin', 'obj', 'apk'
]);
const TEXT_EXT = new Set([
  '.js', '.jsx', '.mjs', '.cjs', '.ts', '.tsx', '.py', '.go', '.rs', '.java',
  '.kt', '.cs', '.rb', '.php', '.vue', '.svelte', '.json', '.yml', '.yaml',
  '.toml', '.txt', '.md', '.gradle', '.xml', '.sql', '.html', '.css'
]);
const SKIP_GROUPS = new Set([
  'index', 'main', 'app', 'types', 'type', 'utils', 'helpers', 'config',
  'styles', 'assets', 'static', 'public', 'tests', 'test', '__tests__', 'spec'
]);

const INFRA = [
  { key: 'postgres', re: /(^|[^a-z])(pg|postgres|postgresql|prisma|sequelize|typeorm|knex|psycopg)([^a-z]|$)/i, label: 'PostgreSQL', description: 'Реляционная база данных', kind: 'data' },
  { key: 'mysql', re: /(mysql|mariadb)/i, label: 'MySQL', description: 'Реляционная база данных', kind: 'data' },
  { key: 'mongo', re: /(mongo|mongoose)/i, label: 'MongoDB', description: 'Документная база данных', kind: 'data' },
  { key: 'redis', re: /(redis|ioredis)/i, label: 'Redis', description: 'Кэш и хранилище сессий', kind: 'data' },
  { key: 'kafka', re: /(kafka|kafkajs)/i, label: 'Kafka', description: 'Брокер событий', kind: 'event' },
  { key: 'rabbit', re: /(rabbit|amqp)/i, label: 'RabbitMQ', description: 'Брокер сообщений', kind: 'event' },
  { key: 'elastic', re: /(elastic|opensearch)/i, label: 'Elasticsearch', description: 'Поиск и аналитика', kind: 'data' },
  { key: 'storage', re: /(minio|@aws-sdk\/client-s3|aws-sdk|boto3|s3)/i, label: 'Object Storage (S3)', description: 'Хранилище файлов', kind: 'data' },
  { key: 'nginx', re: /(^|[^a-z])nginx([^a-z]|$)/i, label: 'Nginx', description: 'Обратный прокси и статик', kind: 'sync' },
  { key: 'grpc', re: /(grpc|@grpc)/i, label: 'gRPC API', description: 'Синхронный gRPC-вызов', kind: 'sync' },
  { key: 'observability', re: /(prometheus|grafana|loki|jaeger|opentelemetry|@opentelemetry|\botel\b|sentry)/i, label: 'Мониторинг / Наблюдаемость', description: 'Метрики, логи и трейсы', kind: 'monitoring' },
  { key: 'scheduler', re: /(node-cron|\bcron\b|bullmq|agenda|quartz)/i, label: 'Планировщик задач', description: 'Периодические и фоновые задачи', kind: 'scheduler' }
];
function infraType(kind) {
  if (kind === 'event') return 'queue';
  if (kind === 'data') return 'db';
  if (kind === 'monitoring') return 'monitoring';
  if (kind === 'scheduler') return 'scheduler';
  return 'gateway';
}
const FRAMEWORKS = [
  /next\.?js|^next$/i, /nestjs/i, /express/i, /fastify/i, /vue/i, /react/i,
  /django/i, /flask/i, /fastapi/i, /spring/i, /gin-gonic/i, /laravel/i
];

function slug(value) {
  return String(value || '').replace(/[^A-Za-z0-9_-]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 60) || 'node';
}
function pretty(value) {
  return String(value || '')
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .trim();
}
function rel(root, file) { return path.relative(root, file).replace(/\\/g, '/'); }
function readText(file) {
  try {
    if (fs.statSync(file).size > 400000) return '';
    return fs.readFileSync(file, 'utf8');
  } catch (_) { return ''; }
}
function parseJSON(file) {
  try { return JSON.parse(readText(file)); } catch (_) { return null; }
}

function walk(root, maxFiles, maxDepth) {
  const files = [];
  const stack = [{ dir: root, depth: 0 }];
  while (stack.length && files.length < maxFiles) {
    const { dir, depth } = stack.pop();
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); }
    catch (_) { continue; }
    for (const ent of entries) {
      if (ent.name.startsWith('.') || IGNORE_DIRS.has(ent.name)) continue;
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        if (depth < maxDepth) stack.push({ dir: full, depth: depth + 1 });
      } else if (ent.isFile() && TEXT_EXT.has(path.extname(ent.name).toLowerCase())) {
        files.push(full);
      }
    }
  }
  return files;
}

function composeServices(root, files) {
  const file = files.find(f => /^(docker-)?compose\.ya?ml$/i.test(path.basename(f)));
  if (!file) return [];
  const lines = readText(file).split(/\r?\n/);
  const out = [];
  let inServices = false, current = null, dependsIndent = -1;
  for (const line of lines) {
    if (/^[A-Za-z]/.test(line)) {
      inServices = /^services:\s*$/.test(line);
      dependsIndent = -1;
    }
    if (!inServices) continue;
    const m = line.match(/^ {2}([A-Za-z0-9_-]+):\s*$/);
    if (m) {
      current = { name: m[1], image: '', dependsOn: [], ports: [] };
      out.push(current);
      dependsIndent = -1;
      continue;
    }
    if (!current) continue;
    const image = line.match(/^\s+image:\s*(.+?)\s*$/);
    if (image) { current.image = image[1].replace(/^["']|["']$/g, ''); continue; }
    const port = line.match(/^\s+-?\s*["']?(\d+:\d+)["']?\s*$/);
    if (port) { current.ports.push(port[1]); continue; }
    const depHeader = line.match(/^(\s*)depends_on:\s*$/);
    if (depHeader) { dependsIndent = depHeader[1].length; continue; }
    if (dependsIndent >= 0) {
      const indent = (line.match(/^\s*/) || [''])[0].length;
      if (!line.trim() || indent > dependsIndent) {
        const dep = line.match(/^\s*-\s*([A-Za-z0-9_-]+)\s*$/);
        if (dep) current.dependsOn.push(dep[1]);
        continue;
      }
      dependsIndent = -1;
    }
  }
  return out;
}

function importProject(args) {
  const rawPath = args && args.path;
  if (typeof rawPath !== 'string' || !rawPath.trim()) {
    throw new Error('Нужно указать path — каталог существующего проекта');
  }
  const root = path.resolve(rawPath);
  if (!fs.existsSync(root) || !fs.statSync(root).isDirectory()) {
    throw new Error('Каталог не найден: ' + root);
  }
  const maxFiles = Math.min(2000, Math.max(50, Number(args.maxFiles) || 600));

  const nodes = [];
  const edges = [];
  const notes = [];
  const zones = new Set();
  const seenNodes = new Set();
  const seenEdges = new Set();
  const evidence = { filesScanned: 0, manifests: [], frameworks: [], modules: [], composeServices: [], warnings: [] };

  const addNode = (key, node) => {
    if (seenNodes.has(key)) return nodes.find(n => n.id === slug(key));
    seenNodes.add(key);
    if (node.zone) zones.add(node.zone);
    nodes.push(Object.assign({ id: slug(key) }, node));
    return nodes[nodes.length - 1];
  };
  const addEdge = (from, to, label, kind) => {
    if (!from || !to || from === to) return;
    const key = from + '\u0000' + to + '\u0000' + kind;
    if (seenEdges.has(key)) return;
    seenEdges.add(key);
    edges.push({
      from, to, label, kind,
      async: kind === 'async' || kind === 'event',
      fromAttached: true, toAttached: true
    });
  };

  const files = walk(root, maxFiles, 7);
  evidence.filesScanned = files.length;
  if (!files.length) throw new Error('В каталоге не найдено исходных файлов: ' + root);

  /* 0. Если в проекте уже лежит схема доски — берём её за основу. */
  const existingSchemaFile = files.find(f => !rel(root, f).includes('/') && /^(architecture-schema|schema)\.json$/i.test(path.basename(f))) ||
    files.find(f => /\.json$/i.test(f) && (() => { const j = parseJSON(f); return j && Array.isArray(j.nodes); })());
  if (existingSchemaFile) {
    const parsed = parseJSON(existingSchemaFile);
    if (parsed && Array.isArray(parsed.nodes)) {
      const s = core.compactSchema(parsed);
      const idMap = new Map();
      s.nodes.forEach(n => {
        const node = addNode('schema:' + (n.id || n.label), {
          label: n.label || 'Блок', type: n.type || 'service', description: n.description,
          zone: n.zone || 'Схема проекта', source: rel(root, existingSchemaFile)
        });
        idMap.set(String(n.id), node.id);
        idMap.set(String(n.label), node.id);
      });
      s.edges.forEach(e => {
        const from = idMap.get(String(e.from)) || idMap.get(String(e.fromLabel));
        const to = idMap.get(String(e.to)) || idMap.get(String(e.toLabel));
        addEdge(from, to, e.label || 'связь', e.kind || 'sync');
      });
      s.notes.forEach(n => {
        const text = typeof n === 'string' ? n : String(n.text || '');
        if (text) notes.push(text);
      });
      evidence.existingSchema = rel(root, existingSchemaFile);
    }
  }

  /* 1. Манифесты и пакеты */
  const packages = files.filter(f => path.basename(f) === 'package.json').slice(0, 30);
  let rootPackage = null;
  packages.forEach(file => {
    const pkg = parseJSON(file);
    if (!pkg) return;
    const relPath = rel(root, file);
    evidence.manifests.push(relPath);
    if (!rootPackage || relPath.split('/').length < rootPackage.depth) {
      rootPackage = { file, pkg, relPath, depth: relPath.split('/').length };
    }
    const deps = Object.assign({}, pkg.dependencies, pkg.devDependencies);
    const names = Object.keys(deps);
    names.forEach(name => FRAMEWORKS.forEach(re => {
      if (re.test(name) && !evidence.frameworks.includes(name)) evidence.frameworks.push(name);
    }));
    const tech = names.filter(n => !/^@types\//.test(n)).slice(0, 8).join(', ');
    const label = relPath === 'package.json' ? 'Приложение: ' + (pkg.name || path.basename(root)) : 'Пакет: ' + (pkg.name || path.basename(path.dirname(file)));
    const zone = relPath === 'package.json' ? 'Приложение' : 'Пакеты и модули';
    const id = addNode('pkg:' + relPath, {
      label, type: 'service',
      description: [tech && 'Зависимости: ' + tech, pkg.version && 'v' + pkg.version].filter(Boolean).join(' · ') || 'Node.js-пакет',
      zone, source: relPath
    }).id;
    if (pkg.scripts && (pkg.scripts.start || pkg.scripts.dev)) {
      notes.push('Команды: ' + Object.keys(pkg.scripts).slice(0, 6).map(k => 'npm run ' + k).join('; '));
    }
    INFRA.forEach(infra => {
      if (!names.some(n => infra.re.test(n))) return;
      const infraId = addNode('infra:' + infra.key, {
        label: infra.label, type: infraType(infra.kind),
        description: infra.description, zone: 'Инфраструктура', source: 'зависимости package.json'
      }).id;
      addEdge(id, infraId, 'использует', infra.kind);
    });
  });

  /* 2. Другие манифесты */
  files.forEach(file => {
    const base = path.basename(file);
    if (!/^(requirements.*\.txt|pyproject\.toml|go\.mod|Cargo\.toml|pom\.xml|build\.gradle.*|.*\.csproj)$/i.test(base)) return;
    if (evidence.manifests.includes(rel(root, file))) return;
    evidence.manifests.push(rel(root, file));
    const text = readText(file);
    const parent = path.basename(path.dirname(file));
    const id = addNode('manifest:' + rel(root, file), {
      label: 'Компонент: ' + pretty(base.replace(/\.(txt|toml|mod|xml|gradle|csproj).*$/i, '')) +
        (rel(root, file).includes('/') ? ' (' + parent + ')' : ''),
      type: 'service', description: 'Манифест ' + base, zone: 'Приложение', source: rel(root, file)
    }).id;
    INFRA.forEach(infra => {
      if (!infra.re.test(text)) return;
      const infraId = addNode('infra:' + infra.key, {
        label: infra.label, type: infraType(infra.kind),
        description: infra.description, zone: 'Инфраструктура', source: 'манифест ' + base
      }).id;
      addEdge(id, infraId, 'использует', infra.kind);
    });
    const entry = text.match(/(?: Entrypoint|ENTRYPOINT|CMD)\s*["']?([^\n"']+)/i);
    if (entry) notes.push('Точка входа: ' + entry[1].trim());
  });

  /* 3. Исходные модули по каталогам */
  const groups = new Map();
  files.forEach(file => {
    const r = rel(root, file);
    const src = r.match(/(?:^|\/)src\/([^/]+)\//);
    let group = src ? src[1] : (r.includes('/') ? r.split('/')[0] : '');
    if (!group || SKIP_GROUPS.has(group.toLowerCase()) || /\./.test(group)) return;
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group).push(r);
  });
  // Плоские проекты без src/<модуль>: за компонент берём каждый исходный файл.
  if (!groups.size) {
    files.forEach(file => {
      const r = rel(root, file);
      if (r.includes('/') || /\.(test|spec)\./i.test(r) || !/\.(js|jsx|ts|tsx|py|go|java|cs|php|rb)$/i.test(r)) return;
      groups.set(r, [r]);
    });
  }
  const groupIds = new Map();
  [...groups.entries()]
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 14)
    .forEach(([group, paths]) => {
      const id = addNode('module:' + group, {
        label: pretty(group), type: 'service',
        description: 'Исходный модуль · ' + paths.length + ' файл.' + (paths.length === 1 ? '' : 'ов'),
        zone: 'Исходный код', source: paths[0]
      }).id;
      groupIds.set(group, id);
      evidence.modules.push({ group, files: paths.length });
    });

  /* 4. Импорты между модулями */
  const importRe = /(?:from\s+|require\(\s*|import\(\s*)['"]([^'"]+)['"]|(?:^|\n)\s*(?:from|import)\s+([A-Za-z0-9_.]+)/g;
  files.forEach(file => {
    const r = rel(root, file);
    const src = r.match(/(?:^|\/)src\/([^/]+)\//);
    const ownGroup = src ? src[1] : (r.includes('/') ? r.split('/')[0] : r);
    const from = groupIds.get(ownGroup);
    if (!from) return;
    const text = readText(file);
    let m;
    while ((m = importRe.exec(text))) {
      const spec = m[1] || m[2] || '';
      for (const group of groupIds.keys()) {
        if (group === ownGroup) continue;
        const matched = group.includes('/')
          ? spec.toLowerCase().includes(path.basename(group, path.extname(group)).toLowerCase())
          : new RegExp('(^|[/@.])' + group.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '([/@.]|$)', 'i').test(spec);
        if (matched) addEdge(from, groupIds.get(group), 'импорт модуля', 'sync');
      }
    }
  });

  /* 5. Docker Compose */
  const services = composeServices(root, files);
  evidence.composeServices = services.map(s => s.name);
  const serviceIds = new Map();
  services.forEach(service => {
    const infra = INFRA.find(i => i.re.test(service.image));
    const key = infra ? 'infra:' + infra.key : 'compose:' + service.name;
    const id = addNode(key, infra ? {
      label: infra.label, type: infraType(infra.kind),
      description: infra.description, zone: 'Инфраструктура', source: service.image
    } : {
      label: pretty(service.name), type: 'service',
      description: 'Docker Compose: ' + (service.image || service.name), zone: 'Контейнеры', source: service.image
    }).id;
    serviceIds.set(service.name, id);
    if (service.ports.length) notes.push('Порты: ' + service.ports.join(', '));
  });
  services.forEach(service => {
    (service.dependsOn || []).forEach(dep => {
      if (serviceIds.has(dep)) addEdge(serviceIds.get(service.name), serviceIds.get(dep), 'зависимость запуска', 'dependency');
    });
  });

  /* 6. Заметки по умолчанию */
  const rootName = (rootPackage && rootPackage.pkg.name) || path.basename(root);
  notes.unshift('Заголовок: Архитектура проекта «' + rootName + '» (автоимпорт)');
  notes.push('Легенда: SYNC — вызов, DATA — данные, EVT — события, DEP — порядок запуска');
  notes.push('Проверьте связи вручную: схема построена статическим анализом исходников');

  const schema = {
    version: 1,
    zones: [...zones].map(name => ({ name })),
    nodes, edges,
    notes: [...new Set(notes)].slice(0, 12)
  };
  if (nodes.length < 2) evidence.warnings.push('Найдено меньше двух компонентов — проверьте, указан ли нужный каталог');
  return { schema, evidence };
}

function writeSchema(schema, output) {
  const file = path.resolve(output);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(schema, null, 2) + '\n', 'utf8');
  return file;
}

module.exports = { importProject, writeSchema };
