export function getLogger(context?: LoggerContext, chooseColor = false) {
  return new Logger(context, chooseColor);
}

export class Logger {
  private context: LoggerContext;
  private colorCode: string | null;

  constructor(context?: LoggerContext, chooseColor = false) {
    this.context = context ?? {};
    this.colorCode = chooseColor ? getColorCode() : null;
  }

  setColor(colorCode: string | null) {
    this.colorCode = colorCode;
  }

  bind(obj: LoggerContext) {
    this.context = { ...this.context, ...obj };
  }

  child(obj?: LoggerContext, chooseColor = false) {
    const logger = new Logger({ ...this.context, ...(obj ?? {}) }, chooseColor);
    if (!chooseColor) {
      // inherit the parent color
      logger.setColor(this.colorCode);
    }
    return logger;
  }

  debug(msg: string, obj?: LoggerContext) {
    const now = new Date().toISOString();
    const contextParts = getContextAsText({ ...this.context, ...(obj ?? {}) });
    const contextText = `[${now}]${contextParts ? ` ${contextParts}` : ""}`;
    if (this.colorCode) {
      console.log(`%c${contextText}`, `color: ${this.colorCode};`, msg);
    } else {
      console.log(contextText, msg);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error(msg: string, e: any) {
    const now = new Date().toISOString();
    const contextParts = getContextAsText(this.context);
    const contextText = `[${now}]${contextParts ? ` ${contextParts}` : ""}`;
    console.error(contextText, msg, e);
  }
}

function getContextAsText(context: LoggerContext) {
  const textFragments = Object.entries(context).map(
    ([key, value]) => `${key}=${JSON.stringify(value)}`,
  );
  return textFragments.join(" ");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LoggerContext = Record<string, any>;

function* getColorGenerator() {
  const colorCodes = [
    "#007ACC",
    "#00875A",
    "#FFA500",
    "#6A5ACD",
    "#00CED1",
    "#9ACD32",
    "#CD9678",
  ];
  let i = 0;
  while (true) {
    yield colorCodes[i];
    i = (i + 1) % colorCodes.length;
  }
}

const COLOR_GENERATOR = getColorGenerator();
function getColorCode() {
  const color = COLOR_GENERATOR.next();
  return color.value as string;
}

const globalLogger = getLogger();
export const glogger = {
  debug(msg: string, obj?: LoggerContext) {
    globalLogger.debug(msg, obj);
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error(msg: string, e: any) {
    globalLogger.error(msg, e);
  },
};
