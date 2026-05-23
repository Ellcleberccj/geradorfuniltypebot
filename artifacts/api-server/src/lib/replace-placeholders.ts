/**
 * Substitui apenas placeholders no formato __NOME_DA_VARIAVEL__.
 * Não altera variáveis no formato {{variavel}} do Typebot.
 */
export function replacePlaceholders(
  template: string,
  values: Record<string, string>,
): string {
  let result = template;
  for (const [key, value] of Object.entries(values)) {
    const placeholder = `__${key}__`;
    result = result.split(placeholder).join(value);
  }
  return result;
}
