class Logger {

  private readonly level: number;
  private readonly levelMaps: string[] = ["debug", "info", "warn", "fatal"];

  public constructor(level: number) {
    this.level = level;
  }

  public print(level: number, msg: string, error?: Error): void {
    if (level >= this.level) {
      console.log(`[${this.levelMaps[level]}] - [${new Date().toISOString()}] - ${msg}`);
    }
    if (error) {
      console.error(error);
    }
  }
}

let logInstance: Logger;


export const logger = {
  warn: (msg: string) => {
    logInstance.print(2, msg);
  },
  info: (msg: string) => {
    logInstance.print(1, msg);
  },
  debug: (msg: string) => {
    logInstance.print(0, msg);
  },
  fatal: (msg: string, error?: Error) => {
    logInstance.print(3, msg, error);
    process.exit(1);
  },
  log: (level: number, msg: string, error?: Error) => {
    logInstance.print(level, msg, error);
    if (level === 3) {
      process.exit(1);
    }
  },
  init: (level: number) => {
    if (!logInstance) {
      logInstance = new Logger(level);
    }
  },
};