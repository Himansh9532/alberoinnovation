export function isAtsFriendlyTemplate(template) {
  return template?.columns === 1 && !template.headshot && template.graphics !== "Decorative";
}
