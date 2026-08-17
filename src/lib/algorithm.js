/**
 * MetaSystem recommendation engine
 * BMR Mifflin-St Jeor, domain scoring, flags, text generation
 */

export function calcBMI(weightKg, heightCm) {
  if (!weightKg || !heightCm) return null
  const h = heightCm / 100
  return Math.round((weightKg / (h * h)) * 10) / 10
}

export function bmiCategory(bmi) {
  if (bmi == null) return null
  if (bmi < 18.5) return { key: 'underweight', label: 'Недовес', level: 0 }
  if (bmi < 25) return { key: 'normal', label: 'Норма', level: 1 }
  if (bmi < 30) return { key: 'overweight', label: 'Избыток', level: 2 }
  if (bmi < 35) return { key: 'obesity1', label: 'Ожирение 1', level: 3 }
  if (bmi < 40) return { key: 'obesity2', label: 'Ожирение 2', level: 4 }
  return { key: 'obesity3', label: 'Ожирение 3', level: 5 }
}

export function calcBMR({ weight, height, age, sex }) {
  if (!weight || !height || !age) return null
  const base = 10 * weight + 6.25 * height - 5 * age
  return Math.round(sex === 'female' ? base - 161 : base + 5)
}

/** Activity factor from domain score + sedentary hours */
export function activityFactor(activityScore, hoursSitting) {
  if (activityScore == null) return 1.45
  if (activityScore <= 2 || (hoursSitting != null && hoursSitting >= 9)) return 1.35
  if (activityScore <= 3) return 1.45
  if (activityScore <= 4) return 1.55
  return 1.65
}

export function domainLevel(score) {
  // use `level` not `key`. otherwise spread overwrites domain id (activity → low)
  if (score == null) return { level: 'unknown', label: '—', color: 'yellow' }
  if (score <= 2.4) return { level: 'low', label: 'Критическая зона', color: 'red' }
  if (score <= 3.7) return { level: 'mid', label: 'Умеренно', color: 'yellow' }
  return { level: 'high', label: 'Сильный', color: 'green' }
}

function avg(nums) {
  const valid = nums.filter((n) => typeof n === 'number' && !Number.isNaN(n))
  if (!valid.length) return null
  return Math.round((valid.reduce((a, b) => a + b, 0) / valid.length) * 10) / 10
}

/** Map training system quality to score contribution */
function systemScore(answers) {
  const map = {
    none: 1,
    own: 2.5,
    internet: 2.5,
    coach: 4,
  }
  const base = map[answers.trainingSystem] ?? 2.5
  const formatMap = { chaos: 1.5, functional: 3, split: 3.5, fullbody: 3.5, other: 2.5 }
  const format = formatMap[answers.trainingFormat] ?? 2.5
  const ageMap = { never: 1, year: 2, '6m': 3, '2m': 4, month: 4.5 }
  const progAge = ageMap[answers.programAge] ?? 2.5
  return avg([base, format, progAge])
}

function nutritionBehaviorScore(answers) {
  const binge = { often: 1.5, sometimes: 2.5, rare: 4, never: 5 }
  const snacks = { constant: 1.5, often: 2.5, rare: 4, planned: 4.5 }
  const sweet = { strong: 1.5, medium: 2.5, weak: 4, control: 4.5 }
  return avg([
    binge[answers.emotionalEating] ?? 3,
    snacks[answers.snacking] ?? 3,
    sweet[answers.sweetCraving] ?? 3,
  ])
}

/**
 * Compute 5 domain scores from block 2 answers
 */
export function computeDomainScores(answers = {}) {
  const activity = avg([
    answers.dailyActivity,
    answers.sportsPrep,
    answers.stairsBreath, // inverted later if needed. higher = better in UI
    answers.morningCharge,
    answers.hoursSitting != null ? Math.max(1, 6 - Math.min(5, Math.ceil((answers.hoursSitting || 0) / 2))) : null,
  ])

  const training = avg([
    systemScore(answers),
    answers.progression,
    answers.warmup,
    answers.techniqueVideo,
    answers.rpeAwareness,
  ])

  const nutrition = avg([
    answers.kbjuTracking,
    answers.foodBalance,
    answers.fastFood,
    answers.mealsPerDay != null ? Math.min(5, Math.max(1, answers.mealsPerDay)) : null,
    answers.cooking === 'self' ? 4 : answers.cooking === 'mix' ? 3 : answers.cooking === 'delivery' ? 2 : null,
    nutritionBehaviorScore(answers),
  ])

  const recovery = avg([
    answers.sleepHours != null
      ? answers.sleepHours >= 8
        ? 5
        : answers.sleepHours >= 7
          ? 4
          : answers.sleepHours >= 6
            ? 2.5
            : 1.5
      : null,
    answers.wakeEase,
    answers.dayFeel,
  ])

  const stress = avg([
    answers.stressHome,
    answers.stressWork,
    answers.workSchedule === 'shift' || answers.workSchedule === 'irregular'
      ? 2
      : answers.workSchedule === 'office'
        ? 3.5
        : 4,
    answers.emotionalBreakdowns === 'often'
      ? 1.5
      : answers.emotionalBreakdowns === 'sometimes'
        ? 2.5
        : answers.emotionalBreakdowns === 'rare'
          ? 4
          : 4.5,
  ])

  return {
    activity: activity ?? 3,
    training: training ?? 3,
    nutrition: nutrition ?? 3,
    recovery: recovery ?? 3,
    stress: stress ?? 3,
  }
}

