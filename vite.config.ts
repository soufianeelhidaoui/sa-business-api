/* eslint-disable sort-keys-fix/sort-keys-fix */

import { defineConfig } from 'vite';
import { VitePluginNode } from 'vite-plugin-node';
import graphqlLoader from "vite-plugin-graphql-loader";
import eslint from 'vite-plugin-eslint';

import tsconfig from './tsconfig.json';

import path from 'path';

const paths = tsconfig.compilerOptions.paths;

const logViteWarn = (message: string) => {
  console.warn(`vite.config: ${message}`);
};

const aliases = Object.keys(paths).reduce((acc, key) => {
  const currentPaths = paths[key];

  if (currentPaths.length > 1) {
    logViteWarn(
      'Mutiple paths wont be handled and may need to be added manually to your vite.config file',
    );
  }

  const [currentPath] = currentPaths;
  const sanatize = (str: string) => str.replace('/*', '');
  const sanatizedKey = sanatize(key);
  const sanatizedPath = sanatize(currentPath);

  if (acc[sanatizedKey]) {
    logViteWarn(
      `alias ${key}: ${currentPath} once sanatized already exist: ${sanatizedKey}: ${acc[sanatizedKey]}`,
    );
    return acc;
  }

  return {
    ...acc,
    [sanatizedKey]: path.resolve(sanatizedPath),
  };
}, {});

export default defineConfig({
  build: {
    target: 'esnext', // Or a higher supported version
  },
  optimizeDeps: {
    exclude: [
      // Add any optional dependencies you want to exclude here
    ],
  },
  plugins: [
    graphqlLoader(),
    ...VitePluginNode({
      adapter: 'koa',
      appPath: './src/server.ts',
      exportName: 'saBusinessApiApp',
      tsCompiler: 'esbuild',
    }),
  ],
  resolve: {
    alias: aliases,
  },
  server: {
    port: 3001,
  },
});
