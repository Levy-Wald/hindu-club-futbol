/**
 * Simple mustache-style template renderer.
 * Replaces {{variable}} with values from the vars map.
 * No conditionals or loops — keep it simple.
 */
export function renderTemplate(
  template: string,
  vars: Record<string, string>
): string {
  let result = template
  for (const [key, value] of Object.entries(vars)) {
    result = result.replaceAll(`{{${key}}}`, value)
  }
  return result
}
