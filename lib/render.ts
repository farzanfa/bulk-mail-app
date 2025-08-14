const variablePattern = /\{\{\s*([a-zA-Z0-9_\.]+)\s*\}\}/g;

function getPath(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object' && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

export function renderTemplateString(template: string, variables: Record<string, unknown>): string {
  return template.replace(variablePattern, (_, path) => {
    const value = getPath(variables, path);
    if (value == null) return '';
    return String(value);
  });
}

export function extractVariables(template: string): string[] {
  const set = new Set<string>();
  for (const match of template.matchAll(variablePattern)) {
    const key = match[1];
    set.add(key);
  }
  return Array.from(set);
}


