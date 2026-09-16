export interface TemplateVariables {
  nome?: string | null;
  empresa?: string | null;
  segmento?: string | null;
  cidade?: string | null;
}

/** Substitui {{variavel}} pelo valor correspondente (ou remove se vazio). */
export function renderTemplate(content: string, vars: TemplateVariables): string {
  return content.replace(/{{\s*(\w+)\s*}}/g, (_, key: string) => {
    const value = vars[key as keyof TemplateVariables];
    return value ?? "";
  });
}

export function extractVariables(content: string): string[] {
  const matches = [...content.matchAll(/{{\s*(\w+)\s*}}/g)];
  return [...new Set(matches.map((m) => m[1]))];
}
