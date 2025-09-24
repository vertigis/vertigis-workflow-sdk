import defaultWebpackConfig from "@vertigis/workflow-sdk/config/webpack.config.js";
import { merge } from "webpack-merge";

export default merge(defaultWebpackConfig, {
    // Add custom webpack configuration for your project here.
});
