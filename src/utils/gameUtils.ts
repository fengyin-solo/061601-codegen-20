import type { TimeOfDay, MoodLevel, GameConfig, CharacterConfig, WarningLevel, CharacterWarning, RemedyAction } from '../types/game'

export function getMoodLevel(mood: number): MoodLevel {
  if (mood >= 80) return 'happy'
  if (mood >= 60) return 'good'
  if (mood >= 40) return 'neutral'
  if (mood >= 20) return 'bad'
  return 'angry'
}

export function getMoodColor(mood: number): string {
  const level = getMoodLevel(mood)
  const colors: Record<MoodLevel, string> = {
    happy: '#22c55e',
    good: '#84cc16',
    neutral: '#eab308',
    bad: '#f97316',
    angry: '#ef4444'
  }
  return colors[level]
}

export function getMoodLabel(mood: number): string {
  const level = getMoodLevel(mood)
  const labels: Record<MoodLevel, string> = {
    happy: '开心',
    good: '不错',
    neutral: '一般',
    bad: '低落',
    angry: '生气'
  }
  return labels[level]
}

export function getTimeLabel(time: TimeOfDay): string {
  const labels: Record<TimeOfDay, string> = {
    morning: '早晨',
    afternoon: '下午',
    evening: '傍晚',
    night: '深夜'
  }
  return labels[time]
}

