module.exports = {
  webpack: {
    configure: (webpackConfig, { env, paths }) => {
      return {
        ...webpackConfig,
        entry: {
          main: [
            env === 'development' &&
              require.resolve('react-dev-utils/webpackHotDevClient'),
            paths.appIndexJs,
          ].filter(Boolean),
          leetcode: './src/scripts/leetcode.ts',
          background: './src/background.ts',
          'authorize-github': './src/scripts/authorize-github.ts',
        },
        output: {
          ...webpackConfig.output,
          filename: 'static/scripts/[name].js',
        },
        optimization: {
          ...webpackConfig.optimization,
          runtimeChunk: false,
        },
      };
    },
  },
};
