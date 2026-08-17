/**
 * All consultation slides: 5 blocks
 */

export const BLOCKS = [
  { id: 'anketa', title: 'Анкета клиента', short: 'Анкета', icon: '01' },
  { id: 'lifestyle', title: 'Образ жизни', short: 'Образ жизни', icon: '02' },
  { id: 'assessment', title: 'Оценка и рекомендации', short: 'Оценка', icon: '03' },
  { id: 'route', title: 'Маршрут к цели', short: 'Маршрут', icon: '04' },
  { id: 'tariffs', title: 'Тарифы и оплата', short: 'Тарифы', icon: '05' },
]

const scale = (key, label, low = 'Слабо', high = 'Отлично') => ({
  type: 'scale',
  key,
  label,
  min: 1,
  max: 5,
  lowHint: low,
  highHint: high,
})

export const SLIDES = [
  // ═══════════════════════════════════════
  // BLOCK 1. Анкета (12)
  // ═══════════════════════════════════════
  {
    block: 0,
    id: 'b1-frame',
    type: 'frame',
    title: 'Анкета клиента',
    description:
      'Разберём, куда ты хочешь прийти и что этому мешало. Ответы своими словами, без правильных вариантов.',
    kicker: 'Блок 1 из 5',
  },
  {
    block: 0,
    id: 'b1-basics',
    type: 'fields',
    title: 'Основные данные',
    description: 'Базовые параметры для расчета индекса массы тела.',
    fields: [
      { key: 'name', label: 'Имя', type: 'text', placeholder: 'Как обращаться', voice: true },
      { key: 'telegram', label: 'Telegram', type: 'text', placeholder: '@username', voice: true },
      {
        key: 'sex',
        label: 'Пол',
        type: 'choice',
        options: [
          { value: 'male', label: 'Мужской' },
          { value: 'female', label: 'Женский' },
        ],
      },
      { key: 'age', label: 'Возраст', type: 'number', placeholder: 'лет', min: 14, max: 90 },
      { key: 'height', label: 'Рост, см', type: 'number', placeholder: 'см' },
      { key: 'weight', label: 'Вес, кг', type: 'number', placeholder: 'кг', step: 0.1 },
    ],
    showBmi: true,
  },
  {
    block: 0,
    id: 'b1-trigger',
    type: 'textarea',
    title: 'Что привело сейчас?',
    description: 'Почему именно сейчас, а не полгода назад?',
    key: 'trigger',
    placeholder: 'Например: смотрю на фото и не узнаю себя, врач сказал...',
    tags: ['фото / зеркало', 'здоровье', 'событие', 'партнёр / семья', 'надоело откладывать'],
  },
  {
    block: 0,
    id: 'b1-goal',
    type: 'choice',
    title: 'Главная цель',
    description: 'Выбери один ключевой приоритет на ближайшие месяцы.',
    key: 'mainGoal',
    options: [
      { value: 'lose', label: 'Похудение', desc: 'сбросить лишний вес' },
      { value: 'definition', label: 'Рельеф', desc: 'тонус и четкий мышечный рельеф' },
      { value: 'mass', label: 'Набор массы', desc: 'Мышечный рост' },
      { value: 'strength', label: 'Сила', desc: 'Прогрессия в зале' },
      { value: 'health', label: 'Здоровье', desc: 'Самочувствие и энергия' },
      { value: 'maintain', label: 'Поддержание', desc: 'Держать форму' },
    ],
    cols: 2,
  },
  {
    block: 0,
    id: 'b1-numbers',
    type: 'fields',
    title: 'Цель в цифрах',
    description: 'Желаемый вес, объемы или размер одежды.',
    fields: [
      { key: 'targetWeight', label: 'Целевой вес, кг', type: 'number', step: 0.1, placeholder: 'кг' },
      {
        key: 'targetNotes',
        label: 'Другие параметры',
        type: 'textarea',
        placeholder: 'Талия в см, размер одежды, процент жира...',
        voice: true,
      },
    ],
  },
  {
    block: 0,
    id: 'b1-ideal',
    type: 'textarea',
    title: 'Идеальная форма',
    description: 'как ты хочешь выглядеть и чувствовать себя в идеале',
    key: 'idealForm',
    placeholder: 'Опиши словами: внешний вид, энергия, уверенность...',
    tags: ['сухой торс', 'широкие плечи', 'лёгкость в теле', 'увереннее в зеркале', 'больше энергии'],
  },
  {
    block: 0,
    id: 'b1-deadline',
    type: 'fields',
    title: 'Срок и желаемая дата',
    description: 'К какому сроку или событию хочешь получить результат?',
    fields: [
      { key: 'deadlineMonths', label: 'Желаемый срок, месяцев', type: 'number', min: 1, max: 24, placeholder: 'мес.' },
      { key: 'deadlineEvent', label: 'Событие / дата', type: 'text', placeholder: 'Отпуск, день рождения, поездка...' },
    ],
  },
  {
    block: 0,
    id: 'b1-zones',
    type: 'multi',
    title: 'Приоритетные зоны',
    description: 'Над какими зонами хочешь поработать в первую очередь?',
    key: 'priorityZones',
    options: [
      'Живот',
      'Бока',
      'Грудь / торс',
      'Спина',
      'Руки',
      'Плечи',
      'Ноги',
      'Ягодицы',
      'Осанка',
      'Общий тонус',
    ],
  },
  {
    block: 0,
    id: 'b1-blockers',
    type: 'textarea',
    title: 'Что мешает результату?',
    description: 'Выбери несколько причин которые тормозят прогресс.',
    key: 'blockers',
    placeholder: 'Своими словами...',
    tags: ['нет режима', 'сладкое', 'нет времени', 'работа / смены', 'стресс', 'алкоголь', 'нет системы', 'нехватка мотивации'],
  },
  {
    block: 0,
    id: 'b1-past',
    type: 'textarea',
    title: 'Прошлые попытки',
    description: 'Какой опыт тренировок и питания уже был?',
    key: 'pastAttempts',
    placeholder: 'Зал сам, диеты, приложения, тренер...',
    tags: ['зал сам', 'диета', 'марафон', 'тренер в зале', 'приложение', 'домашние тренировки'],
  },
  {
    block: 0,
    id: 'b1-why-failed',
    type: 'textarea',
    title: 'Что помешало',
    description: 'Почему прошлые попытки не сработали.',
    key: 'whyFailed',
    placeholder: 'Что сорвало план...',
    tags: ['нет контроля', 'жёсткая диета', 'травма', 'график', 'не хватило дисциплины', 'не было видимого результата'],
  },
  {
    block: 0,
    id: 'b1-need',
    type: 'textarea',
    title: 'Что нужно, чтобы получилось',
    description: 'что поможет дойти до цели без срывов, в этот раз?',
    key: 'whatNeeded',
    placeholder: 'Система, контроль, план питания...',
    tags: ['чёткая система', 'еженедельный контроль', 'гибкость под жизнь', 'поддержка и внешний контроль', 'понятный рацион питания'],
  },
  {
    block: 0,
    id: 'b1-why-important',
    type: 'textarea',
    title: 'Почему это важно для тебя?',
    description: 'Что кардинально изменится в твоей жизни, когда ты достигнешь цели?',
    key: 'whyImportant',
    placeholder: 'Например: наконец смогу нормально играть с ребёнком без одышки...',
    tags: ['уверенность', 'здоровье', 'семья', 'энергия', 'легкость в теле', 'карьера'],
  },
  {
    block: 0,
    id: 'b1-how-know',
    type: 'textarea',
    title: 'Как поймёшь, что удалось?',
    description: 'Конкретные вещи, которые увидишь или почувствуешь.',
    key: 'howKnowSuccess',
    placeholder: 'Например: влезу в старые джинсы, буду бегать без одышки 3 км...',
    tags: ['любимая одежда', 'цифра на весах', 'лёгкость в движении', 'фото без футболки', 'силовые показатели'],
  },

  // ═══════════════════════════════════════
  // BLOCK 2. Lifestyle (13)
  // ═══════════════════════════════════════
  {
    block: 1,
    id: 'b2-frame',
    type: 'frame',
    title: 'Исследуем образ жизни',
    description:
      'Оценим базовую активность, питание, сон и уровень стресса для точной адаптации плана.',
    kicker: 'Блок 2 из 5',
  },
  {
    block: 1,
    id: 'b2-activity',
    type: 'composite',
    title: 'Активность и тренированность',
    description: 'Оценка базовой активности, выносливости и привычек',
    domain: 'activity',
    fields: [
      scale('dailyActivity', 'Бытовая активность днём', 'Сидячий', 'Очень подвижный'),
      scale('sportsPrep', 'Спортивная подготовка', 'Новичок', 'Опытный'),
      scale('stairsBreath', 'Одышка при подъеме по лестнице, 5 этаж', 'Сильная', 'Нет'),
      scale('morningCharge', 'Утренняя зарядка / разминка', 'Никогда', 'Регулярно'),
      { type: 'number', key: 'hoursSitting', label: 'Часов в день сидя', placeholder: 'например, 8', min: 0, max: 16 },
      { type: 'number', key: 'dailySteps', label: 'Шаги в день (примерно)', placeholder: 'например, 6000', min: 0 },
    ],
  },
  {
    block: 1,
    id: 'b2-system',
    type: 'composite',
    title: 'Система тренировок',
    description: 'Текущий формат, структура и периодизация нагрузок.',
    domain: 'training',
    fields: [
      {
        type: 'choice',
        key: 'trainingSystem',
        label: 'Есть ли система',
        options: [
          { value: 'none', label: 'Нет программы' },
          { value: 'own', label: 'Интуитивно / сам(а)' },
          { value: 'internet', label: 'Из интернета' },
          { value: 'coach', label: 'Был / есть тренер' },
        ],
        cols: 2,
      },
      {
        type: 'choice',
        key: 'trainingFormat',
        label: 'Формат',
        options: [
          { value: 'split', label: 'Сплит' },
          { value: 'fullbody', label: 'Фулбоди (все тело)' },
          { value: 'chaos', label: 'Хаотично' },
          { value: 'functional', label: 'Функциональный тренинг' },
          { value: 'other', label: 'Другое' },
        ],
        cols: 2,
      },
      {
        type: 'choice',
        key: 'programAge',
        label: 'Как давно программа не менялась',
        options: [
          { value: 'month', label: 'Меньше 1 мес.' },
          { value: '1-3m', label: '1–3 месяца' },
          { value: '3-6m', label: '3–6 месяцев' },
          { value: '6-12m', label: 'Полгода–год' },
          { value: 'year', label: 'Больше года' },
          { value: 'never', label: 'Не было программы' },
          { value: 'never_changed', label: 'Никогда ничего не менял(а)' },
        ],
        cols: 2,
      },
    ],
  },
  {
    block: 1,
    id: 'b2-quality',
    type: 'composite',
    title: 'Качество тренировок',
    description: 'Оценка техники, прогрессии и осознанности нагрузок.',
    domain: 'training',
    fields: [
      scale('progression', 'Прогрессия нагрузок', 'Нет', 'Системная'),
      scale('warmup', 'Разминка и заминка', 'Пропускаю', 'Всегда'),
      scale('techniqueVideo', 'Техника / контроль по видео', 'Нет', 'Регулярно'),
      scale('rpeAwareness', 'Понимание интенсивности (работа до отказа / усилие)', 'Не чувствую / Не знаю', 'Четко дозирую'),
    ],
  },
  {
    block: 1,
    id: 'b2-nutrition',
    type: 'composite',
    title: 'Питание',
    description: 'Оценка пищевых привычек, баланса рациона и формата питания.',
    domain: 'nutrition',
    fields: [
      scale('kbjuTracking', 'Контроль КБЖУ (подсчет калорий)', 'Никогда', 'Постоянно'),
      scale('foodBalance', 'Баланс белка, овощей, жиров', 'Хаос', 'Осознанно'),
      scale('fastFood', 'Фастфуд и снеки', 'Часто', 'Редко / нет'),
      { type: 'number', key: 'mealsPerDay', label: 'Приёмов пищи в день', min: 1, max: 8, placeholder: 'раз' },
      {
        type: 'choice',
        key: 'cooking',
        label: 'Кто готовит/Источник еды',
        options: [
          { value: 'self', label: 'Готовлю сам(а)' },
          { value: 'mix', label: 'Смешанно / Семья' },
          { value: 'delivery', label: 'Доставка / Кафе' },
        ],
        cols: 3,
      },
    ],
  },
  {
    block: 1,
    id: 'b2-behavior',
    type: 'composite',
    title: 'Пищевое поведение',
    description: 'Оценка эмоциональных триггеров, перекусов и тяги к сладкому.',
    domain: 'nutrition',
    fields: [
      {
        type: 'choice',
        key: 'emotionalEating',
        label: 'Эмоциональное переедание',
        options: [
          { value: 'often', label: 'Часто' },
          { value: 'sometimes', label: 'Иногда' },
          { value: 'rare', label: 'Редко' },
          { value: 'never', label: 'Нет' },
        ],
        cols: 2,
      },
      {
        type: 'choice',
        key: 'snacking',
        label: 'Перекусы',
        options: [
          { value: 'constant', label: 'Постоянно' },
          { value: 'often', label: 'Часто' },
          { value: 'rare', label: 'Редко' },
          { value: 'none', label: 'Нет перекусов' },
          { value: 'planned', label: 'Только запланированные' },
        ],
        cols: 2,
      },
      {
        type: 'choice',
        key: 'sweetCraving',
        label: 'Тяга к сладкому',
        options: [
          { value: 'strong', label: 'Сильная' },
          { value: 'medium', label: 'Умеренная' },
          { value: 'weak', label: 'Слабая' },
          { value: 'control', label: 'Полностью контролирую' },
        ],
        cols: 2,
      },
    ],
  },
  {
    block: 1,
    id: 'b2-stimulants',
    type: 'composite',
    title: 'Стимуляторы',
    description: 'Привычки, влияющие на восстановление, сон и ЦНС.',
    fields: [
      {
        type: 'choice',
        key: 'alcohol',
        label: 'Алкоголь',
        options: [
          { value: 'frequent', label: 'Часто' },
          { value: 'weekend', label: 'По выходным' },
          { value: 'rare', label: 'Редко' },
          { value: 'none', label: 'Не пью' },
        ],
        cols: 2,
      },
      {
        type: 'choice',
        key: 'nicotine',
        label: 'Никотин',
        options: [
          { value: 'yes', label: 'Сигареты' },
          { value: 'vape', label: 'Вейп / Снюс' },
          { value: 'quit', label: 'Бросил(а)' },
          { value: 'no', label: 'Не употребляю' },
        ],
        cols: 2,
      },
      {
        type: 'choice',
        key: 'caffeine',
        label: 'Кофеин / энергетики',
        options: [
          { value: 'heavy', label: 'Много / Энергетики' },
          { value: 'coffee', label: '2–3 чашки в день' },
          { value: 'light', label: '1 чашка в день' },
          { value: 'none', label: 'Редко / Не пью' },
        ],
        cols: 2,
      },
    ],
  },
  {
    block: 1,
    id: 'b2-recovery',
    type: 'composite',
    title: 'Восстановление: сон и энергия',
    description: 'Оценка продолжительности, качества сна и дневной энергии.',
    domain: 'recovery',
    fields: [
      { type: 'number', key: 'sleepHours', label: 'Часов сна', min: 3, max: 12, step: 0.5, placeholder: 'Например, 7-8' },
      scale('wakeEase', 'Качество сна и легкость подъема', 'Тяжело', 'Легко'),
      scale('dayFeel', 'Самочувствие днём', 'Разбит', 'Энергичен'),
    ],
  },
  {
    block: 1,
    id: 'b2-stress',
    type: 'composite',
    title: 'Стресс',
    description: 'Оценка психоэмоциональной нагрузки и условий работы.',
    domain: 'stress',
    fields: [
      scale('stressHome', 'Уровень стресса в быту.', 'Высокий', 'Низкий'),
      scale('stressWork', 'Уровень стресса на работе.', 'Высокий', 'Низкий'),
      {
        type: 'choice',
        key: 'workSchedule',
        label: 'График работы',
        options: [
          { value: 'office', label: 'Офис / 5×2' },
          { value: 'remote', label: 'Удалёнка' },
          { value: 'shift', label: 'Смены' },
          { value: 'irregular', label: 'Ненормированный' },
        ],
        cols: 2,
      },
      {
        type: 'choice',
        key: 'emotionalBreakdowns',
        label: 'Эмоциональные спады',
        options: [
          { value: 'often', label: 'Часто' },
          { value: 'sometimes', label: 'Иногда' },
          { value: 'rare', label: 'Редко' },
          { value: 'never', label: 'Нет' },
        ],
        cols: 2,
      },
    ],
  },
  {
    block: 1,
    id: 'b2-health',
    type: 'composite',
    title: 'Здоровье: общее',
    description: 'Ограничения, особенности организма и безопасность.',
    fields: [
      {
        type: 'choice',
        key: 'bpHeart',
        label: 'Давление / ССС',
        options: [
          { value: 'ok', label: 'В норме' },
          { value: 'issues', label: 'Есть особенности / жалобы' },
          { value: 'unknown', label: 'Не знаю' },
        ],
        cols: 3,
      },
      {
        type: 'choice',
        key: 'gi',
        label: 'ЖКТ',
        options: [
          { value: 'ok', label: 'В норме' },
          { value: 'issues', label: 'Есть жалобы' },
          { value: 'unknown', label: 'Не знаю' },
        ],
        cols: 3,
      },
      {
        type: 'textarea',
        key: 'healthComplaints',
        label: 'Текущие жалобы',
        placeholder: 'Что беспокоит...',
        tags: ['спина', 'колени', 'давление', 'изжога', 'головные боли'],
      },
      {
        type: 'choice',
        key: 'checkup',
        label: 'Чек-ап / врач',
        options: [
          { value: 'recent', label: 'Никогда не сдавал(а)' },
          { value: 'old', label: 'За последние 6 мес.' },
          { value: 'never', label: 'Не было' },
          { value: 'observing', label: 'Наблюдаюсь' },
        ],
        cols: 2,
      },
      {
        type: 'textarea',
        key: 'injuries',
        label: 'Травмы и операции',
        placeholder: 'Если есть...',
        tags: ['колено', 'плечо', 'грыжа', 'перелом', 'операция', 'поясница / шея'],
      },
      {
        type: 'textarea',
        key: 'allergies',
        label: 'Аллергии и непереносимости',
        placeholder: 'Лактоза, глютен...',
      },
    ],
  },
  {
    block: 1,
    id: 'b2-bodymap',
    type: 'multi',
    title: 'Карта тела',
    description: 'Отметь зоны, где бывает боль, напряжение или дискомфорт.',
    key: 'bodyPainZones',
    options: [
      'Шея',
      'Плечи',
      'Локти',
      'Запястья',
      'Верх спины',
      'Поясница',
      'Тазобедренный сустав.',
      'Колени',
      'Голеностоп',
      'Нет болей',
    ],
  },
  {
    block: 1,
    id: 'b2-hormones',
    type: 'hormones',
    title: 'Гормональный фон и тонус',
    description: 'Маркеры восстановления, метаболизма и общего драйва.',
  },
  {
    block: 1,
    id: 'b2-free',
    type: 'textarea',
    title: 'Свободная форма',
    description: 'Заметки тренера под этого клиента.',
    key: 'trainerFreeNotes',
    placeholder: 'Всё, что важно и не вошло в шкалы...',
  },

  // ═══════════════════════════════════════
  // BLOCK 3. Assessment (8)
  // ═══════════════════════════════════════
  {
    block: 2,
    id: 'b3-picture',
    type: 'algo',
    view: 'picture',
    title: 'Твой текущий баланс в цифрах',
    description: 'Оцифрованный профиль: метаболизм, дефициты и точки роста.',
  },
  {
    block: 2,
    id: 'b3-loss',
    type: 'algo',
    view: 'loss',
    title: 'Где утекает результат',
    description: '2-3 самых слабых места. Что сейчас мешает цели.',
  },
  {
    block: 2,
    id: 'b3-realistic',
    type: 'algo',
    view: 'realistic',
    title: 'Реалистичная цель и срок',
    description: 'Безопасная стратегия снижения веса и ориентир по срокам.',
  },
  {
    block: 2,
    id: 'b3-rec-training',
    type: 'algo',
    view: 'rec',
    recKey: 'training',
    title: 'Рекомендации: Тренировки',
    description: 'Персональная стратегия тренировочного процесса на первый месяц.',
  },
  {
    block: 2,
    id: 'b3-rec-nutrition',
    type: 'algo',
    view: 'rec',
    recKey: 'nutrition',
    title: 'Рекомендации: Питание',
    description: 'Персональная стратегия рациона: гибкий подход без голода и срывов.',
  },
  {
    block: 2,
    id: 'b3-rec-activity',
    type: 'algo',
    view: 'rec',
    recKey: 'activity_recovery',
    title: 'Рекомендации: Активность и восстановление',
    description: 'Фоновое жиросжигание, гигиена сна и ресурс нервной системы.',
  },
  {
    block: 2,
    id: 'b3-rec-stress',
    type: 'algo',
    view: 'rec',
    recKey: 'stress_health',
    title: 'Рекомендации: Стресс и здоровье',
    description: 'Персональная адаптация нагрузок, защита суставов и контроль стресса.',
  },
  {
    block: 2,
    id: 'b3-summary',
    type: 'algo',
    view: 'summary',
    recKey: 'summary',
    title: 'Итог месяца',
    description: 'Персональный маршрутный лист трансформации на первые 4 недели.',
  },

  // ═══════════════════════════════════════
  // BLOCK 4. Route (12). живой язык для клиента
  // ═══════════════════════════════════════
  {
    block: 3,
    id: 'b4-frame',
    type: 'frame',
    title: 'Собираем план',
    description:
      'Мы уже поняли, где ты сейчас и что мешает. Дальше разберём, как именно пойдём к цели, шаг за шагом.',
    kicker: 'Блок 4 из 5',
  },
  {
    block: 3,
    id: 'b4-smart-goal',
    type: 'smart_goal',
    title: 'Твоя цель',
    description: 'SMART-цель: конкретная, измеримая, достижимая, значимая, ограниченная по срокам.',
  },
  {
    block: 3,
    id: 'b4-roads',
    type: 'content',
    title: 'Два сценария: куда ты придёшь к лету?',
    description: 'Можно снова одному. Или с системой, где видно прогресс.',
    view: 'roads',
  },
  {
    block: 3,
    id: 'b4-faster',
    type: 'content',
    title: 'Как прийти быстрее',
    description: 'Система ведения: почему с наставником результат достигается гарантированно и без откатов.',
    view: 'faster',
  },
  {
    block: 3,
    id: 'b4-decision',
    type: 'decision',
    title: 'Точка выбора',
    description: 'Два пути: забрать план и попробовать самому или начать с поддержкой.',
  },
  {
    block: 3,
    id: 'b4-step1',
    type: 'content',
    title: 'Шаг 1. Точная настройка под тебя',
    description:
      'Быстрый старт за 5 минут: собираем систему под твое здоровье, график и опыт без шаблонов.',
    view: 'step',
    stepNum: '01',
    hideStepHero: true,
    cards: [
      {
        title: 'Учет здоровья и травм',
        text: 'Фиксируем любые ограничения по спине и суставам, чтобы сделать каждую тренировку на 100% безопасной.',
      },
      {
        title: 'Твой график и локация',
        text: 'Зал или дом, удобное количество дней в неделю. План адаптируется под твою реальную жизнь и работу.',
      },
      {
        title: 'Комфортное питание',
        text: 'Учитываем твои вкусовые привычки и ритм дня без стрессовых ограничений и чувства вины.',
      },
      {
        title: 'Анализ прошлого опыта',
        text: 'Разбираем, что не сработало в прошлые попытки, чтобы исключить старые ошибки и не допустить срыва.',
      },
    ],
    horizontal: false,
  },
  {
    block: 3,
    id: 'b4-step2',
    type: 'content',
    title: 'Шаг 2. Диагностика тела и суставов',
    description:
      'Простой видео-тест дома на телефон: находим скрытые перегрузки и защищаем спину до начала тренировок.',
    view: 'step',
    stepNum: '02',
    hideStepHero: true,
    cards: [
      {
        title: 'Простые тесты на телефон',
        text: '10 минут дома без оборудования: выполняешь базовые движения по готовым видео-инструкциям.',
      },
      {
        title: 'Анализ подвижности',
        text: 'Оцениваем работу спины, таза и суставов, чтобы выявить мышечные зажимы и перекосы.',
      },
      {
        title: 'Личный разбор тренера',
        text: 'В течение 48 часов получаешь подробный отчет с комментариями по твоей биомеханике.',
      },
      {
        title: 'Безопасный список упражнений',
        text: 'Четко фиксируем, какие движения включаем в план, а какие временно исключаем ради безопасности.',
      },
    ],
  },
  {
    block: 3,
    id: 'b4-step3',
    type: 'content',
    title: 'Шаг 3. Тренировочная стратегия на полгода',
    description:
      'Пошаговая система циклов: четко понимаем, что делаем сегодня, через 4 недели и на пути к цели.',
    view: 'step',
    stepNum: '03',
    hideStepHero: true,
    cards: [
      {
        title: 'Маршрут на 6 месяцев',
        text: 'Не разовая тренировка, а стратегический план движения к целевой форме и самочувствию к лету.',
      },
      {
        title: 'Смена циклов и защита от плато',
        text: 'Блоки по 4–6 недель с обновлением фокуса: тело прогрессирует непрерывно и без застоя.',
      },
      {
        title: 'Понедельная оцифровка',
        text: 'В приложении расписан каждый день: точный набор упражнений, подходы, рабочий вес и тайминги.',
      },
      {
        title: 'Готовность за 48 часов',
        text: 'Сразу после диагностики формируем твой персональный стартовый мезоцикл для быстрого запуска.',
      },
    ],
  },
  {
    block: 3,
    id: 'b4-step4',
    type: 'content',
    title: 'Шаг 4. Еженедельная калибровка и разбор',
    description:
      'Анализируем цифры и самочувствие каждые 7 дней: план гибко обновляется и не дает весу встать.',
    view: 'step',
    stepNum: '04',
    hideStepHero: true,
    cards: [
      {
        title: 'Анализ нагрузки',
        text: 'Фиксируем рабочие веса, количество подходов и повторений прямо в дневнике приложения.',
      },
      {
        title: 'Контроль утомления',
        text: 'Оцениваем уровень сил и самочувствие после тренировок, исключая перетренированность и спад.',
      },
      {
        title: 'Динамика тела',
        text: 'Отслеживаем график веса и объемы тела, наглядно фиксируя уход сантиметров в талии.',
      },
      {
        title: 'Адаптация на следующую неделю',
        text: 'Корректируем упражнения и интенсивность на основе фактического прогресса за неделю.',
      },
    ],
  },
  {
    block: 3,
    id: 'b4-diary',
    type: 'content',
    title: 'Дневник тренировок в кармане',
    description:
      'Минимум кликов в зале: фиксируешь веса за 5 секунд, получаешь видеоразборы техники и умные подсказки.',
    view: 'step',
    stepNum: '05',
    hideStepHero: true,
    cards: [
      {
        title: 'Фиксация подходов за 5 секунд',
        text: 'Вбиваешь вес и повторы в два клика. Вся история прогрессии сохраняется автоматически.',
      },
      {
        title: 'Видеоразбор твоей техники',
        text: 'Загружаешь видео подхода прямо в карточку упражнения и получаешь комментарии тренера по углам и траектории.',
      },
      {
        title: 'Мгновенная замена упражнений',
        text: 'Тренажер занят или движение не подходит суставам. Система в один тап подбирает равноценный аналог.',
      },
      {
        title: 'Встроенный таймер и шкала нагрузки',
        text: 'Приложение контролирует интервалы отдыха и фиксирует запас сил (RIR), защищая от недогруза и переутомления.',
      },
    ],
  },
  {
    block: 3,
    id: 'b4-proof',
    type: 'content',
    title: 'Наглядная аналитика твоего результата',
    description:
      'Вся динамика трансформации в одном месте: графики веса, объемы тела, история тренировок и личный чат.',
    view: 'step',
    stepNum: '06',
    hideStepHero: true,
    cards: [
      {
        title: 'Трансформация тела',
        text: 'Графики веса, ключевые замеры и фотопрогресс: наглядно видим, как уходит жировая ткань и меняется силуэт.',
      },
      {
        title: 'Сила и выносливость',
        text: 'Автоматический подсчет тоннажа и рабочих весов: отслеживаем рост силовых показателей и тонуса мышц.',
      },
      {
        title: 'Календарь дисциплины',
        text: 'Удобный трекер тренировочного ритма: помогает сохранять регулярность и стабильный темп без пропусков.',
      },
      {
        title: 'Прямая связь с тренером',
        text: 'Личный чат в приложении для быстрой поддержки: оперативные ответы на любые вопросы по тренировкам и питанию.',
      },
    ],
  },
  {
    block: 3,
    id: 'b4-cabinet',
    type: 'content',
    title: 'Всё в одном кабинете',
    description:
      'Программа, дневник, фото, цифры и чат. Один вход, без хаоса в мессенджерах и потери файлов.',
    view: 'bento',
    cards: [
      {
        title: 'Программа и дневник',
        text: 'Твой план тренировок и рабочий дневник всегда под рукой во время занятия.',
      },
      {
        title: 'Аналитика и замеры',
        text: 'Наглядные графики веса, объемы и фото-прогресс в единой панели без сторонних таблиц.',
      },
      {
        title: 'Связь с тренером',
        text: 'Встроенный чат для вопросов и корректировок. Никакого спама и потери сообщений в WhatsApp.',
      },
      {
        title: 'Еженедельные обновления',
        text: 'Новые версии программы и рекомендации загружаются прямо в твой профиль каждую неделю.',
      },
    ],
  },
  {
    block: 3,
    id: 'b4-objections',
    type: 'content',
    title: 'Частые сомнения',
    description: 'Честно разбираем то, что обычно крутится в голове перед стартом.',
    view: 'objections',
  },

  // ═══════════════════════════════════════
  // BLOCK 5. Tariffs (9)
  // ═══════════════════════════════════════
  {
    block: 4,
    id: 'b5-frame',
    type: 'frame',
    title: 'Выбираем формат',
    description: 'Система понятна. Осталось выбрать срок работы и как стартовать.',
    kicker: 'Блок 5 из 5',
  },
  {
    block: 4,
    id: 'b5-includes',
    type: 'content',
    title: 'Что входит в любой тариф',
    description: 'База одна: кабинет, программа, правки и поддержка.',
    view: 'bento',
    cards: [
      {
        title: 'Персональная программа и софт',
        text: 'Доступ к приложению со всеми тренировками. План собирается под твои цели, без шаблонов из сети.',
      },
      {
        title: 'Видеоконтроль и калибровка',
        text: 'Разбор техники по видео, защита суставов от перегрузок и регулярные обновления программы каждую неделю.',
      },
      {
        title: 'Личная поддержка и аналитика',
        text: 'Прямой чат с тренером, ответы на вопросы, графики динамики веса и наглядные замеры прогресса.',
      },
      {
        title: '5 дней тест-драйва и гарантия',
        text: 'Тестируешь формат на практике. Если поймешь, что система тебе не подходит, вернем 100% оплаты.',
      },
    ],
  },
  {
    block: 4,
    id: 'b5-anchor',
    type: 'tariff',
    view: 'anchor',
    title: 'Форматы сопровождения',
    description: 'Выбирай срок работы в зависимости от того, насколько глубокая трансформация тебе нужна.',
  },
  {
    block: 4,
    id: 'b5-stream',
    type: 'tariff',
    view: 'stream',
    title: 'Спецусловия после разбора: −25%',
  },
  {
    block: 4,
    id: 'b5-nutrition',
    type: 'tariff',
    view: 'nutrition',
    title: 'Ведение по питанию',
    description:
      'Точный расчет калорийности и рациона под твою цель без голодовок и жестких ограничений.',
  },
  {
    block: 4,
    id: 'b5-guarantee',
    type: 'content',
    title: '5 дней тест-драйва',
    description:
      'Полный возврат средств без скрытых условий и лишних вопросов, если формат тебе не подойдет.',
    view: 'guarantee',
  },
  {
    block: 4,
    id: 'b5-pay',
    type: 'content',
    title: 'Как стартовать сегодня',
    description: 'Четыре простых шага от бронирования условий до первой тренировки.',
    view: 'pay',
  },
  {
    block: 4,
    id: 'b5-later',
    type: 'crm_close',
    title: 'Твой план готов',
    description:
      'Забирай оцифрованный маршрут к своей цели в PDF в любом случае. Никакого давления.',
  },
]

export function totalSlides() {
  return SLIDES.length
}

export function slidesInBlock(blockIndex) {
  return SLIDES.filter((s) => s.block === blockIndex)
}

export function globalIndex(blockIndex, slideInBlock) {
  let i = 0
  for (let b = 0; b < blockIndex; b++) {
    i += slidesInBlock(b).length
  }
  return i + slideInBlock
}

export function parseGlobalIndex(g) {
  let left = g
  for (let b = 0; b < BLOCKS.length; b++) {
    const n = slidesInBlock(b).length
    if (left < n) return { blockIndex: b, slideIndex: left }
    left -= n
  }
  return { blockIndex: BLOCKS.length - 1, slideIndex: slidesInBlock(BLOCKS.length - 1).length - 1 }
}
