// =========================================================================
// xX_EMO_BANK_2007_Xx — Interactive Web App (All 12 Screens + Real Leaflet Maps)
// =========================================================================

const BELL_SVG = `
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="#FF1493" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="#FF1493" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
`;

// Real Leaflet instances (open CartoDB / OpenStreetMap tiles — NO API KEY required)
let mainMapInstance = null;
let mainMarkersLayer = null;
let taxiMapInstance = null;

// Transport vehicles around UrFU / Center (Yekaterinburg)
const TRANSPORT_UNITS = [
  { id: 'a12', code: 'А12', type: 'bus', mine: true, label: 'Автобус №12 → Вокзал · 3 мин', lat: 56.8452, lng: 60.6512 },
  { id: 'a28', code: 'А28', type: 'bus', mine: false, label: 'Автобус №28 → Центр · 5 мин', lat: 56.8421, lng: 60.6585 },
  { id: 't4',  code: 'Т4',  type: 'tram', mine: true, label: 'Трамвай №4 → Парк · 6 мин', lat: 56.8415, lng: 60.6525 },
  { id: 't18', code: 'Т18', type: 'tram', mine: false, label: 'Трамвай №18 → ВИЗ · 8 мин', lat: 56.8464, lng: 60.6572 },
  { id: 'tr7', code: 'Тр7', type: 'trolley', mine: false, label: 'Троллейбус №7 → Академический · 4 мин', lat: 56.8432, lng: 60.6480 },
  { id: 'm1',  code: 'М',   type: 'metro', mine: true, label: 'Метро «Площадь 1905 года» · 11 мин пешком', lat: 56.8388, lng: 60.6455 },
];

const FUEL_STATIONS = [
  { code: 'АЗС', label: 'Газпромнефть · АИ-95: 57,40 ₽ · 600 м', lat: 56.8460, lng: 60.6500 },
  { code: 'АЗС', label: 'Лукойл · АИ-95: 58,10 ₽ · 1.1 км', lat: 56.8405, lng: 60.6590 },
];

const state = {
  screen: 'home',
  history: [],
  balanceHidden: false,
  debitBalance: 64250,
  savingsBalance: 84200,
  transactions: [
    { icon: 'С', title: 'Супермаркет', time: 'Сегодня, 14:20', amount: -1480 },
    { icon: 'Т', title: 'Городской транспорт', time: 'Сегодня, 09:15', amount: -62 },
    { icon: '+', title: 'Пополнение по СБП', time: 'Вчера, 19:40', amount: 15000 },
  ],
  // Payments
  payTab: 'phone',
  bills: [
    { id: 'isp', title: 'Интернет-провайдер', sub: 'Оплата до 1 декабря · 650 ₽', amount: 650, paid: false },
    { id: 'gkh', title: 'ЖКХ (квартира)', sub: 'Начисление за ноябрь · 4 120 ₽', amount: 4120, paid: false },
  ],
  // Chats
  chatFilter: 'all',
  threads: [
    { id: 'support', cat: 'support', icon: 'П', isTextIcon: true, title: 'Служба поддержки', msg: 'Ваш вопрос по переводу решён', date: '10:44', unread: 1 },
    { id: 'market', cat: 'services', icon: 'assets/kawaii_marketplace.png', title: 'Маркетплейс · Заказ #4821', msg: 'Курьер привезёт заказ завтра 10–14', date: 'Вчера', unread: 2, go: 'marketplace' },
    { id: 'profi', cat: 'services', icon: 'assets/av_emo_bangs.png', title: 'Услуги · Алексей Смирнов', msg: 'Здравствуйте, могу приехать в четверг', date: 'Вчера', unread: 1 },
    { id: 'isp', cat: 'services', icon: 'assets/svc_internet.png', title: 'Интернет-провайдер', msg: 'Диагностика линии завершена', date: '20 ноя', unread: 0, go: 'internet' },
    { id: 'med', cat: 'services', icon: 'assets/kawaii_hospital.png', title: 'Медицина · Поликлиника №12', msg: 'Напоминание: терапевт 25 ноя, 14:30', date: '19 ноя', unread: 0, go: 'medicine' },
    { id: 'ops', cat: 'history', icon: 'assets/svc_gosuslugi.png', title: 'Уведомления по операциям', msg: 'Начислен кэшбэк 1 420 ₽ за ноябрь', date: '15 ноя', unread: 0 },
  ],
  // Services search
  serviceQuery: '',
  // Maps
  mapTab: 'transport', // nav | transport | fuel
  transportFilter: 'all', // all | mine | bus | tram | trolley | metro
  // Taxi
  taxiTo: '',
  taxiTariff: 'econ',
  taxiOrdered: false,
  // Fitness
  fitPoints: 24,
  fitDay: 0,
  fitCat: 'Все',
  fitBookings: ['Йога · Завтра 19:00'],
  // Internet
  ispTab: 'lk',
  ispBalance: 650,
  ispStatus: 'active',
  // Profi (Услуги и мастера)
  profiTab: 'specialists', // specialists | orders
  profiOrders: [
    {
      id: 101,
      category: 'Ремонт',
      title: 'Повесить полку и заменить розетку',
      budget: 2500,
      date: 'Завтра, 18:00',
      address: 'ул. Ленина, д. 12, кв. 45',
      status: '2 отклика от мастеров',
    },
  ],
  // Marketplace (real products with user's exact photos)
  mpTab: 'catalog',
  mpCat: 'Все',
  mpQuery: '',
  selectedProductId: null,
  selectedVariant: null,
  mpPvz: 'ПВЗ ул. Ленина, 12',
  mpInstallments: true,
  mpNotifs: true,
  mpPromoApplied: false,
  products: [
    {
      id: 1,
      store: 're:Store',
      title: 'Apple AirPods Max (USB-C)',
      cat: 're:Store',
      price: 47990,
      cash: '+4 799 ₽',
      rating: '4.9',
      reviews: 184,
      img: 'assets/prod_airpods_max.jpg',
      fav: true,
      variantsLabel: 'Цвет',
      variants: ['Розовый', 'Тёмная ночь', 'Звездный свет'],
      desc: 'Полноразмерные беспроводные наушники Apple с Hi-Fi звуком, активным шумоподавлением (ANC), режимом прозрачности и разъёмом USB-C.',
      specs: [
        ['Магазин', 're:Store (оригинал)'],
        ['Шумоподавление', 'Активное (ANC)'],
        ['Автономность', 'До 20 часов'],
        ['Разъём', 'USB-C'],
      ],
    },
    {
      id: 2,
      store: 're:Store',
      title: 'Apple iPhone 16 Pro 256 ГБ',
      cat: 're:Store',
      price: 160990,
      cash: '+16 099 ₽',
      rating: '5.0',
      reviews: 312,
      img: 'assets/prod_iphone16pro.jpg',
      fav: false,
      variantsLabel: 'Память',
      variants: ['256 ГБ', '512 ГБ', '1 ТБ'],
      desc: 'Флагманский смартфон в титановом корпусе с дисплеем OLED Super Retina XDR 6,3″ 120 Гц, чипом Apple A18 Pro и камерой Fusion 48 Мп с 5× оптическим зумом.',
      specs: [
        ['Магазин', 're:Store (оригинал)'],
        ['Дисплей', '6.3″ OLED 120 Гц'],
        ['Процессор', 'Apple A18 Pro'],
        ['Камера', '48 Мп + 5× зум'],
      ],
    },
    {
      id: 3,
      store: 'Street Beat',
      title: 'adidas Originals Jeremy Scott JS Poodle',
      cat: 'Street Beat',
      price: 29990,
      cash: '+2 999 ₽',
      rating: '5.0',
      reviews: 64,
      img: 'assets/prod_jeremy_scott.jpg',
      fav: true,
      variantsLabel: 'Размер (EU)',
      variants: ['36', '37', '38', '39', '40'],
      desc: 'Культовая лимитированная коллаборация adidas Originals × Jeremy Scott в ярко-розовом плюше с фирменным пуделем в солнцезащитных очках.',
      specs: [
        ['Магазин', 'Street Beat'],
        ['Коллаборация', 'adidas × Jeremy Scott'],
        ['Материал верха', 'Плюш / текстиль'],
        ['Подошва', 'Резина (розовая)'],
      ],
    },
    {
      id: 4,
      store: 'Street Beat',
      title: 'Onitsuka Tiger Mexico 66',
      cat: 'Street Beat',
      price: 17990,
      cash: '+1 799 ₽',
      rating: '4.9',
      reviews: 215,
      img: 'assets/prod_onitsuka.jpg',
      fav: false,
      variantsLabel: 'Размер (EU)',
      variants: ['37', '38', '40', '42', '43'],
      desc: 'Легендарные низкопрофильные кроссовки Onitsuka Tiger Mexico 66 из мягкой натуральной кожи в культовой жёлто-чёрной расцветке.',
      specs: [
        ['Магазин', 'Street Beat'],
        ['Модель', 'Mexico 66'],
        ['Материал верха', 'Натуральная кожа'],
        ['Подошва', 'Резина с протектором'],
      ],
    },
    {
      id: 5,
      store: 'Мир Кубиков',
      title: 'Конструктор LEGO 76968 Мир Юрского периода Скелет Тираннозавра',
      cat: 'Мир Кубиков',
      price: 34990,
      cash: '+3 499 ₽',
      rating: '5.0',
      reviews: 89,
      img: 'assets/prod_lego_trex.jpg',
      fav: true,
      variantsLabel: 'Комплектация',
      variants: ['Оригинальная коробка', 'Подарочная упаковка'],
      desc: 'Масштабная коллекционная модель скелета Тираннозавра из серии Jurassic Park (3 145 деталей) с подвижными суставами, подставкой и минифигурками Алана Гранта и Элли Сэттлер.',
      specs: [
        ['Магазин', 'Мир Кубиков'],
        ['Артикул', 'LEGO 76968'],
        ['Деталей', '3 145 шт.'],
        ['Возраст', '18+'],
      ],
    },
    {
      id: 6,
      store: 'Мир Кубиков',
      title: 'Конструктор LEGO Icons McLaren MP4/4 & Ayrton Senna 10330',
      cat: 'Мир Кубиков',
      price: 11990,
      cash: '+1 199 ₽',
      rating: '4.9',
      reviews: 112,
      img: 'assets/prod_lego_mclaren.png',
      fav: false,
      variantsLabel: 'Комплектация',
      variants: ['Оригинальная коробка', 'Подарочная упаковка'],
      desc: 'Коллекционный болид Формулы-1 McLaren MP4/4 1988 года с рабочим рулевым управлением, двигателем V6 и минифигуркой Айртона Сенны на пьедестале.',
      specs: [
        ['Магазин', 'Мир Кубиков'],
        ['Артикул', 'LEGO 10330'],
        ['Деталей', '693 шт.'],
        ['Возраст', '18+'],
      ],
    },
  ],
  cart: [1, 3],
  // Courses
  courseCat: 'Все',
  courseQuery: '',
  courseProgress: 35,
  courseLesson: 12,
  // Medicine
  medTab: 'oms',
  medQuery: '',
  medUpcoming: { doc: 'Терапевт · Иванова Е.А.', info: '25 ноября, 14:30 · Городская поликлиника №12, каб. 204' },
};

const fmtRub = (n) => `${Math.abs(n).toLocaleString('ru-RU')} ₽`;
const fmtBal = (n) => `${n.toLocaleString('ru-RU')},00 ₽`;

let toastTimer;
function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
}

function destroyMaps() {
  if (mainMapInstance) {
    mainMapInstance.remove();
    mainMapInstance = null;
    mainMarkersLayer = null;
  }
  if (taxiMapInstance) {
    taxiMapInstance.remove();
    taxiMapInstance = null;
  }
}

