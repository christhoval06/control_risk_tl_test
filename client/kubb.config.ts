import { defineConfig } from 'kubb/config';
import { pluginAxios } from '@kubb/plugin-axios';
import { pluginReactQuery } from '@kubb/plugin-react-query';
import { pluginTs } from '@kubb/plugin-ts';

export default defineConfig({
  input: '../docs/swagger.json',
  output: {
    path: './src/__generated__',
    clean: true,
  },
  plugins: [
    pluginTs({ output: { path: 'types.ts' } }),
    pluginAxios({
      output: { path: 'client', mode: 'directory' },
      group: { type: 'tag' },
    }),
    pluginReactQuery({
      output: { path: 'hooks', mode: 'directory' },
      group: { type: 'tag' },
      client: 'axios',
      hooks: true,
      exclude: [{ type: 'operationId', pattern: 'streamTaskStatusUpdates' }],
    }),
  ],
});