export function getStrategy(goal, bmi) {
  if (goal === 'mass' && bmi != null && bmi >= 27) return 'recomp'
  if (goal === 'lose' || goal === 'definition') {
    if (bmi != null && bmi >= 30) return 'deficit_hard'
    if (bmi != null && bmi >= 25) return 'deficit_soft'
    return 'deficit_light'
  }
  if (goal === 'mass') return 'surplus'
  if (goal === 'strength') return 'maintain_or_surplus'
  if (goal === 'health' || goal === 'maintain') return 'maintain'
  return 'maintain'
}

export function strategyLabel(s) {
  const map = {
    deficit_hard: 'сначала снижаем жир (минус 15-20% от расхода)',
    deficit_soft: 'мягко снижаем вес (минус 10-15% от расхода)',
    deficit_light: 'лёгкая сушка: чуть ниже поддержания',
    surplus: 'набор: едим чуть выше расхода',
    recomp: 'сначала подтянуть состав тела, потом набор',
    maintain_or_surplus: 'держать вес или чуть выше для силы',
    maintain: 'держать текущий вес',
  }
  return map[s] || s
}

function deficitPct(strategy) {
  switch (strategy) {
    case 'deficit_hard':
      return { min: 0.15, max: 0.2 }
    case 'deficit_soft':
      return { min: 0.1, max: 0.15 }
    case 'deficit_light':
    case 'recomp':
      return { min: 0.05, max: 0.1 }
    case 'surplus':
      return { min: -0.1, max: -0.05 } // negative = surplus
    case 'maintain_or_surplus':
      return { min: -0.05, max: 0 }
    default:
      return { min: 0, max: 0 }
  }
}

export function targetCalories(tdee, strategy) {
  if (!tdee) return null
  const { min, max } = deficitPct(strategy)
  // deficit: kcal = tdee * (1 - pct); surplus: tdee * (1 + pct) where pct stored negative
  const low = Math.round(tdee * (1 - max))
  const high = Math.round(tdee * (1 - min))
  return {
    low: Math.min(low, high),
    high: Math.max(low, high),
    mid: Math.round((low + high) / 2),
  }
}

export function macros({ weight, targetWeight, strategy, kcal }) {
  const w = weight || 70
  const tw = targetWeight || w
  let proteinPerKg
  if (strategy?.startsWith('deficit') || strategy === 'recomp') {
    proteinPerKg = { min: 1.8, max: 2.2 }
  } else if (strategy === 'surplus' || strategy === 'maintain_or_surplus') {
    proteinPerKg = { min: 1.6, max: 2.2 }
  } else {
    proteinPerKg = { min: 1.6, max: 1.6 }
  }

  const baseKg = strategy?.startsWith('deficit') || strategy === 'recomp' ? tw : w
  const proteinMin = Math.round(proteinPerKg.min * baseKg)
  const proteinMax = Math.round(proteinPerKg.max * baseKg)
  const protein = Math.round((proteinMin + proteinMax) / 2)

  const fatMin = Math.round(0.8 * w)
  const fatMax = Math.round(1.0 * w)
  const fat = Math.round((fatMin + fatMax) / 2)

  const proteinKcal = protein * 4
  const fatKcal = fat * 9
  const carbsKcal = Math.max(0, (kcal || 2000) - proteinKcal - fatKcal)
  const carbs = Math.round(carbsKcal / 4)

  return {
    protein,
    proteinMin,
    proteinMax,
    fat,
    fatMin,
    fatMax,
    carbs,
  }
}

export function stepsTarget(currentSteps) {
  if (currentSteps == null || currentSteps < 5000) return { label: '7-8 тыс', low: 7000, high: 8000 }
  if (currentSteps < 8000) return { label: '8-10 тыс', low: 8000, high: 10000 }
  return { label: '10+ тыс', low: 10000, high: 12000 }
}

export function sleepTarget(hours) {
  if (hours == null || hours < 6) return { label: '7 ч', value: 7 }
  if (hours < 7) return { label: '7-8 ч', value: 7.5 }
  return { label: '7-8 ч (держать)', value: 8 }
}

export function realisticWeeks(weight, targetWeight) {
  if (!weight || !targetWeight) return null
  const diff = Math.abs(weight - targetWeight)
  if (diff < 0.5) return 0
  const pace = 0.0075 * weight // 0.75% bodyweight / week
  return Math.ceil(diff / pace)
}

export function weeksToMonths(weeks) {
  if (weeks == null) return null
  if (weeks <= 4) return 1
  return Math.ceil(weeks / 4.3)
}

