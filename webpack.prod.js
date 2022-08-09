const path = require("path");
const { merge } = require("webpack-merge");
const common = require("./webpack.common.js");
const packageJson = require("./package.json");

module.exports = merge(common, {
  mode: "production",
  entry: [path.join(__dirname, "src/viper.js")],
  output: {
    filename: `viper.bundle.${packageJson.version}.js`,
    library: "viper-charts",
    libraryTarget: "umd",
  },
});
