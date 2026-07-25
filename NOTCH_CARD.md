# Карточка с выемкой под кнопку (negative space / notch)

Как сверстать карточку, у которой в углу **физически вырезано** углубление
под круглую кнопку — так, что тёмный фон «проглядывает» сквозь материал
карточки, а кнопка идеально садится в вырез.

> ⛔ Мы **не** кладём круглую кнопку поверх прямоугольника. Это была бы
> иллюзия. Мы реально удаляем часть карточки с помощью CSS-маски.

---

## Идея в двух словах

CSS-свойство `mask-image` работает как трафарет:

- там, где маска **непрозрачная** (чёрная) — карточка **видна**;
- там, где маска **прозрачная** — карточка **исчезает** (сквозь неё видно фон).

Рисуем маску радиальным градиентом: сплошной чёрный фон + прозрачный круг
в нужной точке. Прозрачный круг и есть наша выемка.

```
mask-image: radial-gradient(
  circle 38px at 44px 44px,   /* круг радиусом 38px с центром в (44,44) */
  transparent 37px,           /* внутри 37px — дырка (фон виден) */
  #000 38px                   /* с 38px — снова карточка */
);
```

Разница `37px → 38px` даёт резкую, но сглаженную (антиалиасинг) границу
выреза. Если написать `transparent 38px, #000 38px` — край будет «рваным».

---

## Геометрия — как не промахнуться

Всё завязано на **три числа**. Задай их один раз через CSS-переменные,
и кнопка с выемкой всегда совпадут.

| Переменная      | Что это                                   | Пример  |
| --------------- | ----------------------------------------- | ------- |
| `--btn`         | диаметр кнопки                            | `64px`  |
| `--inset`       | отступ кнопки от края карточки            | `12px`  |
| `--gap`         | зазор (тёмное кольцо между кнопкой и картой) | `6px`  |

Из них считается всё остальное:

- **центр кнопки/выемки** = `--inset + --btn/2` → `12 + 32 = 44px`;
- **радиус выемки** = `--btn/2 + --gap` → `32 + 6 = 38px`.

Кнопку позиционируем `position: absolute` в тот же центр — и она ляжет
ровно в вырез с равномерным тёмным кольцом вокруг.

---

## Готовый пример (чистый HTML + CSS)

```html
<div class="stage">
  <div class="card">
    <button class="fab" aria-label="Редактировать">
      <!-- иконка карандаша -->
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none"
           stroke="#2b2c31" stroke-width="2"
           stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
      </svg>
    </button>
  </div>
</div>
```

```css
.stage {
  /* тёмный фон, сквозь который «проглядывает» вырез */
  background: #18191b;
  padding: 60px;
  display: grid;
  place-items: center;
  min-height: 100vh;
}

.card {
  /* три управляющих числа */
  --btn: 64px;
  --inset: 12px;
  --gap: 6px;

  /* производные */
  --c: calc(var(--inset) + var(--btn) / 2);   /* центр = 44px */
  --r: calc(var(--btn) / 2 + var(--gap));      /* радиус выемки = 38px */

  position: relative;
  width: 260px;
  height: 220px;
  background: #d9dbf5;          /* лавандовый */
  border-top-right-radius: 24px;
  border-bottom-right-radius: 24px;

  /* ВЫРЕЗ: прозрачный круг в точке (--c, --c) */
  -webkit-mask-image: radial-gradient(
    circle var(--r) at var(--c) var(--c),
    transparent calc(var(--r) - 1px),
    #000 var(--r)
  );
  mask-image: radial-gradient(
    circle var(--r) at var(--c) var(--c),
    transparent calc(var(--r) - 1px),
    #000 var(--r)
  );
}

.fab {
  position: absolute;
  width: var(--btn);
  height: var(--btn);
  /* центр кнопки в ту же точку (--c, --c) */
  top: var(--c);
  left: var(--c);
  transform: translate(-50%, -50%);

  border: none;
  border-radius: 50%;
  background: #f2f1ef;          /* почти белая */
  display: grid;
  place-items: center;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
}
```

**Почему это работает:** выемка и кнопка используют одни и те же `--c` и
радиусы, поэтому кольцо тёмного фона вокруг кнопки всегда ровное. Меняешь
`--btn` — всё пересчитывается само.

---

## Версия под этот проект (Next.js + CSS Modules)

`NotchCard.tsx`:

```tsx
import styles from "./NotchCard.module.css";

export default function NotchCard() {
  return (
    <div className={styles.card}>
      <button className={styles.fab} aria-label="Редактировать">
        <svg viewBox="0 0 24 24" width={22} height={22} fill="none"
             stroke="#2b2c31" strokeWidth={2}
             strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
        </svg>
      </button>
    </div>
  );
}
```

`NotchCard.module.css`:

```css
.card {
  --btn: 64px;
  --inset: 12px;
  --gap: 6px;
  --c: calc(var(--inset) + var(--btn) / 2);
  --r: calc(var(--btn) / 2 + var(--gap));

  position: relative;
  width: 260px;
  height: 220px;
  background: #d9dbf5;
  border-top-right-radius: 24px;
  border-bottom-right-radius: 24px;

  -webkit-mask-image: radial-gradient(circle var(--r) at var(--c) var(--c),
      transparent calc(var(--r) - 1px), #000 var(--r));
  mask-image: radial-gradient(circle var(--r) at var(--c) var(--c),
      transparent calc(var(--r) - 1px), #000 var(--r));
}

.fab {
  position: absolute;
  top: var(--c);
  left: var(--c);
  transform: translate(-50%, -50%);
  width: var(--btn);
  height: var(--btn);
  border: none;
  border-radius: 50%;
  background: #f2f1ef;
  display: grid;
  place-items: center;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
}
```

---

## Частые грабли

- **Вырез не появился** — проверь, что задал `-webkit-mask-image` (Chrome,
  Safari, Edge всё ещё требуют вендорный префикс).
- **Рваный край выреза** — не делай `transparent Rpx, #000 Rpx`. Оставь
  зазор в 1px: `transparent (R-1)px, #000 Rpx`.
- **Кнопка «плавает» рядом с вырезом** — центр кнопки (`top/left` + `translate`)
  и центр градиента (`at --c --c`) должны быть **одной и той же точкой**.
- **Тень кнопки обрезается маской?** — нет: маска стоит на `.card`, а кнопка
  лежит поверх и маской не режется. Тень кнопки видна целиком.
- **Скругление правых углов пропало** — `mask-image` и `border-radius`
  совместимы, но если нужны сложные формы — переходи на `mask` c несколькими
  слоями или на SVG-маску.

---

## Альтернатива: `clip-path`

`mask-image` — самый простой путь для **круглой** выемки. Если нужна форма
сложнее (несколько вырезов, вогнутые сопряжения как «капля»), рисуй контур
карточки через `clip-path: path("...")` или SVG `<clipPath>`. Минус — путь
задаётся в абсолютных координатах, адаптивность считать вручную. Для одной
круглой выемки маска проще и лаконичнее.