export function collectFlags(lead, answers, domains) {
  const flags = []
  const bodyPain = (answers.bodyPainZones || []).filter((z) => z && z !== 'Нет болей')
  if (bodyPain.length) {
    flags.push({
      key: 'pain',
      label: 'Боли по карте тела',
      text: 'Скрининг ОДА в онбординге, заменить или исключить болезненные движения.',
      tip: `Зоны: ${bodyPain.join(', ')}. В онбординге сделаем скрининг опорно-двигательного аппарата: болезненные паттерны убираем или заменяем, нагрузку вводим постепенно. Это снижает риск срыва программы из-за боли.`,
    })
  }
  if (answers.bpHeart === 'high' || answers.bpHeart === 'issues') {
    flags.push({
      key: 'bp',
      label: 'Давление / ССС',
      text: 'Умеренная интенсивность, показаться врачу, без резких максимумов.',
      tip: 'При жалобах на давление и ССС не гонимся за отказом и пиковыми весами. Интенсивность умеренная, разминка длиннее, при сомнениях нужен допуск врача. Цель: прогресс без риска для здоровья.',
    })
  }
  if (answers.injuries && String(answers.injuries).trim()) {
    flags.push({
      key: 'injury',
      label: 'Травмы',
      text: 'Адаптация упражнений, аккуратный вход в нагрузку.',
      tip: `Учтено: ${String(answers.injuries).slice(0, 120)}. Программа строится вокруг ограничений: безопасные варианты движений, контроль техники, без работы через боль.`,
    })
  }
  if (lead.sex === 'male' && Number(lead.age) >= 35) {
    flags.push({
      key: 'age35',
      label: 'Мужчины 35+',
      text: 'Акцент на сон, белок и восстановление, гормональный контекст.',
      tip: 'После 35 сильнее влияют сон, белок и восстановление на состав тела и гормональный фон. Не разгоняем объём в ущерб сну: сначала режим и белок, потом надбавки в зале.',
    })
  }
  if (domains.stress <= 2.4 && domains.recovery <= 2.4) {
    flags.push({
      key: 'stress_recovery',
      label: 'Стресс + низкое восстановление',
      text: 'Приоритет восстановлению, потолок на объём тренировок.',
      tip: 'Связка высокий стресс + слабое восстановление: лишний объём только углубит яму. Ставим потолок на объём и интенсивность, сначала сон и разгрузка, прогрессия по самочувствию.',
    })
  }
  if (answers.emotionalEating === 'often' || answers.emotionalEating === 'sometimes' || answers.sweetCraving === 'strong') {
    flags.push({
      key: 'emotional_eating',
      label: 'Эмоциональное переедание / сладкое',
      text: 'Мягкая стратегия, плановые окна, работа с триггерами.',
      tip: 'Жёсткие запреты обычно усиливают срывы. Работаем мягко: структура приёмов, белок и клетчатка для сытости, одно плановое окно под сладкое, разбор триггеров (стресс, вечер, скука).',
    })
  }
  if (answers.alcohol === 'frequent' || answers.nicotine === 'yes' || answers.nicotine === 'vape') {
    flags.push({
      key: 'stimulants',
      label: 'Алкоголь / никотин',
      text: 'Влияние на восстановление, сон и аппетит.',
      tip: 'Алкоголь и никотин бьют по сну, восстановлению и контролю аппетита. Учитываем в плане: дни после алкоголя нагрузка легче, сон в приоритете, без попытки нагнать объём.',
    })
  }
  if (
    lead.sex === 'female' &&
    (answers.femaleContext === 'cycle' ||
      answers.femaleContext === 'bf' ||
      answers.femaleContext === 'thyroid' ||
      answers.femaleContext === 'pregnant')
  ) {
    flags.push({
      key: 'female',
      label: 'Женский контекст',
      text: 'Поправка на самочувствие и темп, без агрессивного дефицита.',
      tip: 'Цикл, щитовидка, беременность или ГВ меняют самочувствие и темп. Без агрессивного дефицита: калории и нагрузка под фактическое состояние, гибкие недели вместо жёсткого графика.',
    })
  }
  return flags
}

function trainingFreq(goal, strategy) {
  if (goal === 'strength') return '3-4'
  if (strategy === 'surplus') return '3-4'
  return '3'
}

/**
 * Full algorithm run for a lead
 */
