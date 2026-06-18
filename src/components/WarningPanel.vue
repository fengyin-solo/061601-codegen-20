<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '../stores/gameStore'
import { getWarningColor, getWarningLabel } from '../utils/gameUtils'
import type { RemedyAction } from '../types/game'

const gameStore = useGameStore()

const warnings = computed(() => gameStore.characterWarnings)

const canPerformAction = computed(() => gameStore.actionsRemaining > 0)

function getLevelClass(level: string): string {
  const classes: Record<string, string> = {
    info: 'level-info',
    warning: 'level-warning',
    danger: 'level-danger',
    critical: 'level-critical'
  }
  return classes[level] || 'level-info'
}

function getTypeIcon(type: string): string {
  const icons: Record<string, string> = {
    mood: '😢',
    affinity: '💔',
    both: '⚠️'
  }
  return icons[type] || '⚠️'
}

function canExecuteAction(action: RemedyAction): boolean {
  if (!canPerformAction.value) return false
  if (action.type === 'chat') return true
  if (action.type === 'gift') {
    if (!action.giftId) return false
    return true
  }
  return false
}

function handleRemedyAction(action: RemedyAction) {
  if (!canExecuteAction(action)) return

  if (action.type === 'chat' && action.targetCharacterId) {
    gameStore.selectCharacter(action.targetCharacterId)
    gameStore.performAction('chat', action.targetCharacterId)
  } else if (action.type === 'gift' && action.targetCharacterId && action.giftId) {
    gameStore.selectCharacter(action.targetCharacterId)
    gameStore.performAction('gift', action.targetCharacterId, action.giftId)
  }
}

function getActionButtonText(action: RemedyAction): string {
  if (!canPerformAction.value) return '行动力不足'
  if (action.type === 'chat') return '立即聊天'
  if (action.type === 'gift') return '立即送礼'
  return '查看'
}
</script>

<template>
  <div v-if="warnings.length > 0" class="warning-panel card">
    <h2 class="panel-title">
      <span class="title-icon">🚨</span>
      状态预警
      <span class="warning-count">{{ warnings.length }}</span>
    </h2>

    <div class="warning-list">
      <div
        v-for="warning in warnings"
        :key="warning.characterId"
        class="warning-card"
        :class="getLevelClass(warning.warningLevel)"
      >
        <div class="warning-header">
          <div class="warning-avatar">{{ warning.characterAvatar }}</div>
          <div class="warning-info">
            <div class="warning-title">
              <span class="type-icon">{{ getTypeIcon(warning.warningType) }}</span>
              {{ warning.title }}
            </div>
            <div class="warning-badge" :style="{ backgroundColor: getWarningColor(warning.warningLevel) }">
              {{ getWarningLabel(warning.warningLevel) }}
            </div>
          </div>
        </div>

        <p class="warning-desc">{{ warning.description }}</p>

        <div class="warning-stats">
          <div v-if="warning.moodValue !== undefined" class="stat-item">
            <span class="stat-label">心情</span>
            <span class="stat-value">{{ warning.moodValue }}</span>
          </div>
          <div v-if="warning.affinityValue !== undefined" class="stat-item">
            <span class="stat-label">好感</span>
            <span class="stat-value">{{ warning.affinityValue }}</span>
          </div>
        </div>

        <div class="remedy-section">
          <div class="remedy-title">💡 补救建议</div>
          <div class="remedy-list">
            <div
              v-for="(action, index) in warning.remedyActions"
              :key="index"
              class="remedy-item"
              :class="{ 
                clickable: canExecuteAction(action),
                disabled: !canExecuteAction(action) && (action.type === 'chat' || action.type === 'gift')
              }"
              @click="handleRemedyAction(action)"
            >
              <span class="remedy-icon">{{ action.icon }}</span>
              <div class="remedy-content">
                <div class="remedy-label">{{ action.label }}</div>
                <div class="remedy-desc">{{ action.description }}</div>
              </div>
              <div class="remedy-right">
                <div class="remedy-effect">{{ action.estimatedEffect }}</div>
                <div 
                  v-if="action.type === 'chat' || action.type === 'gift'" 
                  class="remedy-action-btn"
                  :class="{ active: canExecuteAction(action) }"
                >
                  {{ getActionButtonText(action) }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.warning-panel {
  padding: 20px;
}

.panel-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.title-icon {
  font-size: 22px;
}

.warning-count {
  margin-left: auto;
  background: var(--error-color);
  color: white;
  padding: 2px 10px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 500;
}

.warning-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.warning-card {
  padding: 16px;
  border-radius: var(--radius-md);
  border-left: 4px solid;
  background: var(--bg-tertiary);
  transition: all 0.2s;
}

.warning-card.level-info {
  border-left-color: var(--info-color);
  background: rgba(59, 130, 246, 0.08);
}

.warning-card.level-warning {
  border-left-color: var(--warning-color);
  background: rgba(234, 179, 8, 0.08);
}

.warning-card.level-danger {
  border-left-color: #f97316;
  background: rgba(249, 115, 22, 0.08);
}

.warning-card.level-critical {
  border-left-color: var(--error-color);
  background: rgba(239, 68, 68, 0.1);
  animation: pulse-critical 2s ease-in-out infinite;
}

@keyframes pulse-critical {
  0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.2); }
  50% { box-shadow: 0 0 0 8px rgba(239, 68, 68, 0); }
}

.warning-header {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 10px;
}

.warning-avatar {
  width: 44px;
  height: 44px;
  background: var(--bg-secondary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  flex-shrink: 0;
}

.warning-info {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.warning-title {
  font-weight: 600;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.type-icon {
  font-size: 16px;
}

.warning-badge {
  color: white;
  padding: 3px 10px;
  border-radius: 9999px;
  font-size: 11px;
  font-weight: 600;
  flex-shrink: 0;
}

.warning-desc {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.5;
  margin-bottom: 12px;
}

.warning-stats {
  display: flex;
  gap: 20px;
  margin-bottom: 14px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.stat-label {
  font-size: 12px;
  color: var(--text-muted);
}

.stat-value {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.remedy-section {
  background: var(--bg-secondary);
  border-radius: var(--radius-sm);
  padding: 12px;
}

.remedy-title {
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 10px;
  color: var(--text-primary);
}

.remedy-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.remedy-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-sm);
  transition: all 0.2s;
}

.remedy-item.clickable {
  cursor: pointer;
}

.remedy-item.clickable:hover {
  background: var(--accent-light);
  transform: translateX(4px);
}

.remedy-item.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.remedy-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.remedy-content {
  flex: 1;
  min-width: 0;
}

.remedy-label {
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 2px;
}

.remedy-desc {
  font-size: 11px;
  color: var(--text-muted);
}

.remedy-right {
  flex-shrink: 0;
  text-align: right;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.remedy-effect {
  font-size: 11px;
  color: var(--success-color);
  font-weight: 500;
}

.remedy-action-btn {
  font-size: 10px;
  padding: 3px 8px;
  border-radius: 9999px;
  background: var(--bg-tertiary);
  color: var(--text-muted);
  font-weight: 500;
}

.remedy-action-btn.active {
  background: var(--accent-primary);
  color: white;
}
</style>
