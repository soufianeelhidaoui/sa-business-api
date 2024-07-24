import path from 'path';

// eslint-disable-next-line no-undef
module.exports = {
  '@config': path.resolve('./src/utils/config'),
  '@utils': path.resolve('./src/utils'),
  '@constants': path.resolve('./src/constants'),
  '@middlewares': path.resolve('./src/middlewares'),
  '@services': path.resolve('./src/services'),
  '@routes': path.resolve('./src/routes'),
  '@clients': path.resolve('./src/clients'),
  '@ts-types': path.resolve('./src/types'),
  '@schema': path.resolve('./src/schema'),
  '@app': path.resolve('./src'),
  '@root': path.resolve('./'),
  '@email': path.resolve('./src/email'),
};