export function runAlgorithm(lead) {
  const a = lead.answers || {}
  const weight = Number(lead.weight) || Number(a.weight)
  const height = Number(lead.height) || Number(a.height)
  const age = Number(lead.age) || Number(a.age)
  const sex = lead.sex || a.sex || 'male'
  const goal = a.mainGoal || 'health'
  const targetWeight = Number(a.targetWeight) || null
  const claimedWeeks = a.deadlineWeeks ? Number(a.deadlineWeeks) : a.deadlineMonths ? Number(a.deadlineMonths) * 4.3 : null

  const bmi = calcBMI(weight, height)
  const bmiCat = bmiCategory(bmi)
  const domains = computeDomainScores(a)
  const domainDetails = Object.fromEntries(
    Object.entries(domains).map(([k, v]) => {
      const lvl = domainLevel(v)
      return [k, { score: v, level: lvl.level, label: lvl.label, color: lvl.color }]
    })
  )

  const factor = activityFactor(domains.activity, a.hoursSitting)
  const bmr = calcBMR({ weight, height, age, sex })
  const tdee = bmr ? Math.round(bmr * factor) : null
  const strategy = getStrategy(goal, bmi)
  const calories = targetCalories(tdee, strategy)
  const macro = macros({ weight, targetWeight, strategy, kcal: calories?.mid })
  const steps = stepsTarget(a.dailySteps)
  const sleep = sleepTarget(a.sleepHours)
  const realWeeks = realisticWeeks(weight, targetWeight)
  const realMonths = weeksToMonths(realWeeks)
  const expectationsHigh =
    claimedWeeks != null && realWeeks != null && claimedWeeks < realWeeks * 0.75 && Math.abs((weight || 0) - (targetWeight || 0)) > 2

  // Prioritize 2-3 weakest domains
  const ranked = Object.entries(domains)
    .map(([key, score]) => {
      const lvl = domainLevel(score)
      return { key, score, level: lvl.level, label: lvl.label, color: lvl.color }
    })
    .sort((x, y) => x.score - y.score)
  const focus = ranked.slice(0, 3).filter((d) => d.score <= 3.7)
  const focusKeys = (focus.length ? focus : ranked.slice(0, 2)).map((d) => d.key)

  const flags = collectFlags({ ...lead, sex, age }, a, domains)
  const freq = trainingFreq(goal, strategy)

  const goalLabels = {
    lose: 'похудеть',
    definition: 'рельеф',
    mass: 'набрать массу',
    strength: 'стать сильнее',
    health: 'здоровье и энергия',
    maintain: 'удержать форму',
  }

  const ctx = {
    goal: goalLabels[goal] || goal,
    strategy: strategyLabel(strategy),
    strategyKey: strategy,
    kcal: calories ? `${calories.low}-${calories.high}` : '—',
    kcalMid: calories?.mid,
    protein: macro?.protein,
    proteinRange: macro ? `${macro.proteinMin}-${macro.proteinMax}` : '—',
    fat: macro?.fat,
    fatRange: macro ? `${macro.fatMin}-${macro.fatMax}` : '—',
    carbs: macro?.carbs,
    steps: steps.label,
    sleep: sleep.label,
    freq,
    name: lead.name || a.name || 'Клиент',
    weight,
    targetWeight,
    bmi,
    bmiLabel: bmiCat?.label,
    realWeeks,
    realMonths,
    expectationsHigh,
    domains: domainDetails,
    ranked,
    focusKeys,
    flags,
    bmr,
    tdee,
    factor,
  }

  const recommendations = buildRecommendations(ctx, a)

  return {
    ...ctx,
    recommendations,
    generatedAt: new Date().toISOString(),
  }
}

