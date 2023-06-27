type Entry<T> = { [K in keyof T]: [K, T[K]] }[keyof T];
export function entries<T extends object>(object: T): ReadonlyArray<Entry<T>> {
  return Object.entries(object) as unknown as ReadonlyArray<Entry<T>>;
}

type Value<T> = { [K in keyof T]: T[K] }[keyof T];
export function values<T extends object>(object: T): ReadonlyArray<Value<T>> {
  return Object.values(object) as unknown as ReadonlyArray<Value<T>>;
}
