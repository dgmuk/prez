/**
 * Product screenshots for consultation slides.
 * Drop real files into /public/screenshots/ (see README there).
 */

export const PRODUCT_SCREENS = {
  slide41: {
    src: '/screenshots/41.jpg',
    caption: 'Анкета клиента: базовые данные',
    ratio: 'phone',
  },
  slide42: {
    src: '/screenshots/42.jpg',
    caption: 'Программа на неделю',
    ratio: 'phone',
  },
  slide43: {
    src: '/screenshots/43.jpg',
    caption: 'Правка после недели',
    ratio: 'phone',
  },
  slide44: {
    src: '/screenshots/44.jpg',
    caption: 'Дневник тренировок',
    ratio: 'phone',
  },
  slide45: {
    src: '/screenshots/45.jpg',
    caption: 'Прогресс: цифры и фото',
    ratio: 'phone',
  },
  slide46: {
    src: '/screenshots/46.jpg',
    caption: 'Личный кабинет',
    ratio: 'phone',
  },
}

/** Map slide id -> screen keys to show */
export const SLIDE_SCREENS = {
  'b4-step1': ['slide41'],
  'b4-step2': ['slide42'],
  'b4-step3': ['slide43'],
  'b4-step4': ['slide44'],
  'b4-diary': ['slide45'],
  'b4-proof': ['slide46'],
}