function buildRecommendations(ctx, answers) {
  /**
   * Expert, speakable, number-heavy. Each line: action + number + short why.
   * No fluff, no quote-metaphors, no long dashes.
   */
  const recs = {
    training: '',
    nutrition: '',
    activity_recovery: '',
    stress_health: '',
    summary: '',
  }

  const focus = new Set(ctx.focusKeys || [])
  const has = (k) => focus.has(k)
  const flag = (k) => ctx.flags?.some((f) => f.key === k)
  const tScore = ctx.domains?.training?.score ?? 3
  const nScore = ctx.domains?.nutrition?.score ?? 3
  const aScore = ctx.domains?.activity?.score ?? 3
  const rScore = ctx.domains?.recovery?.score ?? 3
  const sScore = ctx.domains?.stress?.score ?? 3
  const sleepH = answers.sleepHours
  const sitting = answers.hoursSitting
  const meals = answers.mealsPerDay != null ? Number(answers.mealsPerDay) : 3
  const proteinPerMeal =
    ctx.protein && meals > 0 ? Math.round(ctx.protein / Math.min(Math.max(meals, 3), 5)) : null
  const zones = (answers.priorityZones || []).slice(0, 3).join(', ')
  const pain = (answers.bodyPainZones || []).filter((z) => z && z !== 'Нет болей')

  // ── Training ──
  const train = []
  train.push(
    `Первый месяц: силовые ${ctx.freq} раза в неделю, не больше и не меньше. Этого хватает, чтобы задать прогрессию и не убить восстановление.`
  )
  if (tScore <= 2.4 || has('training')) {
    train.push(
      'Формат: одна и та же схема на 4 недели. Три опоры: жимовое, тяговое, присед или жим ногами. Остальное только как дополнение, не как хаос из 12 упражнений.'
    )
    train.push(
      'Правило прогрессии: каждую неделю на одном базовом движении +2.5 кг или +1 повтор при той же технике. Если две недели подряд веса не растут, режем подходы, а не добавляем новые упражнения.'
    )
    train.push(
      'Дневник обязателен. Пишешь вес и повторы после подхода. Без цифр мы не можем править программу, только гадать.'
    )
  } else {
    train.push(
      'Схема уже есть. Задача месяца: жёсткая прогрессия и один микроцикл на 4 недели. Не меняй программу каждую неделю.'
    )
    train.push(
      'Шаг нагрузки: +2.5 кг или +1 повтор раз в 7 дней на 1-2 главных движениях. Видео техники: одно базовое движение, раз в неделю.'
    )
  }
  if (ctx.strategyKey?.startsWith('deficit') || ctx.strategyKey === 'recomp') {
    train.push(
      'Кардио не вместо зала. Силовые держат мышцы при дефиците. Кардио только как фон для шагов, если вообще нужно.'
    )
  }
  if (ctx.strategyKey === 'surplus' || ctx.goal === 'стать сильнее') {
    train.push(
      'Приоритет: рабочие веса в базе. Объём второстепенен. Лучше 4 тяжёлых подхода с запасом 1-2 повтора, чем 8 лёгких до отказа.'
    )
  }
  if (flag('pain') || pain.length) {
    train.push(
      `Зоны дискомфорта: ${pain.length ? pain.join(', ') : 'есть по карте тела'}. В онбординге заменим или упростим эти паттерны. Боль на тренировке не терпим.`
    )
  }
  if (flag('bp')) {
    train.push(
      'Давление или жалобы по сердцу: без максимумов и без резких пиков. Интенсивность средняя, разминка длиннее. При сомнениях сначала врач.'
    )
  }
  if (flag('stress_recovery')) {
    train.push(
      'Стресс высокий и сон слабый: потолок объёма. Не добавляем тренировки. Сначала стабилизируем восстановление, потом наращиваем.'
    )
  }
  if (zones) {
    train.push(`Приоритет зон: ${zones}. В программе акцент на эти мышцы, без распыления на всё тело сразу.`)
  }
  recs.training = train.join('\n\n')

  // ── Nutrition ──
  const nut = []
  nut.push(
    `Калории на месяц: ${ctx.kcal} ккал в день. Это расчёт под цель (${ctx.goal}) и твой расход ~${ctx.tdee ?? '—'} ккал (TDEE).`
  )
  nut.push(
    `Белок: ${ctx.protein} г в день (коридор ${ctx.proteinRange} г). Жиры: ${ctx.fat} г. Углеводы: ${ctx.carbs} г. Остаток калорий.`
  )
  if (proteinPerMeal) {
    nut.push(
      `Практика: ${Math.min(Math.max(meals, 3), 4)} приёма пищи. Ориентир ~${proteinPerMeal} г белка на приём. Так проще добрать норму, чем одним ужином.`
    )
  }
  if (nScore <= 2.4 || has('nutrition')) {
    nut.push(
      'Первые 14 дней не гонись за точностью до грамма. Цель: 3-4 приёма, белок в каждом, без хаотичных перекусов. Потом уже точность.'
    )
    nut.push(
      'Один системный минус на месяц: либо фастфуд не чаще 1 раза в неделю, либо убрать сладкие напитки. Не оба сразу, если привычка сильная.'
    )
  } else {
    nut.push(
      'Структура уже не нулевая. Дожимаем белок до нормы и убираем один слабый паттерн (часто жидкие калории или поздние перекусы).'
    )
  }
  if (flag('emotional_eating') || answers.sweetCraving === 'strong' || answers.emotionalEating === 'often') {
    nut.push(
      'Сладкое и срывы: без жёсткого запрета. Одно плановое окно 2-3 раза в неделю. Белок и овощи до сладкого. Запрет обычно усиливает откат.'
    )
  }
  if (flag('female')) {
    nut.push(
      'Учитываем самочувствие по циклу или нагрузке. Агрессивный дефицит не ставим. Темп можно снижать в тяжёлые дни.'
    )
  }
  if (ctx.strategyKey === 'recomp') {
    nut.push(
      'Сейчас не чистый набор. Сначала состав тела: белок высокий, калории около поддержания. Набор позже, когда жир не мешает.'
    )
  }
  if (ctx.strategyKey?.startsWith('deficit')) {
    nut.push(
      'Дефицит умеренный. Резкая резка калорий даёт срыв и потерю мышц. Если вес стоит 10-14 дней при дисциплине, режем 100-150 ккал, не 500.'
    )
  }
  recs.nutrition = nut.join('\n\n')

  // ── Activity + recovery ──
  const ar = []
  const curSteps = answers.dailySteps
  if (aScore <= 3.7 || has('activity') || (sitting != null && sitting >= 8)) {
    ar.push(
      `Шаги: цель ${ctx.steps} в день. ${
        curSteps != null
          ? `Сейчас примерно ${curSteps}. Плюс 1500-2000 к текущим, потом +1000 раз в неделю, пока не выйдем на цель.`
          : 'Если не считаешь, начни с 7000 и держи 5 дней из 7.'
      }`
    )
    if (sitting != null && sitting >= 8) {
      ar.push(
        `Сидишь около ${sitting} ч. Раз в 50-60 минут вставать на 2-3 минуты. Две короткие прогулки по 10-15 минут (после еды или вечером).`
      )
    } else {
      ar.push('Закрепи одну привычку: лестница вместо лифта или прогулка 15 минут после ужина. Каждый день.')
    }
  } else {
    ar.push(`Активность в порядке. Держи ${ctx.steps} шагов. Не разменивай это на лишний час в зале.`)
  }
  if (ctx.strategyKey?.startsWith('deficit')) {
    ar.push(
      'При снижении жира шаги часто дают больше, чем ещё одна тренировка. Они дешевле по восстановлению.'
    )
  }
  if (rScore <= 3.7 || has('recovery') || (sleepH != null && sleepH < 7)) {
    ar.push(
      `Сон: цель ${ctx.sleep}. ${
        sleepH != null ? `Сейчас ${sleepH} ч.` : ''
      } Фиксируем время отбоя (±30 мин). Это не «пожелание», а условие прогресса.`
    )
    if (sleepH != null && sleepH < 6) {
      ar.push(
        'Меньше 6 часов сна: восстановление сейчас тормоз номер один. Пока сон не 7+, не увеличиваем объём тренировок.'
      )
    } else {
      ar.push(
        'Экран за 60 минут до сна убрать. Кофеин не позже чем за 8 часов до сна. Один день в неделю легче по залу, если накопилась усталость.'
      )
    }
  } else {
    ar.push(`Сон держать ${ctx.sleep}. Не жертвуй сном ради шестой тренировки.`)
  }
  if (flag('age35')) {
    ar.push(
      'После 35 сон, белок и восстановление влияют на состав тела сильнее, чем «ещё один подход». Это не возраст как приговор, а приоритеты.'
    )
  }
  if (flag('stimulants')) {
    ar.push(
      'Алкоголь и никотин бьют по сну и аппетиту. Дни после алкоголя: тренировка легче или отдых. Не пытайся «нагнать» объём на следующий день.'
    )
  }
  recs.activity_recovery = ar.join('\n\n')

  // ── Stress + health ──
  const sh = []
  if (sScore <= 2.4 || has('stress')) {
    sh.push(
      'На фоне высокого стресса не наращиваем объём и не ставим личные рекорды. Сначала стабильность, потом интенсивность.'
    )
    sh.push(
      'Каждый день 10 минут разгрузки без телефона: ходьба или дыхание 4-6 циклов. Мало, но каждый день.'
    )
    sh.push(
      'Если срыв по еде, смотри день: сон, дедлайн, конфликт. Связь «стресс → срыв» важнее, чем сила воли после факта.'
    )
  } else if (sScore <= 3.7) {
    sh.push(
      'Стресс средний. В тяжёлые рабочие недели режем 1-2 подхода с конца, не пропускаем тренировку целиком.'
    )
  } else {
    sh.push(
      'Стресс в зелёной зоне. Держим план. Следим, чтобы сон и нагрузка не разъехались в конце месяца.'
    )
  }
  if (answers.workSchedule === 'shift' || answers.workSchedule === 'irregular') {
    sh.push(
      'График сменный или рваный: приёмы пищи и отбой привязываем к смене, не к «идеальным 8:00». Иначе срывы системные.'
    )
  }
  if (flag('pain') || pain.length) {
    sh.push(
      `Ограничения по телу: ${pain.length ? pain.join(', ') : 'есть'}. Перед полной нагрузкой: скрининг и замены. Это экономит месяцы.`
    )
  }
  if (flag('bp')) {
    sh.push(ctx.flags.find((f) => f.key === 'bp')?.text || 'Давление: умеренная интенсивность, при сомнениях врач.')
  }
  if (flag('injury') && answers.injuries) {
    sh.push(`Травмы и операции: ${String(answers.injuries).slice(0, 100)}. Вход в нагрузку плавный, без героизма.`)
  }
  if (flag('female')) {
    sh.push('Темп и самочувствие важнее жёсткого календаря. В тяжёлые дни объём можно снизить без вины.')
  }
  recs.stress_health = sh.join('\n\n')

  // ── Summary (what trainer says in 40 seconds) ──
  const focusNames = {
    activity: 'активность',
    training: 'тренировки',
    nutrition: 'питание',
    recovery: 'восстановление',
    stress: 'стресс',
  }
  const focusList = (ctx.focusKeys || []).map((k) => focusNames[k] || k).join(', ')
  const sum = []
  sum.push(
    `${ctx.name || 'Клиент'}. Цель: ${ctx.goal}. Сейчас ${ctx.weight ?? '—'} кг, ИМТ ${ctx.bmi ?? '—'} (${ctx.bmiLabel || '—'}).`
  )
  sum.push(`Стратегия первого месяца: ${ctx.strategy}.`)
  sum.push(
    `Цифры: ${ctx.kcal} ккал, белок ${ctx.protein} г, шаги ${ctx.steps}, сон ${ctx.sleep}, зал ${ctx.freq}× в неделю.`
  )
  sum.push(`Фокус месяца (слабые места): ${focusList || 'держать сильные зоны'}.`)
  if (ctx.realWeeks != null && ctx.targetWeight) {
    sum.push(
      `До ${ctx.targetWeight} кг по безопасному темпу ~${ctx.realWeeks} недель (около ${ctx.realMonths} мес.).`
    )
  }
  if (ctx.expectationsHigh) {
    sum.push(
      'Срок, который хотелось, короче расчёта. Честный горизонт важнее красивой цифры. Иначе срыв и откат.'
    )
  }
  sum.push(
    'Критерий успеха через 4 недели: белок стабильно, шаги 5 из 7 дней, в дневнике есть прогрессия хотя бы на одном движении, сон ближе к цели.'
  )
  recs.summary = sum.join('\n\n')

  return recs
}

