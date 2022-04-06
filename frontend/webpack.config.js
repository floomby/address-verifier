const resolve = require("path").resolve;
const webpack = require("webpack");

const config = {
  mode: "development",

  devServer: {
    static: ".",
  },

  entry: {
    app: resolve("./src/app"),
  },

  output: {
    library: "App",
  },

  devtool: "eval-source-map",

  resolve: {
    extensions: [".ts", ".tsx", ".js", ".json"],
    fallback: {
      stream: require.resolve("stream-browserify"),
      crypto: require.resolve("crypto-browserify"),
      assert: require.resolve("assert/"),
      http: require.resolve("stream-http"),
      https: require.resolve("https-browserify"),
      url: require.resolve("url/"),
      os: require.resolve("os-browserify/browser"),
    },
  },

  module: {
    rules: [
      {
        test: /\.(ts|js)x?$/,
        include: [resolve(".")],
        exclude: [/node_modules/],
        use: [
          {
            loader: "babel-loader",
            options: {
              presets: ["@babel/env", "@babel/react"],
            },
          },
          {
            loader: "ts-loader",
          },
        ],
      },
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader"],
      },
    ],
  },

  plugins: [
    new webpack.ProvidePlugin({
      Buffer: ["buffer", "Buffer"],
    }),
    new webpack.ProvidePlugin({
      process: "process/browser",
    }),
  ],
};

// Enables bundling against src in this repo rather than the installed version
module.exports = (env) =>
  env && env.local ? require("../webpack.config.local")(config)(env) : config;
