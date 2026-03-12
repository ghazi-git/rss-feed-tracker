export function debounce<T extends unknown[]>(
  callback: (...args: T) => void,
  delay = 200,
) {
  let timer: number;

  return (...args: T) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => callback(...args), delay);
  };
}
