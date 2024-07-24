import fs from 'fs';
import path from 'path';

import multer from '@koa/multer';
import { v4 as uuidv4 } from 'uuid';

import { XLS_STATUSES } from '@constants/file-handling-messages';
import multerWithErrorHandling from '@middlewares/multer-with-error-handling';

const buildXlsxHandler = (dirpath) => async (ctx, next) => {
  const DIRECTORY = path.resolve(dirpath);

  const filename = `${uuidv4()}.xlsx`;
  const filepath = path.resolve(`${dirpath}/${filename}`);

  ctx.request.file = filepath;

  await fs.promises.access(DIRECTORY)
    .catch(() => fs.promises.mkdir(DIRECTORY, { recursive: true }));

  const storage = multer.diskStorage({
    destination(_, __, cb) {
      cb(null, DIRECTORY);
    },
    filename(_, __, cb) {
      cb(null, filename);
    },
  });

  const fileFilter = (_, file, cb) => {
    const isValidFormat = Boolean(file.originalname.match(/.+\.xls(x)?$/));

    if (!isValidFormat) {
      throw new Error(XLS_STATUSES.INVALID_EXTENSION)
    }

    return cb(null, true);
  };

  const upload = multer({
    storage,
    fileFilter,
  });

  return multerWithErrorHandling(ctx, next, upload);
};

export default buildXlsxHandler;
