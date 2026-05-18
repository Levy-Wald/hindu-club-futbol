export type WidgetCondition = {
  hasAnyAttribute?: string[]
  hasAllAttributes?: string[]
  hasAnyCapability?: string[]
  always?: boolean
}

export type WidgetSize = 'sm' | 'md' | 'lg'

export type WidgetDef = {
  id: string
  title: string
  priority: number
  condition: WidgetCondition
  size: WidgetSize
}

export function shouldShowWidget(
  widget: WidgetDef,
  userAttributes: string[],
  userCapabilities: string[]
): boolean {
  const { condition } = widget
  if (condition.always) return true
  if (
    condition.hasAnyAttribute &&
    condition.hasAnyAttribute.some(a => userAttributes.includes(a))
  )
    return true
  if (
    condition.hasAllAttributes &&
    condition.hasAllAttributes.every(a => userAttributes.includes(a))
  )
    return true
  if (
    condition.hasAnyCapability &&
    condition.hasAnyCapability.some(c => userCapabilities.includes(c))
  )
    return true
  return false
}
