/* ======================================
   ДНЕВНИК ЭМОЦИЙ — Логика
   Задание: утром "Почему я счастлив" + 4 эмоции,
   вечером — 4 эмоции
   ====================================== */

// ============ TWEMOJI HELPER ============

function emojiHtml(str) {
    if (typeof twemoji !== 'undefined') {
        return twemoji.parse(str, {
            folder: 'svg',
            ext: '.svg',
            base: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/'
        });
    }
    return str;
}

// ============ АВТОРИЗАЦИЯ ============

const AUTH_URL = '/api/auth';
let authToken = localStorage.getItem('auth_token') || null;
let authMode = 'login'; // 'login' | 'register'

function getAuthHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
    return headers;
}

function showAuthError(msg) {
    const el = document.getElementById('auth-error');
    el.textContent = msg;
    el.style.display = 'block';
}

function hideAuthError() {
    document.getElementById('auth-error').style.display = 'none';
}

function toggleAuthMode() {
    authMode = authMode === 'login' ? 'register' : 'login';
    const btn = document.getElementById('auth-submit');
    const toggle = document.getElementById('auth-toggle');
    const switchText = document.getElementById('auth-switch-text');

    if (authMode === 'register') {
        btn.textContent = 'Зарегистрироваться';
        switchText.textContent = 'Уже есть аккаунт?';
        toggle.textContent = 'Войти';
    } else {
        btn.textContent = 'Войти';
        switchText.textContent = 'Нет аккаунта?';
        toggle.textContent = 'Зарегистрироваться';
    }
    hideAuthError();
}

async function handleAuth() {
    const email = document.getElementById('auth-email').value.trim();
    const password = document.getElementById('auth-password').value;
    const btn = document.getElementById('auth-submit');

    if (!email || !password) {
        showAuthError('Введите email и пароль');
        return;
    }

    btn.disabled = true;
    btn.textContent = 'Загрузка...';
    hideAuthError();

    try {
        const res = await fetch(AUTH_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: authMode, email, password })
        });

        const data = await res.json();

        if (!res.ok) {
            showAuthError(data.error || 'Ошибка авторизации');
            btn.disabled = false;
            btn.textContent = authMode === 'login' ? 'Войти' : 'Зарегистрироваться';
            return;
        }

        authToken = data.token;
        localStorage.setItem('auth_token', authToken);
        localStorage.setItem('auth_email', data.email);

        // Скрыть логин, показать приложение
        document.getElementById('auth-screen').style.display = 'none';
        document.getElementById('app').style.display = 'block';
        await startApp();
    } catch (err) {
        console.error('Auth error:', err);
        showAuthError('Ошибка соединения с сервером');
        btn.disabled = false;
        btn.textContent = authMode === 'login' ? 'Войти' : 'Зарегистрироваться';
    }
}

function logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_email');
    window.location.reload();
}

function toggleProfilePopup() {
    const popup = document.getElementById('profile-popup');
    const btn = document.getElementById('nav-profile');
    const isOpen = popup.style.display !== 'none';

    if (isOpen) {
        closeProfilePopup();
    } else {
        // Показать email
        const email = localStorage.getItem('auth_email') || '—';
        document.getElementById('profile-email').textContent = email;
        popup.style.display = 'flex';
        btn.classList.add('active');

        // Оверлей для закрытия (внутри #app, чтобы z-index работал)
        let overlay = document.querySelector('.profile-popup-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'profile-popup-overlay';
            overlay.addEventListener('click', closeProfilePopup);
            document.getElementById('app').appendChild(overlay);
        }
        overlay.style.display = 'block';
    }
}

function closeProfilePopup() {
    document.getElementById('profile-popup').style.display = 'none';
    document.getElementById('nav-profile').classList.remove('active');
    const overlay = document.querySelector('.profile-popup-overlay');
    if (overlay) overlay.style.display = 'none';
}

// ============ ДАННЫЕ ЭМОЦИЙ ============

const EMOTIONS = {
    anger: {
        id: 'anger', name: 'Гнев', emoji: '😠',
        color: '#c06cf0',
        bg: 'rgba(192, 108, 240, 0.12)',
        glow: 'rgba(192, 108, 240, 0.25)',
        subemotions: [
            'Холодность', 'Злость', 'Бешенство', 'Сарказм', 'Раздражение',
            'Ярость', 'Унижение', 'Обида', 'Ненависть', 'Нетерпение',
            'Отвращение', 'Надменность', 'Злорадство', 'Недовольство',
            'Цинизм', 'Протест', 'Неистовость', 'Враждебность',
            'Равнодушие', 'Безучастность', 'Неприязнь', 'Пренебрежение',
            'Зависть', 'Мстительность', 'Высокомерие', 'Жадность', 'Упрямство'
        ]
    },
    shame: {
        id: 'shame', name: 'Стыд', emoji: '🫣',
        color: '#f06ca0',
        bg: 'rgba(240, 108, 160, 0.12)',
        glow: 'rgba(240, 108, 160, 0.25)',
        subemotions: [
            'Вина', 'Раскаяние', 'Унижение', 'Нечестность', 'Угрызения совести',
            'Стеснение', 'Неловкость', 'Похоть', 'Ущербность',
            'Растерянность', 'Обман', 'Потеря лица', 'Смущение', 'Позор',
            'Сожаление', 'Расщепление', 'Озабоченность', 'Брошенность',
            'Замкнутость', 'Угрюмость', 'Угнетенность',
            'Пассивность', 'Отвержение', 'Усталость'
        ]
    },
    sadness: {
        id: 'sadness', name: 'Грусть', emoji: '😢',
        color: '#6cb0f0',
        bg: 'rgba(108, 176, 240, 0.12)',
        glow: 'rgba(108, 176, 240, 0.25)',
        subemotions: [
            'Огорчение', 'Горе', 'Боль', 'Угнетенность', 'Отвращение',
            'Одиночество', 'Отчуждение', 'Разочарование', 'Поражение',
            'Жалость к себе', 'Тоска', 'Подавленность',
            'Предательство', 'Скука', 'Печаль', 'Апатия', 'Равнодушие',
            'Принижение', 'Раздражение', 'Обида', 'Скорбь', 'Отверженность',
            'Отчаяние', 'Ущемленность', 'Никчемность'
        ]
    },
    fear: {
        id: 'fear', name: 'Страх', emoji: '👻',
        color: '#6cf0b0',
        bg: 'rgba(108, 240, 176, 0.12)',
        glow: 'rgba(108, 240, 176, 0.25)',
        subemotions: [
            'Волнение', 'Испуг', 'Паника', 'Беспокойство', 'Неуверенность',
            'Боязливость', 'Подозрительность', 'Трусость', 'Нерешительность',
            'Настороженность', 'Смятение', 'Тревога', 'Ужас', 'Опасение',
            'Робость', 'Застенчивость', 'Безнадежность',
            'Сдержанность', 'Скрытность', 'Жалость', 'Скованность',
            'Замешательство', 'Ошарашенность', 'Озадаченность', 'Удивление'
        ]
    },
    joy: {
        id: 'joy', name: 'Радость', emoji: '😊',
        color: '#f0c06c',
        bg: 'rgba(240, 192, 108, 0.12)',
        glow: 'rgba(240, 192, 108, 0.25)',
        subemotions: [
            'Благодарность', 'Доверие', 'Воодушевление', 'Озарение',
            'Сопричастность', 'Умиротворение', 'Радушие', 'Единство',
            'Торжественность', 'Наслаждение', 'Общность', 'Восторг',
            'Благодать', 'Поддержка', 'Веселье', 'Надежда', 'Уверенность',
            'Лёгкость', 'Любовь', 'Удовлетворение', 'Облегчение',
            'Обожание', 'Преклонение', 'Подъём духа', 'Энтузиазм',
            'Вожделение', 'Успокоение'
        ]
    }
};

