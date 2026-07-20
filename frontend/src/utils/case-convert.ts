type Obj = Record<string, unknown>;

function isObject(v: unknown): v is Obj {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function camelToSnake(key: string): string {
  return key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
}

function snakeToCamel(key: string): string {
  return key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

export function toSnakeCase(data: unknown): unknown {
  if (Array.isArray(data)) return data.map(toSnakeCase);
  if (isObject(data)) {
    const result: Obj = {};
    for (const [key, value] of Object.entries(data)) {
      result[camelToSnake(key)] = toSnakeCase(value);
    }
    return result;
  }
  return data;
}

export function toCamelCase(data: unknown): unknown {
  if (Array.isArray(data)) return data.map(toCamelCase);
  if (isObject(data)) {
    const result: Obj = {};
    for (const [key, value] of Object.entries(data)) {
      result[snakeToCamel(key)] = toCamelCase(value);
    }
    return result;
  }
  return data;
}
