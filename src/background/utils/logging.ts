export class FeedPollingLogger {
  private readonly feedId: number;
  private readonly scheduledAt: string;
  private readonly colorCode: string;

  constructor(feedId: number, scheduledAt: string) {
    this.feedId = feedId;
    this.scheduledAt = scheduledAt;
    // logs for a specific feed will have the same color, so it is easier to
    // follow them when multiple feeds are updating in parallel
    this.colorCode = COLOR_CODES[feedId % COLOR_CODES.length];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  debug(...data: any[]) {
    const now = new Date().toISOString();
    console.log(
      `%c[${now}] feed-polling scheduledAt=${this.scheduledAt} feedId=${this.feedId}`,
      `color: ${this.colorCode};`,
      ...data,
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error(...data: any[]) {
    const now = new Date().toISOString();
    console.error(
      `[${now}] feed-polling scheduledAt=${this.scheduledAt} feedId=${this.feedId}`,
      ...data,
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static log(scheduledAt: string, ...data: any[]) {
    const now = new Date().toISOString();
    console.log(`[${now}] feed-polling scheduledAt=${scheduledAt}`, ...data);
  }
}

const COLOR_CODES = [
  "#007ACC",
  "#00875A",
  "#FFA500",
  "#6A5ACD",
  "#00CED1",
  "#9ACD32",
  "#CD9678",
];
