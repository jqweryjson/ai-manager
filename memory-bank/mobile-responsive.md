# Мобильная версия AI-MANAGER

## Обзор

Приложение поддерживает **2 брейкпоинта** с использованием CSS медиа-запросов:

- **Mobile**: < 768px
- **Desktop**: ≥ 768px

Реализация полностью основана на **CSS**, без JavaScript хуков.

## Архитектура адаптивности

### Брейкпоинты

```css
:root {
  --bp-mobile: 768px;
}
```

### Утилиты видимости

```css
/* Скрывает элемент на мобилке */
.hidden-mobile {
  display: none !important;
}

/* Скрывает элемент на десктопе */
.hidden-desktop {
  display: none !important;
}
```

## Адаптированные компоненты

### 1. MainLayout

**Desktop** (≥ 768px):

```
┌─────────────────────────────────────┐
│         Header                      │
├────────┬──────────────┬─────────────┤
│Sidebar │   Main       │ Retrieval   │
│ 60px   │   Content    │ Panel 400px │
│        │              │             │
└────────┴──────────────┴─────────────┘
```

**Mobile** (< 768px):

```
┌──────────────────────┐
│      Header          │
├──────────────────────┤
│    Main Content      │
├──────────────────────┤
│  Mobile Bottom Nav   │
└──────────────────────┘
```

**Реализация:**

- `Sidebar` скрыт на мобилке (`.hidden-mobile`)
- `MobileBottomNav` показан только на мобилке (`.hidden-desktop`)
- Основной контент адаптирует padding: `var(--space-2xl)` → `var(--space-m)`

### 2. Header

**CSS классы:**

- `.header` — основной контейнер
- `.header__left` — левая часть (логотип)
- `.header__right` — правая часть (кнопки, пользователь)
- `.header__title` — заголовок (1.25rem → 1rem на мобилке)
- `.header__user-info` — скрыта на мобилке

**Изменения на мобилке:**

- Размер шрифта: 1.25rem → 1rem
- Padding: `var(--space-m) var(--space-xl)` → `var(--space-m)`
- Gap: `var(--space-xl)` → `var(--space-m)`

### 3. Sidebar

**Поведение:**

- Desktop: вертикальная колонка 60px слева
- Mobile: скрыта (`.hidden-mobile`)

### 4. MobileBottomNav (Новый компонент)

**Появляется только на мобилке** (< 768px)

**Расположение:** внизу экрана (position: sticky/fixed в будущих версиях)

**Размеры:**

- Высота: 60px
- Ширина: 100%
- Кнопки: 3 штуки (Чат, Документы, Настройки)

**CSS класс:** `.mobile-bottom-nav`

### 5. ChatPage

**Desktop:**

- Layout: `flex-direction: row`
- Main + RetrievalPanel рядом

**Mobile:**

- Layout: `flex-direction: column`
- RetrievalPanel скрыт (`.hidden-mobile`)
- Main занимает весь экран

**CSS классы:**

- `.chat-container` — основной контейнер
- `.chat-main` — основная область
- `.chat-header` — панель с ролью и workspace
- `.chat-messages` — область сообщений
- `.retrieval-panel` — скрыта на мобилке

### 6. InputBar

**Изменения на мобилке:**

- Кнопка загрузки скрыта (`.input-bar__button-attach`)
- Gap: `var(--space-m)` → `var(--space-s)`
- Padding: `var(--space-xl)` → `var(--space-m)`
- TextField занимает flex: 1

**CSS классы:**

- `.input-bar` — контейнер
- `.input-bar__layout` — flex layout
- `.input-bar__button-attach` — скрыта на мобилке
- `.input-bar__field` — текстовое поле
- `.input-bar__button-send` — кнопка отправки

### 7. RetrievalPanel

**Поведение:**

- Desktop: видна справа (400px)
- Mobile: скрыта (`display: none`)

**В будущих версиях:** может быть реализована как modal/drawer на мобилке

### 8. RoleCombobox

**CSS классы:**

- `.role-combobox` — контейнер
- `.role-combobox__header` — хедер с select и кнопками
- `.role-combobox__select` — select элемент
- `.role-combobox__prompt` — область промпта
- `.role-combobox__prompt-input` — textarea промпта
- `.role-combobox__prompt-status` — статус генерации

**Изменения на мобилке:**

- Gap в хедере: `var(--space-xs)` → `var(--space-2xs)`
- Margin промпта: `var(--space-s)` → `var(--space-xs)`

## CSS структура

### Файлы

1. **`app/styles/index.css`**
   - Глобальные стили и reset
   - Брейкпоинты и утилиты видимости
   - Touch-friendly размеры

2. **`app/styles/layout.css`**
   - Стили всех основных компонентов (~350 строк)
   - BEM нейминг для классов
   - Все медиа-запросы встроены в соответствующие селекторы

### BEM Соглашение

```css
/* Блок */
.component-name {
}

/* Элемент */
.component-name__element {
}

/* Модификатор */
.component-name--modifier {
}
```

Пример:

```css
.input-bar {
}
.input-bar__layout {
}
.input-bar__button-attach {
}
.input-bar__button-send {
}
```

## Touch-friendly ограничения

На мобилке все интерактивные элементы должны иметь минимальный размер:

```css
@media (max-width: 767px) {
  button,
  [role="button"],
  input[type="button"],
  input[type="submit"] {
    min-height: 44px;
    min-width: 44px;
  }
}
```

## Как добавить адаптивность новому компоненту

1. **Создать CSS класс** в `app/styles/layout.css`:

```css
.my-component {
  /* Desktop стили */
}

@media (max-width: 767px) {
  .my-component {
    /* Mobile стили */
  }
}
```

2. **Применить класс** в компоненте:

```tsx
<div className="my-component">{/* Content */}</div>
```

3. **Для скрытия элемента** использовать утилиты:

```tsx
<div className="hidden-mobile">Только на десктопе</div>
<div className="hidden-desktop">Только на мобилке</div>
```

## Тестирование мобильной версии

### Chrome DevTools

1. Откройте DevTools (F12)
2. Нажмите "Toggle device toolbar" (Ctrl+Shift+M)
3. Выберите мобильное устройство или установите ширину < 768px

### Реальные устройства

- iPhone: используйте Dev Tools через Safari или Xcode
- Android: используйте Chrome на телефоне

### Контрольные точки

- [ ] Header компактный и читаемый
- [ ] Кнопки имеют минимум 44x44px
- [ ] Текстовое поле занимает достаточно места
- [ ] Нет горизонтального скролла
- [ ] MobileBottomNav видна и работает
- [ ] RetrievalPanel скрыта
- [ ] Спейсинги правильные

## Будущие улучшения

- [ ] Drawer/Modal для RetrievalPanel на мобилке
- [ ] Hamburger меню вместо MobileBottomNav
- [ ] Оптимизация для планшетов (третий брейкпоинт)
- [ ] Ориентация (portrait/landscape)
- [ ] Динамические размеры на основе DPI
- [ ] Progressive Web App (PWA) поддержка
- [ ] Touch жесты (свайп между панелями)

## Ссылки

- `app/styles/index.css` — утилиты и брейкпоинты
- `app/styles/layout.css` — основные стили компонентов
- `widgets/Layout/MobileBottomNav.tsx` — мобильная навигация

