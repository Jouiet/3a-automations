/**
 * Remotion Configuration - 3A Automation Studio
 * @see https://www.remotion.dev/docs/config
 * Updated for Remotion v4.0+
 */
import { Config } from '@remotion/cli/config';

// Concurrency for rendering (adjust based on CPU cores)
Config.setConcurrency(4);

// Webpack override for CSS support
Config.overrideWebpackConfig((currentConfiguration) => {
  return {
    ...currentConfiguration,
    module: {
      ...currentConfiguration.module,
      rules: [
        ...(currentConfiguration.module?.rules ?? []),
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader', 'postcss-loader'],
        },
      ],
    },
  };
});
