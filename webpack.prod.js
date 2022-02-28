const path = require("path");
const { merge } = require("webpack-merge");
const common = require("./webpack.common.js");

module.exports = merge(common, {
  mode: "production",
  entry: [path.join(__dirname, "src/viper.js")],
  output: {
    filename: "viper.bundle.js",
    library: "viper-charts",
    libraryTarget: "umd",
  },
});
