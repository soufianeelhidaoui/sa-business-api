import fs from 'fs';

const multerWithErrorHandling = async (ctx, next, upload) => upload.single('file')(ctx, next)
  .then((res) => res)
  .finally(() => {
    fs.promises.unlink(ctx.request.file.path).catch(() => Promise.resolve());
  });

export default multerWithErrorHandling;