const CATEGORY_ORDER = ['anger', 'shame', 'sadness', 'fear', 'joy'];
const API_URL = '/api/entries';
const MIN_EMOTIONS = 4;

// Подсказки «Почему я счастлив» — большой список
const HAPPY_PROMPTS = [
    // Базовые
    'Я проснулся и у меня есть новый день',
    'У меня есть тёплый дом',
    'Меня кто-то любит',
    'Я здоров',
    'Сегодня красивая погода',
    'У меня есть вкусная еда',
    'Я могу дышать',
    'Я учусь чему-то новому',
    'У меня есть хобби',
    'Кто-то мне улыбнулся',
    'Я послушал любимую музыку',
    'Я выспался',
    'Мне позвонил близкий человек',
    'Я могу видеть этот мир',
    'Впереди выходные',
    'Я помог кому-то',
    'Я выполнил задачу',
    'У меня есть чистая вода',
    'Я могу мечтать',
    'Я двигаюсь к своей цели',
    'У меня есть друзья',
    'Я прочитал что-то интересное',
    'Я сделал себе что-то приятное',
    'Мне сегодня повезло',
    'Я живу в безопасности',
    // Отношения
    'Кто-то сказал мне доброе слово',
    'Я обнял близкого человека',
    'Мне написал друг просто так',
    'Я провёл время с семьёй',
    'Кто-то поблагодарил меня',
    'Я чувствую поддержку близких',
    'У меня есть человек, которому я доверяю',
    'Я могу позвонить маме/папе',
    'Кто-то разделил со мной радость',
    'Я услышал смех близкого человека',
    'Мне подарили внимание и заботу',
    'Я чувствую себя нужным кому-то',
    'У меня есть тот, с кем можно помолчать',
    'Я могу быть собой рядом с близкими',
    // Природа и окружение
    'Я увидел красивый закат',
    'За окном поют птицы',
    'Я прогулялся на свежем воздухе',
    'Я заметил красоту вокруг',
    'Весна/лето/осень — мое любимое время года',
    'Солнце светит и мне тепло',
    'Я увидел цветы',
    'Я услышал шум дождя',
    'Я увидел радугу после дождя',
    'Мне нравится звук ветра в деревьях',
    'Я посидел у воды и успокоился',
    'Я заметил первые листья весной',
    'Мне нравится хруст снега под ногами',
    'Я поймал красивый момент на фото',
    // Тело и здоровье
    'Моё тело работает и несёт меня',
    'Я могу ходить',
    'Я выпил чашку вкусного кофе/чая',
    'Я позаботился о своём здоровье',
    'У меня ничего не болит',
    'Я чувствую лёгкость в теле',
    'Я сделал зарядку и чувствую прилив сил',
    'Я выпил стакан воды и стало лучше',
    'Я размялся после долгого сидения',
    'Я хорошо поспал ночью',
    'Я чувствую себя отдохнувшим',
    // Моменты
    'Сегодня я рассмеялся',
    'Я посмотрел хороший фильм',
    'Я узнал что-то новое о мире',
    'У меня получилось что-то, что раньше не выходило',
    'Я сделал маленький шаг к мечте',
    'Я горжусь тем, что я сделал',
    'Я отдохнул и чувствую себя лучше',
    'Я принял хорошее решение',
    'Я довёл дело до конца',
    'Я написал что-то, что мне нравится',
    'Я решил задачу, над которой думал',
    'Я превзошёл свои ожидания',
    // Еда и уют
    'Я поел вкусный завтрак',
    'Я в тёплой удобной одежде',
    'У меня есть уютное место для отдыха',
    'Я укутался в одеяло',
    'Я приготовил что-то вкусное',
    'Я попробовал новое блюдо',
    'Я выпечку/десерт сделал сам',
    'У меня горит уютная лампа вечером',
    'Я зажёг свечу и создал атмосферу',
    // Простые радости
    'Я могу читать книги',
    'У меня есть любимая музыка',
    'Я могу смотреть на звёзды',
    'Я нашёл что-то смешное в интернете',
    'Впереди целый день возможностей',
    'Я мог бы не проснуться, но я проснулся',
    'Я свободен выбирать что делать',
    'Сегодня я стал на день мудрее',
    'Я ценю то, что имею',
    'Жизнь продолжается, и это уже хорошо',
    // Развитие и творчество
    'Я научился чему-то полезному',
    'Я попробовал что-то новое впервые',
    'Я преодолел свой страх',
    'Я стал немного лучше, чем вчера',
    'У меня есть идея, которая вдохновляет',
    'Я создал что-то своими руками',
    'Я написал свои мысли и стало легче',
    'У меня появилась новая цель',
    'Я осознал что-то важное о себе',
    'Я нашёл вдохновение для проекта',
    // Маленькие победы
    'Я встал вовремя',
    'Я не сдался в сложный момент',
    'Я вычеркнул дело из списка задач',
    'Я навёл порядок дома',
    'Я выбросил что-то ненужное',
    'Я организовал своё время',
    'Я сказал "нет" тому, что мне мешает',
    'Я позволил себе отдых без чувства вины',
    'Я признал свои чувства'
];

