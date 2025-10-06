export async function retry<Resp>(
  callback: () => Promise<Resp>,
  retries = 3,
  backoffFactor = 500,
) {
  for (let i = 0; i < retries + 1; i++) {
    try {
      return await callback();
    } catch (err) {
      if (i < retries) {
        await sleep(backoffFactor * Math.pow(2, i));
      } else {
        throw err;
      }
    }
  }

  // so typescript doesn't infer undefined as a possible return value
  throw new Error("Unable to get the feed data.");
}

async function sleep(timeMs: number) {
  return await new Promise((resolve) => setTimeout(resolve, timeMs));
}