/**
 * Build a SMART goal statement from answers + algorithm context.
 * Returns an object with 5 SMART parts + a combined full text.
 */
export function buildSmartGoal(answers, algorithm) {
  const a = answers || {}
  const algo = algorithm || {}

  const goalLabels = {
    lose: 'снизить вес',
    definition: 'добиться рельефа',
    mass: 'набрать мышечную массу',
    strength: 'стать сильнее',
    health: 'улучшить здоровье и энергию',
    maintain: 'удержать текущую форму',
  }

  // S — Specific
  const goalText = goalLabels[a.mainGoal] || a.mainGoal || 'улучшить форму'
  const targetW = a.targetWeight ? ` до ${a.targetWeight} кг` : ''
  const idealForm = a.idealForm ? `. ${a.idealForm}` : ''
  const zones = (a.priorityZones || []).length
    ? `. Акцент на: ${a.priorityZones.slice(0, 3).join(', ')}`
    : ''
  const specific = `${goalText}${targetW}${idealForm}${zones}`

  // M — Measurable
  const measures = []
  if (a.targetWeight && algo.weight) {
    const delta = Math.abs(Math.round((Number(a.targetWeight) - Number(algo.weight)) * 10) / 10)
    measures.push(`вес ${algo.weight} → ${a.targetWeight} кг (разница ${delta} кг)`)
  }
  if (a.targetNotes && String(a.targetNotes).trim()) {
    measures.push(String(a.targetNotes).trim())
  }
  if (a.howKnowSuccess && String(a.howKnowSuccess).trim()) {
    measures.push(String(a.howKnowSuccess).trim())
  }
  if (algo.kcal) {
    measures.push(`питание ${algo.kcal} ккал/день, белок ${algo.protein} г`)
  }
  if (algo.steps) {
    measures.push(`шаги ${algo.steps}/день`)
  }
  const measurable = measures.length
    ? measures.join('. ')
    : 'вес, обхваты, самочувствие и фото до/после'

  // A — Achievable
  const weeks = algo.realWeeks
  const months = algo.realMonths
  const pace = algo.weight ? `~${Math.round(0.0075 * Number(algo.weight) * 10) / 10} кг/нед` : ''
  const achievable = weeks != null
    ? `Безопасный темп ${pace}. Реальный срок: ~${weeks} недель (около ${months} мес.). Это реально при ${algo.freq || '3'} тренировках в неделю и соблюдении плана.`
    : `При ${algo.freq || '3'} тренировках в неделю и соблюдении питания результат достижим за 2-3 месяца.`

  // R — Relevant
  const whyImportant = a.whyImportant && String(a.whyImportant).trim()
    ? String(a.whyImportant).trim()
    : a.trigger && String(a.trigger).trim()
      ? String(a.trigger).trim()
      : a.idealForm && String(a.idealForm).trim()
        ? `Хочу: ${a.idealForm}`
        : ''
  const relevant = whyImportant || 'Здоровье, энергия и уверенность в себе.'

  // T — Time-bound
  const event = a.deadlineEvent && String(a.deadlineEvent).trim()
    ? String(a.deadlineEvent).trim()
    : null
  const desiredMonths = a.deadlineMonths ? Number(a.deadlineMonths) : null
  let timeBound
  if (event && months) {
    timeBound = `Дедлайн: ${event}. По расчёту нужно ~${months} мес.`
  } else if (event && desiredMonths) {
    timeBound = `Дедлайн: ${event} (${desiredMonths} мес.).`
  } else if (months) {
    timeBound = `Горизонт: ~${months} мес. (${weeks} недель).`
  } else if (desiredMonths) {
    timeBound = `План на ${desiredMonths} мес.`
  } else {
    timeBound = 'Стартуем сейчас, результат через 2-3 месяца.'
  }

  // Combined (detailed)
  const full = [
    `Цель: ${specific}.`,
    `Измеримо: ${measurable}.`,
    `Достижимо: ${achievable}`,
    `Значимо: ${relevant}`,
    `Срок: ${timeBound}`,
  ].join('\n\n')

  // Short emotional summary (2-3 sentences for the trainer to read aloud)
  const short = buildSmartShort(a, algo, { goalText, targetW, relevant, months, weeks, event })

  return { specific, measurable, achievable, relevant, timeBound, full, short }
}

