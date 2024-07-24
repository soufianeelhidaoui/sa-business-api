import { Middleware } from 'koa';

import multer from '@koa/multer';

const fileMiddleware: Middleware = multer({
  storage: multer.memoryStorage(),
}).single('file');

export default fileMiddleware;
