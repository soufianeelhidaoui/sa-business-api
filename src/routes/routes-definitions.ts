import compose from 'koa-compose';

import dealersMiddleware from '@middlewares/dealers-middleware';
import errorMiddleware from '@middlewares/error-middleware';
import fileMiddleware from '@middlewares/file-middleware';
import jwtMiddleware from '@middlewares/jwt-middleware';
import validatOrderStateMiddleware from '@middlewares/validate-order-state';
import loggerMiddleware from '@middlewares/logger-middleware';
import validateBrandMiddleware from '@middlewares/validate-brand';
import createCheckout from '@routes/create-checkout';
import getDealer from '@routes/get-dealer';
import getDealers from '@routes/get-dealers';
import getOrders from '@routes/get-orders';
import getOrdersStats from '@routes/get-orders-stats';
import updateOrder from '@routes/update-order';
import getOrderDetails from '@routes/get-order-details';
import getPaymentStatus from '@routes/get-payment-status';
import hasPayment from '@routes/has-payment';
import healthiness from '@routes/healthiness';
import login from '@routes/login';
import paymentWebhook from '@routes/payment-webhook';
import updateTerms from '@routes/update-terms';
import getPrices from '@routes/get-prices';
import updatePrices from '@routes/update-prices';
import type RouteDefinition from '@ts-types/route-definitions.t';
import buildXlsxHandler from '@middlewares/build-xlsx-file-middleware';

const defaultMiddlewares = compose([loggerMiddleware, errorMiddleware]);

const withDealersMiddleware = compose([
  defaultMiddlewares,
  validateBrandMiddleware,
  dealersMiddleware,
]);

const withJwtMiddlewares = compose([
  defaultMiddlewares,
  jwtMiddleware,
]);

const withFileUploadMiddleware = compose([withJwtMiddlewares, buildXlsxHandler('./public/uploaded/prices')])

export const healthinessDef: RouteDefinition = {
  method: 'get',
  middlewares: [defaultMiddlewares],
  path: '/health',
  resolver: healthiness,
};

export const getDealersDef: RouteDefinition = {
  method: 'get',
  middlewares: [withDealersMiddleware],
  path: '/get-dealers/:brand',
  resolver: getDealers,
};

export const getDealerDef: RouteDefinition = {
  method: 'get',
  middlewares: [withDealersMiddleware],
  path: '/get-dealer/:brand/:kvps',
  resolver: getDealer,
};

export const createCheckoutDef: RouteDefinition = {
  method: 'post',
  middlewares: [defaultMiddlewares],
  path: '/create-checkout/:brand/:kvps',
  resolver: createCheckout,
};

export const getPaymentStatusDef: RouteDefinition = {
  method: 'get',
  middlewares: [defaultMiddlewares],
  path: '/payment/:transactionId',
  resolver: getPaymentStatus,
};

export const paymentWebhookDef: RouteDefinition = {
  method: 'post',
  middlewares: [defaultMiddlewares],
  path: '/payment-webhook',
  resolver: paymentWebhook,
};

export const hasPaymentDef: RouteDefinition = {
  method: 'get',
  middlewares: [defaultMiddlewares],
  path: '/has-payment/:kvps',
  resolver: hasPayment,
};

export const updateTermsDef: RouteDefinition = {
  method: 'post',
  middlewares: [withJwtMiddlewares, fileMiddleware],
  path: '/terms',
  resolver: updateTerms,
};

export const loginDef: RouteDefinition = {
  method: 'post',
  middlewares: [defaultMiddlewares],
  path: '/auth/login',
  resolver: login,
};

export const getOrdersDef: RouteDefinition = {
  method: 'get',
  middlewares: [withJwtMiddlewares],
  path: '/orders',
  resolver: getOrders,
};

export const getOrdersStatsDef: RouteDefinition = {
  method: 'get',
  middlewares: [withJwtMiddlewares],
  path: '/orders/stats',
  resolver: getOrdersStats,
};

export const getPricesDef: RouteDefinition = {
  method: 'get',
  middlewares: [withJwtMiddlewares],
  path: '/prices',
  resolver: getPrices,
};

export const updatePricesDef: RouteDefinition = {
  method: 'post',
  middlewares: [withFileUploadMiddleware],
  path: '/prices',
  resolver: updatePrices,
}

export const updateOrdersDef: RouteDefinition = {
  method: 'post',
  middlewares: [withJwtMiddlewares, validatOrderStateMiddleware],
  path: '/order/:orderId',
  resolver: updateOrder,
};

export const getOrderDetailsDef: RouteDefinition = {
  method: 'get',
  middlewares: [withJwtMiddlewares],
  path: '/order/:orderId',
  resolver: getOrderDetails,
};