const GRATEFUL_PROMPTS = [
    // Люди
    'Здоровье моих близких',
    'Приятный разговор с другом',
    'Поддержку от человека, который рядом',
    'Доброту незнакомого человека',
    'Случайную улыбку прохожего',
    'Терпение близких ко мне',
    'Что кто-то выслушал меня',
    'Помощь, которую мне оказали',
    'Человека, который в меня верит',
    'Тех, кто рядом в трудные моменты',
    'Наставника или учителя, который вдохновляет',
    'Коллегу, который помог с задачей',
    // Комфорт и быт
    'Вкусный ужин сегодня',
    'Спокойный вечер дома',
    'Возможность отдохнуть',
    'Хорошую погоду или уютный дождь',
    'Горячий душ',
    'Мягкую постель',
    'Вкусный утренний или вечерний чай',
    'Уютное освещение в комнате',
    'Чистый дом после уборки',
    'Тёплые носки в холодный день',
    'Запах свежего хлеба или выпечки',
    'Горячую ванну после тяжёлого дня',
    // Работа и учёба
    'Интересную задачу на работе или учёбе',
    'Завершенное за день дело',
    'То, что я справился со сложной ситуацией',
    'Новое знание или навык, полученный сегодня',
    'Возможность заниматься тем, что нравится',
    'Проект, над которым интересно работать',
    'Стабильную работу и доход',
    'Мозг, который может решать задачи',
    'Свободу выбирать чем заниматься',
    // Здоровье и тело
    'Свое здоровье и тело',
    'Что я могу двигаться',
    'Хороший сон прошлой ночью',
    'Энергию, которую чувствую сегодня',
    'Что боль прошла или стало легче',
    'Своё дыхание — оно всегда со мной',
    // Природа и мир
    'Красивый вид из окна',
    'Что-то красивое, что я сегодня увидел',
    'Пение птиц за окном',
    'Свежий воздух на прогулке',
    'Звёзды на ночном небе',
    'Первые тёплые дни весны',
    'Шум дождя за окном',
    // Развлечения и хобби
    'Любимого питомца',
    'Музыку, которая подняла мне настроение',
    'Хорошую книгу или фильм',
    'Смех и юмор в течение дня',
    'Доступ к информации и интернету',
    'Любимую песню, которая зазвучала',
    'Хороший подкаст или видео',
    'Время на своё хобби',
    'Компьютерную игру, которая порадовала',
    // Внутренний мир
    'Чувство безопасности',
    'Своё упорство и силу',
    'Момент тишины и покоя',
    'Что я нашёл время для себя',
    'Свою способность чувствовать',
    'Что я не сдался',
    'Урок, который преподнёс мне этот день',
    'Свою честность перед собой',
    'Возможность начать заново завтра',
    'Что я записываю свои мысли и чувства'
];

const PROMPTS_PER_PAGE = 6;

// ============ СОСТОЯНИЕ ============

const state = {
    timeOfDay: 'morning',  // 'morning' | 'evening'
    selectedEmotions: [],  // [{category, emotion}]
    calendarDate: new Date(),
    entries: [],
    usedPromptIndices: new Set(),  // чтобы не повторять при обновлении
    usedGratefulPromptIndices: new Set()
};

// ============ УТИЛИТЫ ============

