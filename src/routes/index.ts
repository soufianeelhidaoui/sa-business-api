import Router from 'koa-router';

import * as routesDefinitions from '@routes/routes-definitions';
import RouteDefinition from '@ts-types/route-definitions.t';

const routes: Router[] = [];

/*
  Creates routes dynamically
*/

const buildRoute = ({ method, path, middlewares = [], resolver }: RouteDefinition) => {
  const router = new Router();

  router[method](path, ...middlewares, resolver);
  routes.push(router);
};

Object.values(routesDefinitions).forEach(buildRoute);

export default routes;
