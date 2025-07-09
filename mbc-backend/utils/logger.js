import winston from 'winston';

const { combine, timestamp, printf, colorize, json } = winston.format;

/**
 * Custom log format for console
 */
const consoleFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level}]: ${message}`;
  if (Object.keys(metadata).length) {
    msg += `\n${JSON.stringify(metadata, null, 2)}`;
  }
  return msg;
});

/**
 * Winston logger instance
 */
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  transports: [
    new winston.transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        consoleFormat
      ),
      handleExceptions: true
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: combine(timestamp(), json()),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ],
  exitOnError: false
});

// Morgan stream for HTTP request logging
logger.stream = {
  write: message => logger.info(message.trim())
};

export default logger;