async function loadEntries() {
    try {
        const res = await fetch(API_URL, { headers: getAuthHeaders() });
        if (res.status === 401) { logout(); return; }
        if (!res.ok) throw new Error('Failed to load');
        const rows = await res.json();
        state.entries = rows.map(r => ({
            id: r.id,
            date: r.date,
            dayKey: r.day_key,
            timeOfDay: r.time_of_day,
            emotions: r.emotions || [],
            happyText: r.happy_text || '',
            gratefulText: r.grateful_text || '',
            notes: r.notes || ''
        }));
    } catch (err) {
        console.error('Load error:', err);
        state.entries = [];
    }
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

function todayKey() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Получить выбранный dayKey из date-picker (или сегодня)
function getSelectedDayKey() {
    const input = document.getElementById('entry-date');
    return (input && input.value) ? input.value : todayKey();
}

// Получить ISO дату из выбранной даты (полночь по UTC)
function getSelectedDate() {
    const key = getSelectedDayKey();
    const today = todayKey();
    if (key === today) return new Date().toISOString();
    // Для прошлых дней используем 12:00 дня
    return new Date(key + 'T12:00:00').toISOString();
}

function formatDate(dateStr) {
    const d = new Date(dateStr);
    const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
        'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function formatTime(dateStr) {
    return new Date(dateStr).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

function formatMonthYear(date) {
    const months = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
        'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
}

function isSameDay(d1, d2) {
    return d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate();
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showToast(msg, type = 'success') {
    const c = document.getElementById('toast-container');
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.textContent = msg;
    c.appendChild(t);
    setTimeout(() => t.remove(), 3000);
}

function getTodayEntries() {
    const key = todayKey();
    return state.entries.filter(e => e.dayKey === key);
}

function hasTodayMorning() {
    return getTodayEntries().some(e => e.timeOfDay === 'morning');
}

function hasTodayEvening() {
    return getTodayEntries().some(e => e.timeOfDay === 'evening');
}

// ============ НАВИГАЦИЯ ============

function switchScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(`screen-${screenId}`).classList.add('active');
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelector(`.nav-btn[data-screen="${screenId}"]`).classList.add('active');

    if (screenId === 'history') {
        renderHistory();
        renderCalendar();
    } else if (screenId === 'stats') {
        renderStats();
    } else if (screenId === 'checkin') {
        updateTodayStatus();
    }
}

// ============ ПРИВЕТСТВИЕ ============

function renderGreeting() {
    const hour = new Date().getHours();
    let greeting, emoji;
    if (hour < 12) { greeting = 'Доброе утро'; emoji = '☀️'; }
    else if (hour < 18) { greeting = 'Добрый день'; emoji = '🌤️'; }
    else { greeting = 'Добрый вечер'; emoji = '🌙'; }

    const el = document.getElementById('greeting');
    const dayNames = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
    const now = new Date();
    el.innerHTML = `
        <span class="greeting-emoji">${emojiHtml(emoji)}</span>
        <h1>${greeting}!</h1>
        <p class="date-text">${dayNames[now.getDay()]}, ${formatDate(now.toISOString())}</p>
    `;

    // Авто-выбор утро/вечер
    if (hour >= 17 || hasTodayMorning()) {
        switchTimeOfDay('evening');
    } else {
        switchTimeOfDay('morning');
    }
}

// ============ УТРО/ВЕЧЕР ============

function switchTimeOfDay(time) {
    state.timeOfDay = time;
    state.selectedEmotions = [];

    document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('active'));
    document.querySelector(`.time-btn[data-time="${time}"]`).classList.add('active');

    const happyBlock = document.getElementById('happy-block');
    const gratefulBlock = document.getElementById('grateful-block');
    const emotionsBlock = document.querySelector('.emotions-block');
    const saveBtnText = document.getElementById('save-btn-text');

    if (time === 'note') {
        happyBlock.style.display = 'none';
        gratefulBlock.style.display = 'none';
        emotionsBlock.style.display = 'none';
        saveBtnText.textContent = 'Сохранить заметку';
    } else if (time === 'morning') {
        happyBlock.style.display = 'block';
        gratefulBlock.style.display = 'none';
        emotionsBlock.style.display = 'block';
        saveBtnText.textContent = 'Сохранить утреннюю запись';
        document.getElementById('happy-text').value = '';
    } else {
        happyBlock.style.display = 'none';
        gratefulBlock.style.display = 'block';
        emotionsBlock.style.display = 'block';
        saveBtnText.textContent = 'Сохранить вечернюю запись';
        document.getElementById('grateful-text').value = '';
    }

    document.getElementById('notes-text').value = '';
    renderAccordion();
    updateSelectionCounter();
    updateSaveBtn();
    updateTodayStatus();
}

// ============ СТАТУС СЕГОДНЯ ============

function updateTodayStatus() {
    const container = document.getElementById('today-status');
    const morning = hasTodayMorning();
    const evening = hasTodayEvening();

    container.innerHTML = `
        <div class="status-item ${morning ? 'done' : ''}">
            <span class="status-icon">${morning ? emojiHtml('✅') : emojiHtml('☀️')}</span>
            <div class="status-text">
                <strong>Утро</strong>
                ${morning ? 'Записано' : 'Не записано'}
            </div>
        </div>
        <div class="status-item ${evening ? 'done' : ''}">
            <span class="status-icon">${evening ? emojiHtml('✅') : emojiHtml('🌙')}</span>
            <div class="status-text">
                <strong>Вечер</strong>
                ${evening ? 'Записано' : 'Не записано'}
            </div>
        </div>
    `;
}

// ============ ПОДСКАЗКИ "ПОЧЕМУ Я СЧАСТЛИВ" ============

function getRandomPrompts() {
    // Берём подсказки, которые ещё не были показаны
    const available = HAPPY_PROMPTS
        .map((p, i) => ({ text: p, idx: i }))
        .filter(p => !state.usedPromptIndices.has(p.idx));

    // Если все использованы — сбросить
    if (available.length < PROMPTS_PER_PAGE) {
        state.usedPromptIndices.clear();
        return HAPPY_PROMPTS
            .map((p, i) => ({ text: p, idx: i }))
            .sort(() => Math.random() - 0.5)
            .slice(0, PROMPTS_PER_PAGE);
    }

    const selected = available.sort(() => Math.random() - 0.5).slice(0, PROMPTS_PER_PAGE);
    selected.forEach(p => state.usedPromptIndices.add(p.idx));
    return selected;
}

function renderHappyPrompts() {
    const container = document.getElementById('happy-prompts');
    const prompts = getRandomPrompts();

    container.innerHTML = prompts.map(p =>
        `<button class="happy-prompt" data-text="${escapeHtml(p.text)}">${p.text}</button>`
    ).join('');

    container.querySelectorAll('.happy-prompt').forEach(btn => {
        btn.addEventListener('click', () => {
            if (btn.classList.contains('used')) return;
            const textarea = document.getElementById('happy-text');
            const text = btn.dataset.text;
            textarea.value += (textarea.value ? '\n' : '') + text;
            textarea.focus();
            btn.classList.add('used');
            updateSaveBtn();
        });
    });
}

// ============ ПОДСКАЗКИ "ЗА ЧТО Я БЛАГОДАРЕН" ============

function getRandomGratefulPrompts() {
    const available = GRATEFUL_PROMPTS
        .map((p, i) => ({ text: p, idx: i }))
        .filter(p => !state.usedGratefulPromptIndices.has(p.idx));

    if (available.length < PROMPTS_PER_PAGE) {
        state.usedGratefulPromptIndices.clear();
        return GRATEFUL_PROMPTS
            .map((p, i) => ({ text: p, idx: i }))
            .sort(() => Math.random() - 0.5)
            .slice(0, PROMPTS_PER_PAGE);
    }

    const selected = available.sort(() => Math.random() - 0.5).slice(0, PROMPTS_PER_PAGE);
    selected.forEach(p => state.usedGratefulPromptIndices.add(p.idx));
    return selected;
}

function renderGratefulPrompts() {
    const container = document.getElementById('grateful-prompts');
    const prompts = getRandomGratefulPrompts();

    container.innerHTML = prompts.map(p =>
        `<button class="happy-prompt" data-text="${escapeHtml(p.text)}">${p.text}</button>`
    ).join('');

    container.querySelectorAll('.happy-prompt').forEach(btn => {
        btn.addEventListener('click', () => {
            if (btn.classList.contains('used')) return;
            const textarea = document.getElementById('grateful-text');
            const text = btn.dataset.text;
            textarea.value += (textarea.value ? '\n' : '') + text;
            textarea.focus();
            btn.classList.add('used');
            updateSaveBtn();
        });
    });
}

// ============ АККОРДЕОН ЭМОЦИЙ ============

function renderAccordion() {
    const container = document.getElementById('emotion-accordion');

    container.innerHTML = CATEGORY_ORDER.map(key => {
        const cat = EMOTIONS[key];
        return `
            <div class="accordion-item" data-category="${key}">
                <button class="accordion-header"
                    style="--cat-color: ${cat.color}; --cat-bg: ${cat.bg}">
                    <span class="accordion-emoji">${emojiHtml(cat.emoji)}</span>
                    <span class="accordion-name">${cat.name}</span>
                    <span class="accordion-selected-count" 
                          id="acc-count-${key}"
                          style="--cat-color: ${cat.color}; --cat-bg: ${cat.bg}">0</span>
                    <span class="accordion-arrow">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
                    </span>
                </button>
                <div class="accordion-body">
                    <div class="accordion-chips">
                        ${cat.subemotions.map(sub => `
                            <button class="emotion-chip" 
                                    data-category="${key}" 
                                    data-emotion="${sub}"
                                    style="--cat-color: ${cat.color}; --cat-bg: ${cat.bg}; --cat-glow: ${cat.glow}">
                                ${sub}
                            </button>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }).join('');

    // Аккордеон открытие/закрытие
    container.querySelectorAll('.accordion-header').forEach(header => {
        header.addEventListener('click', () => {
            const item = header.closest('.accordion-item');
            item.classList.toggle('open');
        });
    });

    // Выбор чипов
    container.querySelectorAll('.emotion-chip').forEach(chip => {
        chip.addEventListener('click', (e) => {
            e.stopPropagation();
            const catId = chip.dataset.category;
            const emotion = chip.dataset.emotion;

            const idx = state.selectedEmotions.findIndex(
                e => e.category === catId && e.emotion === emotion
            );

            if (idx >= 0) {
                state.selectedEmotions.splice(idx, 1);
                chip.classList.remove('selected');
            } else {
                state.selectedEmotions.push({ category: catId, emotion });
                chip.classList.add('selected');
            }

            updateCategoryCount(catId);
            updateSelectionCounter();
            updateSaveBtn();
        });
    });
}

function updateCategoryCount(catId) {
    const count = state.selectedEmotions.filter(e => e.category === catId).length;
    const el = document.getElementById(`acc-count-${catId}`);
    el.textContent = count;
    el.classList.toggle('has-selected', count > 0);
}

function updateSelectionCounter() {
    const count = state.selectedEmotions.length;
    const currentEl = document.getElementById('counter-current');
    const counterEl = document.getElementById('selection-counter');

    currentEl.textContent = count;

    const enough = count >= MIN_EMOTIONS;
    currentEl.classList.toggle('enough', enough);
    counterEl.classList.toggle('enough', enough);
}

function updateSaveBtn() {
    const btn = document.getElementById('save-entry');

    if (state.timeOfDay === 'note') {
        const notesText = document.getElementById('notes-text').value.trim();
        btn.disabled = notesText.length === 0;
    } else {
        const enough = state.selectedEmotions.length >= MIN_EMOTIONS;
        if (state.timeOfDay === 'morning') {
            const happyText = document.getElementById('happy-text').value.trim();
            btn.disabled = !enough || happyText.length === 0;
        } else {
            btn.disabled = !enough;
        }
    }
}

// ============ СОХРАНЕНИЕ ============

async function saveEntry() {
    const btn = document.getElementById('save-entry');
    if (btn.disabled) return;

    btn.disabled = true;
    const saveBtnText = document.getElementById('save-btn-text');
    saveBtnText.textContent = 'Сохраняю...';

    const happyText = state.timeOfDay === 'morning'
        ? document.getElementById('happy-text').value.trim()
        : '';
    const gratefulText = state.timeOfDay === 'evening'
        ? document.getElementById('grateful-text').value.trim()
        : '';
    const notesText = document.getElementById('notes-text').value.trim();
    const selectedDayKey = getSelectedDayKey();
    const selectedDate = getSelectedDate();

    const entry = {
        id: generateId(),
        date: selectedDate,
        dayKey: selectedDayKey,
        timeOfDay: state.timeOfDay,
        emotions: state.timeOfDay === 'note' ? [] : [...state.selectedEmotions],
        happyText,
        gratefulText,
        notes: notesText
    };

    try {
        const res = await fetch(API_URL, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(entry)
        });

        if (!res.ok) throw new Error('Save failed');

        state.entries.unshift(entry);
        // Пересортировать по дате
        state.entries.sort((a, b) => new Date(b.date) - new Date(a.date));

        const timeLabelMap = { morning: 'Утренняя', evening: 'Вечерняя', note: 'Заметка' };
        const timeLabel = timeLabelMap[state.timeOfDay] || 'Запись';
        showToast(`✨ ${timeLabel} сохранена!`);

        // Сброс
        state.selectedEmotions = [];
        document.getElementById('happy-text').value = '';
        document.getElementById('grateful-text').value = '';
        document.getElementById('notes-text').value = '';
        // Сбросить дату на сегодня
        const dateInput = document.getElementById('entry-date');
        if (dateInput) dateInput.value = todayKey();
        renderAccordion();
        updateSelectionCounter();
        updateSaveBtn();
        updateTodayStatus();

        // Если утро записано, переключить на вечер
        if (state.timeOfDay === 'morning') {
            switchTimeOfDay('evening');
        }
    } catch (err) {
        console.error('Save error:', err);
        showToast('Ошибка сохранения. Попробуйте ещё раз.', 'error');
        btn.disabled = false;
        const saveBtnText = document.getElementById('save-btn-text');
        if (state.timeOfDay === 'note') {
            saveBtnText.textContent = 'Сохранить заметку';
        } else if (state.timeOfDay === 'morning') {
            saveBtnText.textContent = 'Сохранить утреннюю запись';
        } else {
            saveBtnText.textContent = 'Сохранить вечернюю запись';
        }
    }
}