const MAIN_TABS = ['home', 'payments', 'chats', 'services'];

function go(screenName, pushHistory = true) {
  if (MAIN_TABS.includes(screenName)) {
    // Navigating to a top-level tab resets inner history
    state.history = [];
  } else if (pushHistory && state.screen !== screenName) {
    state.history.push(state.screen);
  }
  destroyMaps();
  state.screen = screenName;
  render();
  document.getElementById('screenViewport').scrollTop = 0;
}

function goBack() {
  if (state.screen === 'marketplace' && state.selectedProductId !== null) {
    state.selectedProductId = null;
    render();
    document.getElementById('screenViewport').scrollTop = 0;
    return;
  }
  destroyMaps();
  const prev = state.history.pop() || 'services';
  state.screen = prev;
  render();
  document.getElementById('screenViewport').scrollTop = 0;
}

window.openMarketplaceCatalog = (cat = 'Все') => {
  state.mpTab = 'catalog';
  state.mpCat = cat;
  state.selectedProductId = null;
  go('marketplace');
};

window.openMarketplaceOrders = () => {
  state.mpTab = 'orders';
  state.selectedProductId = null;
  go('marketplace');
};

window.openProductDetail = (id) => {
  const p = state.products.find(x => x.id === id);
  if (!p) return;
  state.selectedProductId = id;
  state.selectedVariant = p.variants[0];
  render();
  document.getElementById('screenViewport').scrollTop = 0;
};

// Modals
function openModal(html) {
  const backdrop = document.getElementById('modalBackdrop');
  const sheet = document.getElementById('modalSheet');
  sheet.innerHTML = html;
  backdrop.classList.add('open');
}

function closeModal() {
  document.getElementById('modalBackdrop').classList.remove('open');
}

document.getElementById('modalBackdrop').addEventListener('click', (e) => {
  if (e.target.id === 'modalBackdrop') closeModal();
});

function openTopUpModal() {
  openModal(`
    <div class="sheet-handle"></div>
    <div class="section-heading">Пополнить основную карту</div>
    <div class="grid-3">
      <button class="btn-dark" onclick="doTopUp(1000)">+1 000 ₽</button>
      <button class="btn-dark" onclick="doTopUp(5000)">+5 000 ₽</button>
      <button class="btn-dark" onclick="doTopUp(10000)">+10 000 ₽</button>
    </div>
    <button class="btn-pink btn-full" onclick="doTopUp(3000)">Пополнить на 3 000 ₽ (СБП)</button>
    <button class="btn-dark btn-full" onclick="closeModal()">Отмена</button>
  `);
}

function doTopUp(amount) {
  state.debitBalance += amount;
  state.transactions.unshift({ icon: '+', title: 'Пополнение по СБП', time: 'Только что', amount });
  closeModal();
  showToast(`Баланс пополнен на +${fmtRub(amount)} ★`);
  render();
}

function openTransferModal(recipient = '') {
  openModal(`
    <div class="sheet-handle"></div>
    <div class="section-heading">Перевод по СБП</div>
    <div class="search-box">
      <input id="trName" placeholder="Имя или номер телефона" value="${recipient}" />
    </div>
    <div class="search-box">
      <input id="trSum" type="number" placeholder="Сумма в ₽" value="500" />
    </div>
    <button class="btn-pink btn-full" onclick="doTransfer()">Перевести сейчас →</button>
    <button class="btn-dark btn-full" onclick="closeModal()">Отмена</button>
  `);
}

function doTransfer() {
  const name = document.getElementById('trName').value.trim() || 'Получатель';
  const sum = Math.max(1, parseInt(document.getElementById('trSum').value, 10) || 0);
  if (sum > state.debitBalance) {
    showToast('Недостаточно средств на карте');
    return;
  }
  state.debitBalance -= sum;
  state.transactions.unshift({ icon: '→', title: `Перевод: ${name}`, time: 'Только что', amount: -sum });
  closeModal();
  showToast(`Переведено ${fmtRub(sum)} → ${name}`);
  render();
}

function openQrModal() {
  openModal(`
    <div class="sheet-handle"></div>
    <div class="section-heading">Сканер QR-кода</div>
    <div class="card" style="align-items:center;padding:24px;border:2px dashed var(--hot-pink);">
      <div style="font-size:40px;color:var(--hot-pink);">⊞</div>
      <div class="text-pink" style="font-size:12px;text-align:center;">Наведите камеру на QR-код СБП для оплаты без комиссии</div>
    </div>
    <button class="btn-pink btn-full" onclick="doQrPay()">Симулировать оплату 390 ₽</button>
    <button class="btn-dark btn-full" onclick="closeModal()">Закрыть</button>
  `);
}

function doQrPay() {
  state.debitBalance -= 390;
  state.transactions.unshift({ icon: '⊞', title: 'Оплата по QR · Кофейня', time: 'Только что', amount: -390 });
  closeModal();
  showToast('Оплачено 390 ₽ по QR-коду ★');
  render();
}

function openLiveChat(title, firstMsg) {
  openModal(`
    <div class="sheet-handle"></div>
    <div class="row-between">
      <div class="section-heading">${title}</div>
      <button class="btn-dark btn-sm" onclick="closeModal()">✕</button>
    </div>
    <div class="chat-messages" id="liveChatBox">
      <div class="msg-bubble msg-in">${firstMsg}</div>
    </div>
    <div class="row-center">
      <div class="search-box" style="flex:1;padding:8px 10px;">
        <input id="chatMsgInput" placeholder="Написать сообщение..." />
      </div>
      <button class="btn-pink btn-sm" onclick="sendChatMsg()">→</button>
    </div>
  `);
}

function sendChatMsg() {
  const inp = document.getElementById('chatMsgInput');
  const box = document.getElementById('liveChatBox');
  const txt = inp.value.trim();
  if (!txt) return;
  box.innerHTML += `<div class="msg-bubble msg-out">${txt}</div>`;
  inp.value = '';
  box.scrollTop = box.scrollHeight;
  setTimeout(() => {
    box.innerHTML += `<div class="msg-bubble msg-in">Принято! 🖤 Уже проверяем и вернёмся с ответом через минуту.</div>`;
    box.scrollTop = box.scrollHeight;
  }, 450);
}

window.openCancelIspModal = () => {
  openModal(`
    <div class="sheet-handle"></div>
    <div class="section-heading">Отказаться от услуг</div>
    <div class="text-pink" style="font-size:12px;">
      Договор № 4920184 · ул. Ленина, д. 12, кв. 45. Вы можете временно заморозить тариф бесплатно или подать заявку на полное расторжение.
    </div>
    <button class="btn-dark btn-full" onclick="setIspStatus('paused')">Приостановить интернет на 30 дней</button>
    <button class="btn-danger btn-full" onclick="setIspStatus('cancelled')">Расторгнуть договор и отключить услуги</button>
    <button class="btn-pink btn-full" onclick="closeModal()">Остаться на тарифе</button>
  `);
};

window.setIspStatus = (st) => {
  state.ispStatus = st;
  closeModal();
  showToast(st === 'paused' ? 'Тариф приостановлен на 30 дней' : 'Заявка на отказ от услуг оформлена');
  render();
};

window.openPvzModal = () => {
  openModal(`
    <div class="sheet-handle"></div>
    <div class="section-heading">Выберите пункт выдачи (ПВЗ)</div>
    <button class="btn-dark btn-full" onclick="setPvz('ПВЗ ул. Ленина, 12')">ПВЗ ул. Ленина, 12 (рядом с домом)</button>
    <button class="btn-dark btn-full" onclick="setPvz('ПВЗ ул. Мира, 19 (УрФУ)')">ПВЗ ул. Мира, 19 (УрФУ)</button>
    <button class="btn-dark btn-full" onclick="setPvz('Курьером до двери')">Курьером до двери · 0 ₽</button>
    <button class="btn-pink btn-full" onclick="closeModal()">Закрыть</button>
  `);
};

window.setPvz = (addr) => {
  state.mpPvz = addr;
  closeModal();
  showToast(`Адрес доставки: ${addr}`);
  render();
};

