import { env } from './env.js';

const COLORS = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

const paint = (color, text) => (env.isProd ? text : `${COLORS[color]}${text}${COLORS.reset}`);

const stamp = () => new Date().toISOString().slice(11, 19);

const write = (stream, color, label, args) => {
  stream(`${paint('dim', stamp())} ${paint(color, label.padEnd(5))} ${args.map(fmt).join(' ')}`);
};

const fmt = (value) => (typeof value === 'string' ? value : JSON.stringify(value, null, 2));

/**
 * Informational output is suppressed under test.
 *
 * The console email provider prints a framed banner per message, so a suite that
 * registers dozens of users buries the actual assertion failures under hundreds
 * of lines of boxes. Warnings and errors still come through, because those are
 * the ones worth seeing when a test breaks.
 */
const quiet = env.isTest;

export const logger = {
  info: (...args) => !quiet && write(console.log, 'cyan', 'info', args),
  success: (...args) => !quiet && write(console.log, 'green', 'ok', args),
  warn: (...args) => write(console.warn, 'yellow', 'warn', args),
  error: (...args) => write(console.error, 'red', 'error', args),
  debug: (...args) => {
    if (!env.isProd && !quiet) write(console.log, 'magenta', 'debug', args);
  },
  /** Framed block for boot banners and dev-only notices worth not missing. */
  banner: (title, lines = []) => {
    if (quiet) return;
    if (env.isProd) {
      logger.info(title, ...lines);
      return;
    }
    const width = Math.max(title.length, ...lines.map((l) => l.length)) + 4;
    const bar = '─'.repeat(width);
    console.log(paint('blue', `\n┌${bar}┐`));
    console.log(paint('blue', '│  ') + title.padEnd(width - 4) + paint('blue', '  │'));
    if (lines.length) {
      console.log(paint('blue', `├${bar}┤`));
      for (const line of lines) {
        console.log(paint('blue', '│  ') + paint('dim', line.padEnd(width - 4)) + paint('blue', '  │'));
      }
    }
    console.log(paint('blue', `└${bar}┘\n`));
  },
};

export default logger;