// ============ ИСТОРИЯ ============

function renderHistory() {
    const container = document.getElementById('entries-list');
    const empty = document.getElementById('history-empty');

    if (state.entries.length === 0) {
        container.innerHTML = '';
        empty.style.display = 'block';
        return;
    }

    empty.style.display = 'none';

    container.innerHTML = state.entries.map(entry => {
        const timeClass = entry.timeOfDay || 'morning';
        const timeLabelMap = { morning: emojiHtml('☀️') + ' Утро', evening: emojiHtml('🌙') + ' Вечер', note: emojiHtml('📝') + ' Заметка' };
        const timeLabel = timeLabelMap[timeClass] || timeClass;
        const colorMap = { morning: '#f0c06c', evening: '#8b6cf0', note: '#6cf0e0' };
        const entryColor = colorMap[timeClass] || '#6cf0e0';

        const emotionsHtml = (entry.emotions || []).map(em => {
            const cat = EMOTIONS[em.category] || {};
            return `<span class="entry-emotion-tag" style="--cat-color: ${cat.color}; --cat-bg: ${cat.bg}">${em.emotion}</span>`;
        }).join('');

        const notePreview = entry.timeOfDay === 'note' && entry.notes
            ? `<div class="entry-card-note-preview">${escapeHtml(entry.notes.substring(0, 100))}${entry.notes.length > 100 ? '...' : ''}</div>`
            : '';

        return `
            <div class="entry-card" data-id="${entry.id}" style="--entry-color: ${entryColor}">
                <div class="entry-card-top">
                    <span class="entry-card-time-badge ${timeClass}">${timeLabel}</span>
                    <span class="entry-card-date">${formatDate(entry.date)}, ${formatTime(entry.date)}</span>
                </div>
                ${emotionsHtml ? `<div class="entry-card-emotions">${emotionsHtml}</div>` : ''}
                ${entry.happyText ? `<div class="entry-card-happy">${escapeHtml(entry.happyText)}</div>` : ''}
                ${notePreview}
            </div>
        `;
    }).join('');

    container.querySelectorAll('.entry-card').forEach(card => {
        card.addEventListener('click', () => openModal(card.dataset.id));
    });
}