// =========================================================================
// REAL LEAFLET MAPS INITIALIZATION (NO API KEY NEEDED)
// =========================================================================
function initMainLeafletMap() {
  const el = document.getElementById('leafletMap');
  if (!el || typeof L === 'undefined') return;

  mainMapInstance = L.map(el, {
    center: [56.8438, 60.6540],
    zoom: 15,
    zoomControl: false,
    attributionControl: true,
  });

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
    crossOrigin: true,
    attribution: '&copy; OSM &copy; CARTO',
  }).addTo(mainMapInstance);

  const userIcon = L.divIcon({
    className: '',
    html: '<div class="emo-user-marker"></div>',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
  L.marker([56.8438, 60.6540], { icon: userIcon }).addTo(mainMapInstance)
    .on('click', () => showToast('Вы здесь: район УрФУ, ул. Мира, 19'));

  mainMarkersLayer = L.layerGroup().addTo(mainMapInstance);
  renderMapMarkers();
}

function renderMapMarkers() {
  if (!mainMarkersLayer || typeof L === 'undefined') return;
  mainMarkersLayer.clearLayers();

  if (state.mapTab === 'transport') {
    const f = state.transportFilter;
    const visible = TRANSPORT_UNITS.filter(u => {
      if (f === 'all') return true;
      if (f === 'mine') return u.mine;
      return u.type === f;
    });
    visible.forEach(u => {
      const cls = u.type === 'metro' ? 'emo-map-marker metro' : (u.mine ? 'emo-map-marker mine' : 'emo-map-marker');
      const icon = L.divIcon({
        className: '',
        html: `<div class="${cls}">${u.code}</div>`,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });
      L.marker([u.lat, u.lng], { icon })
        .addTo(mainMarkersLayer)
        .on('click', () => showToast(u.label));
    });
  } else if (state.mapTab === 'fuel') {
    FUEL_STATIONS.forEach(st => {
      const icon = L.divIcon({
        className: '',
        html: `<div class="emo-map-marker metro">⛽</div>`,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });
      L.marker([st.lat, st.lng], { icon })
        .addTo(mainMarkersLayer)
        .on('click', () => showToast(st.label));
    });
  }
}

function initTaxiLeafletMap() {
  const el = document.getElementById('taxiLeafletMap');
  if (!el || typeof L === 'undefined') return;

  taxiMapInstance = L.map(el, {
    center: [56.8438, 60.6540],
    zoom: 16,
    zoomControl: false,
    attributionControl: false,
  });

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
    crossOrigin: true,
  }).addTo(taxiMapInstance);

  const pickupIcon = L.divIcon({
    className: '',
    html: '<div class="emo-user-marker"></div>',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
  L.marker([56.8438, 60.6540], { icon: pickupIcon }).addTo(taxiMapInstance);
}

// =========================================================================
// SCREEN RENDERERS
// =========================================================================

function renderHome() {
  const total = state.debitBalance + state.savingsBalance;
  return `
    <div class="content-col">
      <div class="top-header">
        <div class="user-greet">
          <img src="assets/av_girl.jpg" alt="Наталия" class="avatar-ring" />
          <div>
            <div class="greet-sub">Добрый день,</div>
            <div class="greet-name">xX_Наталия_Xx ★</div>
          </div>
        </div>
        <button class="bell-btn" onclick="go('chats')" title="Уведомления">${BELL_SVG}</button>
      </div>

      <div class="card card-hero">
        <div class="row-between">
          <img src="assets/sticker_skull.jpg" alt="" class="sticker-img" style="width:34px;height:34px;border-radius:8px;" />
          <span class="text-pink" style="font-size:12px;font-weight:600;">Общий баланс</span>
          <button class="pill-btn" style="padding:4px 9px;font-size:11px;" onclick="toggleBalance()">
            ${state.balanceHidden ? 'Показать ◉' : 'Скрыть ◉'}
          </button>
        </div>
        <div class="balance-amount">${state.balanceHidden ? '••• ••• ₽' : fmtBal(total)}</div>
        <div class="row-center" style="gap:8px;">
          <button class="btn-pink" style="flex:1;" onclick="go('payments')">→ Перевести</button>
          <button class="btn-dark" style="flex:1;" onclick="openTopUpModal()">+ Пополнить</button>
          <button class="btn-dark" onclick="openQrModal()">⊞ QR</button>
        </div>
      </div>

      <div class="row-between">
        <span class="section-heading">Мои счета и карты</span>
        <span class="section-sub clickable" onclick="showToast('Заявка на новую эмо-карту отправлена ★')">+ Открыть</span>
      </div>
      <div class="grid-2">
        <div class="card card-zebra clickable" onclick="openTopUpModal()">
          <div class="row-between">
            <span style="font-size:12px;font-weight:600;">Основная</span>
            <span class="text-pink" style="font-size:11px;">•• 4821</span>
          </div>
          <div style="font-size:18px;font-weight:800;">${state.balanceHidden ? '•• ••• ₽' : fmtRub(state.debitBalance)}</div>
          <div class="text-pink" style="font-size:11px;">Кэшбэк до 5%</div>
        </div>
        <div class="card clickable" onclick="showToast('Накопительный счёт под 16% годовых')">
          <div class="row-between">
            <span style="font-size:12px;font-weight:600;">Накопления</span>
            <span style="font-size:11px;font-weight:800;color:var(--hot-pink);">16%</span>
          </div>
          <div style="font-size:18px;font-weight:800;">${state.balanceHidden ? '•• ••• ₽' : fmtRub(state.savingsBalance)}</div>
          <div class="text-pink" style="font-size:11px;">+1 120 ₽ в мес</div>
        </div>
      </div>

      <div class="section-heading">Быстрый доступ к сервисам</div>
      <div class="grid-4">
        <div class="eco-tile clickable" onclick="go('maps')">
          <img src="assets/kawaii_maps_transport.png" class="kawaii-icon" alt="Карты" />
          <span>Карты</span>
        </div>
        <div class="eco-tile clickable" onclick="openMarketplaceCatalog('Все')">
          <img src="assets/kawaii_marketplace.png" class="kawaii-icon" alt="Маркет" />
          <span>Маркет</span>
        </div>
        <div class="eco-tile clickable" onclick="go('medicine')">
          <img src="assets/kawaii_hospital.png" class="kawaii-icon" alt="Врачи" />
          <span>Врачи</span>
        </div>
        <div class="eco-tile clickable" onclick="go('internet')">
          <img src="assets/svc_internet.png" class="kawaii-icon" alt="Интернет" />
          <span>Интернет</span>
        </div>
      </div>

      <div class="card">
        <div class="row-between">
          <span class="section-heading">Финансы за ноябрь</span>
          <img src="assets/sticker_heart.jpg" alt="" class="sticker-img" style="width:38px;height:26px;" />
          <span style="font-size:12px;font-weight:700;">Кэшбэк: +1 420 ₽</span>
        </div>
        <div class="text-pink" style="font-size:13px;">Расходы: 42 180 ₽</div>
        <div class="progress-segments">
          <span style="background:#ff1493;"></span>
          <span style="background:#ff2ea2;"></span>
          <span style="background:#6d2850;"></span>
          <span style="background:#381632;"></span>
        </div>
        <div class="chips-row">
          <span class="chip">Продукты 38%</span>
          <span class="chip">Транспорт 19%</span>
          <span class="chip">Сервисы 14%</span>
        </div>
      </div>

      <div class="row-between">
        <span class="section-heading">Последние операции</span>
        <span class="section-sub">История ›</span>
      </div>
      <div class="card" style="gap:11px;">
        ${state.transactions.slice(0, 4).map(t => `
          <div class="row-between">
            <div class="row-center">
              <div style="width:34px;height:34px;border-radius:10px;background:var(--surface);display:flex;align-items:center;justify-content:center;font-weight:700;color:var(--baby-pink);">${t.icon}</div>
              <div>
                <div style="font-size:13px;font-weight:600;">${t.title}</div>
                <div class="text-muted" style="font-size:11px;">${t.time}</div>
              </div>
            </div>
            <div style="font-size:13px;font-weight:700;color:${t.amount > 0 ? 'var(--hot-pink)' : '#fff'};">
              ${t.amount > 0 ? '+' : '−'}${fmtRub(t.amount)}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderPayments() {
  const unpaidCount = state.bills.filter(b => !b.paid).length;
  const placeholders = {
    phone: '+7 (___) ___‑__‑__ или имя',
    card: 'Номер карты получателя',
    between: 'С основной на Накопления',
  };
  return `
    <div class="content-col">
      <div class="top-header">
        <div class="page-title">Платежи</div>
        <div class="header-right">
          <button class="bell-btn" onclick="go('chats')">${BELL_SVG}</button>
          <button class="btn-pink btn-sm" onclick="openQrModal()">⊞ QR</button>
        </div>
      </div>

      <div class="card">
        <div class="segmented">
          <button class="seg-btn ${state.payTab === 'phone' ? 'active' : ''}" onclick="setPayTab('phone')">По телефону</button>
          <button class="seg-btn ${state.payTab === 'card' ? 'active' : ''}" onclick="setPayTab('card')">По карте</button>
          <button class="seg-btn ${state.payTab === 'between' ? 'active' : ''}" onclick="setPayTab('between')">Между счетами</button>
        </div>
        <div class="search-box clickable" onclick="openTransferModal()">
          <span class="text-muted" style="font-size:13px;flex:1;">${placeholders[state.payTab]}</span>
          <span class="text-pink" style="font-size:11px;font-weight:700;">СБП</span>
        </div>
        <div class="grid-4">
          <div class="contact-item" onclick="openTransferModal('Анна')">
            <img src="assets/av_girl.jpg" class="contact-avatar" alt="Анна" />
            <span>Анна</span>
          </div>
          <div class="contact-item" onclick="openTransferModal('Дмитрий')">
            <img src="assets/av_boy.jpg" class="contact-avatar" alt="Дмитрий" />
            <span>Дмитрий</span>
          </div>
          <div class="contact-item" onclick="openTransferModal('Мама')">
            <img src="assets/av_mama_cat.jpg" class="contact-avatar" alt="Мама" />
            <span>Мама</span>
          </div>
          <div class="contact-item" onclick="openTransferModal('')">
            <div class="contact-plus">+</div>
            <span>Новый</span>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="row-between">
          <span class="section-heading">Счета к оплате (${unpaidCount})</span>
          <span class="section-sub">Автоплатежи ›</span>
        </div>
        ${state.bills.map(b => `
          <div class="row-between">
            <div>
              <div style="font-size:13px;font-weight:600;">${b.title}</div>
              <div class="text-pink" style="font-size:11px;">${b.paid ? 'Оплачено ✓' : b.sub}</div>
            </div>
            <button class="btn-dark btn-sm" ${b.paid ? 'disabled style="opacity:0.5;"' : `onclick="payBill('${b.id}')"`}>
              ${b.paid ? 'Оплачен' : 'Оплатить'}
            </button>
          </div>
        `).join('')}
      </div>

      <div class="row-between">
        <span class="section-heading">Шаблоны</span>
        <span class="section-sub clickable" onclick="showToast('Новый шаблон добавлен')">+ Добавить</span>
      </div>
      <div class="grid-3">
        <button class="chip" onclick="openTransferModal('Квартира')">Квартира</button>
        <button class="chip" onclick="openTransferModal('Мобильный')">Мобильный</button>
        <button class="chip" onclick="go('fitness')">Фитнес</button>
      </div>

      <div class="section-heading">Оплата услуг</div>
      <div class="grid-2">
        <div class="card clickable" style="flex-direction:row;align-items:center;padding:11px;" onclick="openTransferModal('Мобильная связь')">
          <img src="assets/svc_mobile.png" class="kawaii-icon" alt="" />
          <span style="font-size:12px;font-weight:600;">Мобильная связь</span>
        </div>
        <div class="card clickable" style="flex-direction:row;align-items:center;padding:11px;" onclick="openTransferModal('ЖКХ и дом')">
          <img src="assets/svc_gkh.png" class="kawaii-icon" alt="" />
          <span style="font-size:12px;font-weight:600;">ЖКХ и дом</span>
        </div>
        <div class="card clickable" style="flex-direction:row;align-items:center;padding:11px;" onclick="go('internet')">
          <img src="assets/svc_internet.png" class="kawaii-icon" alt="" />
          <span style="font-size:12px;font-weight:600;">Интернет и ТВ</span>
        </div>
        <div class="card clickable" style="flex-direction:row;align-items:center;padding:11px;" onclick="go('maps')">
          <img src="assets/svc_transport.png" class="kawaii-icon" alt="" />
          <span style="font-size:12px;font-weight:600;">Транспорт и штрафы</span>
        </div>
        <div class="card clickable" style="flex-direction:row;align-items:center;padding:11px;" onclick="openTransferModal('Госуслуги')">
          <img src="assets/svc_gosuslugi.png" class="kawaii-icon" alt="" />
          <span style="font-size:12px;font-weight:600;">Госуслуги и налоги</span>
        </div>
        <div class="card clickable" style="flex-direction:row;align-items:center;padding:11px;" onclick="go('courses')">
          <img src="assets/kawaii_courses_new.jpg" class="kawaii-icon" alt="" />
          <span style="font-size:12px;font-weight:600;">Курсы</span>
        </div>
      </div>
    </div>
  `;
}

function renderChats() {
  const filtered = state.chatFilter === 'all'
    ? state.threads
    : state.threads.filter(t => t.cat === state.chatFilter);
  return `
    <div class="content-col">
      <div class="top-header">
        <div class="page-title" style="font-size:20px;">Чаты и уведомления</div>
        <button class="bell-btn" onclick="showToast('Все уведомления актуальны ★')">${BELL_SVG}</button>
      </div>

      <div class="segmented">
        <button class="seg-btn ${state.chatFilter === 'all' ? 'active' : ''}" onclick="setChatFilter('all')">Все</button>
        <button class="seg-btn ${state.chatFilter === 'support' ? 'active' : ''}" onclick="setChatFilter('support')">Поддержка</button>
        <button class="seg-btn ${state.chatFilter === 'services' ? 'active' : ''}" onclick="setChatFilter('services')">Сервисы</button>
        <button class="seg-btn ${state.chatFilter === 'history' ? 'active' : ''}" onclick="setChatFilter('history')">История</button>
      </div>

      <div class="card card-hero" style="flex-direction:row;align-items:center;justify-content:space-between;">
        <div class="row-center">
          <img src="assets/sticker_skull.jpg" alt="" class="sticker-img" style="width:42px;height:42px;border-radius:10px;" />
          <div>
            <div style="font-size:14px;font-weight:700;">Поддержка банка 24/7</div>
            <div class="text-pink" style="font-size:11px;">Среднее время ответа — 2 мин</div>
          </div>
        </div>
        <button class="btn-pink btn-sm" onclick="openLiveChat('Поддержка банка 24/7', 'Привет! 🖤 Чем помочь по карте или сервисам?')">Чат</button>
      </div>

      <div class="card thread-list">
        ${filtered.map(t => `
          <div class="thread-row" onclick="${t.go ? (t.go === 'marketplace' ? "openMarketplaceCatalog('Все')" : `go('${t.go}')`) : `openLiveChat('${t.title}', '${t.msg}')`}">
            ${t.isTextIcon
              ? `<div style="width:42px;height:42px;border-radius:12px;background:var(--hot-pink);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:16px;flex-shrink:0;">${t.icon}</div>`
              : `<img src="${t.icon}" class="kawaii-icon" style="width:42px;height:42px;" alt="" />`
            }
            <div style="flex:1;min-width:0;">
              <div style="font-size:13px;font-weight:700;">${t.title}</div>
              <div class="text-pink" style="font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${t.msg}</div>
            </div>
            <div style="display:flex;flex-direction:column;align-items:flex-end;gap:5px;">
              <span class="text-muted" style="font-size:10px;">${t.date}</span>
              ${t.unread ? `<span class="badge-count">${t.unread}</span>` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderServices() {
  const q = state.serviceQuery.toLowerCase();
  const match = (txt) => !q || txt.toLowerCase().includes(q);
  return `
    <div class="content-col">
      <div class="top-header">
        <div class="page-title">Сервисы</div>
        <div class="header-right">
          <button class="pill-btn" onclick="showToast('Город: Екатеринбург')">Екатеринбург ▾</button>
          <button class="bell-btn" onclick="go('chats')">${BELL_SVG}</button>
        </div>
      </div>

      <div class="search-box">
        <span class="text-muted">◎</span>
        <input id="svcSearchInput" placeholder="Поиск сервисов..." value="${state.serviceQuery}" oninput="setServiceQuery(this.value)" />
      </div>

      ${match('маркетплейс товары каталог restore street beat мир кубиков') ? `
      <div class="card card-zebra clickable" onclick="openMarketplaceCatalog('Все')">
        <div class="row-between">
          <div class="row-center">
            <img src="assets/kawaii_marketplace.png" class="kawaii-icon" style="width:42px;height:42px;" alt="" />
            <div>
              <div style="font-size:17px;font-weight:800;">Маркетплейс</div>
              <div class="text-pink" style="font-size:12px;">Товары с кэшбэком и доставкой</div>
            </div>
          </div>
          <img src="assets/sticker_heart.jpg" class="sticker-img" style="width:44px;height:30px;" alt="" />
        </div>
        <div class="chips-row">
          <button class="chip active" onclick="event.stopPropagation();openMarketplaceCatalog('Все')">Каталог</button>
          <button class="chip" onclick="event.stopPropagation();openMarketplaceOrders()">Заказы</button>
        </div>
      </div>` : ''}

      <div class="section-sub">Город и передвижение</div>
      <div class="grid-2">
        ${match('карты транспорт навигатор заправки') ? `
        <div class="card svc-card clickable" onclick="go('maps')">
          <div class="row-between">
            <img src="assets/kawaii_maps_transport.png" class="kawaii-icon" alt="" />
            <span class="tag-pill">Карта</span>
          </div>
          <div class="svc-card-title">Карты и транспорт</div>
          <div class="svc-card-desc">Навигатор, отслеживание транспорта в реальном времени, карта заправок</div>
        </div>` : ''}
        ${match('такси машина заказ') ? `
        <div class="card svc-card clickable" onclick="go('taxi')">
          <div class="row-between">
            <img src="assets/kawaii_taxi_new.jpg" class="kawaii-icon" alt="" />
            <span class="tag-pill">от 240 ₽</span>
          </div>
          <div class="svc-card-title">Такси</div>
          <div class="svc-card-desc">Быстрый и удобный заказ такси</div>
        </div>` : ''}
      </div>

      <div class="section-sub">Дом и услуги</div>
      <div class="grid-2">
        ${match('интернет провайдер тариф') ? `
        <div class="card svc-card clickable" onclick="go('internet')">
          <div class="row-between">
            <img src="assets/svc_internet.png" class="kawaii-icon" alt="" />
            <span class="tag-pill">ЛК</span>
          </div>
          <div class="svc-card-title">Интернет-провайдер</div>
          <div class="svc-card-desc">Личный кабинет, тариф, баланс и заявка на установку</div>
        </div>` : ''}
        ${match('услуги мастера специалисты') ? `
        <div class="card svc-card clickable" onclick="go('profi')">
          <div class="row-between">
            <img src="assets/av_emo_bangs.png" class="kawaii-icon" alt="" />
            <span class="tag-pill">Заказы</span>
          </div>
          <div class="svc-card-title">Услуги и мастера</div>
          <div class="svc-card-desc">Подбор проверенных специалистов и мастеров для любых задач</div>
        </div>` : ''}
      </div>

      <div class="section-sub">Здоровье и спорт</div>
      <div class="grid-2">
        ${match('медицина клиники врачи больницы') ? `
        <div class="card svc-card clickable" onclick="go('medicine')">
          <div class="row-between">
            <img src="assets/kawaii_hospital.png" class="kawaii-icon" alt="" />
            <span class="tag-pill">ОМС/ЧК</span>
          </div>
          <div class="svc-card-title">Медицина и клиники</div>
          <div class="svc-card-desc">Онлайн-запись в частные и государственные больницы</div>
        </div>` : ''}
        ${match('фитнес абонемент спорт йога') ? `
        <div class="card svc-card clickable" onclick="go('fitness')">
          <div class="row-between">
            <img src="assets/kawaii_fitness_new.jpg" class="kawaii-icon" alt="" />
            <span class="tag-pill">${state.fitPoints} б.</span>
          </div>
          <div class="svc-card-title">Фитнес-абонемент</div>
          <div class="svc-card-desc">Единый абонемент и запись в студии и спортзалы</div>
        </div>` : ''}
      </div>

      <div class="section-sub">Развитие и обучение</div>
      ${match('допобразование курсы обучение') ? `
      <div class="card clickable" style="flex-direction:row;align-items:center;" onclick="go('courses')">
        <img src="assets/kawaii_courses_new.jpg" class="kawaii-icon" style="width:44px;height:44px;" alt="" />
        <div style="flex:1;">
          <div style="font-size:15px;font-weight:700;">Допобразование и курсы</div>
          <div class="text-pink" style="font-size:12px;">Освоение новых профессий, онлайн-курсы и сертификаты</div>
        </div>
        <span class="text-pink" style="font-size:18px;">›</span>
      </div>` : ''}

      <div class="section-sub">Активные записи и заказы</div>
      <div class="card" style="gap:8px;font-size:12px;">
        <div class="row-center clickable" onclick="openMarketplaceCatalog('Все')">
          <span class="tag-pill">Маркетплейс</span>
          <span class="text-pink">Заказ #4821 — доставка завтра</span>
        </div>
        <div class="row-center clickable" onclick="go('medicine')">
          <span class="tag-pill">Медицина</span>
          <span class="text-pink">${state.medUpcoming.doc}</span>
        </div>
        <div class="row-center clickable" onclick="go('internet')">
          <span class="tag-pill">Интернет</span>
          <span class="text-pink">Баланс ${state.ispBalance} ₽ · оплата до 01.12</span>
        </div>
      </div>
    </div>
  `;
}

function renderMapsSheetChips() {
  if (state.mapTab === 'transport') {
    const filters = [
      ['all', 'Все'],
      ['mine', '★ Мой транспорт'],
      ['bus', 'Автобусы'],
      ['tram', 'Трамваи'],
      ['trolley', 'Троллейбусы'],
      ['metro', 'Метро'],
    ];
    return filters.map(([id, lbl]) => `
      <button class="chip ${state.transportFilter === id ? 'active' : ''}" onclick="setTransportFilter('${id}')">${lbl}</button>
    `).join('');
  }
  if (state.mapTab === 'fuel') {
    return `
      <button class="chip active" onclick="showToast('Показаны АЗС с АИ-95')">АИ-95</button>
      <button class="chip" onclick="showToast('Показаны АЗС с АИ-92')">АИ-92</button>
      <button class="chip" onclick="showToast('Показаны АЗС с ДТ')">Дизель</button>
      <button class="chip" onclick="showToast('Показаны электрозарядки')">Электро</button>
    `;
  }
  // Navigator mode — NO transport filters here!
  return `
    <button class="chip" onclick="showToast('Маршрут домой: 14 мин на авто')">Дом</button>
    <button class="chip" onclick="showToast('Маршрут на работу: 21 мин')">Работа</button>
    <button class="chip" onclick="showToast('Рядом 12 кафе и ресторанов')">Где поесть</button>
    <button class="chip" onclick="showToast('Парковки рядом отмечены')">Парковки</button>
  `;
}

function renderMaps() {
  return `
    <div style="display:flex;flex-direction:column;flex:1;min-height:100%;">
      <div class="map-viewport">
        <div id="leafletMap" class="leaflet-host"></div>

        <button class="map-float-btn" style="left:14px;top:12px;" onclick="goBack()">←</button>
        <button class="map-float-btn" style="right:14px;top:12px;" onclick="showToast('Слои: Карта + Пробки')">▤</button>
        <button class="map-float-btn" style="right:14px;top:58px;" onclick="showToast('Пробки: 4 балла')">◉</button>
        <button class="map-float-btn" style="right:14px;top:104px;" onclick="showToast('Погода: +1°, облачно')">1°</button>
        <button class="map-float-btn" style="right:14px;top:190px;" onclick="mapZoomIn()">+</button>
        <button class="map-float-btn" style="right:14px;top:234px;" onclick="mapZoomOut()">−</button>
        <button class="map-float-btn" style="right:14px;top:284px;" onclick="mapCenterUser()">➤</button>

        <button class="map-float-btn" style="left:14px;bottom:14px;border-radius:12px;" onclick="showToast('Построение маршрута')">⇄</button>
        <button class="map-float-btn" style="left:60px;bottom:14px;border-radius:12px;" onclick="showToast('Домой: 18 мин')">⌂</button>
      </div>

      <div class="map-sheet">
        <div class="sheet-handle"></div>
        <div class="row-center">
          <div class="search-box" style="flex:1;padding:9px 12px;">
            <span class="text-muted">◎</span>
            <input placeholder="${state.mapTab === 'nav' ? 'Куда едем? Адрес или место' : (state.mapTab === 'fuel' ? 'Поиск АЗС...' : 'Поиск остановок и маршрутов')}" />
          </div>
          ${state.mapTab === 'transport' ? `<button class="btn-dark" style="padding:9px 11px;" onclick="setTransportFilter('mine')" title="Мой транспорт">★</button>` : `<button class="btn-dark" style="padding:9px 11px;" onclick="showToast('Сохранённые места')" title="Закладки">⚑</button>`}
        </div>

        <div class="chips-row" id="mapsSheetChips">
          ${renderMapsSheetChips()}
        </div>

        <div class="card clickable" style="flex-direction:row;align-items:center;justify-content:space-between;padding:10px 12px;" onclick="go('taxi')">
          <div>
            <div style="font-size:13px;font-weight:700;">Вызвать такси отсюда</div>
            <div class="text-pink" style="font-size:11px;">Эконом · 4 мин · от 240 ₽</div>
          </div>
          <span class="btn-pink btn-sm">Такси →</span>
        </div>
      </div>
    </div>
  `;
}

function renderTaxi() {
  const tariffs = [
    { id: 'econ', name: 'Эконом', price: 240, eta: '4 мин', img: 'assets/car_econ.jpg' },
    { id: 'comf', name: 'Комфорт', price: 340, eta: '3 мин', img: 'assets/car_comf.jpg' },
    { id: 'deliv', name: 'Доставка', price: 290, eta: '6 мин', img: 'assets/car_deliv.jpg' },
  ];
  const cur = tariffs.find(t => t.id === state.taxiTariff);
  return `
    <div style="display:flex;flex-direction:column;flex:1;min-height:100%;">
      <div class="map-viewport" style="min-height:230px;">
        <div id="taxiLeafletMap" class="leaflet-host"></div>
        <button class="map-float-btn" style="left:14px;top:12px;" onclick="goBack()">←</button>
        <div style="position:absolute;left:50%;top:64px;transform:translateX(-50%);background:var(--hot-pink);padding:6px 12px;border-radius:14px;font-size:11px;font-weight:700;white-space:nowrap;z-index:500;box-shadow:0 4px 16px rgba(255,20,147,0.6);">
          ${state.taxiOrdered ? '★ Водитель уже едет (3 мин)' : `Подача: ${cur.eta} · ул. Мира, 19`}
        </div>
      </div>

      <div class="map-sheet" style="flex:1;">
        <div class="card" style="padding:10px 12px;gap:8px;">
          <div class="row-center" style="font-size:13px;">
            <span style="width:12px;height:12px;border-radius:50%;background:var(--hot-pink);display:inline-block;"></span>
            <span>Откуда: ул. Мира, 19 (УрФУ)</span>
          </div>
          <div style="height:1px;background:var(--border-dark);"></div>
          <div class="row-center">
            <span style="width:12px;height:12px;border-radius:50%;background:var(--surface-alt);display:inline-block;"></span>
            <input style="background:transparent;border:none;outline:none;color:#fff;font-size:13px;font-weight:600;width:100%;" placeholder="Куда поедем?" value="${state.taxiTo}" oninput="state.taxiTo=this.value" />
          </div>
        </div>

        <div class="grid-3">
          <button class="chip" onclick="setTaxiTo('Дом · 15 мин')">Дом · 15 мин</button>
          <button class="chip" onclick="setTaxiTo('Работа · 22 мин')">Работа · 22 мин</button>
          <button class="chip" onclick="setTaxiTo('Аэропорт')">Аэропорт</button>
        </div>

        <div class="section-sub">Выберите тариф</div>
        <div class="grid-3">
          ${tariffs.map(t => `
            <div class="tariff-card ${state.taxiTariff === t.id ? 'active' : ''}" onclick="setTaxiTariff('${t.id}')">
              <img src="${t.img}" class="tariff-car" alt="${t.name}" />
              <div style="font-size:12px;font-weight:700;">${t.name}</div>
              <div style="font-size:14px;font-weight:800;">${t.price} ₽</div>
              <div class="text-pink" style="font-size:10px;">${t.eta}</div>
            </div>
          `).join('')}
        </div>

        <div class="row-between" style="font-size:12px;">
          <span>Оплата: Карта •• 4821 ▾</span>
          <span class="text-pink">Комментарий / опции ›</span>
        </div>

        <button class="btn-pink btn-full" onclick="orderTaxi(${cur.price}, '${cur.name}')">
          ${state.taxiOrdered ? 'Отменить заказ такси' : `Заказать такси · ${cur.price} ₽`}
        </button>
      </div>
    </div>
  `;
}

function renderFitness() {
  const days = [['Пн','23'],['Вт','24'],['Ср','25'],['Чт','26'],['Пт','27']];
  const cats = ['Все','Йога','Бассейн','Зал','Пилатес'];
  const studios = [
    { name: 'Студия баланса «Воздух»', cat: 'Йога', meta: 'Йога · 0.6 км · ★ 4.9', pts: 4, slots: ['18:00','19:30'], img: 'assets/fit_skull.png' },
    { name: 'Фитнес-клуб «Атлет»', cat: 'Зал', meta: 'Тренажёрный зал · 1.1 км · ★ 4.8', pts: 5, slots: ['17:00','20:00'], img: 'assets/fit_cat.png' },
    { name: 'Аква-центр «Волна»', cat: 'Бассейн', meta: 'Бассейн 25м · 1.4 км · ★ 4.9', pts: 6, slots: ['19:00','21:00'], img: 'assets/fit_yoga.jpg' },
  ].filter(s => state.fitCat === 'Все' || s.cat === state.fitCat);

  return `
    <div class="nav-header">
      <div class="nav-left">
        <button class="back-btn" onclick="goBack()">←</button>
        <span class="nav-title">Фитнес</span>
      </div>
      <span class="pill-btn">${state.fitPoints} балла</span>
    </div>
    <div class="content-col">
      <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:6px;">
        ${days.map(([wd, dd], i) => `
          <button class="day-pill ${state.fitDay === i ? 'active' : ''}" onclick="setFitDay(${i})">
            <span class="day-wd">${wd}</span>
            <span class="day-num">${dd}</span>
          </button>
        `).join('')}
      </div>

      <div class="chips-row">
        ${cats.map(c => `<button class="chip ${state.fitCat === c ? 'active' : ''}" onclick="setFitCat('${c}')">${c}</button>`).join('')}
      </div>

      ${studios.map(st => `
        <div class="card">
          <div class="row-center">
            <img src="${st.img}" class="emo-thumb" alt="${st.name}" />
            <div>
              <div style="font-size:14px;font-weight:700;">${st.name}</div>
              <div class="text-pink" style="font-size:11px;">${st.meta}</div>
              <div style="font-size:12px;font-weight:700;margin-top:2px;">${st.pts} балла</div>
            </div>
          </div>
          <div class="row-between">
            <div class="row-center" style="gap:6px;">
              ${st.slots.map(sl => `<span class="chip">${sl}</span>`).join('')}
            </div>
            <button class="btn-pink btn-sm" onclick="bookFitness('${st.name}', ${st.pts})">Записаться</button>
          </div>
        </div>
      `).join('')}

      <div class="card" style="background:var(--surface);flex-direction:row;align-items:center;justify-content:space-between;">
        <span style="font-size:12px;font-weight:600;">Мои записи (${state.fitBookings.length}): ${state.fitBookings[0]}</span>
        <span class="text-pink">›</span>
      </div>
    </div>
  `;
}

function renderInternet() {
  const statusMap = {
    active: '● Активен',
    paused: '⏸ Приостановлен (30 дн.)',
    cancelled: '✕ Заявка на отключение',
  };
  return `
    <div class="nav-header">
      <div class="nav-left">
        <button class="back-btn" onclick="goBack()">←</button>
        <span class="nav-title">Интернет</span>
      </div>
      <span class="pill-btn">Договор</span>
    </div>
    <div class="content-col">
      <div class="segmented">
        <button class="seg-btn ${state.ispTab === 'lk' ? 'active' : ''}" onclick="setIspTab('lk')">Личный кабинет</button>
        <button class="seg-btn ${state.ispTab === 'new' ? 'active' : ''}" onclick="setIspTab('new')">Подключить адрес</button>
      </div>

      ${state.ispTab === 'lk' ? `
      <div class="card">
        <div class="row-between">
          <span class="text-pink" style="font-size:12px;font-weight:600;">Договор № 4920184</span>
          <span class="tag-pill">${statusMap[state.ispStatus]}</span>
        </div>
        <div class="text-pink" style="font-size:13px;">ул. Ленина, д. 12, кв. 45</div>
        <div class="row-between">
          <div>
            <div style="font-size:24px;font-weight:800;">${state.ispBalance},00 ₽</div>
            <div class="text-pink" style="font-size:11px;">Списание 1 декабря · 650 ₽</div>
          </div>
          <button class="btn-pink" onclick="topUpIsp()">Пополнить</button>
        </div>
      </div>

      <div class="card">
        <div class="row-between">
          <span class="text-pink" style="font-size:12px;font-weight:600;">Ваш тариф</span>
          <span style="font-size:12px;font-weight:700;">Сменить ›</span>
        </div>
        <div style="font-size:16px;font-weight:700;">Домашний 500 Мбит/с + ТВ</div>
        <div class="chips-row">
          <span class="chip">500 Мбит/с</span>
          <span class="chip">180 каналов</span>
          <span class="chip">Wi-Fi роутер</span>
        </div>
      </div>

      <div class="grid-2">
        <div class="card clickable" onclick="setIspTab('new')">
          <div style="font-size:18px;color:var(--hot-pink);">+</div>
          <div style="font-size:13px;font-weight:700;">Заказать установку</div>
        </div>
        <div class="card clickable" onclick="showToast('Сеть стабильна: 492 Мбит/с, пинг 4 мс ★')">
          <div style="font-size:18px;color:var(--hot-pink);">⚡</div>
          <div style="font-size:13px;font-weight:700;">Диагностика сети</div>
        </div>
        <div class="card clickable" onclick="showToast('Обещанный платёж на 7 дней доступен')">
          <div style="font-size:18px;color:var(--hot-pink);">₽</div>
          <div style="font-size:13px;font-weight:700;">Обещанный платёж</div>
        </div>
        <div class="card clickable" onclick="showToast('Заявка на визит мастера создана')">
          <div style="font-size:18px;color:var(--hot-pink);">⚙</div>
          <div style="font-size:13px;font-weight:700;">Вызвать мастера</div>
        </div>
      </div>

      <div class="card card-hero">
        <div style="font-size:14px;font-weight:700;">Подключить новый адрес или роутер</div>
        <div class="text-pink" style="font-size:12px;">Проверим доступность дома и назначим удобное время визита инженера</div>
        <button class="btn-pink btn-full" onclick="setIspTab('new')">Оставить заявку на установку</button>
      </div>

      <button class="btn-danger btn-full" onclick="openCancelIspModal()">
        ✕ Отказаться от услуг / Расторгнуть договор
      </button>
      ` : `
      <div class="card">
        <div class="section-heading">Заявка на подключение</div>
        <div class="search-box"><input placeholder="Город, улица, дом и квартира" /></div>
        <div class="search-box"><input placeholder="Контактный телефон" value="+7 (999) 123-45-67" /></div>
        <div class="chips-row">
          <span class="chip active">500 Мбит/с · 650 ₽</span>
          <span class="chip">1 Гбит/с · 950 ₽</span>
        </div>
        <button class="btn-pink btn-full" onclick="showToast('Заявка на подключение принята! ★');setIspTab('lk')">Отправить заявку</button>
      </div>
      `}
    </div>
  `;
}

function openCreateProfiOrderModal(preCat = 'Ремонт') {
  openModal(`
    <div class="sheet-handle"></div>
    <div class="row-between">
      <div class="section-heading">Новая заявка на услугу</div>
      <button class="btn-dark btn-sm" onclick="closeModal()">✕</button>
    </div>
    <select id="profiCat" class="form-field">
      ${['Ремонт', 'Уборка', 'Репетиторы', 'Электрик', 'Красота', 'Авто'].map(c =>
        `<option value="${c}" ${c === preCat ? 'selected' : ''}>${c}</option>`
      ).join('')}
    </select>
    <input id="profiTitle" class="form-field" placeholder="Что нужно сделать? (например, собрать шкаф)" />
    <textarea id="profiDesc" class="form-field" rows="3" placeholder="Опишите задачу подробнее..."></textarea>
    <div class="grid-2">
      <input id="profiBudget" type="number" class="form-field" placeholder="Бюджет, ₽" value="2000" />
      <input id="profiDate" class="form-field" placeholder="Когда?" value="Завтра, 18:00" />
    </div>
    <input id="profiAddr" class="form-field" placeholder="Адрес" value="ул. Ленина, д. 12" />
    <button class="btn-pink btn-full" onclick="submitProfiOrder()">Опубликовать заявку →</button>
  `);
}

window.submitProfiOrder = () => {
  const category = document.getElementById('profiCat').value;
  const title = document.getElementById('profiTitle').value.trim() || `Услуга: ${category}`;
  const budget = Math.max(300, parseInt(document.getElementById('profiBudget').value, 10) || 1500);
  const date = document.getElementById('profiDate').value.trim() || 'По договорённости';
  const address = document.getElementById('profiAddr').value.trim() || 'Екатеринбург';

  state.profiOrders.unshift({
    id: Date.now(),
    category,
    title,
    budget,
    date,
    address,
    status: 'Опубликована · ждём отклики',
  });
  state.profiTab = 'orders';
  closeModal();
  showToast('Заявка опубликована! Мастера скоро откликнутся ★');
  render();
};

window.cancelProfiOrder = (id) => {
  state.profiOrders = state.profiOrders.filter(o => o.id !== id);
  showToast('Заявка удалена');
  render();
};

window.setProfiTab = (t) => { state.profiTab = t; render(); };

function renderProfi() {
  return `
    <div class="nav-header">
      <div class="nav-left">
        <button class="back-btn" onclick="goBack()">←</button>
        <span class="nav-title">Услуги и мастера</span>
      </div>
      <button class="pill-btn" onclick="setProfiTab(state.profiTab === 'orders' ? 'specialists' : 'orders')">
        ${state.profiTab === 'orders' ? 'Специалисты' : `Мои заявки (${state.profiOrders.length})`}
      </button>
    </div>
    <div class="content-col">
      <div class="segmented">
        <button class="seg-btn ${state.profiTab === 'specialists' ? 'active' : ''}" onclick="setProfiTab('specialists')">Специалисты</button>
        <button class="seg-btn ${state.profiTab === 'orders' ? 'active' : ''}" onclick="setProfiTab('orders')">Мои заявки (${state.profiOrders.length})</button>
      </div>

      <button class="btn-pink btn-full" onclick="openCreateProfiOrderModal()">+ Создать заявку и получить отклики</button>

      ${state.profiTab === 'specialists' ? `
        <div class="search-box">
          <span class="text-muted">◎</span>
          <input placeholder="Какая услуга нужна?" />
        </div>

        <div class="section-sub">Категории специалистов</div>
        <div class="grid-3">
          ${[['⚒','Ремонт'],['✦','Уборка'],['✎','Репетиторы'],['⚡','Электрик'],['✂','Красота'],['◉','Авто']].map(([ic, lbl]) => `
            <div class="card clickable" style="align-items:center;padding:10px;gap:6px;" onclick="openCreateProfiOrderModal('${lbl}')">
              <span style="font-size:18px;color:var(--baby-pink);">${ic}</span>
              <span style="font-size:11px;font-weight:600;">${lbl}</span>
            </div>
          `).join('')}
        </div>

        <div class="section-sub">Проверенные мастера рядом</div>
        <div class="card">
          <div class="row-center">
            <img src="assets/av_boy.jpg" class="contact-avatar" style="width:48px;height:48px;" alt="" />
            <div>
              <div style="font-size:14px;font-weight:700;">Алексей Смирнов</div>
              <div class="text-pink" style="font-size:12px;">Сантехник · Электрик</div>
              <div style="font-size:11px;font-weight:600;">★ 4.9 (112 отзывов)</div>
            </div>
          </div>
          <div class="row-between">
            <span style="font-size:14px;font-weight:800;">от 1 500 ₽</span>
            <div class="row-center" style="gap:6px;">
              <button class="btn-dark btn-sm" onclick="openLiveChat('Алексей Смирнов', 'Здравствуйте! Подскажите, какие работы планируются?')">Чат</button>
              <button class="btn-pink btn-sm" onclick="showToast('Мастер Алексей Смирнов выбран ★')">Выбрать</button>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="row-center">
            <img src="assets/av_girl.jpg" class="contact-avatar" style="width:48px;height:48px;" alt="" />
            <div>
              <div style="font-size:14px;font-weight:700;">Марина Козлова</div>
              <div class="text-pink" style="font-size:12px;">Репетитор по английскому</div>
              <div style="font-size:11px;font-weight:600;">★ 5.0 (64 отзыва)</div>
            </div>
          </div>
          <div class="row-between">
            <span style="font-size:14px;font-weight:800;">1 800 ₽ / час</span>
            <div class="row-center" style="gap:6px;">
              <button class="btn-dark btn-sm" onclick="openLiveChat('Марина Козлова', 'Привет! Готова провести пробное занятие в удобное время.')">Чат</button>
              <button class="btn-pink btn-sm" onclick="showToast('Репетитор Марина Козлова выбрана ★')">Выбрать</button>
            </div>
          </div>
        </div>
      ` : `
        <div class="section-sub">Ваши активные заявки и заказы</div>
        ${state.profiOrders.length === 0 ? `<div class="card text-pink">У вас пока нет активных заявок — нажмите «+ Создать заявку» выше</div>` : state.profiOrders.map(o => `
          <div class="card">
            <div class="row-between">
              <span class="tag-pill">${o.category}</span>
              <span class="text-pink" style="font-size:11px;font-weight:600;">${o.status}</span>
            </div>
            <div style="font-size:14px;font-weight:700;">${o.title}</div>
            <div class="text-muted" style="font-size:11px;">${o.date} · ${o.address}</div>
            <div class="row-between">
              <span style="font-size:14px;font-weight:800;">до ${fmtRub(o.budget)}</span>
              <button class="btn-danger btn-sm" onclick="cancelProfiOrder(${o.id})">Отменить</button>
            </div>
          </div>
        `).join('')}
      `}
    </div>
  `;
}

function renderProductDetail(p) {
  const partPrice = Math.round(p.price / 4);
  return `
    <div class="nav-header">
      <div class="nav-left">
        <button class="back-btn" onclick="goBack()">←</button>
        <span class="nav-title">${p.store}</span>
      </div>
      <button class="pill-btn" onclick="toggleFav(${p.id})">${p.fav ? '♥ В избранном' : '♡ В избранное'}</button>
    </div>
    <div class="content-col">
      <div class="pd-hero">
        <img src="${p.img}" alt="${p.title}" onerror="this.src='assets/prod_headphones.jpg'" />
        <span class="store-badge" style="position:absolute;left:10px;top:10px;">★ ${p.store}</span>
      </div>

      <div class="card">
        <div class="row-between">
          <span style="font-size:22px;font-weight:800;">${fmtRub(p.price)}</span>
          <span class="tag-pill">Кэшбэк ${p.cash}</span>
        </div>
        <div style="font-size:15px;font-weight:700;line-height:1.3;">${p.title}</div>
        <div class="row-between" style="font-size:12px;">
          <span class="text-pink">★ ${p.rating} · ${p.reviews} отзывов</span>
          <span class="text-muted">Частями: 4 × ${fmtRub(partPrice)}</span>
        </div>
      </div>

      <div class="card">
        <div class="section-sub">${p.variantsLabel}</div>
        <div class="chips-row">
          ${p.variants.map(v => `
            <button class="chip ${state.selectedVariant === v ? 'active' : ''}" onclick="setSelectedVariant('${v}')">${v}</button>
          `).join('')}
        </div>
      </div>

      <div class="card">
        <div class="section-heading" style="font-size:13px;">Описание</div>
        <div class="text-pink" style="font-size:12px;line-height:1.45;">${p.desc}</div>
      </div>

      <div class="card" style="gap:2px;">
        <div class="section-heading" style="font-size:13px;margin-bottom:4px;">Характеристики</div>
        ${p.specs.map(([k, v]) => `
          <div class="spec-row">
            <span class="text-muted">${k}</span>
            <span style="font-weight:600;text-align:right;">${v}</span>
          </div>
        `).join('')}
      </div>

      <div class="row-center" style="gap:8px;">
        <button class="btn-pink btn-full" onclick="addToCart(${p.id})">В корзину · ${fmtRub(p.price)}</button>
      </div>
    </div>
  `;
}

function renderMarketplace() {
  if (state.selectedProductId !== null) {
    const p = state.products.find(x => x.id === state.selectedProductId);
    if (p) return renderProductDetail(p);
  }

  const cats = ['Все', 're:Store', 'Street Beat', 'Мир Кубиков'];
  let body = '';

  if (state.mpTab === 'catalog' || state.mpTab === 'fav') {
    const q = state.mpQuery.toLowerCase();
    const list = state.products.filter(p => {
      if (state.mpTab === 'fav') return p.fav;
      const catOk = state.mpCat === 'Все' || p.cat === state.mpCat;
      const qOk = !q || p.title.toLowerCase().includes(q) || p.store.toLowerCase().includes(q);
      return catOk && qOk;
    });
    body = `
      ${state.mpTab === 'catalog' ? `
        <div class="search-box">
          <span class="text-muted">◎</span>
          <input id="mpSearchInput" placeholder="Искать в re:Store, Street Beat, Мир Кубиков..." value="${state.mpQuery}" oninput="setMpQuery(this.value)" />
        </div>
        <div class="text-pink clickable" style="font-size:12px;" onclick="openPvzModal()">Доставка: ${state.mpPvz} ▾</div>
        <div class="chips-row">
          ${cats.map(c => `<button class="chip ${state.mpCat === c ? 'active' : ''}" onclick="setMpCat('${c}')">${c}</button>`).join('')}
        </div>
        <div class="card card-zebra" style="flex-direction:row;align-items:center;justify-content:space-between;">
          <div>
            <div style="font-size:14px;font-weight:700;">Кэшбэк до 15% + оплата частями</div>
            <div class="text-pink" style="font-size:11px;">Промокод EMO2007 даёт −10% в корзине</div>
          </div>
          <img src="assets/sticker_heart.jpg" class="sticker-img" style="width:48px;height:36px;" alt="" />
        </div>
      ` : `<div class="section-heading">Избранные товары (${list.length})</div>`}

      <div class="grid-2">
        ${list.map(p => `
          <div class="product-card clickable" onclick="openProductDetail(${p.id})">
            <div>
              <div class="product-img-wrap">
                <img src="${p.img}" alt="${p.title}" onerror="this.src='assets/prod_headphones.jpg'" />
                <span class="store-badge" style="position:absolute;left:5px;bottom:5px;padding:2px 6px;font-size:9px;">${p.store}</span>
                <button class="fav-heart-btn ${p.fav ? 'active' : ''}" onclick="event.stopPropagation();toggleFav(${p.id})">${p.fav ? '♥' : '♡'}</button>
              </div>
              <div class="row-center" style="margin-top:8px;gap:5px;flex-wrap:wrap;">
                <span style="font-size:14px;font-weight:800;">${fmtRub(p.price)}</span>
                <span class="tag-pill">${p.cash}</span>
              </div>
              <div class="text-pink" style="font-size:11px;margin-top:4px;line-height:1.3;">${p.title}</div>
            </div>
            <button class="btn-pink btn-sm btn-full" onclick="event.stopPropagation();addToCart(${p.id})">В корзину</button>
          </div>
        `).join('')}
      </div>
    `;
  } else if (state.mpTab === 'cart') {
    const items = state.cart.map(id => state.products.find(p => p.id === id)).filter(Boolean);
    const subtotal = items.reduce((s, p) => s + p.price, 0);
    const total = state.mpPromoApplied ? Math.round(subtotal * 0.9) : subtotal;
    body = `
      <div class="section-heading">Корзина (${items.length})</div>
      ${items.length === 0 ? `<div class="card text-pink">Корзина пуста — добавьте товары из каталога</div>` : `
        ${items.map((p, idx) => `
          <div class="card clickable" style="flex-direction:row;align-items:center;" onclick="openProductDetail(${p.id})">
            <img src="${p.img}" class="emo-thumb" alt="" onerror="this.src='assets/prod_headphones.jpg'" />
            <div style="flex:1;">
              <div class="text-muted" style="font-size:10px;font-weight:700;">${p.store}</div>
              <div style="font-size:13px;font-weight:700;">${p.title}</div>
              <div class="text-pink" style="font-size:13px;font-weight:700;">${fmtRub(p.price)}</div>
            </div>
            <button class="btn-dark btn-sm" onclick="event.stopPropagation();removeFromCart(${idx})">✕</button>
          </div>
        `).join('')}
        <div class="card card-hero">
          ${state.mpPromoApplied ? `<div class="text-pink" style="font-size:11px;">✓ Промокод EMO2007 применён (−10%)</div>` : ''}
          <div class="row-between">
            <span>Итого к оплате</span>
            <span style="font-size:18px;font-weight:800;">${fmtRub(total)}</span>
          </div>
          <button class="btn-pink btn-full" onclick="checkoutCart(${total})">Оплатить картой •• 4821</button>
        </div>
      `}
    `;
  } else if (state.mpTab === 'orders') {
    body = `
      <div class="section-heading">Мои заказы</div>
      <div class="card">
        <div class="row-between">
          <span style="font-weight:700;">Заказ #4821 · re:Store</span>
          <span class="tag-pill">В пути</span>
        </div>
        <div class="text-pink" style="font-size:12px;">Apple AirPods Max (USB-C) · Доставка завтра 10:00–14:00</div>
      </div>
      <div class="card">
        <div class="row-between">
          <span style="font-weight:700;">Заказ #4705 · Мир Кубиков</span>
          <span class="tag-pill">Получен</span>
        </div>
        <div class="text-pink" style="font-size:12px;">LEGO Botanicals «Мини-орхидея» · ПВЗ ул. Ленина, 12</div>
      </div>
    `;
  } else {
    body = `
      <div class="card card-hero" style="flex-direction:row;align-items:center;justify-content:space-between;">
        <div class="row-center">
          <img src="assets/av_girl.jpg" class="avatar-ring" style="width:50px;height:50px;" alt="" />
          <div>
            <div style="font-size:15px;font-weight:800;">xX_Наталия_Xx ★</div>
            <div class="text-pink" style="font-size:11px;">Статус: Emo Prime · Кэшбэк 15%</div>
          </div>
        </div>
        <span class="tag-pill">PRO</span>
      </div>

      <div class="grid-3">
        <div class="card" style="padding:10px;align-items:center;gap:2px;">
          <span style="font-size:15px;font-weight:800;color:var(--hot-pink);">1 420 ₽</span>
          <span class="text-pink" style="font-size:10px;">Бонусы</span>
        </div>
        <div class="card clickable" style="padding:10px;align-items:center;gap:2px;" onclick="setMpTab('orders')">
          <span style="font-size:15px;font-weight:800;">8</span>
          <span class="text-pink" style="font-size:10px;">Заказов</span>
        </div>
        <div class="card clickable" style="padding:10px;align-items:center;gap:2px;" onclick="showToast('У вас 5 опубликованных отзывов ★')">
          <span style="font-size:15px;font-weight:800;">5</span>
          <span class="text-pink" style="font-size:10px;">Отзывов</span>
        </div>
      </div>

      <div class="card">
        <div class="section-heading" style="font-size:13px;">Промокод на скидку</div>
        <div class="row-center">
          <div class="search-box" style="flex:1;padding:8px 10px;">
            <input id="promoInput" placeholder="Введите EMO2007" value="${state.mpPromoApplied ? 'EMO2007' : ''}" />
          </div>
          <button class="btn-pink btn-sm" onclick="applyPromo()">Ок</button>
        </div>
      </div>

      <div class="card thread-list">
        <div class="thread-row" onclick="openPvzModal()">
          <div style="flex:1;">
            <div style="font-size:13px;font-weight:700;">Пункт выдачи и адреса</div>
            <div class="text-pink" style="font-size:11px;">${state.mpPvz}</div>
          </div>
          <span class="text-pink">›</span>
        </div>
        <div class="thread-row" onclick="toggleMpInstallments()">
          <div style="flex:1;">
            <div style="font-size:13px;font-weight:700;">Оплата частями 0%</div>
            <div class="text-pink" style="font-size:11px;">Карта •• 4821 · ${state.mpInstallments ? 'Включено' : 'Выключено'}</div>
          </div>
          <span class="tag-pill">${state.mpInstallments ? 'ВКЛ' : 'ВЫКЛ'}</span>
        </div>
        <div class="thread-row" onclick="toggleMpNotifs()">
          <div style="flex:1;">
            <div style="font-size:13px;font-weight:700;">Уведомления о скидках</div>
            <div class="text-pink" style="font-size:11px;">Снижение цен на товары из Избранного</div>
          </div>
          <span class="tag-pill">${state.mpNotifs ? 'ВКЛ' : 'ВЫКЛ'}</span>
        </div>
        <div class="thread-row" onclick="showToast('Возвратов и споров нет ✓')">
          <div style="flex:1;">
            <div style="font-size:13px;font-weight:700;">Возвраты и поддержка заказов</div>
            <div class="text-pink" style="font-size:11px;">Бесплатный возврат в течение 14 дней</div>
          </div>
          <span class="text-pink">›</span>
        </div>
      </div>
    `;
  }

  return `
    <div class="nav-header">
      <div class="nav-left">
        <button class="back-btn" onclick="goBack()">←</button>
        <span class="nav-title">Маркетплейс</span>
      </div>
    </div>
    <div class="content-col">${body}</div>
  `;
}

function renderCourses() {
  const cats = ['Все','IT и дизайн','Языки','Бизнес','Дети'];
  const q = state.courseQuery.toLowerCase();
  const list = [
    { title: 'Аналитик данных (Python + SQL)', cat: 'IT и дизайн', meta: '6 месяцев · Онлайн · Диплом', price: 'от 4 200 ₽/мес' },
    { title: 'Английский для работы (B1–B2)', cat: 'Языки', meta: '3 месяца · Индивидуально', price: 'от 3 100 ₽/мес' },
    { title: 'Финансовая грамотность и бюджет', cat: 'Бизнес', meta: '4 недели · Мини-курс', price: 'Бесплатно' },
    { title: 'Программирование на Scratch для детей', cat: 'Дети', meta: '2 месяца · Игровой формат', price: 'от 2 500 ₽/мес' },
  ].filter(c => (state.courseCat === 'Все' || c.cat === state.courseCat) && (!q || c.title.toLowerCase().includes(q) || c.meta.toLowerCase().includes(q)));

  return `
    <div class="nav-header">
      <div class="nav-left">
        <button class="back-btn" onclick="goBack()">←</button>
        <span class="nav-title">Обучение</span>
      </div>
      <span class="pill-btn">Мои курсы</span>
    </div>
    <div class="content-col">
      <div class="search-box">
        <span class="text-muted">◎</span>
        <input id="courseSearchInput" placeholder="Поиск курса или профессии..." value="${state.courseQuery}" oninput="setCourseQuery(this.value)" />
      </div>

      <div class="chips-row">
        ${cats.map(c => `<button class="chip ${state.courseCat === c ? 'active' : ''}" onclick="setCourseCat('${c}')">${c}</button>`).join('')}
      </div>

      <div class="card card-hero">
        <div class="row-between">
          <span class="text-pink" style="font-size:11px;font-weight:600;">Продолжить обучение</span>
          <span style="font-size:12px;font-weight:800;">${state.courseProgress}%</span>
        </div>
        <div style="font-size:15px;font-weight:700;">UX/UI Дизайнер с нуля</div>
        <div style="height:8px;border-radius:4px;background:var(--surface);overflow:hidden;">
          <div style="width:${state.courseProgress}%;height:100%;background:var(--hot-pink);"></div>
        </div>
        <button class="btn-pink btn-full" onclick="advanceCourse()">Открыть урок №${state.courseLesson}</button>
      </div>

      <div class="section-sub">Популярные программы (${list.length})</div>
      ${list.length === 0 ? `<div class="card text-pink">По запросу «${state.courseQuery}» курсов не найдено</div>` : list.map(cr => `
        <div class="card">
          <div class="row-center">
            <img src="assets/kawaii_courses_new.jpg" class="kawaii-icon" style="width:48px;height:48px;" alt="" />
            <div>
              <div style="font-size:14px;font-weight:700;">${cr.title}</div>
              <div class="text-pink" style="font-size:11px;">${cr.meta}</div>
            </div>
          </div>
          <div class="row-between">
            <span style="font-size:13px;font-weight:800;">${cr.price}</span>
            <button class="btn-dark btn-sm" onclick="showToast('Программа курса открыта ★')">Подробнее</button>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderMedicine() {
  const q = state.medQuery.toLowerCase();
  const specialties = ['Терапевт','Стоматолог','Педиатр','ЛОР','Анализы','УЗИ / МРТ']
    .filter(sp => !q || sp.toLowerCase().includes(q));
  const docs = [
    { name: 'Петров В.И.', type: 'oms', role: 'Терапевт · Поликлиника №12', slots: ['16:00','17:15'], img: 'assets/av_emo_checker.png' },
    { name: 'Соколова О.Н.', type: 'private', role: 'Стоматолог · МедЦентр Плюс', slots: ['15:30','18:00'], img: 'assets/av_emo_happy.png' },
    { name: 'Волкова А.С.', type: 'oms', role: 'ЛОР · Городская больница №6', slots: ['14:00','16:30'], img: 'assets/av_emo_bangs.png' },
  ].filter(d => (!q || d.name.toLowerCase().includes(q) || d.role.toLowerCase().includes(q)));

  return `
    <div class="nav-header">
      <div class="nav-left">
        <button class="back-btn" onclick="goBack()">←</button>
        <span class="nav-title">Медицина</span>
      </div>
      <span class="pill-btn">Медкарта</span>
    </div>
    <div class="content-col">
      <div class="segmented">
        <button class="seg-btn ${state.medTab === 'oms' ? 'active' : ''}" onclick="setMedTab('oms')">Поликлиники ОМС</button>
        <button class="seg-btn ${state.medTab === 'private' ? 'active' : ''}" onclick="setMedTab('private')">Частные клиники</button>
      </div>

      <div class="search-box">
        <span class="text-muted">◎</span>
        <input id="medSearchInput" placeholder="Врач, специальность или больница..." value="${state.medQuery}" oninput="setMedQuery(this.value)" />
      </div>

      <div class="card card-hero">
        <div class="row-between">
          <span class="text-pink" style="font-size:11px;font-weight:600;">Ближайшая запись</span>
          <span style="font-size:12px;font-weight:700;">Талон ›</span>
        </div>
        <div style="font-size:15px;font-weight:700;">${state.medUpcoming.doc}</div>
        <div class="text-pink" style="font-size:12px;">${state.medUpcoming.info}</div>
      </div>

      ${specialties.length ? `
        <div class="section-sub">Выберите специалиста</div>
        <div class="grid-3">
          ${specialties.map(sp => `
            <div class="card clickable" style="align-items:center;padding:10px;gap:5px;" onclick="setMedQuery('${sp}')">
              <span style="font-size:16px;color:var(--hot-pink);font-weight:800;">+</span>
              <span style="font-size:11px;font-weight:600;">${sp}</span>
            </div>
          `).join('')}
        </div>
      ` : ''}

      <div class="section-sub">Свободные врачи сегодня (${docs.length})</div>
      ${docs.length === 0 ? `<div class="card text-pink">Врачи по запросу «${state.medQuery}» не найдены</div>` : docs.map(d => `
        <div class="card">
          <div class="row-center">
            <img src="${d.img}" class="kawaii-icon" style="border-radius:50%;" alt="" />
            <div>
              <div style="font-size:14px;font-weight:700;">${d.name}</div>
              <div class="text-pink" style="font-size:11px;">${d.role}</div>
            </div>
          </div>
          <div class="row-between">
            <div class="row-center" style="gap:6px;">
              ${d.slots.map(sl => `<span class="chip">${sl}</span>`).join('')}
            </div>
            <button class="btn-pink btn-sm" onclick="bookDoctor('${d.name}', '${d.role}', '${d.slots[0]}')">Записаться</button>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

// =========================================================================
// BOTTOM BARS
// =========================================================================
function renderBottomBar() {
  const slot = document.getElementById('bottomBarSlot');
  const mainTabs = ['home', 'payments', 'chats', 'services'];

  if (mainTabs.includes(state.screen)) {
    const unpaid = state.bills.filter(b => !b.paid).length;
    const unread = state.threads.reduce((s, t) => s + t.unread, 0);
    const items = [
      { id: 'home', img: 'assets/nav_home.jpg', label: 'Главная', badge: 0 },
      { id: 'payments', img: 'assets/nav_payments.jpg', label: 'Платежи', badge: unpaid },
      { id: 'chats', img: 'assets/nav_chats.jpg', label: 'Чаты', badge: unread },
      { id: 'services', img: 'assets/nav_services.jpg', label: 'Сервисы', badge: 0 },
    ];
    slot.innerHTML = `
      <nav class="bottom-bar">
        <div class="bottom-tabs">
          ${items.map(it => `
            <button class="tab-btn ${state.screen === it.id ? 'active' : ''}" onclick="go('${it.id}', false)">
              <div class="tab-icon-img-wrap">
                <img src="${it.img}" class="tab-icon-img" alt="${it.label}" />
                ${it.badge ? `<span class="tab-badge">${it.badge}</span>` : ''}
              </div>
              <span>${it.label}</span>
            </button>
          `).join('')}
        </div>
        <div class="home-indicator"></div>
      </nav>
    `;
  } else if (state.screen === 'maps') {
    const items = [
      { id: 'nav', icon: '➤', label: 'Навигатор' },
      { id: 'transport', icon: 'А', label: 'Транспорт' },
      { id: 'taxi', icon: 'Т', label: 'Такси' },
      { id: 'fuel', icon: '⛽', label: 'Заправки' },
    ];
    slot.innerHTML = `
      <nav class="bottom-bar">
        <div class="bottom-tabs">
          ${items.map(it => `
            <button class="tab-btn ${state.mapTab === it.id ? 'active' : ''}" onclick="${it.id === 'taxi' ? "go('taxi')" : `setMapTab('${it.id}')`}">
              <div class="tab-icon-box">${it.icon}</div>
              <span>${it.label}</span>
            </button>
          `).join('')}
        </div>
        <div class="home-indicator"></div>
      </nav>
    `;
  } else if (state.screen === 'marketplace') {
    const favCount = state.products.filter(p => p.fav).length;
    const cartCount = state.cart.length;
    const items = [
      { id: 'catalog', icon: '⊞', label: 'Каталог', badge: 0 },
      { id: 'fav', icon: '♡', label: 'Избранное', badge: favCount },
      { id: 'cart', icon: '▭', label: 'Корзина', badge: cartCount },
      { id: 'orders', icon: '≡', label: 'Заказы', badge: 0 },
      { id: 'account', icon: '◉', label: 'Аккаунт', badge: 0 },
    ];
    slot.innerHTML = `
      <nav class="bottom-bar">
        <div class="bottom-tabs">
          ${items.map(it => `
            <button class="tab-btn ${state.selectedProductId === null && state.mpTab === it.id ? 'active' : ''}" onclick="setMpTab('${it.id}')">
              <div class="tab-icon-box">
                ${it.icon}
                ${it.badge ? `<span class="tab-badge">${it.badge}</span>` : ''}
              </div>
              <span>${it.label}</span>
            </button>
          `).join('')}
        </div>
        <div class="home-indicator"></div>
      </nav>
    `;
  } else {
    slot.innerHTML = `
      <div class="bottom-bar" style="padding:10px 0 12px;border-top:none;background:rgba(10,6,12,0.95);">
        <div class="home-indicator"></div>
      </div>
    `;
  }
}

function renderKeepFocus(inputId) {
  render();
  const inp = document.getElementById(inputId);
  if (inp) {
    inp.focus();
    const len = inp.value.length;
    inp.setSelectionRange(len, len);
  }
}

// =========================================================================
// INTERACTIVE ACTIONS
// =========================================================================
window.toggleBalance = () => { state.balanceHidden = !state.balanceHidden; render(); };
window.setPayTab = (t) => { state.payTab = t; render(); };
window.payBill = (id) => {
  const b = state.bills.find(x => x.id === id);
  if (!b || b.paid) return;
  b.paid = true;
  state.debitBalance -= b.amount;
  state.transactions.unshift({ icon: '✓', title: b.title, time: 'Только что', amount: -b.amount });
  showToast(`Счёт «${b.title}» оплачен (${fmtRub(b.amount)}) ★`);
  render();
};
window.setChatFilter = (f) => { state.chatFilter = f; render(); };
window.setServiceQuery = (v) => { state.serviceQuery = v; renderKeepFocus('svcSearchInput'); };
window.mapZoomIn = () => { if (mainMapInstance) mainMapInstance.zoomIn(); };
window.mapZoomOut = () => { if (mainMapInstance) mainMapInstance.zoomOut(); };
window.mapCenterUser = () => {
  if (mainMapInstance) mainMapInstance.setView([56.8438, 60.6540], 15);
  showToast('Вы здесь: ул. Мира, 19 (УрФУ)');
};
window.setMapTab = (t) => {
  state.mapTab = t;
  const chipsEl = document.getElementById('mapsSheetChips');
  if (chipsEl) chipsEl.innerHTML = renderMapsSheetChips();
  renderMapMarkers();
  renderBottomBar();
  const titles = { nav: 'Режим: Навигатор', transport: 'Режим: Транспорт онлайн', fuel: 'Режим: Карта заправок' };
  showToast(titles[t] || t);
};
window.setTransportFilter = (f) => {
  state.transportFilter = f;
  renderMapMarkers();
  const chipsEl = document.getElementById('mapsSheetChips');
  if (chipsEl) chipsEl.innerHTML = renderMapsSheetChips();
  const names = { all: 'весь транспорт', mine: 'мой транспорт (А12, Т4, М)', bus: 'автобусы', tram: 'трамваи', trolley: 'троллейбусы', metro: 'метро' };
  showToast(`Фильтр: ${names[f]}`);
};
window.setTaxiTo = (v) => { state.taxiTo = v; render(); };
window.setTaxiTariff = (id) => { state.taxiTariff = id; render(); };
window.orderTaxi = (price, name) => {
  state.taxiOrdered = !state.taxiOrdered;
  showToast(state.taxiOrdered ? `Такси «${name}» (${price} ₽) уже в пути! 🖤` : 'Заказ такси отменён');
  render();
};
window.setFitDay = (i) => { state.fitDay = i; render(); };
window.setFitCat = (c) => { state.fitCat = c; render(); };
window.bookFitness = (name, pts) => {
  if (state.fitPoints < pts) return showToast('Недостаточно баллов абонемента');
  state.fitPoints -= pts;
  state.fitBookings.unshift(`${name} · Сегодня`);
  showToast(`Вы записаны в «${name}» (−${pts} б.) ★`);
  render();
};
window.setIspTab = (t) => { state.ispTab = t; render(); };
window.topUpIsp = () => {
  state.ispBalance += 650;
  state.debitBalance -= 650;
  showToast('Баланс интернета пополнен на 650 ₽ ★');
  render();
};
window.setMpTab = (t) => { state.mpTab = t; state.selectedProductId = null; render(); };
window.setMpCat = (c) => { state.mpCat = c; render(); };
window.setMpQuery = (v) => { state.mpQuery = v; renderKeepFocus('mpSearchInput'); };
window.setSelectedVariant = (v) => { state.selectedVariant = v; render(); };
window.toggleFav = (id) => {
  const p = state.products.find(x => x.id === id);
  if (p) {
    p.fav = !p.fav;
    showToast(p.fav ? 'Добавлено в Избранное ♥' : 'Удалено из Избранного');
    render();
  }
};
window.addToCart = (id) => {
  state.cart.push(id);
  showToast('Товар добавлен в корзину ★');
  render();
};
window.removeFromCart = (idx) => {
  state.cart.splice(idx, 1);
  render();
};
window.applyPromo = () => {
  const val = (document.getElementById('promoInput')?.value || '').trim().toUpperCase();
  if (val === 'EMO2007') {
    state.mpPromoApplied = true;
    showToast('Промокод EMO2007 активирован (−10% в корзине) ★');
    render();
  } else {
    showToast('Попробуйте промокод EMO2007');
  }
};
window.toggleMpInstallments = () => { state.mpInstallments = !state.mpInstallments; render(); };
window.toggleMpNotifs = () => { state.mpNotifs = !state.mpNotifs; render(); };
window.checkoutCart = (total) => {
  if (total > state.debitBalance) return showToast('Недостаточно средств на карте');
  state.debitBalance -= total;
  state.transactions.unshift({ icon: 'M', title: 'Маркетплейс · Заказ', time: 'Только что', amount: -total });
  state.cart = [];
  state.mpTab = 'orders';
  showToast(`Заказ оплачен (${fmtRub(total)})! Кэшбэк начислен ★`);
  render();
};
window.setCourseCat = (c) => { state.courseCat = c; render(); };
window.setCourseQuery = (v) => { state.courseQuery = v; renderKeepFocus('courseSearchInput'); };
window.advanceCourse = () => {
  state.courseProgress = Math.min(100, state.courseProgress + 10);
  state.courseLesson += 1;
  showToast(`Урок пройден! Прогресс: ${state.courseProgress}% ★`);
  render();
};
window.setMedTab = (t) => { state.medTab = t; render(); };
window.setMedQuery = (v) => { state.medQuery = v; renderKeepFocus('medSearchInput'); };
window.bookDoctor = (name, role, slot) => {
  state.medUpcoming = { doc: `${role.split(' · ')[0]} · ${name}`, info: `Сегодня, ${slot} · ${role.split(' · ')[1] || 'Клиника'}` };
  showToast(`Вы записаны к ${name} на ${slot} ★`);
  render();
};

// =========================================================================
// MAIN RENDER LOOP
// =========================================================================
const renderers = {
  home: renderHome,
  payments: renderPayments,
  chats: renderChats,
  services: renderServices,
  maps: renderMaps,
  taxi: renderTaxi,
  fitness: renderFitness,
  internet: renderInternet,
  profi: renderProfi,
  marketplace: renderMarketplace,
  courses: renderCourses,
  medicine: renderMedicine,
};

function render() {
  destroyMaps();
  const viewport = document.getElementById('screenViewport');
  viewport.innerHTML = (renderers[state.screen] || renderHome)();
  renderBottomBar();

  document.querySelectorAll('.side-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.go === state.screen);
  });

  if (state.screen === 'maps') {
    requestAnimationFrame(initMainLeafletMap);
  } else if (state.screen === 'taxi') {
    requestAnimationFrame(initTaxiLeafletMap);
  }
}

document.querySelectorAll('.side-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const target = btn.dataset.go;
    if (MAIN_TABS.includes(target)) {
      go(target, false);
    } else {
      // Jumping directly via sidebar sets "Сервисы" as the Back origin
      state.history = ['services'];
      if (target === 'marketplace') {
        state.mpTab = 'catalog';
        state.mpCat = 'Все';
        state.selectedProductId = null;
      }
      go(target, false);
    }
  });
});

render();
