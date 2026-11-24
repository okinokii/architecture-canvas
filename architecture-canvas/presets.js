/* Классические архитектурные пресеты. Общий формат для браузера и MCP-сервера. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.ArchPresets = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const COLORS = {
    client: '#29c7a3', gateway: '#38bdf8', service: '#5b8cff', db: '#c084fc',
    cache: '#ffb454', queue: '#f472b6', storage: '#a3e635', external: '#94a3b8',
    monitoring: '#22d3ee', daemon: '#a3e635', worker: '#fb923c', scheduler: '#facc15',
    balancer: '#60a5fa', auth: '#e879f9', analytics: '#34d399', ci: '#818cf8',
    config: '#94a3b8', firewall: '#f87171', ai: '#f0abfc', vector: '#c084fc'
  };

  const n = (key, label, sub, kind, x, y, w, h, zone) =>
    ({ key, label, sub, kind, color: COLORS[kind] || COLORS.service, x, y, w: w || 190, h: h || 64, zone: zone || '' });
  const e = (from, to, label, async, kind) => ({
    from, to, label: label || '',
    async: !!(async || (kind === 'event')),
    kind: kind || (async ? 'async' : 'sync')
  });
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
    },
    {
      id: 'modular-monolith',
      name: 'Модульный монолит',
      description: 'Один процесс и одна БД, но строгие границы модулей и транзакционный outbox для интеграции.',
      tags: ['classic', 'monolith', 'modules', 'outbox'],
      zones: [
        z('API', 40, 80, 250, 600),
        z('МОДУЛИ', 330, 80, 480, 600),
        z('ИНФРАСТРУКТУРА', 850, 80, 320, 600)
      ],
      nodes: [
        n('web', 'Web / Mobile', 'HTTP-клиенты', 'client', 70, 210, 180, 64, 'API'),
        n('facade', 'Application Facade', 'единая точка входа', 'gateway', 360, 210, 170, 64, 'МОДУЛИ'),
        n('orders', 'Orders Module', 'заказы', 'service', 360, 340, 170, 64, 'МОДУЛИ'),
        n('billing', 'Billing Module', 'оплата, тарифы', 'service', 560, 340, 170, 64, 'МОДУЛИ'),
        n('catalog', 'Catalog Module', 'товары, остатки', 'service', 560, 470, 170, 64, 'МОДУЛИ'),
        n('outbox', 'Transactional Outbox', 'таблица событий', 'queue', 760, 340, 140, 64, 'МОДУЛИ'),
        n('postgres', 'PostgreSQL', 'общая БД, одна транзакция', 'db', 880, 210, 230, 64, 'ИНФРАСТРУКТУРА'),
        n('bus', 'Event Bus', 'Kafka / RabbitMQ', 'queue', 880, 440, 230, 64, 'ИНФРАСТРУКТУРА')
      ],
      edges: [
        e('web', 'facade', 'HTTPS', false, 'sync'),
        e('facade', 'orders', 'вызов модуля', false, 'sync'),
        e('orders', 'billing', 'тарификация', false, 'sync'),
        e('orders', 'catalog', 'проверка остатков', false, 'sync'),
        e('orders', 'outbox', 'event record', false, 'data'),
        e('outbox', 'bus', 'publish', false, 'event'),
        e('orders', 'postgres', 'SQL, транзакция', false, 'data'),
        e('billing', 'postgres', 'SQL', false, 'data')
      ],
      notes: [
        note('Outbox пишется в той же транзакции, что и заказ — события не теряются.', 850, 560, 290, 70)
      ]
    },
    {
      id: 'clean',
      name: 'Чистая архитектура',
      description: 'Ядро зависит только от интерфейсов портов; адаптеры подключают PostgreSQL, брокер и HTTP.',
      tags: ['classic', 'ddd', 'clean', 'ports'],
      zones: [
        z('ВНЕШНИЙ СЛОЙ', 40, 80, 250, 600),
        z('АДАПТЕРЫ', 330, 80, 230, 600),
        z('ЯДРО', 600, 80, 260, 600),
        z('ИНФРАСТРУКТУРА', 900, 80, 300, 600)
      ],
      nodes: [
        n('http', 'HTTP API', 'REST / JSON', 'gateway', 70, 240, 180, 64, 'ВНЕШНИЙ СЛОЙ'),
        n('controller', 'Controller', 'разбор запроса', 'gateway', 360, 240, 160, 64, 'АДАПТЕРЫ'),
        n('usecase', 'Use Case', 'прикладная логика', 'service', 630, 240, 190, 70, 'ЯДРО'),
        n('entity', 'Domain Entity', 'инварианты', 'service', 630, 410, 190, 64, 'ЯДРО'),
        n('outport', 'Outbound Port', 'interface Repository', 'service', 630, 550, 190, 64, 'ЯДРО'),
        n('pgadapter', 'DB Adapter', 'реализация порта', 'db', 930, 200, 220, 64, 'ИНФРАСТРУКТУРА'),
        n('mqadapter', 'MQ Adapter', 'реализация порта', 'queue', 930, 380, 220, 64, 'ИНФРАСТРУКТУРА'),
        n('postgres', 'PostgreSQL', 'данные', 'db', 930, 540, 220, 64, 'ИНФРАСТРУКТУРА')
      ],
      edges: [
        e('http', 'controller', 'HTTP', false, 'sync'),
        e('controller', 'usecase', 'вызов use case', false, 'sync'),
        e('usecase', 'entity', 'доменные правила', false, 'sync'),
        e('usecase', 'outport', 'Repository interface', false, 'dependency'),
        e('outport', 'pgadapter', 'реализация', false, 'dependency'),
        e('outport', 'mqadapter', 'реализация', false, 'dependency'),
        e('pgadapter', 'postgres', 'SQL', false, 'data')
      ],
      notes: [
        note('Ядро не знает о PostgreSQL/Kafka — только интерфейсы портов. DEP-связи не должны образовывать цикл.', 900, 620, 320, 70)
      ]
    },
    {
      id: 'bff',
      name: 'Backend for Frontend',
      description: 'Отдельный BFF под каждый клиент: меньше лишних полей и не зависят друг от друга релизы web и mobile.',
      tags: ['api', 'bff', 'frontend'],
      zones: [
        z('КЛИЕНТЫ', 40, 80, 230, 600),
        z('BFF', 310, 80, 300, 600),
        z('ДОМЕННЫЕ СЕРВИСЫ', 650, 80, 300, 600),
        z('ХРАНИЛИЩА', 990, 80, 240, 600)
      ],
      nodes: [
        n('web', 'Web SPA', 'браузер', 'client', 70, 250, 160, 60, 'КЛИЕНТЫ'),
        n('mobile', 'Mobile App', 'iOS / Android', 'client', 70, 430, 160, 60, 'КЛИЕНТЫ'),
        n('webbff', 'Web BFF', 'агрегация для web', 'gateway', 350, 250, 210, 64, 'BFF'),
        n('mobilebff', 'Mobile BFF', 'агрегация для mobile', 'gateway', 350, 430, 210, 64, 'BFF'),
        n('auth', 'Auth Service', 'токены, JWT', 'service', 680, 170, 210, 60, 'ДОМЕННЫЕ СЕРВИСЫ'),
        n('orders', 'Orders Service', 'заказы', 'service', 680, 320, 210, 60, 'ДОМЕННЫЕ СЕРВИСЫ'),
        n('catalog', 'Catalog Service', 'товары', 'service', 680, 470, 210, 60, 'ДОМЕННЫЕ СЕРВИСЫ'),
        n('pg', 'PostgreSQL', 'заказы', 'db', 1020, 320, 180, 60, 'ХРАНИЛИЩА'),
        n('redis', 'Redis', 'кэш каталога', 'cache', 1020, 470, 180, 60, 'ХРАНИЛИЩА')
      ],
      edges: [
        e('web', 'webbff', 'HTTPS', false, 'sync'),
        e('mobile', 'mobilebff', 'HTTPS', false, 'sync'),
        e('webbff', 'orders', 'REST', false, 'sync'),
        e('webbff', 'auth', 'JWT', false, 'auth'),
        e('mobilebff', 'catalog', 'REST', false, 'sync'),
        e('mobilebff', 'auth', 'JWT', false, 'auth'),
        e('orders', 'pg', 'SQL', false, 'data'),
        e('catalog', 'redis', 'кэш', false, 'data')
      ],
      notes: [
        note('Каждый BFF owns свою модель ответа — общий GraphQL-слой здесь не нужен.', 990, 570, 240, 70)
      ]
    },
    {
      id: 'streaming',
      name: 'Streaming / Kappa',
      description: 'Все данные идут через брокер: CDC и телеметрия → stream-обработка → OLAP, поиск и алерты.',
      tags: ['streaming', 'kafka', 'kappa', 'etl'],
      zones: [
        z('ИСТОЧНИКИ', 40, 80, 250, 600),
        z('БРОКЕР', 330, 80, 240, 600),
        z('ОБРАБОТКА', 610, 80, 320, 600),
        z('ВЫХОДЫ', 970, 80, 260, 600)
      ],
      nodes: [
        n('cdc', 'CDC Connector', 'Debezium', 'db', 70, 220, 180, 64, 'ИСТОЧНИКИ'),
        n('iot', 'IoT Devices', 'телеметрия', 'external', 70, 430, 180, 64, 'ИСТОЧНИКИ'),
        n('kafka', 'Kafka', 'топики, retention', 'queue', 360, 320, 180, 70, 'БРОКЕР'),
        n('flink', 'Flink Job', 'фильтры, обогащение', 'service', 640, 240, 230, 70, 'ОБРАБОТКА'),
        n('window', 'Window Aggregator', 'tumbling window', 'service', 640, 430, 230, 64, 'ОБРАБОТКА'),
        n('olap', 'OLAP Store', 'ClickHouse', 'db', 1000, 180, 200, 64, 'ВЫХОДЫ'),
        n('search', 'Search Index', 'Elasticsearch', 'storage', 1000, 360, 200, 64, 'ВЫХОДЫ'),
        n('alert', 'Alerter', 'PagerDuty / Slack', 'external', 1000, 520, 200, 64, 'ВЫХОДЫ')
      ],
      edges: [
        e('cdc', 'kafka', 'CDC', false, 'event'),
        e('iot', 'kafka', 'телеметрия', false, 'event'),
        e('kafka', 'flink', 'consume', false, 'event'),
        e('flink', 'window', 'windowing', false, 'data'),
        e('window', 'olap', 'upsert', false, 'data'),
        e('window', 'search', 'index', false, 'data'),
        e('flink', 'alert', 'anomaly', false, 'event')
      ],
      notes: [
        note('Один поток и один источник истины — батч и realtime не расходятся.', 970, 610, 250, 70)
      ]
    },
    {
      id: 'microfrontend',
      name: 'Микрофронтенды',
      description: 'Module Federation собирает независимые UI-модули в один shell; общие библиотеки вынесены отдельно.',
      tags: ['frontend', 'ui', 'module-federation'],
      zones: [
        z('БРАУЗЕР', 40, 80, 260, 600),
        z('КОМПОЗИЦИЯ', 340, 80, 260, 600),
        z('УДАЛЁННЫЕ МОДУЛИ', 640, 80, 360, 600),
        z('ОБЩИЕ БИБЛИОТЕКИ', 1040, 80, 220, 600)
      ],
      nodes: [
        n('shell', 'App Shell', 'роутинг, тема', 'client', 70, 300, 190, 70, 'БРАУЗЕР'),
        n('federation', 'Module Federation', 'remote modules', 'gateway', 370, 300, 190, 70, 'КОМПОЗИЦИЯ'),
        n('catalog', 'Catalog MFE', 'товары', 'service', 680, 180, 240, 64, 'УДАЛЁННЫЕ МОДУЛИ'),
        n('cart', 'Cart MFE', 'корзина', 'service', 680, 340, 240, 64, 'УДАЛЁННЫЕ МОДУЛИ'),
        n('account', 'Account MFE', 'профиль', 'service', 680, 500, 240, 64, 'УДАЛЁННЫЕ МОДУЛИ'),
        n('design', 'Design System', 'UI kit, токены', 'external', 1070, 260, 160, 64, 'ОБЩИЕ БИБЛИОТЕКИ'),
        n('authsdk', 'Auth SDK', 'JWT, сессия', 'external', 1070, 450, 160, 64, 'ОБЩИЕ БИБЛИОТЕКИ')
      ],
      edges: [
        e('shell', 'federation', 'загрузка модулей', false, 'sync'),
        e('federation', 'catalog', 'import', false, 'sync'),
        e('federation', 'cart', 'import', false, 'sync'),
        e('federation', 'account', 'import', false, 'sync'),
        e('catalog', 'design', 'UI kit', false, 'dependency'),
        e('cart', 'design', 'UI kit', false, 'dependency'),
        e('shell', 'authsdk', 'JWT', false, 'auth')
      ],
      notes: [
        note('Версии общих библиотек фиксируются в shell — иначе модальные окна разъедутся.', 1040, 560, 220, 70)
      ]
    },
    {
      id: 'service-mesh',
      name: 'Service Mesh / Zero Trust',
      description: 'mTLS и политики между сервисами через sidecar-прокси; телеметрия с трассировками.',
      tags: ['mesh', 'security', 'zero-trust', 'observability'],
      zones: [
        z('КЛИЕНТ', 40, 80, 220, 600),
        z('SERVICE MESH', 300, 80, 400, 600),
        z('СЕРВИСЫ', 740, 80, 300, 600),
        z('ПОЛИТИКИ И ТЕЛЕМЕТРИЯ', 1080, 80, 260, 600)
      ],
      nodes: [
        n('client', 'Client', 'HTTPS', 'client', 70, 330, 150, 60, 'КЛИЕНТ'),
        n('ingress', 'Ingress Gateway', 'точка входа', 'gateway', 330, 330, 150, 64, 'SERVICE MESH'),
        n('envoyA', 'Envoy SIDECAR-A', 'mTLS, policy', 'gateway', 530, 200, 140, 60, 'SERVICE MESH'),
        n('envoyB', 'Envoy SIDECAR-B', 'mTLS, policy', 'gateway', 530, 450, 140, 60, 'SERVICE MESH'),
        n('svcA', 'Service A', 'заказы', 'service', 770, 200, 190, 60, 'СЕРВИСЫ'),
        n('svcB', 'Service B', 'платежи', 'service', 770, 450, 190, 60, 'СЕРВИСЫ'),
        n('iam', 'IAM / SPIRE', 'идентичности', 'external', 1110, 200, 190, 60, 'ПОЛИТИКИ И ТЕЛЕМЕТРИЯ'),
        n('otel', 'OpenTelemetry', 'трейсы, метрики', 'service', 1110, 450, 190, 60, 'ПОЛИТИКИ И ТЕЛЕМЕТРИЯ')
      ],
      edges: [
        e('client', 'ingress', 'HTTPS', false, 'sync'),
        e('ingress', 'envoyA', 'mTLS', false, 'auth'),
        e('envoyA', 'svcA', 'gRPC', false, 'sync'),
        e('svcA', 'envoyB', 'вызов сервиса', false, 'sync'),
        e('envoyB', 'svcB', 'gRPC', false, 'sync'),
        e('iam', 'envoyA', 'JWT / SPIFFE', false, 'auth'),
        e('iam', 'envoyB', 'JWT / SPIFFE', false, 'auth'),
        e('envoyA', 'otel', 'трейсы', false, 'data'),
        e('envoyB', 'otel', 'трейсы', false, 'data')
      ],
      notes: [
        note('Сервисы не доверяют сети: идентичность выдаётся IAM, трафик подписывается mTLS.', 1080, 560, 260, 70)
      ]
    },

    /* ---------- Дополнительные архитектурные практики ---------- */
    {
      id: 'data-lake',
      name: 'Data Lake / Лямбда-архитектура',
      description: 'Сырые события идут и в потоковую обработку, и в архив; batch пересчитывает историю, stream даёт свежие метрики.',
      tags: ['data', 'streaming', 'analytics', 'lake'],
      zones: [z('ИСТОЧНИКИ', 40, 80, 220, 600), z('STREAM', 300, 80, 260, 600), z('BATCH', 600, 80, 260, 600), z('ПОТРЕБЛЕНИЕ', 900, 80, 300, 600)],
      nodes: [
        n('events', 'События / логи', 'клики, треки', 'client', 70, 260, 180, 60, 'ИСТОЧНИКИ'),
        n('kafka', 'Kafka', 'raw events', 'queue', 330, 200, 200, 60, 'STREAM'),
        n('flink', 'Flink / Streaming', 'окна, агрегаты', 'worker', 330, 390, 200, 60, 'STREAM'),
        n('lake', 'S3 / Data Lake', 'сырые parquet', 'storage', 630, 200, 200, 60, 'BATCH'),
        n('spark', 'Spark Batch', 'пересчёт витрин', 'worker', 630, 390, 200, 60, 'BATCH'),
        n('olap', 'ClickHouse / OLAP', 'витрины и срезы', 'analytics', 930, 260, 220, 60, 'ПОТРЕБЛЕНИЕ'),
        n('bi', 'BI / Дашборды', 'отчёты, метрики', 'client', 930, 450, 220, 60, 'ПОТРЕБЛЕНИЕ')
      ],
      edges: [
        e('events', 'kafka', 'events', true, 'event'),
        e('events', 'lake', 'архив', false, 'data'),
        e('kafka', 'flink', 'consume', true, 'event'),
        e('flink', 'olap', 'real-time метрики', false, 'data'),
        e('lake', 'spark', 'parquet', false, 'data'),
        e('spark', 'olap', 'витрины', false, 'data'),
        e('olap', 'bi', 'SQL', false, 'sync')
      ],
      notes: [
        note('Заголовок: Data Lake — лямбда-архитектура (stream + batch).', 900, 560, 300, 50),
        note('Легенда: EVT — события, DATA — данные, SYNC — запрос.', 900, 620, 300, 44),
        note('Batch пересчитывает историю, stream даёт свежие метрики.', 70, 540, 250, 60)
      ]
    },
    {
      id: 'ml-serving',
      name: 'ML-сервинг и Feature Store',
      description: 'Обучение и инференс разделены: признаки из одного источника, модель в registry, онлайн-предсказания и контроль дрейфа.',
      tags: ['ml', 'ai', 'data', 'serving'],
      zones: [z('ДАННЫЕ', 40, 80, 230, 600), z('ОБУЧЕНИЕ', 310, 80, 250, 600), z('СЕРВИНГ', 600, 80, 280, 600), z('НАБЛЮДЕНИЕ', 920, 80, 280, 600)],
      nodes: [
        n('raw', 'Сырые данные', 'события, БД', 'db', 70, 230, 190, 60, 'ДАННЫЕ'),
        n('features', 'Feature Store', 'онлайн + офлайн', 'storage', 70, 410, 190, 60, 'ДАННЫЕ'),
        n('trainer', 'Training Job', 'пайплайн обучения', 'worker', 340, 230, 190, 60, 'ОБУЧЕНИЕ'),
        n('registry', 'Model Registry', 'версии модели', 'config', 340, 410, 190, 60, 'ОБУЧЕНИЕ'),
        n('api', 'Inference API', 'REST / gRPC', 'gateway', 630, 240, 200, 60, 'СЕРВИНГ'),
        n('model', 'Модель', 'скоринг', 'ai', 630, 420, 200, 60, 'СЕРВИНГ'),
        n('monitor', 'Мониторинг', 'дрейф, latency', 'monitoring', 950, 240, 200, 60, 'НАБЛЮДЕНИЕ'),
        n('retrain', 'Переобучение', 'cron / календарь', 'scheduler', 950, 420, 200, 60, 'НАБЛЮДЕНИЕ')
      ],
      edges: [
        e('raw', 'features', 'ETL признаков', false, 'data'),
        e('features', 'trainer', 'dataset', false, 'data'),
        e('trainer', 'registry', 'новая версия', false, 'data'),
        e('registry', 'model', 'deploy версии', false, 'data'),
        e('features', 'model', 'онлайн-признаки', false, 'data'),
        e('api', 'model', 'predict', false, 'sync'),
        e('api', 'monitor', 'метрики запросов', false, 'data'),
        e('monitor', 'retrain', 'дрейф > порога', true, 'event'),
        e('retrain', 'trainer', 'запуск job', true, 'event')
      ],
      notes: [
        note('Заголовок: ML-сервинг с Feature Store и переобучением по дрейфу.', 920, 550, 300, 50),
        note('Легенда: DATA — признаки/модель, SYNC — инференс, EVT — событие переобучения.', 920, 610, 300, 50)
      ]
    },
    {
      id: 'rag-chat',
      name: 'RAG-чат (LLM + векторная БД)',
      description: 'Вопрос пользователя → эмбеддинг → поиск по базе знаний → контекст для LLM → ответ; трассировка и логи в мониторинг.',
      tags: ['ai', 'llm', 'rag', 'vector'],
      zones: [z('КЛИЕНТ', 40, 80, 220, 600), z('ПРИЛОЖЕНИЕ', 300, 80, 250, 600), z('ЗНАНИЯ', 590, 80, 250, 600), z('МОДЕЛЬ И КОНТРОЛЬ', 880, 80, 300, 600)],
      nodes: [
        n('user', 'Пользователь', 'чат / web', 'client', 70, 320, 180, 60, 'КЛИЕНТ'),
        n('api', 'Chat API', 'сессия, лимиты', 'gateway', 330, 200, 190, 60, 'ПРИЛОЖЕНИЕ'),
        n('orch', 'RAG Orchestrator', 'prompt + контекст', 'worker', 330, 390, 190, 60, 'ПРИЛОЖЕНИЕ'),
        n('embed', 'Embedder', 'вектор запроса', 'worker', 620, 200, 190, 60, 'ЗНАНИЯ'),
        n('vector', 'Векторная БД', 'top-k чанков', 'vector', 620, 390, 190, 60, 'ЗНАНИЯ'),
        n('llm', 'LLM', 'генерация ответа', 'ai', 910, 200, 190, 60, 'МОДЕЛЬ И КОНТРОЛЬ'),
        n('answer', 'Ответ / UI', 'стриминг токенов', 'client', 910, 390, 190, 60, 'МОДЕЛЬ И КОНТРОЛЬ'),
        n('monitor', 'Мониторинг', 'трассировки, оценка', 'monitoring', 1090, 500, 170, 60, 'МОДЕЛЬ И КОНТРОЛЬ')
      ],
      edges: [
        e('user', 'api', 'вопрос', false, 'sync'),
        e('api', 'orch', 'запрос + история', false, 'sync'),
        e('orch', 'embed', 'embed запроса', false, 'sync'),
        e('embed', 'vector', 'векторный поиск', false, 'data'),
        e('vector', 'llm', 'релевантные чанки', false, 'data'),
        e('orch', 'llm', 'prompt + контекст', false, 'sync'),
        e('llm', 'answer', 'ответ', false, 'sync'),
        e('answer', 'user', 'показать ответ', false, 'sync'),
        e('orch', 'monitor', 'логи/трассировка', false, 'data')
      ],
      notes: [
        note('Заголовок: RAG-чат: сообщение → поиск знаний → реакция LLM → результат.', 880, 560, 300, 50),
        note('Легенда: SYNC — вызов, DATA — контекст, мониторинг видит всю цепочку.', 880, 620, 300, 44)
      ]
    },
    {
      id: 'iot',
      name: 'IoT-телеметрия',
      description: 'Датчики через MQTT-брокер и правила попадают в stream-обработку, Timeseries DB и дашборд; пороги уходят в алерты.',
      tags: ['iot', 'mqtt', 'streaming', 'timeseries'],
      zones: [z('УСТРОЙСТВА', 40, 80, 220, 600), z('БРОКЕР', 300, 80, 230, 600), z('ОБРАБОТКА', 570, 80, 270, 600), z('ХРАНЕНИЕ И UI', 880, 80, 300, 600)],
      nodes: [
        n('sensors', 'Датчики', 'MQTT / LoRa', 'client', 70, 300, 180, 60, 'УСТРОЙСТВА'),
        n('gw', 'IoT Gateway', 'агрегация, TLS', 'balancer', 330, 200, 180, 60, 'БРОКЕР'),
        n('mqtt', 'MQTT Broker', 'topics, QoS', 'queue', 330, 390, 180, 60, 'БРОКЕР'),
        n('rules', 'Rules Engine', 'фильтры, пороги', 'worker', 600, 220, 190, 60, 'ОБРАБОТКА'),
        n('stream', 'Stream Processor', 'окна, агрегаты', 'worker', 600, 410, 190, 60, 'ОБРАБОТКА'),
        n('tsdb', 'Timeseries DB', 'метрики времени', 'db', 910, 220, 220, 60, 'ХРАНЕНИЕ И UI'),
        n('alerts', 'Алерты', 'SMS / email / push', 'monitoring', 910, 410, 220, 60, 'ХРАНЕНИЕ И UI'),
        n('dash', 'Дашборд', 'графики, карты', 'client', 910, 560, 220, 60, 'ХРАНЕНИЕ И UI')
      ],
      edges: [
        e('sensors', 'gw', 'телеметрия', true, 'event'),
        e('gw', 'mqtt', 'publish', true, 'event'),
        e('mqtt', 'rules', 'subscribe', true, 'event'),
        e('rules', 'stream', 'очищенные события', true, 'event'),
        e('rules', 'alerts', 'порог превышен', false, 'event'),
        e('stream', 'tsdb', 'точки данных', false, 'data'),
        e('tsdb', 'dash', 'запросы', false, 'sync')
      ],
      notes: [
        note('Заголовок: IoT-телеметрия: сообщение датчика → реакция правил → результат в БД и алертах.', 880, 640, 300, 44),
        note('Легенда: EVT — MQTT-события, DATA — запись в БД, SYNC — запрос дашборда.', 880, 690, 300, 44)
      ]
    },
    {
      id: 'ecommerce',
      name: 'E-commerce: заказ и оплата',
      description: 'Каталог и корзина → оформление заказа → оплата и резерв остатков → события в брокере → уведомление и аналитика.',
      tags: ['business', 'ecommerce', 'payments', 'inventory'],
      zones: [z('КЛИЕНТ', 40, 80, 210, 600), z('КАТАЛОГ', 290, 80, 240, 600), z('ЗАКАЗ И ОПЛАТА', 570, 80, 310, 600), z('ИНФРАСТРУКТУРА', 920, 80, 280, 600)],
      nodes: [
        n('browser', 'Магазин (Web/Mobile)', 'каталог, корзина', 'client', 70, 330, 170, 60, 'КЛИЕНТ'),
        n('gateway', 'API Gateway', 'роутинг, сессии', 'gateway', 320, 330, 180, 60, 'КАТАЛОГ'),
        n('catalog', 'Catalog Service', 'товары, цены', 'service', 320, 170, 180, 60, 'КАТАЛОГ'),
        n('cart', 'Cart (Redis)', 'корзина', 'cache', 320, 490, 180, 60, 'КАТАЛОГ'),
        n('orders', 'Order Service', 'заказы, статусы', 'service', 600, 250, 190, 60, 'ЗАКАЗ И ОПЛАТА'),
        n('payment', 'Payment Provider', 'эквайринг', 'external', 600, 430, 190, 60, 'ЗАКАЗ И ОПЛАТА'),
        n('stock', 'Inventory Service', 'резерв остатков', 'service', 810, 250, 150, 60, 'ЗАКАЗ И ОПЛАТА'),
        n('kafka', 'Kafka', 'order.* события', 'queue', 950, 200, 220, 60, 'ИНФРАСТРУКТУРА'),
        n('pg', 'PostgreSQL', 'заказы, товары', 'db', 950, 380, 220, 60, 'ИНФРАСТРУКТУРА'),
        n('notify', 'Notify / Analytics', 'email, push, BI', 'monitoring', 950, 540, 220, 60, 'ИНФРАСТРУКТУРА')
      ],
      edges: [
        e('browser', 'gateway', 'HTTPS', false, 'sync'),
        e('gateway', 'catalog', 'список товаров', false, 'sync'),
        e('gateway', 'cart', 'добавить в корзину', false, 'data'),
        e('gateway', 'orders', 'оформить заказ', false, 'sync'),
        e('orders', 'payment', 'оплата', false, 'sync'),
        e('orders', 'stock', 'зарезервировать', false, 'sync'),
        e('orders', 'pg', 'транзакция', false, 'data'),
        e('orders', 'kafka', 'order.created / paid', true, 'event'),
        e('kafka', 'notify', 'consume', true, 'event')
      ],
      notes: [
        note('Заголовок: E-commerce: путь от товара до оплаченного заказа.', 920, 620, 280, 50),
        note('Легенда: SYNC — вызовы, DATA — состояние, EVT — события заказа.', 920, 670, 280, 44)
      ]
    },
    {
      id: 'multi-region',
      name: 'Мультирегион Active-Active',
      description: 'CDN и глобальный балансировщик распределяют трафик между регионами; своя БД в каждом регионе, репликация и единый мониторинг.',
      tags: ['cloud', 'ha', 'dr', 'multi-region'],
      zones: [z('ГЛОБАЛЬНО', 40, 80, 220, 600), z('REGION EU', 300, 80, 260, 600), z('REGION US', 600, 80, 260, 600), z('ДАННЫЕ И НАБЛЮДЕНИЕ', 900, 80, 300, 600)],
      nodes: [
        n('users', 'Пользователи', 'весь мир', 'client', 70, 330, 180, 60, 'ГЛОБАЛЬНО'),
        n('cdn', 'CDN', 'статик, кэш', 'balancer', 310, 200, 200, 60, 'ГЛОБАЛЬНО'),
        n('gslb', 'GSLB', 'geo DNS, failover', 'balancer', 310, 420, 200, 60, 'ГЛОБАЛЬНО'),
        n('ingressA', 'Ingress EU', 'TLS, WAF', 'gateway', 620, 200, 200, 60, 'REGION EU'),
        n('appA', 'App EU', 'сервисы', 'service', 620, 390, 200, 60, 'REGION EU'),
        n('ingressB', 'Ingress US', 'TLS, WAF', 'gateway', 920, 200, 200, 60, 'REGION US'),
        n('appB', 'App US', 'сервисы', 'service', 920, 390, 200, 60, 'REGION US'),
        n('pgA', 'DB EU', 'primary', 'db', 620, 560, 200, 60, 'REGION EU'),
        n('pgB', 'DB US', 'replica / primary', 'db', 920, 560, 200, 60, 'REGION US'),
        n('monitor', 'Глобальный мониторинг', 'health-check, SLO', 'monitoring', 1160, 330, 180, 70, 'ДАННЫЕ И НАБЛЮДЕНИЕ')
      ],
      edges: [
        e('users', 'cdn', 'статик', false, 'sync'),
        e('cdn', 'gslb', 'динамика', false, 'sync'),
        e('gslb', 'ingressA', 'EU трафик', false, 'sync'),
        e('gslb', 'ingressB', 'US трафик', false, 'sync'),
        e('ingressA', 'appA', 'HTTP', false, 'sync'),
        e('ingressB', 'appB', 'HTTP', false, 'sync'),
        e('appA', 'pgA', 'SQL', false, 'data'),
        e('appB', 'pgB', 'SQL', false, 'data'),
        e('pgA', 'pgB', 'репликация', false, 'data'),
        e('appA', 'monitor', 'health + метрики', false, 'data'),
        e('appB', 'monitor', 'health + метрики', false, 'data')
      ],
      notes: [
        note('Заголовок: Active-Active в двух регионах с репликацией и общим SLO.', 900, 650, 300, 44),
        note('Легенда: SYNC — трафик, DATA — репликация и метрики.', 900, 700, 300, 44)
      ]
    },
    {
      id: 'strangler',
      name: 'Strangler Fig: миграция с монолита',
      description: 'Фасад перехватывает запросы и по правилам маршрутизации постепенно переводит их с монолита на новые сервисы.',
      tags: ['migration', 'monolith', 'microservices', 'strangler'],
      zones: [z('КЛИЕНТ', 40, 80, 210, 600), z('ФАСАД', 290, 80, 240, 600), z('НОВЫЕ СЕРВИСЫ', 570, 80, 300, 600), z('СТАРЫЙ МОНОЛИТ', 910, 80, 280, 600)],
      nodes: [
        n('client', 'Клиенты', 'web / mobile', 'client', 70, 330, 170, 60, 'КЛИЕНТ'),
        n('facade', 'Strangler Facade', 'единая точка входа', 'gateway', 320, 330, 180, 60, 'ФАСАД'),
        n('routes', 'Правила маршрутизации', 'feature flags', 'config', 320, 500, 180, 60, 'ФАСАД'),
        n('orders', 'Orders Service', 'новый сервис', 'service', 600, 230, 190, 60, 'НОВЫЕ СЕРВИСЫ'),
        n('catalog', 'Catalog Service', 'новый сервис', 'service', 600, 410, 190, 60, 'НОВЫЕ СЕРВИСЫ'),
        n('legacy', 'Legacy Monolith', 'остаток системы', 'service', 940, 330, 200, 60, 'СТАРЫЙ МОНОЛИТ'),
        n('legacyDb', 'Legacy DB', 'общая БД', 'db', 940, 510, 200, 60, 'СТАРЫЙ МОНОЛИТ'),
        n('monitor', 'Мониторинг', 'доля трафика, ошибки', 'monitoring', 600, 570, 190, 60, 'НОВЫЕ СЕРВИСЫ')
      ],
      edges: [
        e('client', 'facade', 'HTTPS', false, 'sync'),
        e('routes', 'facade', 'куда вести запрос', false, 'data'),
        e('facade', 'orders', 'новый маршрут', false, 'sync'),
        e('facade', 'catalog', 'новый маршрут', false, 'sync'),
        e('facade', 'legacy', 'старый маршрут', false, 'sync'),
        e('legacy', 'legacyDb', 'SQL', false, 'data'),
        e('orders', 'monitor', 'метрики', false, 'data'),
        e('catalog', 'monitor', 'метрики', false, 'data')
      ],
      notes: [
        note('Заголовок: Постепенная замена монолита через фасад и правила маршрутизации.', 910, 600, 280, 60),
        note('Легенда: SYNC — запросы, DATA — правила и метрики.', 910, 660, 280, 44)
      ]
    },
    {
      id: 'observability',
      name: 'Наблюдаемость: метрики, логи, трейсы',
      description: 'Сервисы и демоны-экспортеры отдают health-check и телеметрию; Prometheus, Loki и трейсы ведут в Grafana и Alertmanager.',
      tags: ['observability', 'monitoring', 'health-check', 'sre'],
      zones: [z('ИСТОЧНИКИ', 40, 80, 230, 600), z('СБОР', 310, 80, 250, 600), z('ХРАНЕНИЕ', 600, 80, 260, 600), z('ПОТРЕБЛЕНИЕ', 900, 80, 300, 600)],
      nodes: [
        n('app', 'Сервисы', 'бизнес-логика', 'service', 70, 220, 190, 60, 'ИСТОЧНИКИ'),
        n('daemon', 'Node Exporter / Демон', 'метрики хоста', 'daemon', 70, 400, 190, 60, 'ИСТОЧНИКИ'),
        n('health', 'Health-check', '/healthz, /ready', 'monitoring', 340, 200, 190, 60, 'СБОР'),
        n('otel', 'OpenTelemetry Collector', 'метрики, логи, трейсы', 'worker', 340, 400, 190, 60, 'СБОР'),
        n('prom', 'Prometheus', 'метрики и алерты', 'monitoring', 630, 200, 200, 60, 'ХРАНЕНИЕ'),
        n('loki', 'Loki / S3', 'логи и архив', 'storage', 630, 380, 200, 60, 'ХРАНЕНИЕ'),
        n('grafana', 'Grafana', 'дашборды SLO', 'client', 930, 200, 220, 60, 'ПОТРЕБЛЕНИЕ'),
        n('alert', 'Alertmanager', 'дежурный, тикеты', 'monitoring', 930, 400, 220, 60, 'ПОТРЕБЛЕНИЕ')
      ],
      edges: [
        e('app', 'health', 'GET /healthz', false, 'sync'),
        e('app', 'otel', 'трейсы, логи', false, 'data'),
        e('daemon', 'otel', 'метрики хоста', false, 'data'),
        e('health', 'prom', 'probe результат', false, 'data'),
        e('otel', 'prom', 'метрики', false, 'data'),
        e('otel', 'loki', 'логи', false, 'data'),
        e('prom', 'grafana', 'PromQL', false, 'sync'),
        e('loki', 'grafana', 'запрос логов', false, 'sync'),
        e('prom', 'alert', 'правило сработало', true, 'event')
      ],
      notes: [
        note('Заголовок: Наблюдаемость: health-check → сбор → хранение → дашборд и алерт.', 900, 520, 300, 60),
        note('Легенда: SYNC — probe/запрос, DATA — телеметрия, EVT — алерт.', 900, 600, 300, 50)
      ]
    },

    /* ---------- Логические и событийные диаграммы процессов ---------- */
    {
      id: 'flow-message',
      category: 'process',
      name: 'Сообщение → реакция → результат',
      description: 'Универсальный шаблон логической диаграммы: входящее сообщение классифицируется, обработчик реагирует в инструменте, результат уходит пользователю и в журнал.',
      tags: ['process', 'message', 'webhook', 'flow'],
      zones: [z('СООБЩЕНИЕ', 40, 80, 220, 600), z('РЕАКЦИЯ', 300, 80, 250, 600), z('ИНСТРУМЕНТЫ', 590, 80, 270, 600), z('РЕЗУЛЬТАТ', 900, 80, 300, 600)],
      nodes: [
        n('msg', 'Входящее сообщение', 'Telegram / Email / Slack', 'client', 70, 260, 180, 60, 'СООБЩЕНИЕ'),
        n('webhook', 'Webhook / Bot API', 'приём payload', 'gateway', 330, 210, 190, 60, 'РЕАКЦИЯ'),
        n('classify', 'Классификация', 'интент, язык', 'worker', 330, 410, 190, 60, 'РЕАКЦИЯ'),
        n('handler', 'Обработчик', 'бизнес-правила', 'service', 620, 250, 190, 60, 'ИНСТРУМЕНТЫ'),
        n('store', 'БД / CRM', 'состояние заявки', 'db', 620, 440, 190, 60, 'ИНСТРУМЕНТЫ'),
        n('reply', 'Ответ пользователю', 'подтверждение', 'client', 930, 250, 200, 60, 'РЕЗУЛЬТАТ'),
        n('audit', 'Аудит / логи', 'история событий', 'monitoring', 930, 440, 200, 60, 'РЕЗУЛЬТАТ')
      ],
      edges: [
        e('msg', 'webhook', 'message.received', true, 'event'),
        e('webhook', 'classify', 'текст + метаданные', false, 'sync'),
        e('classify', 'handler', 'интент выбран', false, 'sync'),
        e('handler', 'store', 'сохранить результат', false, 'data'),
        e('handler', 'reply', 'answer', false, 'sync'),
        e('reply', 'msg', 'доставлено', false, 'sync'),
        e('handler', 'audit', 'событие обработки', false, 'data')
      ],
      notes: [
        note('Заголовок: Сообщение → реакция в инструменте → результат.', 900, 550, 300, 50),
        note('Легенда: EVT — входящее событие, SYNC — вызов, DATA — запись результата.', 900, 610, 300, 50)
      ]
    },
    {
      id: 'flow-webhook',
      category: 'process',
      name: 'Webhook платежа → заказ → уведомление',
      description: 'Платёжный шлюз присылает webhook; шина событий разносит payment.succeeded по сервисам, меняется статус заказа, резервируются остатки и уходит уведомление.',
      tags: ['process', 'event', 'payment', 'webhook'],
      zones: [z('ТРИГГЕР', 40, 80, 220, 600), z('ШИНА', 300, 80, 240, 600), z('РЕАКЦИИ', 580, 80, 300, 600), z('РЕЗУЛЬТАТ', 920, 80, 280, 600)],
      nodes: [
        n('provider', 'Платёжный шлюз', 'внешний webhook', 'external', 70, 330, 180, 60, 'ТРИГГЕР'),
        n('endpoint', 'Webhook Endpoint', 'проверка подписи', 'gateway', 330, 330, 180, 60, 'ШИНА'),
        n('bus', 'Event Bus', 'payment.succeeded', 'queue', 610, 330, 180, 60, 'РЕАКЦИИ'),
        n('orders', 'Order Worker', 'статус → paid', 'worker', 830, 200, 160, 60, 'РЕАКЦИИ'),
        n('stock', 'Stock Worker', 'списать остатки', 'worker', 830, 370, 160, 60, 'РЕАКЦИИ'),
        n('notify', 'Notify Worker', 'email / push', 'daemon', 950, 520, 180, 60, 'РЕАКЦИИ'),
        n('db', 'Order DB', 'итоговый статус', 'db', 950, 200, 200, 60, 'РЕЗУЛЬТАТ'),
        n('client', 'Покупатель', '«Заказ оплачен»', 'client', 950, 370, 200, 60, 'РЕЗУЛЬТАТ')
      ],
      edges: [
        e('provider', 'endpoint', 'POST /webhook', true, 'event'),
        e('endpoint', 'bus', 'publish event', true, 'event'),
        e('bus', 'orders', 'consume', true, 'event'),
        e('bus', 'stock', 'consume', true, 'event'),
        e('bus', 'notify', 'consume', true, 'event'),
        e('orders', 'db', 'UPDATE status', false, 'data'),
        e('notify', 'client', 'уведомление', false, 'sync'),
        e('orders', 'client', 'результат заказа', false, 'data')
      ],
      notes: [
        note('Заголовок: Событие оплаты → реакции сервисов → результат для покупателя.', 920, 600, 280, 50),
        note('Легенда: EVT — событие шины, SYNC — уведомление, DATA — изменение состояния.', 920, 650, 280, 50)
      ]
    },
    {
      id: 'flow-saga',
      category: 'process',
      name: 'Saga: компенсация при ошибке',
      description: 'Оркестратор проводит заказ через резерв, оплату и доставку; при отказе шага срабатывают компенсирующие события (refund, release).',
      tags: ['process', 'saga', 'event', 'compensation'],
      zones: [z('КОМАНДА', 40, 80, 210, 600), z('ОРКЕСТРАТОР', 290, 80, 240, 600), z('ШАГИ', 570, 80, 300, 600), z('КОМПЕНСАЦИЯ', 910, 80, 290, 600)],
      nodes: [
        n('request', 'Запрос на заказ', 'пользователь', 'client', 70, 330, 170, 60, 'КОМАНДА'),
        n('saga', 'Saga Orchestrator', 'состояние процесса', 'worker', 320, 320, 190, 70, 'ОРКЕСТРАТОР'),
        n('order', 'Create Order', 'шаг 1', 'service', 600, 180, 180, 60, 'ШАГИ'),
        n('stock', 'Reserve Stock', 'шаг 2', 'service', 600, 320, 180, 60, 'ШАГИ'),
        n('payment', 'Charge Payment', 'шаг 3', 'external', 600, 460, 180, 60, 'ШАГИ'),
        n('ship', 'Ship Order', 'шаг 4', 'daemon', 820, 320, 160, 60, 'ШАГИ'),
        n('comp', 'Компенсации', 'release / refund', 'config', 940, 200, 200, 60, 'КОМПЕНСАЦИЯ'),
        n('audit', 'Журнал Saga', 'все события', 'monitoring', 940, 470, 200, 60, 'КОМПЕНСАЦИЯ')
      ],
      edges: [
        e('request', 'saga', 'order.create', true, 'event'),
        e('saga', 'order', 'command', true, 'event'),
        e('order', 'stock', 'order.created', true, 'event'),
        e('stock', 'payment', 'stock.reserved', true, 'event'),
        e('payment', 'ship', 'payment.charged', true, 'event'),
        e('stock', 'comp', 'payment.failed → release', true, 'event'),
        e('payment', 'comp', 'ship.failed → refund', true, 'event'),
        e('comp', 'audit', 'compensated', false, 'data'),
        e('saga', 'audit', 'шаги процесса', false, 'data')
      ],
      notes: [
        note('Заголовок: Saga — событийная диаграмма с компенсирующими транзакциями.', 910, 550, 290, 60),
        note('Легенда: EVT — команды и события шагов, DATA — журнал процесса.', 910, 620, 290, 50)
      ]
    },
    {
      id: 'flow-outbox',
      category: 'process',
      name: 'Transactional Outbox',
      description: 'Команда пишет состояние и событие в одной транзакции; демон-relay читает outbox и публикует в брокер, а consumer-ы обновляют read model.',
      tags: ['process', 'event', 'outbox', 'consistency'],
      zones: [z('ТРАНЗАКЦИЯ', 40, 80, 230, 600), z('РЕЛЕЙ', 310, 80, 230, 600), z('БРОКЕР', 580, 80, 230, 600), z('ПОТРЕБИТЕЛИ', 850, 80, 330, 600)],
      nodes: [
        n('api', 'Command API', 'запрос на изменение', 'gateway', 70, 330, 190, 60, 'ТРАНЗАКЦИЯ'),
        n('db', 'БД + Outbox', 'INSERT + event', 'db', 70, 490, 190, 60, 'ТРАНЗАКЦИЯ'),
        n('relay', 'Outbox Relay', 'poll / CDC демон', 'daemon', 340, 330, 190, 60, 'РЕЛЕЙ'),
        n('monitor', 'Лаг релея', 'метрика, алерт', 'monitoring', 340, 500, 190, 60, 'РЕЛЕЙ'),
        n('kafka', 'Kafka', '_at-least-once_', 'queue', 610, 330, 190, 60, 'БРОКЕР'),
        n('read', 'Read Model', 'проекция', 'analytics', 880, 230, 200, 60, 'ПОТРЕБИТЕЛИ'),
        n('notify', 'Notify Consumer', 'email / push', 'worker', 880, 430, 200, 60, 'ПОТРЕБИТЕЛИ')
      ],
      edges: [
        e('api', 'db', 'BEGIN → COMMIT', false, 'data'),
        e('db', 'relay', 'новые строки outbox', false, 'data'),
        e('relay', 'kafka', 'publish', true, 'event'),
        e('relay', 'monitor', 'лаг публикации', false, 'data'),
        e('kafka', 'read', 'consume → проекция', true, 'event'),
        e('kafka', 'notify', 'consume → письмо', true, 'event')
      ],
      notes: [
        note('Заголовок: Outbox — состояние и событие фиксируются одной транзакцией.', 850, 550, 320, 60),
        note('Легенда: DATA — чтение outbox/БД, EVT — публикация и consumption.', 850, 620, 320, 44)
      ]
    },
    {
      id: 'flow-retry-dlq',
      category: 'process',
      name: 'Обработка события: retry и DLQ',
      description: 'Consumer не смог обработать событие: несколько повторов с backoff, затем событие уходит в DLQ, поднимается алерт и после фикса выполняется replay.',
      tags: ['process', 'event', 'retry', 'dlq', 'error-handling'],
      zones: [z('СОБЫТИЕ', 40, 80, 210, 600), z('ОБРАБОТКА', 290, 80, 240, 600), z('ПОВТОРЫ', 570, 80, 250, 600), z('РАЗБОР', 860, 80, 320, 600)],
      nodes: [
        n('source', 'Очередь событий', ' Kafka / SQS', 'queue', 70, 330, 170, 60, 'СОБЫТИЕ'),
        n('consumer', 'Consumer', 'бизнес-обработка', 'worker', 320, 250, 190, 60, 'ОБРАБОТКА'),
        n('result', 'Успех → БД', 'результат', 'db', 320, 450, 190, 60, 'ОБРАБОТКА'),
        n('retry', 'Retry (backoff)', '3 попытки', 'scheduler', 600, 250, 190, 60, 'ПОВТОРЫ'),
        n('dlq', 'DLQ', 'необработанные', 'storage', 600, 450, 190, 60, 'ПОВТОРЫ'),
        n('alert', 'Алерт дежурному', 'ошибка обработки', 'monitoring', 890, 230, 200, 60, 'РАЗБОР'),
        n('support', 'Разбор incident', 'причина, фикс', 'client', 890, 410, 200, 60, 'РАЗБОР'),
        n('replay', 'Replay из DLQ', 'повторная подача', 'daemon', 890, 560, 200, 60, 'РАЗБОР')
      ],
      edges: [
        e('source', 'consumer', 'consume', true, 'event'),
        e('consumer', 'result', 'успех', false, 'data'),
        e('consumer', 'retry', 'ошибка', true, 'event'),
        e('retry', 'consumer', 'повтор', true, 'event'),
        e('retry', 'dlq', 'лимит попыток', true, 'event'),
        e('dlq', 'alert', 'новое событие', true, 'event'),
        e('alert', 'support', 'расследование', false, 'sync'),
        e('support', 'replay', 'фикс готов', false, 'sync'),
        e('replay', 'source', 'replay события', true, 'event')
      ],
      notes: [
        note('Заголовок: Событие → реакция consumer → результат, retry или DLQ.', 860, 640, 320, 44),
        note('Легенда: EVT — события и повторы, DATA — успешный результат.', 860, 690, 320, 44)
      ]
    },
    {
      id: 'flow-incident',
      category: 'process',
      name: 'Инцидент: от алерта до постмортема',
      description: 'Health-check и метрики поднимают алерт, дежурный открывает дашборд и логи, выкатывается фикс, затем фиксируется постмортем и действия.',
      tags: ['process', 'incident', 'sre', 'monitoring'],
      zones: [z('СИГНАЛ', 40, 80, 220, 600), z('РЕАГИРОВАНИЕ', 300, 80, 250, 600), z('ИНСТРУМЕНТЫ', 590, 80, 270, 600), z('ИТОГ', 900, 80, 300, 600)],
      nodes: [
        n('health', 'Health-check / SLO', 'проба сервиса', 'monitoring', 70, 240, 180, 60, 'СИГНАЛ'),
        n('alert', 'Alertmanager', 'страница дежурному', 'monitoring', 70, 430, 180, 60, 'СИГНАЛ'),
        n('oncall', 'Дежурный инженер', 'принял алерт', 'client', 330, 240, 190, 60, 'РЕАГИРОВАНИЕ'),
        n('dash', 'Grafana / Дашборд', 'метрики, трейсы', 'analytics', 330, 430, 190, 60, 'РЕАГИРОВАНИЕ'),
        n('logs', 'Логи (Loki)', 'причина ошибки', 'storage', 620, 200, 190, 60, 'ИНСТРУМЕНТЫ'),
        n('fix', 'Фикс в коде', 'hotfix / конфиг', 'worker', 620, 390, 190, 60, 'ИНСТРУМЕНТЫ'),
        n('deploy', 'Выкатка', 'CI/CD pipeline', 'ci', 930, 240, 200, 60, 'ИТОГ'),
        n('post', 'Постмортем', 'без вины, действия', 'config', 930, 450, 200, 60, 'ИТОГ')
      ],
      edges: [
        e('health', 'alert', 'порог нарушен', true, 'event'),
        e('alert', 'oncall', 'page / push', true, 'event'),
        e('oncall', 'dash', 'открыть метрики', false, 'sync'),
        e('dash', 'logs', 'переход к логам', false, 'sync'),
        e('logs', 'fix', 'найдена причина', false, 'data'),
        e('fix', 'deploy', 'merge + deploy', false, 'sync'),
        e('deploy', 'health', 'проверка восстановления', false, 'sync'),
        e('deploy', 'post', 'итоги инцидента', false, 'data')
      ],
      notes: [
        note('Заголовок: Инцидент: сигнал мониторинга → реакция инженера → фикс → постмортем.', 900, 550, 300, 60),
        note('Легенда: EVT — алерты, SYNC — действия, DATA — артефакты расследования.', 900, 620, 300, 50)
      ]
    },
    {
      id: 'flow-cicd',
      category: 'process',
      name: 'CI/CD: от коммита до health-check',
      description: 'Push в репозиторий запускает сборку и тесты, артефакт уходит в registry, деплой проверяется health-check и smoke-тестом перед релизом.',
      tags: ['process', 'cicd', 'devops', 'health-check'],
      zones: [z('ИСТОЧНИК', 40, 80, 210, 600), z('СБОРКА', 290, 80, 240, 600), z('ВЫКАТКА', 570, 80, 270, 600), z('ПРОВЕРКА', 880, 80, 300, 600)],
      nodes: [
        n('git', 'Git Repository', 'push / PR', 'external', 70, 330, 170, 60, 'ИСТОЧНИК'),
        n('ci', 'CI Pipeline', 'build, линтеры', 'ci', 320, 200, 190, 60, 'СБОРКА'),
        n('tests', 'Тесты', 'unit, integration', 'ci', 320, 390, 190, 60, 'СБОРКА'),
        n('registry', 'Artifact Registry', 'Docker image', 'storage', 600, 200, 190, 60, 'ВЫКАТКА'),
        n('deploy', 'Deploy Job', 'dev → stage → prod', 'ci', 600, 400, 190, 60, 'ВЫКАТКА'),
        n('health', 'Health-check', 'readiness / liveness', 'monitoring', 910, 230, 200, 60, 'ПРОВЕРКА'),
        n('smoke', 'Smoke-тест', 'критичный сценарий', 'worker', 910, 420, 200, 60, 'ПРОВЕРКА'),
        n('release', 'Релиз', 'тег, уведомление', 'client', 1090, 560, 160, 60, 'ПРОВЕРКА')
      ],
      edges: [
        e('git', 'ci', 'push event', true, 'event'),
        e('ci', 'tests', 'запуск тестов', false, 'sync'),
        e('tests', 'registry', 'собрать образ', false, 'data'),
        e('registry', 'deploy', 'образ готов', false, 'data'),
        e('deploy', 'health', 'проба сервиса', false, 'sync'),
        e('health', 'smoke', 'сервис готов', false, 'sync'),
        e('smoke', 'release', 'проверки пройдены', false, 'sync'),
        e('release', 'git', 'тег версии', false, 'data')
      ],
      notes: [
        note('Заголовок: CI/CD: коммит → сборка → выкатка → health-check → релиз.', 880, 640, 300, 44),
        note('Легенда: EVT — событие push, SYNC — шаги пайплайна, DATA — артефакты.', 880, 690, 300, 44)
      ]
    },
    {
      id: 'flow-cron',
      category: 'process',
      name: 'Cron → демон → отчёт → уведомление',
      description: 'Планировщик будит фоновую задачу, она читает данные через API, строит отчёт, сохраняет его и отправляет письмо; результат виден в мониторинге.',
      tags: ['process', 'cron', 'daemon', 'batch'],
      zones: [z('ТРИГГЕР', 40, 80, 210, 600), z('ФОНОВАЯ ЗАДАЧА', 290, 80, 250, 600), z('ДАННЫЕ', 580, 80, 260, 600), z('РЕЗУЛЬТАТ', 880, 80, 300, 600)],
      nodes: [
        n('cron', 'Планировщик', 'cron / timer', 'scheduler', 70, 330, 170, 60, 'ТРИГГЕР'),
        n('daemon', 'Демон задачи', 'single instance', 'daemon', 320, 330, 190, 60, 'ФОНОВАЯ ЗАДАЧА'),
        n('lock', 'Блокировка', 'Распределённый lock', 'config', 320, 500, 190, 60, 'ФОНОВАЯ ЗАДАЧА'),
        n('api', 'Внешний API', 'источник данных', 'external', 610, 220, 190, 60, 'ДАННЫЕ'),
        n('db', 'БД', 'сырые записи', 'db', 610, 430, 190, 60, 'ДАННЫЕ'),
        n('report', 'Отчёт / S3', 'CSV, PDF', 'storage', 910, 220, 200, 60, 'РЕЗУЛЬТАТ'),
        n('mail', 'Получатели', 'email / Slack', 'client', 910, 420, 200, 60, 'РЕЗУЛЬТАТ'),
        n('monitor', 'Мониторинг задачи', 'успех / длительность', 'monitoring', 1090, 560, 170, 60, 'РЕЗУЛЬТАТ')
      ],
      edges: [
        e('cron', 'daemon', 'tick', true, 'event'),
        e('daemon', 'lock', 'занять lock', false, 'sync'),
        e('daemon', 'api', 'fetch данные', false, 'sync'),
        e('api', 'db', 'сохранить', false, 'data'),
        e('db', 'report', 'собрать отчёт', false, 'data'),
        e('daemon', 'mail', 'отправить ссылку', false, 'sync'),
        e('daemon', 'monitor', 'метрика запуска', false, 'data')
      ],
      notes: [
        note('Заголовок: Запланированное событие → реакция демона → отчёт и уведомление.', 880, 640, 300, 44),
        note('Легенда: EVT — tick, SYNC — вызовы, DATA — результат задачи.', 880, 690, 300, 44)
      ]
    },
    {
      id: 'self-map-architecture',
      name: 'Карта приложения: Architecture Canvas',
      description: 'Самопортрет доски: браузер и APK, index.html, core.js, пресеты, автосохранение, MCP, внешние API и CI. Сверено с реальным содержимым репозитория: index.html, core.js, presets.js, project-import.js, mcp-server.js и workflows.',
      tags: ['self', 'architecture', 'architecture-canvas'],
      zones: [
        z('КЛИЕНТЫ И ХОСТИНГ', 40, 80, 300, 620),
        z('ДОСКА / UI', 380, 80, 330, 620),
        z('ЯДРО И ДАННЫЕ', 750, 80, 340, 620),
        z('MCP И ИНТЕГРАЦИИ', 1130, 80, 360, 620),
        z('CI/CD', 1530, 80, 260, 620)
      ],
      nodes: [
        n('browser', 'Браузер', 'Chrome / Edge / Safari', 'client', 70, 240, 190, 64, 'КЛИЕНТЫ И ХОСТИНГ'),
        n('pages', 'GitHub Pages', 'статический хостинг', 'gateway', 70, 380, 190, 64, 'КЛИЕНТЫ И ХОСТИНГ'),
        n('apk', 'APK WebView', 'Galaxy Tab / S Pen', 'client', 70, 520, 190, 64, 'КЛИЕНТЫ И ХОСТИНГ'),
        n('ui', 'index.html', 'панели, холст, редактор, модалки', 'service', 410, 300, 190, 70, 'ДОСКА / UI'),
        n('canvas', 'Canvas 2D', 'фигуры, связи, жесты, перо', 'gateway', 410, 470, 190, 64, 'ДОСКА / UI'),
        n('core', 'core.js', 'Mermaid / C4 / prompt / Gist', 'service', 780, 210, 190, 64, 'ЯДРО И ДАННЫЕ'),
        n('presets', 'presets.js', '31 сценарий в 2 категориях', 'config', 780, 350, 190, 64, 'ЯДРО И ДАННЫЕ'),
        n('storage', 'localStorage', 'autosave, версии, настройки', 'db', 780, 490, 190, 64, 'ЯДРО И ДАННЫЕ'),
        n('mcp', 'mcp-server.js', '11 MCP-инструментов', 'ai', 1160, 210, 200, 64, 'MCP И ИНТЕГРАЦИИ'),
        n('importjs', 'project-import.js', 'статический разбор проекта', 'worker', 1160, 350, 200, 64, 'MCP И ИНТЕГРАЦИИ'),
        n('qwen', 'Qwen / LLM', 'OpenAI-совместимый API', 'ai', 1160, 490, 200, 64, 'MCP И ИНТЕГРАЦИИ'),
        n('gist', 'GitHub Gist', 'публикация схемы', 'external', 1160, 620, 200, 60, 'MCP И ИНТЕГРАЦИИ'),
        n('speech', 'Web Speech API', 'диктовка в блоки', 'external', 1390, 490, 80, 64, 'MCP И ИНТЕГРАЦИИ'),
        n('actions', 'GitHub Actions', 'Pages + ручная сборка APK', 'ci', 1560, 300, 190, 64, 'CI/CD')
      ],
      edges: [
        e('browser', 'pages', 'HTTPS'),
        e('pages', 'ui', 'HTML + JS'),
        e('apk', 'ui', 'WebView'),
        e('ui', 'canvas', 'отрисовка и ввод'),
        e('ui', 'core', 'buildPrompt / validateC4'),
        e('ui', 'presets', 'get / toSchema'),
        e('ui', 'storage', 'autosave / версии / тема'),
        e('ui', 'speech', 'диктовка'),
        e('core', 'gist', 'makeGistFiles / push_gist'),
        e('core', 'qwen', 'запрос в модель'),
        e('mcp', 'core', 'read_schema / validate_c4'),
        e('mcp', 'presets', 'list_presets / get_preset'),
        e('mcp', 'importjs', 'import_project'),
        e('importjs', 'core', 'compactSchema'),
        e('actions', 'pages', 'deploy from main'),
        e('actions', 'apk', 'workflow_dispatch')
      ],
      notes: [
        note('Заголовок: Карта приложения Architecture Canvas — браузер, доска, ядро, MCP и CI.', 40, 690, 560, 44),
        note('Легенда: SYNC — вызовы, DATA — поток данных, EVT — события и триггеры CI, DEP — зависимости.', 620, 690, 600, 44),
        note('Сверено с реальным кодом: index.html держит UI и холст, core.js — экспорт и валидацию, presets.js — пресеты, mcp-server.js — 11 инструментов, project-import.js — импорт проекта.', 40, 740, 560, 70),
        note('Связи в UI пока создаются инструментом «→»; перетаскивание связи от блока к блоку ещё не реализовано — это следующая доработка.', 640, 740, 520, 70),
        note('Pages публикует index.html + core.js + presets.js из main. APK собирается только вручную (workflow_dispatch), версия остаётся v1.1.1.', 1240, 740, 540, 70)
      ]
    },
    {
      id: 'self-map-processes',
      category: 'process',
      name: 'Процессы Architecture Canvas',
      description: 'Сквозные сценарии самой доски: создание блока перетаскиванием, autosave, валидация, подготовка запроса, отправка в модель, Gist и публикация через CI. Сверено с текущей реализацией.',
      tags: ['self', 'process', 'architecture-canvas'],
      zones: [
        z('ПОЛЬЗОВАТЕЛЬ', 40, 80, 240, 620),
        z('ДОСКА', 320, 80, 400, 620),
        z('ЯДРО И ХРАНЕНИЕ', 760, 80, 360, 620),
        z('ВНЕШНИЕ СЕРВИСЫ', 1160, 80, 320, 620),
        z('CI/CD', 1520, 80, 260, 620)
      ],
      nodes: [
        n('user', 'Пользователь / S Pen', 'рисует и перетаскивает', 'client', 70, 250, 180, 64, 'ПОЛЬЗОВАТЕЛЬ'),
        n('palette', 'Палитра «Работа»', 'перетащить блок', 'service', 350, 170, 180, 64, 'ДОСКА'),
        n('canvas', 'Холст + редактор', 'вводим название/размер', 'gateway', 350, 310, 180, 64, 'ДОСКА'),
        n('edge', 'Стрелка', 'тип и подпись в редакторе', 'queue', 350, 450, 180, 64, 'ДОСКА'),
        n('validate', 'C4-валидация', 'проверка связности', 'monitoring', 350, 590, 180, 60, 'ДОСКА'),
        n('autosave', 'Autosave', '500 мс + версии', 'scheduler', 790, 250, 180, 64, 'ЯДРО И ХРАНЕНИЕ'),
        n('core', 'core.js', 'Mermaid / JSON / prompt', 'service', 790, 390, 180, 64, 'ЯДРО И ХРАНЕНИЕ'),
        n('builder', 'Конструктор для ИИ', 'пространства/кубики/связи', 'service', 790, 530, 180, 64, 'ЯДРО И ХРАНЕНИЕ'),
        n('qwen', 'Qwen / LLM', 'OpenAI-совместимый API', 'ai', 1190, 310, 180, 64, 'ВНЕШНИЕ СЕРВИСЫ'),
        n('gist', 'GitHub Gist', 'publish / update', 'external', 1190, 450, 180, 64, 'ВНЕШНИЕ СЕРВИСЫ'),
        n('mcp', 'MCP-агент', 'build_schema / import_project', 'ai', 1190, 590, 180, 64, 'ВНЕШНИЕ СЕРВИСЫ'),
        n('commit', 'git push main', 'коммит изменений', 'ci', 1540, 250, 180, 64, 'CI/CD'),
        n('pages', 'GitHub Pages', 'онлайн-доска', 'gateway', 1540, 400, 180, 64, 'CI/CD'),
        n('apk', 'APK (вручную)', 'обновление приостановлено', 'client', 1540, 550, 180, 64, 'CI/CD')
      ],
      edges: [
        e('user', 'palette', 'перетащить плитку', false, 'event'),
        e('palette', 'canvas', 'блок на холсте, инструмент не сменился', false, 'data'),
        e('user', 'edge', 'инструмент «→»', false, 'sync'),
        e('user', 'validate', 'проверить схему', false, 'sync'),
        e('canvas', 'autosave', 'изменение состояния', true, 'event'),
        e('edge', 'validate', 'концы/типы/петли', false, 'sync'),
        e('builder', 'canvas', 'элементы сразу на доске', false, 'data'),
        e('validate', 'core', 'validateC4', false, 'sync'),
        e('autosave', 'core', 'currentSchema', false, 'data'),
        e('core', 'qwen', 'buildPrompt → ответ модели', false, 'sync'),
        e('core', 'gist', 'материалы gist', false, 'data'),
        e('mcp', 'builder', 'build_schema', false, 'sync'),
        e('commit', 'pages', 'deploy из main', true, 'event'),
        e('commit', 'apk', 'только workflow_dispatch', true, 'event')
      ],
      notes: [
        note('Заголовок: Процессы Architecture Canvas — от жеста пользователя до публикации и ответа модели.', 40, 690, 560, 44),
        note('Легенда: SYNC — вызовы, DATA — поток данных, EVT — события и autosave, DEP — триггеры CI.', 620, 690, 600, 44),
        note('Перетаскивание блоков из панели не меняет активный инструмент. Отпускание вне холста ничего не добавляет.', 40, 740, 500, 70),
        note('Связи создаются инструментом «→» и редактируются двойным кликом: тип, подпись, привязка концов. Перетаскивание связи от блока запланировано.', 580, 740, 550, 70),
        note('APK остаётся v1.1.1: автосборка отключена, сборка запускается только вручную.', 1160, 740, 540, 70)
      ]
    }
  ];

  PRESETS.forEach(p => { if (!p.category) p.category = 'architecture'; });

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
        kind: edge.kind || (edge.async ? 'async' : 'sync'),
        async: !!edge.async,
        fromAttached: !!labelOf(preset, edge.from),
        toAttached: !!labelOf(preset, edge.to)
      })),
      notes: preset.notes.map(n => n.text)
    };
  }

  function get(id) { return PRESETS.find(p => p.id === id); }

  return { presets: PRESETS, get, toSchema, zoneOfNode };
});