// ============ КАЛЕНДАРЬ ============

function renderCalendar() {
    const grid = document.getElementById('calendar-grid');
    document.getElementById('cal-month-year').textContent = formatMonthYear(state.calendarDate);

    const year = state.calendarDate.getFullYear();
    const month = state.calendarDate.getMonth();

    const dayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    const firstDay = new Date(year, month, 1);
    let startDay = firstDay.getDay() - 1;
    if (startDay < 0) startDay = 6;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();

    const monthEntries = state.entries.filter(e => {
        const d = new Date(e.date);
        return d.getFullYear() === year && d.getMonth() === month;
    });

    let html = dayNames.map(d => `<div class="cal-day-name">${d}</div>`).join('');

    for (let i = 0; i < startDay; i++) {
        html += '<div class="cal-day empty"></div>';
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dateObj = new Date(year, month, day);
        const isToday = isSameDay(dateObj, today);
        const dayEntries = monthEntries.filter(e => new Date(e.date).getDate() === day);
        const hasMorning = dayEntries.some(e => e.timeOfDay === 'morning');
        const hasEvening = dayEntries.some(e => e.timeOfDay === 'evening');
        const hasNote = dayEntries.some(e => e.timeOfDay === 'note');

        let dots = '';
        if (hasMorning || hasEvening || hasNote) {
            dots = '<div class="cal-dots">';
            if (hasMorning) dots += '<span class="cal-dot morning"></span>';
            if (hasEvening) dots += '<span class="cal-dot evening"></span>';
            if (hasNote) dots += '<span class="cal-dot note"></span>';
            dots += '</div>';
        }

        html += `<div class="cal-day ${isToday ? 'today' : ''}">${day}${dots}</div>`;
    }

    grid.innerHTML = html;
}

// ============ МОДАЛКА ============

function openModal(entryId) {
    const entry = state.entries.find(e => e.id === entryId);
    if (!entry) return;

    const modal = document.getElementById('entry-modal');
    const body = document.getElementById('modal-body');
    const timeClass = entry.timeOfDay || 'morning';
    const timeLabelMap = { morning: emojiHtml('☀️') + ' Утренняя запись', evening: emojiHtml('🌙') + ' Вечерняя запись', note: emojiHtml('📝') + ' Заметка' };
    const timeLabel = timeLabelMap[timeClass] || timeClass;

    const emotionsSection = (entry.emotions || []).length > 0 ? `
        <div class="modal-emotions">
            ${(entry.emotions || []).map(em => {
        const cat = EMOTIONS[em.category] || {};
        return `<span class="entry-emotion-tag" style="--cat-color: ${cat.color}; --cat-bg: ${cat.bg}">${emojiHtml(cat.emoji)} ${em.emotion}</span>`;
    }).join('')}
        </div>` : '';

    body.innerHTML = `
        <span class="modal-time-badge ${timeClass}">${timeLabel}</span>
        <div class="modal-date">${formatDate(entry.date)}, ${formatTime(entry.date)}</div>
        
        ${emotionsSection}

        ${entry.happyText ? `
            <div class="modal-happy">
                <div class="modal-happy-label">${emojiHtml('✨')} Почему я сегодня счастлив:</div>
                <div class="modal-happy-text">${escapeHtml(entry.happyText)}</div>
            </div>
        ` : ''}

        ${entry.gratefulText ? `
            <div class="modal-happy" style="border-color: rgba(139,108,240,0.2); background: rgba(139,108,240,0.06)">
                <div class="modal-happy-label">${emojiHtml('🙏')} За что я благодарен:</div>
                <div class="modal-happy-text">${escapeHtml(entry.gratefulText)}</div>
            </div>
        ` : ''}

        ${entry.notes ? `<div class="modal-note">${escapeHtml(entry.notes)}</div>` : ''}
    `;

    modal.dataset.entryId = entryId;
    modal.style.display = 'flex';
}

function closeModal() {
    document.getElementById('entry-modal').style.display = 'none';
}

