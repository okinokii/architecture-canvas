/* Классические архитектурные пресеты. Общий формат для браузера и MCP-сервера. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.ArchPresets = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const COLORS = {
    client: '#29c7a3', gateway: '#38bdf8', service: '#5b8cff', db: '#c084fc',
    cache: '#ffb454', queue: '#f472b6', storage: '#a3e635', external: '#94a3b8'
  };

  const n = (key, label, sub, kind, x, y, w, h, zone) =>
    ({ key, label, sub, kind, color: COLORS[kind] || COLORS.service, x, y, w: w || 190, h: h || 64, zone: zone || '' });
  const e = (from, to, label, async) => ({ from, to, label: label || '', async: !!async });
  const z = (title, x, y, w, h) => ({ title, x, y, w, h });
  const note = (text, x, y, w, h) => ({ text, x, y, w: w || 260, h: h || 52 });

  const PRESETS = [
    {
      id: 'layered',
      name: 'Слоистый монолит (3-tier)',
      description: 'Классическое разделение на презентацию, бизнес-логику и доступ к данным. Один процесс, одна транзакция.',
      tags: ['classic', 'monolith', 'crud'],
      zones: [
        z('ПРЕЗЕНТАЦИЯ', 40, 80, 250, 600),
        z('ПРИЛОЖЕНИЕ', 330, 80, 250, 600),
        z('ДАННЫЕ', 620, 80, 280, 600)
      ],
      nodes: [
        n('browser', 'Браузер', 'HTTP + JSON', 'client', 70, 210, 190, 64, 'ПРЕЗЕНТАЦИЯ'),
        n('controller', 'Controller', 'парсинг, валидация', 'gateway', 360, 210, 190, 64, 'ПРИЛОЖЕНИЕ'),
        n('service', 'Service', 'бизнес-правила', 'service', 360, 340, 190, 64, 'ПРИЛОЖЕНИЕ'),
        n('repository', 'Repository', 'DAO / SQL', 'service', 360, 470, 190, 64, 'ПРИЛОЖЕНИЕ'),
        n('postgres', 'PostgreSQL', 'реляционные данные', 'db', 660, 400, 200, 64, 'ДАННЫЕ')
      ],
      edges: [
        e('browser', 'controller', 'HTTPS'),
        e('controller', 'service', 'вызов сервиса'),
        e('service', 'repository', 'вызов DAO'),
        e('repository', 'postgres', 'SQL, транзакция')
      ],
      notes: [
        note('Граница транзакции — в Repository. Слои общаются только с соседним слоем.', 660, 540, 230, 70)
      ]
    },
    {
      id: 'mvc',
      name: 'MVC',
      description: 'Model — View — Controller. Классический шаблон для веб-интерфейсов с серверным рендерингом.',
      tags: ['classic', 'ui', 'pattern'],
      zones: [
        z('КЛИЕНТ', 40, 80, 240, 600),
        z('MVC-ПРИЛОЖЕНИЕ', 320, 80, 430, 600),
        z('ДАННЫЕ', 790, 80, 250, 600)
      ],
      nodes: [
        n('browser', 'Browser', 'HTML / AJAX', 'client', 70, 330, 180, 64, 'КЛИЕНТ'),
        n('router', 'Router', 'маршрутизация', 'gateway', 350, 200, 170, 60, 'MVC-ПРИЛОЖЕНИЕ'),
        n('controller', 'Controller', 'обрабатывает запрос', 'service', 350, 340, 170, 60, 'MVC-ПРИЛОЖЕНИЕ'),
        n('model', 'Model', 'состояние + правила', 'service', 550, 340, 170, 60, 'MVC-ПРИЛОЖЕНИЕ'),
        n('view', 'View', 'шаблоны, HTML', 'gateway', 350, 480, 170, 60, 'MVC-ПРИЛОЖЕНИЕ'),
        n('db', 'Database', 'PostgreSQL', 'db', 820, 340, 190, 64, 'ДАННЫЕ')
      ],
      edges: [
        e('browser', 'router', 'GET / POST'),
        e('router', 'controller', 'dispatch'),
        e('controller', 'model', 'read / write'),
        e('model', 'db', 'SQL'),
        e('controller', 'view', 'model → шаблон'),
        e('view', 'browser', 'HTML')
      ],
      notes: [
        note('Controller не работает с БД напрямую — только через Model.', 800, 480, 230, 60)
      ]
    },
    {
      id: 'microservices',
      name: 'Микросервисы + API Gateway',
      description: 'Независимые сервисы за шлюзом, собственные хранилища, асинхронная интеграция через брокер.',
      tags: ['classic', 'microservices', 'distributed'],
      zones: [
        z('КЛИЕНТЫ', 40, 80, 220, 600),
        z('ГРАНИЦА', 300, 80, 220, 600),
        z('СЕРВИСЫ', 560, 80, 330, 600),
        z('ИНФРАСТРУКТУРА', 930, 80, 260, 600)
      ],
      nodes: [
        n('client', 'Web / Mobile', 'HTTP', 'client', 70, 330, 160, 60, 'КЛИЕНТЫ'),
        n('gateway', 'API Gateway', 'роутинг, JWT, лимиты', 'gateway', 330, 330, 160, 64, 'ГРАНИЦА'),
        n('auth', 'Auth Service', 'токены', 'service', 590, 180, 150, 60, 'СЕРВИСЫ'),
        n('orders', 'Orders Service', 'заказы', 'service', 590, 330, 150, 60, 'СЕРВИСЫ'),
        n('catalog', 'Catalog Service', 'товары', 'service', 590, 480, 150, 60, 'СЕРВИСЫ'),
        n('notify', 'Notify Service', 'email / push', 'service', 760, 330, 120, 60, 'СЕРВИСЫ'),
        n('pg', 'PostgreSQL', 'данные сервисов', 'db', 960, 200, 200, 60, 'ИНФРАСТРУКТУРА'),
        n('redis', 'Redis', 'кэш, сессии', 'cache', 960, 340, 200, 60, 'ИНФРАСТРУКТУРА'),
        n('kafka', 'Kafka', 'события', 'queue', 960, 480, 200, 60, 'ИНФРАСТРУКТУРА')
      ],
      edges: [
        e('client', 'gateway', 'HTTPS'),
        e('gateway', 'auth', 'проверка токена'),
        e('gateway', 'orders', 'REST'),
        e('gateway', 'catalog', 'REST'),
        e('orders', 'pg', 'SQL'),
        e('catalog', 'redis', 'кэш'),
        e('orders', 'kafka', 'order.created', true),
        e('kafka', 'notify', 'consume', true)
      ],
      notes: [
        note('У каждого сервиса своя БД — общую схему не использовать.', 960, 570, 230, 60)
      ]
    },
    {
      id: 'event-driven',
      name: 'Событийно-ориентированная архитектура',
      description: 'Producer публикует события в брокер, независимые consumer-ы реагируют асинхронно.',
      tags: ['classic', 'eda', 'async'],
      zones: [
        z('ПРОДЮСЕРЫ', 40, 80, 250, 600),
        z('БРОКЕР', 330, 80, 250, 600),
        z('КОНСЬЮМЕРЫ', 620, 80, 300, 600),
        z('ХРАНИЛИЩА', 960, 80, 250, 600)
      ],
      nodes: [
        n('api', 'Command API', 'POST /events', 'gateway', 70, 320, 190, 64, 'ПРОДЮСЕРЫ'),
        n('producer', 'Event Producer', 'валидация, publish', 'service', 70, 460, 190, 64, 'ПРОДЮСЕРЫ'),
        n('broker', 'Kafka', 'топики, retention', 'queue', 360, 330, 190, 70, 'БРОКЕР'),
        n('audit', 'Audit Consumer', 'журнал событий', 'service', 650, 200, 190, 60, 'КОНСЬЮМЕРЫ'),
        n('notify', 'Notify Consumer', 'уведомления', 'service', 650, 340, 190, 60, 'КОНСЬЮМЕРЫ'),
        n('projector', 'Projection Worker', 'read model', 'service', 650, 480, 190, 60, 'КОНСЬЮМЕРЫ'),
        n('logdb', 'Event Log', 'append-only', 'db', 990, 200, 190, 60, 'ХРАНИЛИЩА'),
        n('readdb', 'Read Model DB', 'проекции', 'db', 990, 480, 190, 60, 'ХРАНИЛИЩА')
      ],
      edges: [
        e('api', 'producer', 'команда'),
        e('producer', 'broker', 'publish', true),
        e('broker', 'audit', 'consume', true),
        e('broker', 'notify', 'consume', true),
        e('broker', 'projector', 'consume', true),
        e('audit', 'logdb', 'append'),
        e('projector', 'readdb', 'upsert')
      ],
      notes: [
        note('Связи с брокером асинхронные (пунктир): eventual consistency.', 990, 340, 220, 70)
      ]
    },
    {
      id: 'cqrs',
      name: 'CQRS + Event Sourcing',
      description: 'Разделение команд и запросов: запись в event store, проекции в read model, чтение из отдельного API.',
      tags: ['classic', 'cqrs', 'event-sourcing'],
      zones: [
        z('COMMAND SIDE', 40, 80, 420, 600),
        z('EVENT BUS', 500, 80, 220, 600),
        z('QUERY SIDE', 760, 80, 440, 600)
      ],
      nodes: [
        n('client', 'Client', 'HTTP', 'client', 70, 330, 160, 60, 'COMMAND SIDE'),
        n('cmdapi', 'Command API', 'POST /commands', 'gateway', 260, 330, 170, 60, 'COMMAND SIDE'),
        n('handler', 'Command Handler', 'агрегат, валидация', 'service', 260, 200, 170, 60, 'COMMAND SIDE'),
        n('eventstore', 'Event Store', 'append-only', 'db', 70, 200, 160, 60, 'COMMAND SIDE'),
        n('bus', 'Event Bus', 'RabbitMQ / Kafka', 'queue', 540, 330, 150, 64, 'EVENT BUS'),
        n('projector', 'Projector', 'применяет события', 'service', 800, 200, 170, 60, 'QUERY SIDE'),
        n('readdb', 'Read Model DB', 'PostgreSQL / ES', 'db', 800, 340, 170, 60, 'QUERY SIDE'),
        n('queryapi', 'Query API', 'GET /items', 'gateway', 1000, 340, 170, 60, 'QUERY SIDE')
      ],
      edges: [
        e('client', 'cmdapi', 'команда'),
        e('cmdapi', 'handler', 'handle'),
        e('handler', 'eventstore', 'append events'),
        e('handler', 'bus', 'publish', true),
        e('bus', 'projector', 'subscribe', true),
        e('projector', 'readdb', 'upsert'),
        e('client', 'queryapi', 'запрос'),
        e('queryapi', 'readdb', 'SELECT')
      ],
      notes: [
        note('Read model может отставать — это нормально (eventual consistency).', 800, 480, 380, 55),
        note('Источник истины — Event Store, а не Read Model.', 800, 550, 380, 55)
      ]
    },
    {
      id: 'hexagonal',
      name: 'Гексагональная (Ports & Adapters)',
      description: 'Ядро приложения не зависит от инфраструктуры: взаимодействия идут через порты и адаптеры.',
      tags: ['classic', 'ddd', 'hexagonal'],
      zones: [
        z('ВНЕШНИЕ АДАПТЕРЫ', 40, 80, 260, 600),
        z('ПОРТЫ', 340, 80, 200, 600),
        z('ЯДРО', 580, 80, 260, 600),
        z('АДАПТЕРЫ ИНФРАСТРУКТУРЫ', 880, 80, 320, 600)
      ],
      nodes: [
        n('http', 'HTTP Adapter', 'REST controller', 'gateway', 70, 230, 200, 60, 'ВНЕШНИЕ АДАПТЕРЫ'),
        n('cli', 'CLI Adapter', 'команды', 'client', 70, 380, 200, 60, 'ВНЕШНИЕ АДАПТЕРЫ'),
        n('inport', 'Inbound Port', 'Use Case интерфейс', 'service', 370, 310, 140, 64, 'ПОРТЫ'),
        n('core', 'Application Core', 'домен, бизнес-правила', 'service', 610, 310, 190, 70, 'ЯДРО'),
        n('outport', 'Outbound Port', 'Repository интерфейс', 'service', 850, 310, 150, 64, 'АДАПТЕРЫ ИНФРАСТРУКТУРЫ'),
        n('dbadapter', 'DB Adapter', 'PostgreSQL', 'db', 1030, 220, 150, 60, 'АДАПТЕРЫ ИНФРАСТРУКТУРЫ'),
        n('mqadapter', 'MQ Adapter', 'Kafka', 'queue', 1030, 400, 150, 60, 'АДАПТЕРЫ ИНФРАСТРУКТУРЫ')
      ],
      edges: [
        e('http', 'inport', 'вызов use case'),
        e('cli', 'inport', 'вызов use case'),
        e('inport', 'core', 'реализация'),
        e('core', 'outport', 'сохранение'),
        e('outport', 'dbadapter', 'реализация порта'),
        e('outport', 'mqadapter', 'реализация порта')
      ],
      notes: [
        note('Ядро не импортирует PostgreSQL/Kafka — только интерфейсы портов.', 880, 520, 320, 70)
      ]
    },
    {
      id: 'serverless',
      name: 'Serverless',
      description: 'API Gateway вызывает функции по запросу; данные в managed-хранилищах, фоновые задачи через шину событий.',
      tags: ['classic', 'serverless', 'cloud'],
      zones: [
        z('КЛИЕНТЫ', 40, 80, 230, 600),
        z('ГРАНИЦА', 310, 80, 230, 600),
        z('ФУНКЦИИ', 580, 80, 300, 600),
        z('MANAGED SERVICES', 920, 80, 290, 600)
      ],
      nodes: [
        n('client', 'Web / Mobile', 'HTTPS', 'client', 70, 330, 170, 60, 'КЛИЕНТЫ'),
        n('gw', 'API Gateway', 'маршруты, авторизация', 'gateway', 340, 330, 170, 64, 'ГРАНИЦА'),
        n('fn', 'Handler Lambda', 'бизнес-логика', 'service', 620, 240, 220, 64, 'ФУНКЦИИ'),
        n('worker', 'Worker Lambda', 'фоновые задачи', 'service', 620, 450, 220, 64, 'ФУНКЦИИ'),
        n('db', 'DynamoDB', 'NoSQL', 'db', 950, 200, 220, 60, 'MANAGED SERVICES'),
        n('s3', 'Object Storage', 'файлы', 'storage', 950, 340, 220, 60, 'MANAGED SERVICES'),
        n('bus', 'EventBridge', 'события', 'queue', 950, 480, 220, 60, 'MANAGED SERVICES')
      ],
      edges: [
        e('client', 'gw', 'HTTPS'),
        e('gw', 'fn', 'invoke'),
        e('fn', 'db', 'SDK'),
        e('fn', 's3', 'SDK'),
        e('fn', 'bus', 'событие', true),
        e('bus', 'worker', 'trigger', true)
      ],
      notes: [
        note('Functions stateless — состояние только во внешних хранилищах.', 950, 570, 250, 60)
      ]
    }
  ];

  function labelOf(preset, key) {
    const node = preset.nodes.find(x => x.key === key);
    return node ? node.label : key;
  }

  function zoneOfNode(preset, node) {
    if (node.zone) return node.zone;
    const cx = node.x + node.w / 2, cy = node.y + node.h / 2;
    const zone = preset.zones.find(z => cx >= z.x && cx <= z.x + z.w && cy >= z.y && cy <= z.y + z.h);
    return zone ? zone.title : '';
  }

  function toSchema(preset) {
    if (!preset) throw new Error('Пресет не найден');
    return {
      version: 1,
      zones: preset.zones.map(z => z.title),
      nodes: preset.nodes.map(node => ({
        id: node.key,
        label: node.label,
        type: node.kind,
        description: node.sub || '',
        zone: zoneOfNode(preset, node),
        source: 'preset:' + preset.id
      })),
      edges: preset.edges.map(edge => ({
        from: edge.from,
        fromLabel: labelOf(preset, edge.from),
        to: edge.to,
        toLabel: labelOf(preset, edge.to),
        label: edge.label,
        async: !!edge.async
      })),
      notes: preset.notes.map(n => n.text)
    };
  }

  function get(id) { return PRESETS.find(p => p.id === id); }

  return { presets: PRESETS, get, toSchema, zoneOfNode };
});
