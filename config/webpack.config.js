const CompressionPlugin = require('compression-webpack-plugin');
const CopyPlugin = require("copy-webpack-plugin");
const {CleanWebpackPlugin} = require("clean-webpack-plugin");
const HardSourceWebpackPlugin = require("hard-source-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const path = require("path");
const TerserPlugin = require("terser-webpack-plugin");

const CURRENT_WORKING_DIR = process.cwd();
const DEFAULT_PORT = 8080;
const DEFAULT_SERVER_URL = "http://localhost:3030";

module.exports = (env, argv) => {
  // Use user-specified port; if none was given, fall back to the default
  // If the default port is already in use, webpack will automatically use
  // the next available port

  let clientP = process.env.CLIENT;

  // The url the server is running on; if none was given, fall back to the default
  let serverUrl;
  if (process.env.SERVER != undefined) {
    serverUrl = `http://localhost:${process.env.SERVER}`;
  } else {
    console.warn(
      `No server url specified. Expecting server to run on ${DEFAULT_SERVER_URL}`,
    );
    serverUrl = DEFAULT_SERVER_URL;
  }

  return {
    context: path.resolve(CURRENT_WORKING_DIR, "client"),
    entry: {
      main: "./index.js",
    },
    output: {
      filename:
        argv.mode === "development" ? "[name].js" : "[name].[contenthash].js",
      chunkFilename: "[name].chunk.js",
      path: path.resolve(CURRENT_WORKING_DIR, "dist"),
      publicPath: "/",
      pathinfo: false,
    },

    devtool:
      argv.mode === "development" ? "cheap-module-source-map" : "source-map",

    resolve: {
      extensions: ["*", ".js", ".jsx"],
    },

    module: {
      rules: [
        {
          test: /\.(js|jsx)$/,
          exclude: /node_modules/,
          use: ["babel-loader"],
        },
        {
          test: /\.css$/,
          use: ["style-loader", "css-loader"],
        },
        {
          test: /\.(eot|svg|ttf|woff|woff2)$/,
          use: ["file-loader"]
        },
      ],
    },

    plugins: [
      new CleanWebpackPlugin(),
      new HtmlWebpackPlugin({
        filename: "index.html",
        template: path.resolve(CURRENT_WORKING_DIR, "public/index.html"),
      }),
      new HardSourceWebpackPlugin(),
      new CompressionPlugin({
        filename: '[path].gz[query]',
        algorithm: 'gzip',
        test: /\.js$|\.css$|\.html$/,
        threshold: 10240,
        minRatio: 0.8,
      }),
      new CopyPlugin({
        "patterns": [
          {
            from: path.resolve(CURRENT_WORKING_DIR, "client/assets"),
            to: path.resolve(CURRENT_WORKING_DIR, "dist/assets"),
          }
        ]
      }),
    ],

    devServer: {
      port: clientP,
      stats: {
        colors: true,
      },
      publicPath: "/",
      compress: true,
      overlay: {
        warnings: true,
        errors: true,
      },
      disableHostCheck: true,
      progress: true,
      stats: "errors-only",
      open: true,
      contentBase: path.join(CURRENT_WORKING_DIR, "public"),
      watchContentBase: true,
      watchOptions: {
        ignored: /node_modules/,
      },
      historyApiFallback: true,
      proxy: {
        "/api": serverUrl,
      },
      hot: true,
    },
    optimization: {
      runtimeChunk: "single",
      minimizer: [new TerserPlugin()],
      minimize: true,
      splitChunks: {
        chunks: "all",
        minSize: 30000,
        maxSize: 0,
        minChunks: 1,
        maxAsyncRequests: 5,
        maxInitialRequests: 3,
        automaticNameDelimiter: "~",
        name: true,
        cacheGroups: {
          vendors: {
            test: /[\\/]node_modules[\\/]/,
            priority: -10,
          },
          default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true,
          },
        },
      },
    },
    node: {
      fs: "empty",
    },
  };
};