/**
 * 2-3 sentence emotional summary combining the most powerful SMART elements.
 * Written to be spoken aloud and hit emotionally.
 */
function buildSmartShort(a, algo, ctx) {
  const name = a.name || algo.name || 'Клиент'
  const curWeight = algo.weight
  const target = a.targetWeight
  const delta = curWeight && target ? Math.abs(Math.round((Number(target) - Number(curWeight)) * 10) / 10) : null

  // Sentence 1: Goal + number (specific + measurable)
  let s1
  if (a.mainGoal === 'mass' && delta && target) {
    s1 = `${name}, твоя цель: набрать ${delta} кг мышечной массы и выйти на ${target} кг.`
  } else if (a.mainGoal === 'lose' && delta && target) {
    s1 = `${name}, твоя цель: сбросить ${delta} кг и выйти на ${target} кг.`
  } else if (a.mainGoal === 'definition') {
    s1 = `${name}, твоя цель: убрать лишнее и получить видимый рельеф.`
  } else if (a.mainGoal === 'strength') {
    s1 = `${name}, твоя цель: стать заметно сильнее в базовых движениях.`
  } else {
    s1 = `${name}, твоя цель: ${ctx.goalText}${ctx.targetW}.`
  }

  // Sentence 2: Why it matters (relevant) — pick the most emotional part
  const whyRaw = a.whyImportant && String(a.whyImportant).trim()
  const triggerRaw = a.trigger && String(a.trigger).trim()
  const howKnowRaw = a.howKnowSuccess && String(a.howKnowSuccess).trim()

  let s2
  if (whyRaw) {
    // Use their own words for the "why"
    const whyClean = whyRaw.replace(/^[яЯ]\s+/i, '').trim()
    s2 = whyClean.charAt(0).toUpperCase() + whyClean.slice(1)
    if (!s2.endsWith('.') && !s2.endsWith('!')) s2 += '.'
  } else if (triggerRaw) {
    const triggerClean = triggerRaw.replace(/^[яЯ]\s+/i, '').trim()
    s2 = triggerClean.charAt(0).toUpperCase() + triggerClean.slice(1)
    if (!s2.endsWith('.') && !s2.endsWith('!')) s2 += '.'
  } else if (howKnowRaw) {
    s2 = `Ты поймёшь что удалось: ${howKnowRaw.toLowerCase()}.`
  } else {
    s2 = 'Внешний вид и самочувствие изменятся, и это почувствуется во всём.'
  }

  // Sentence 3: Timeline (time-bound) — make it concrete and motivating
  let s3
  const eventClean = ctx.event && String(ctx.event).trim()
  if (eventClean && ctx.months) {
    s3 = `До "${eventClean}" по расчёту ~${ctx.months} мес. Стартуем сейчас.`
  } else if (ctx.months) {
    s3 = `Реальный срок: ${ctx.months} мес. Стартуем сейчас.`
  } else {
    s3 = 'Стартуем сейчас, через 2-3 месяца ты увидишь результат.'
  }

  return [s1, s2, s3].join(' ')
}

