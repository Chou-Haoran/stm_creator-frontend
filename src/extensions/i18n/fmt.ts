// Tiny template helper: fmt('Hello {name}', {name:'World'}) -> 'Hello World'
export function fmt(template: string, params: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (_, k) => String(params[k] ?? ''));
}
