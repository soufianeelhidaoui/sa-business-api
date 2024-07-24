import { HttpStatusCode } from 'axios';
import { jwtDecode } from 'jwt-decode';
import { Middleware } from 'koa';
import compose from 'koa-compose';
import koajwt from 'koa-jwt';
import config from '@config';
import brands from '@constants/brands';

const tokenValidator = koajwt({ secret: config.get('VITE_JWT_SECRET') });

const tokenParser: Middleware = async (ctx, next) => {
  const token = jwtDecode(ctx.header.authorization!);
  const kvps = ctx.header['x-kvps'];
  const brand = ctx.header['brand'];
  if (brand && !brands.includes(brand)) {
    ctx.throw(HttpStatusCode.BadRequest, 'Unknown BRAND');
  }

  const contract = token.contracts?.find((v: object) => v.kvps === kvps);
  if (!contract) {
    ctx.throw(HttpStatusCode.Forbidden, 'You do not have access to this KVPS');
  }
  ctx.state.brand = brand ? brand : contract.brand;
  ctx.state.kvps = kvps ? kvps : contract.kvps;
  ctx.logger = ctx.logger.child({ brand: contract.brand, kvps: contract.kvps });

  return next();
};

const jwtMiddleware = compose([tokenValidator, tokenParser]);

export default jwtMiddleware;
