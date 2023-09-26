const { transports, createLogger, format } = require('winston');
const { combine, timestamp, printf } = format;

// define the custom settings for each transport (file, console)
var options = {
  file: {
    level: 'info',
    filename: 'logs/app.log',
    handleExceptions: true,
    json: false,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
    colorize: false
  },
  errorFile: {
    level: 'error',
    name: 'file.error',
    filename: 'logs/error.log',
    handleExceptions: true,
    json: false,
    maxsize: 5242880, // 5MB
    maxFiles: 100,
    colorize: false
  },
  console: {
    level: 'debug',
    handleExceptions: true,
    json: false,
    maxsize: 5242880, // 5MB
    maxFiles: 100,
    colorize: false
  }
}

const logPrintFormat = printf(log => {
  return `${log.timestamp} [${log.level}]: ${log.message}`
});

var logger = createLogger({
  level: (process.env.PRODUCTION ? 'error' : 'info'),
  format: combine(
    timestamp(),
    logPrintFormat
  ),
  transports: [
    new transports.File(options.file),
    new transports.File(options.errorFile),
    new transports.Console(options.console)
  ],
  exitOnError: false // do not exit on handled exceptions
});

module.exports = logger;