export function getTimeIcon(time: TimeOfDay): string {
  const icons: Record<TimeOfDay, string> = {
    morning: '🌅',
    afternoon: '☀️',
    evening: '🌆',
    night: '🌙'
  }
  return icons[time]
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function getAffinityColor(affinity: number, maxAffinity: number): string {
  const ratio = affinity / maxAffinity
  if (ratio >= 0.8) return '#ec4899'
  if (ratio >= 0.6) return '#f472b6'
  if (ratio >= 0.4) return '#fb923c'
  if (ratio >= 0.2) return '#fbbf24'
  if (ratio >= 0) return '#94a3b8'
  return '#64748b'
}

export function getAffinityStage(affinity: number): string {
  if (affinity >= 80) return '恋人'
  if (affinity >= 60) return '亲密'
  if (affinity >= 40) return '好友'
  if (affinity >= 20) return '朋友'
  if (affinity >= 0) return '相识'
  return '陌生'
}

export function getRarityColor(rarity: string): string {
  const colors: Record<string, string> = {
    common: '#94a3b8',
    rare: '#3b82f6',
    epic: '#a855f7',
    legendary: '#f59e0b'
  }
  return colors[rarity] || '#94a3b8'
}

export function getRarityLabel(rarity: string): string {
  const labels: Record<string, string> = {
    common: '普通',
    rare: '稀有',
    epic: '史诗',
    legendary: '传说'
  }
  return labels[rarity] || '普通'
}

export function getNextTimeSlot(current: TimeOfDay, timeSlots: TimeOfDay[]): TimeOfDay {
  const index = timeSlots.indexOf(current)
  if (index < timeSlots.length - 1) {
    return timeSlots[index + 1]
  }
  return timeSlots[0]
}

export function isGiftLiked(giftId: string, character: CharacterConfig): boolean {
  return character.favoriteGifts.includes(giftId)
}

export function isGiftDisliked(giftId: string, character: CharacterConfig): boolean {
  return character.dislikedGifts.includes(giftId)
}

export function calculateChatAffinity(
  topic: string,
  character: CharacterConfig,
  mood: number,
  timeOfDay: TimeOfDay
): number {
  const topicConfig = character.chatTopics.find(t => t.topic === topic)
  let baseChange = topicConfig ? topicConfig.affinity : 0

  const moodMultiplier = 0.5 + (mood / 100)
  baseChange *= moodMultiplier

  if (timeOfDay === 'night' && character.baseMood < 50) {
    baseChange *= 0.7
  }
  if (timeOfDay === 'morning' && character.baseMood >= 60) {
    baseChange *= 1.2
  }

  return Math.round(baseChange * 10) / 10
}

export function calculateGiftAffinity(
  giftId: string,
  character: CharacterConfig,
  giftPrice: number,
  mood: number
): number {
  let baseChange = giftPrice / 10

  if (isGiftLiked(giftId, character)) {
    baseChange *= 2
  } else if (isGiftDisliked(giftId, character)) {
    baseChange *= -0.5
  }

  const moodMultiplier = 0.6 + (mood / 150)
  baseChange *= moodMultiplier

  return Math.round(baseChange * 10) / 10
}

export function getMoodWarningLevel(mood: number, maxMood: number): WarningLevel | null {
  const ratio = mood / maxMood
  if (ratio <= 0.15) return 'critical'
  if (ratio <= 0.3) return 'danger'
  if (ratio <= 0.45) return 'warning'
  return null
}

export function getAffinityWarningLevel(affinity: number, maxAffinity: number, minAffinity: number): WarningLevel | null {
  const range = maxAffinity - minAffinity
  const ratio = (affinity - minAffinity) / range
  if (ratio <= 0.2) return 'critical'
  if (ratio <= 0.3) return 'danger'
  if (ratio <= 0.4) return 'warning'
  return null
}

export function getWarningColor(level: WarningLevel): string {
  const colors: Record<WarningLevel, string> = {
    info: '#3b82f6',
    warning: '#eab308',
    danger: '#f97316',
    critical: '#ef4444'
  }
  return colors[level]
}

export function getWarningLabel(level: WarningLevel): string {
  const labels: Record<WarningLevel, string> = {
    info: '提示',
    warning: '注意',
    danger: '警告',
    critical: '危险'
  }
  return labels[level]
}

export function compareWarningLevel(a: WarningLevel, b: WarningLevel): number {
  const priority: Record<WarningLevel, number> = {
    info: 0,
    warning: 1,
    danger: 2,
    critical: 3
  }
  return priority[b] - priority[a]
}

export function generateRemedyActions(
  character: CharacterConfig,
  moodWarning: WarningLevel | null,
  affinityWarning: WarningLevel | null,
  currentResources: number,
  gameConfig: GameConfig,
  currentMood: number
): RemedyAction[] {
  const actions: RemedyAction[] = []

  if (moodWarning || affinityWarning) {
    if (character.favoriteGifts.length > 0) {
      const favoriteGiftId = character.favoriteGifts[0]
      const giftConfig = gameConfig.gifts.find(g => g.id === favoriteGiftId)
      if (giftConfig) {
        const canAfford = currentResources >= giftConfig.price
        const estimatedAffinity = Math.round(calculateGiftAffinity(
          favoriteGiftId,
          character,
          giftConfig.price,
          currentMood
        ) * 10) / 10
        const moodChange = 15
        actions.push({
          type: 'gift',
          label: `送${giftConfig.name}`,
          icon: giftConfig.icon,
          description: `ta最喜欢的礼物，能大幅提升好感和心情`,
          targetCharacterId: character.id,
          giftId: favoriteGiftId,
          estimatedEffect: `好感 +${estimatedAffinity}，心情 +${moodChange}`,
          priority: canAfford ? 10 : 5
        })
      }
    }

    const bestTopic = character.chatTopics.reduce((best, topic) =>
      topic.affinity > best.affinity ? topic : best
    , character.chatTopics[0])
    if (bestTopic) {
      const estimatedAffinity = Math.round(calculateChatAffinity(
        bestTopic.topic,
        character,
        currentMood,
        'afternoon'
      ) * 10) / 10
      const moodChange = estimatedAffinity > 0 ? 5 : -3
      actions.push({
        type: 'chat',
        label: `聊${bestTopic.topic}`,
        icon: '💬',
        description: `聊ta感兴趣的话题`,
        targetCharacterId: character.id,
        estimatedEffect: `好感 ${estimatedAffinity >= 0 ? '+' : ''}${estimatedAffinity}，心情 ${moodChange >= 0 ? '+' : ''}${moodChange}`,
        priority: 8
      })
    }

    if (moodWarning && (moodWarning === 'danger' || moodWarning === 'critical')) {
      actions.push({
        type: 'work',
        label: '避免打工',
        icon: '⚠️',
        description: '打工会降低所有角色心情',
        estimatedEffect: '防止心情进一步下降',
        priority: 7
      })
    }

    if (affinityWarning && (affinityWarning === 'danger' || affinityWarning === 'critical')) {
      actions.push({
        type: 'event',
        label: '多花时间陪伴',
        icon: '⏰',
        description: '每天优先和ta互动，避免好感持续下降',
        estimatedEffect: '阻止关系恶化',
        priority: 9
      })
    }
  }

  return actions.sort((a, b) => b.priority - a.priority)
}

export function buildCharacterWarning(
  charState: { id: string; affinity: number; mood: number; unlocked: boolean },
  charConfig: CharacterConfig | undefined,
  gameConfig: GameConfig,
  currentResources: number
): CharacterWarning | null {
  if (!charState.unlocked || !charConfig) return null

  const moodWarning = getMoodWarningLevel(charState.mood, gameConfig.maxMood)
  const affinityWarning = getAffinityWarningLevel(
    charState.affinity,
    gameConfig.maxAffinity,
    gameConfig.minAffinity
  )

  if (!moodWarning && !affinityWarning) return null

  const worseLevel = moodWarning && affinityWarning
    ? (compareWarningLevel(moodWarning, affinityWarning) < 0 ? moodWarning : affinityWarning)
    : (moodWarning || affinityWarning!)

  const warningType = moodWarning && affinityWarning
    ? 'both'
    : moodWarning ? 'mood' : 'affinity'

  let title = ''
  let description = ''

  if (warningType === 'both') {
    title = `${charConfig.name}的状态很糟糕`
    description = `心情和好感都处于${getWarningLabel(worseLevel)}状态，需要尽快补救！`
  } else if (warningType === 'mood') {
    title = `${charConfig.name}的心情很低落`
    description = `当前心情${charState.mood}，处于${getWarningLabel(moodWarning!)}状态，快去陪陪ta吧。`
  } else {
    title = `和${charConfig.name}的关系堪忧`
    description = `当前好感${charState.affinity}，处于${getWarningLabel(affinityWarning!)}状态，关系正在疏远。`
  }

  const remedyActions = generateRemedyActions(
    charConfig,
    moodWarning,
    affinityWarning,
    currentResources,
    gameConfig,
    charState.mood
  )

  return {
    characterId: charState.id,
    characterName: charConfig.name,
    characterAvatar: charConfig.avatar,
    warningType,
    warningLevel: worseLevel,
    moodValue: charState.mood,
    affinityValue: charState.affinity,
    title,
    description,
    remedyActions
  }
}