/**
 * Make recommendation text readable: paragraphs with blank lines.
 * Also repairs old wall-of-text blobs without newlines.
 */
export function formatRecommendationText(text) {
  if (!text || typeof text !== 'string') return ''
  let t = text.replace(/\r\n/g, '\n').trim()
  if (!t) return ''

  // Already structured
  if (/\n\s*\n/.test(t) || (t.match(/\n/g) || []).length >= 2) {
    return t
      .split(/\n+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .join('\n\n')
  }

  // Wall of text: split into sentences (keep decimals like 2.5 together)
  const sentences = []
  let buf = ''
  for (let i = 0; i < t.length; i++) {
    buf += t[i]
    const ch = t[i]
    if (ch === '.' || ch === '!' || ch === '?') {
      const next = t[i + 1]
      const prev = t[i - 1]
      // decimal number 2.5
      if (ch === '.' && prev && /\d/.test(prev) && next && /\d/.test(next)) continue
      // abbreviation-ish single capital? skip rare cases
      if (next === ' ' || next === undefined || next === '\n') {
        const s = buf.trim()
        if (s) sentences.push(s)
        buf = ''
        if (next === ' ') i++ // skip space after sentence
      }
    }
  }
  if (buf.trim()) sentences.push(buf.trim())

  // Group 1 sentence per paragraph for speakable chunks
  return (sentences.length ? sentences : [t]).join('\n\n')
}

export function recommendationParagraphs(text) {
  return formatRecommendationText(text)
    .split(/\n\n+/)
    .map((s) => s.trim())
    .filter(Boolean)
}

export function suggestedTariff(realMonths) {
  if (realMonths == null || realMonths <= 1) return 'start'
  if (realMonths <= 4) return 'progress'
  return 'transform'
}

export const TARIFFS = {
  start: {
    id: 'start',
    name: 'Старт',
    months: 1,
    priceRegular: 19900,
    priceStream: 14900,
    desc: 'Вводный цикл',
    longDesc: 'Постановка правильной техники, адаптация суставов и запуск снижения веса.',
  },
  progress: {
    id: 'progress',
    name: 'Прогресс',
    months: 3,
    priceRegular: 47900,
    priceStream: 35900,
    desc: 'Полный цикл',
    longDesc: 'Основной этап: видимый сброс веса, перестройка питания и режима без срывов.',
  },
  transform: {
    id: 'transform',
    name: 'Трансформация',
    months: 6,
    priceRegular: 79900,
    priceStream: 59900,
    desc: 'Результат под ключ',
    longDesc: 'Доведение до целевого веса, закрепление формы навсегда и план питания в подарок.',
    nutritionGift: true,
  },
}

export const NUTRITION_ADDON = 3000

export function formatPrice(n) {
  return n.toLocaleString('ru-RU')
}
