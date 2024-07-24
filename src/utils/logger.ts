import pino, { LoggerOptions } from 'pino';
import config from '@config';

const devConfig: LoggerOptions = {
  formatters: {
    level: (label) => {
      return { level: label.toUpperCase() };
    },
  },
  level: 'debug',
  timestamp: pino.stdTimeFunctions.isoTime,
};

const prodConfig: LoggerOptions = {
  formatters: {
    level: (label) => {
      return { level: label.toUpperCase() };
    },
  },
  level: 'info',
  timestamp: pino.stdTimeFunctions.isoTime,
};

const logger = pino(config.get('MODE') === 'production' ? prodConfig : devConfig);


export default logger;