async function deleteEntry(entryId) {
    try {
        const res = await fetch(`${API_URL}/${entryId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        if (!res.ok) throw new Error('Delete failed');

        state.entries = state.entries.filter(e => e.id !== entryId);
        closeModal();
        renderHistory();
        renderCalendar();
        updateTodayStatus();
        showToast('Запись удалена', 'error');
    } catch (err) {
        console.error('Delete error:', err);
        showToast('Ошибка удаления', 'error');
    }
}

// ============ СТАТИСТИКА ============

function renderStats() {
    const empty = document.getElementById('stats-empty');

    if (state.entries.length === 0) {
        document.querySelectorAll('#screen-stats .chart-section, #screen-stats .stats-grid').forEach(el => {
            el.style.display = 'none';
        });
        empty.style.display = 'block';
        return;
    }

    empty.style.display = 'none';
    document.querySelectorAll('#screen-stats .chart-section, #screen-stats .stats-grid').forEach(el => {
        el.style.display = '';
    });

    // Карточки
    const total = state.entries.length;
    const streak = calculateStreak();
    const thisWeek = countThisWeek();

    document.querySelector('#stat-total .stat-number').textContent = total;
    document.querySelector('#stat-streak .stat-number').textContent = streak;
    document.querySelector('#stat-this-week .stat-number').textContent = thisWeek;

    renderEmotionBars();
    renderTopEmotions();
    renderHappyHistory();
}

function calculateStreak() {
    if (state.entries.length === 0) return 0;

    const uniqueDays = [...new Set(state.entries.map(e => e.dayKey))].sort().reverse();
    let streak = 0;
    let checkDate = new Date();

    for (let i = 0; i < 365; i++) {
        const key = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
        if (uniqueDays.includes(key)) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
        } else {
            break;
        }
    }
    return streak;
}

function countThisWeek() {
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    return state.entries.filter(e => new Date(e.date) >= weekAgo).length;
}

function renderEmotionBars() {
    const container = document.getElementById('emotion-bars');
    const counts = {};
    CATEGORY_ORDER.forEach(k => counts[k] = 0);

    state.entries.forEach(entry => {
        (entry.emotions || []).forEach(em => {
            if (counts[em.category] !== undefined) counts[em.category]++;
        });
    });

    const max = Math.max(...Object.values(counts), 1);

    container.innerHTML = CATEGORY_ORDER.map(key => {
        const cat = EMOTIONS[key];
        const count = counts[key];
        const pct = (count / max) * 100;
        return `
            <div class="emotion-bar-row">
                <div class="emotion-bar-label"><span>${cat.emoji}</span><span>${cat.name}</span></div>
                <div class="emotion-bar-track">
                    <div class="emotion-bar-fill" style="width: ${pct}%; background: ${cat.color}"></div>
                </div>
                <div class="emotion-bar-count">${count}</div>
            </div>
        `;
    }).join('');
}

function renderTopEmotions() {
    const container = document.getElementById('top-emotions');
    const counts = {};

    state.entries.forEach(entry => {
        (entry.emotions || []).forEach(em => {
            counts[em.emotion] = (counts[em.emotion] || 0) + 1;
        });
    });

    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);

    if (sorted.length === 0) {
        container.innerHTML = '<p style="color: var(--text-muted)">Нет данных</p>';
        return;
    }

    const medals = ['🥇', '🥈', '🥉', '4', '5'];
    container.innerHTML = sorted.map(([name, count], i) => `
        <div class="top-emotion-item">
            <div class="top-emotion-rank">${medals[i]}</div>
            <div class="top-emotion-name">${name}</div>
            <div class="top-emotion-count">${count} раз</div>
        </div>
    `).join('');
}

function renderHappyHistory() {
    const container = document.getElementById('happy-history');
    const happyEntries = state.entries.filter(e => e.happyText).slice(0, 7);

    if (happyEntries.length === 0) {
        container.innerHTML = '<p style="color: var(--text-muted)">Пока нет ответов</p>';
        return;
    }

    container.innerHTML = happyEntries.map(e => `
        <div class="happy-history-item">
            <div class="happy-history-date">${formatDate(e.date)}</div>
            <div class="happy-history-text">${escapeHtml(e.happyText)}</div>
        </div>
    `).join('');
}

// ============ ИНИЦИАЛИЗАЦИЯ ============

function exportToTxt() {
    if (state.entries.length === 0) {
        showToast('Нет записей для экспорта', 'error');
        return;
    }

    let textContent = 'ДНЕВНИК ЭМОЦИЙ — Экспорт записей\n';
    textContent += '=================================\n\n';

    const sortedEntries = [...state.entries].sort((a, b) => new Date(a.date) - new Date(b.date));

    sortedEntries.forEach(entry => {
        const dateStr = formatDate(entry.date);
        const timeStr = formatTime(entry.date);
        const timeLabelMap = { morning: '☀️ Утро', evening: '🌙 Вечер', note: '📝 Заметка' };
        const timeLabel = timeLabelMap[entry.timeOfDay] || entry.timeOfDay;

        textContent += `[${dateStr}, ${timeStr}] ${timeLabel}\n`;

        if (entry.emotions && entry.emotions.length > 0) {
            const ems = entry.emotions.map(em => em.emotion).join(', ');
            textContent += `Эмоции: ${ems}\n`;
        }

        if (entry.happyText) {
            textContent += `Почему я счастлив:\n${entry.happyText}\n`;
        }

        if (entry.gratefulText) {
            textContent += `За что я благодарен:\n${entry.gratefulText}\n`;
        }

        if (entry.notes) {
            textContent += `Заметки:\n${entry.notes}\n`;
        }

        textContent += '---------------------------------\n\n';
    });

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `diary_export_${todayKey()}.txt`;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 100);

    showToast('Записи экспортированы!', 'success');
}

// ============ ИМПОРТ ============

async function importFromTxt(file) {
    const text = await file.text();
    const lines = text.split('\n').map(l => l.replace(/\r$/, ''));

    const entries = [];
    let current = null;
    let section = null; // 'happy' | 'grateful' | 'notes' | 'emotions'

    const MONTHS_RU = {
        'января': 0, 'февраля': 1, 'марта': 2, 'апреля': 3, 'мая': 4, 'июня': 5,
        'июля': 6, 'августа': 7, 'сентября': 8, 'октября': 9, 'ноября': 10, 'декабря': 11
    };

    function parseDateLine(line) {
        // Format: [15 марта 2025, 09:30] ☀️ Утро
        const m = line.match(/\[(\d+)\s+(\S+)\s+(\d{4}),\s*(\d{2}):(\d{2})\]\s*(.*)/u);
        if (!m) return null;
        const [, day, monthStr, year, hh, mm, label] = m;
        const month = MONTHS_RU[monthStr.toLowerCase()];
        if (month === undefined) return null;
        const date = new Date(parseInt(year), month, parseInt(day), parseInt(hh), parseInt(mm));
        const labelClean = label.replace(/[☀️🌙📝]/gu, '').trim();
        let timeOfDay = 'morning';
        if (labelClean.includes('Вечер')) timeOfDay = 'evening';
        else if (labelClean.includes('Заметка')) timeOfDay = 'note';
        const dayKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        return { date: date.toISOString(), dayKey, timeOfDay };
    }

    for (const line of lines) {
        if (line.startsWith('[') && line.includes(']')) {
            // Сохраняем предыдущую запись
            if (current) entries.push(current);
            const parsed = parseDateLine(line);
            if (!parsed) continue;
            current = {
                id: generateId(),
                date: parsed.date,
                dayKey: parsed.dayKey,
                timeOfDay: parsed.timeOfDay,
                emotions: [],
                happyText: '',
                gratefulText: '',
                notes: ''
            };
            section = null;
            continue;
        }

        if (!current) continue;

        if (line.startsWith('Эмоции:')) {
            section = 'emotions';
            const emotionNames = line.replace('Эмоции:', '').split(',').map(s => s.trim()).filter(Boolean);
            // Find category for each emotion name
            current.emotions = emotionNames.map(name => {
                for (const [catId, cat] of Object.entries(EMOTIONS)) {
                    if (cat.subemotions.includes(name)) return { category: catId, emotion: name };
                }
                return { category: 'joy', emotion: name };
            });
            continue;
        }
        if (line.startsWith('Почему я счастлив:')) { section = 'happy'; continue; }
        if (line.startsWith('За что я благодарен:')) { section = 'grateful'; continue; }
        if (line.startsWith('Заметки:')) { section = 'notes'; continue; }
        if (line.startsWith('---------')) {
            if (current) entries.push(current);
            current = null;
            section = null;
            continue;
        }

        if (section === 'happy') current.happyText += (current.happyText ? '\n' : '') + line;
        else if (section === 'grateful') current.gratefulText += (current.gratefulText ? '\n' : '') + line;
        else if (section === 'notes') current.notes += (current.notes ? '\n' : '') + line;
    }
    if (current) entries.push(current);

    if (entries.length === 0) {
        showToast('Не найдено записей для импорта', 'error');
        return;
    }

    // Дедупликация по dayKey + timeOfDay
    const existingKeys = new Set(state.entries.map(e => `${e.dayKey}-${e.timeOfDay}`));
    const newEntries = entries.filter(e => !existingKeys.has(`${e.dayKey}-${e.timeOfDay}`));

    if (newEntries.length === 0) {
        showToast('Все записи уже существуют', 'error');
        return;
    }

    // Отправка на сервер
    let saved = 0;
    for (const entry of newEntries) {
        try {
            const res = await fetch(API_URL, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(entry)
            });
            if (res.ok) {
                state.entries.push(entry);
                saved++;
            }
        } catch (e) { /* skip */ }
    }

    state.entries.sort((a, b) => new Date(b.date) - new Date(a.date));
    renderHistory();
    renderCalendar();
    updateTodayStatus();

    showToast(`✅ Импортировано ${saved} из ${entries.length} записей!`, 'success');
}

async function startApp() {
    await loadEntries();
    renderGreeting();
    renderHappyPrompts();
    renderGratefulPrompts();
    renderAccordion();
    updateSelectionCounter();
    updateTodayStatus();
    updateSaveBtn();
}

function initAuth() {
    document.getElementById('auth-submit').addEventListener('click', handleAuth);
    document.getElementById('auth-toggle').addEventListener('click', toggleAuthMode);

    document.getElementById('auth-password').addEventListener('keydown', e => {
        if (e.key === 'Enter') handleAuth();
    });
    document.getElementById('auth-email').addEventListener('keydown', e => {
        if (e.key === 'Enter') document.getElementById('auth-password').focus();
    });

    // Показать/скрыть пароль
    const toggleBtn = document.getElementById('password-toggle');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            const input = document.getElementById('auth-password');
            const eyeIcon = document.getElementById('eye-icon');
            const eyeOffIcon = document.getElementById('eye-off-icon');
            if (input.type === 'password') {
                input.type = 'text';
                eyeIcon.style.display = 'none';
                eyeOffIcon.style.display = 'block';
            } else {
                input.type = 'password';
                eyeIcon.style.display = 'block';
                eyeOffIcon.style.display = 'none';
            }
        });
    }

    // Профиль
    document.getElementById('nav-profile').addEventListener('click', toggleProfilePopup);
    document.getElementById('profile-logout').addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        logout();
    });
}

async function init() {
    initAuth();

    // Экспорт
    const exportBtn = document.getElementById('history-export');
    if (exportBtn) exportBtn.addEventListener('click', exportToTxt);

    // Импорт
    const importBtn = document.getElementById('history-import');
    const importFileInput = document.getElementById('import-file-input');
    if (importBtn && importFileInput) {
        importBtn.addEventListener('click', () => importFileInput.click());
        importFileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            await importFromTxt(file);
            importFileInput.value = ''; // сбросить для повторного импорта
        });
    }

    // Навигация (только кнопки с data-screen, не профиль)
    document.querySelectorAll('.nav-btn[data-screen]').forEach(btn => {
        btn.addEventListener('click', () => switchScreen(btn.dataset.screen));
    });

    // Утро / Вечер / Заметка
    document.querySelectorAll('.time-btn').forEach(btn => {
        btn.addEventListener('click', () => switchTimeOfDay(btn.dataset.time));
    });

    // Датапикер
    const entryDate = document.getElementById('entry-date');
    if (entryDate) {
        entryDate.value = todayKey();
        entryDate.max = todayKey();
        entryDate.addEventListener('change', updateTodayStatus);
    }

    // Текстовые поля
    document.getElementById('happy-text').addEventListener('input', updateSaveBtn);
    document.getElementById('grateful-text').addEventListener('input', updateSaveBtn);
    document.getElementById('notes-text').addEventListener('input', updateSaveBtn);
    document.getElementById('refresh-prompts').addEventListener('click', renderHappyPrompts);
    document.getElementById('refresh-grateful-prompts').addEventListener('click', renderGratefulPrompts);
    document.getElementById('save-entry').addEventListener('click', saveEntry);

    // Календарь
    document.getElementById('cal-prev').addEventListener('click', () => {
        state.calendarDate.setMonth(state.calendarDate.getMonth() - 1);
        renderCalendar();
    });
    document.getElementById('cal-next').addEventListener('click', () => {
        state.calendarDate.setMonth(state.calendarDate.getMonth() + 1);
        renderCalendar();
    });

    // Модалка
    document.getElementById('modal-close').addEventListener('click', closeModal);
    document.getElementById('entry-modal').addEventListener('click', e => {
        if (e.target === e.currentTarget) closeModal();
    });
    document.getElementById('modal-delete').addEventListener('click', () => {
        const id = document.getElementById('entry-modal').dataset.entryId;
        if (confirm('Удалить эту запись?')) deleteEntry(id);
    });

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') closeModal();
    });

    // Если есть токен — сразу в приложение
    if (authToken) {
        document.getElementById('auth-screen').style.display = 'none';
        document.getElementById('app').style.display = 'block';
        await startApp();
    }

    parseEmojis();
}

// ============ TWEMOJI (парсинг статичного HTML) ============

function parseEmojis() {
    if (typeof twemoji !== 'undefined') {
        twemoji.parse(document.body, {
            folder: 'svg',
            ext: '.svg',
            base: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/'
        });
    }
}

document.addEventListener('DOMContentLoaded', init);
