/**
 * useful with the node store as we sometimes know the type of the node
 * (feed or folder), but TS doesn't
 */
export function assertTypeIs<T>(obj: unknown): asserts obj is T {}
