const path = require("path");
const regeneratorRuntime = require("regenerator-runtime/runtime");

module.exports = {
  entry: ["regenerator-runtime/runtime.js"],
  output: {
    path: path.join(__dirname, "dist"),
    clean: true,
  },
  resolve: {
    preferRelative: true,
    modules: [path.resolve(__dirname, "src"), "node_modules"],
  },
  devServer: {
    hot: true,
    liveReload: true,
    static: {
      directory: path.join(__dirname, "public"),
    },
    watchFiles: ["src/**"],
    port: 8080,
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: ["babel-loader"],
      },
      {
        test: /\.(css|scss)$/,
        use: ["style-loader", "css-loader"],
      },
      {
        test: /\.(jpg|jpeg|png|gif|mp3|svg)$/,
        use: ["file-loader"],
      },
      {
        test: /\.worker\.js$/,
        use: {
          loader: "worker-loader",
          options: {
            name: "[name].[hash:8].js",
            inline: true,
            publicPath: "/dist",
            fallback: false,
          },
        },
      },
    ],
  },
};
