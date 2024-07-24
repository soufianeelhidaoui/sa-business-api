import { Middleware } from 'koa';

interface RouteDefinition {
  path: string;
  method: 'get' | 'post' | 'put' | 'delete' | 'patch';
  middlewares?: Middleware[];
  resolver: Middleware;
}

export default RouteDefinition;
