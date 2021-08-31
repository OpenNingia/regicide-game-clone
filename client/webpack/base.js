const webpack = require("webpack");
const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const WorkboxPlugin = require('workbox-webpack-plugin');
const WebpackPwaManifest = require('webpack-pwa-manifest')
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
    mode: "development",
    devtool: "eval-source-map",
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: "babel-loader"
                }
            },
            {
                test: [/\.vert$/, /\.frag$/],
                use: "raw-loader"
            },
            {
                test: /\.(gif|png|jpe?g|svg|xml)$/i,
                use: "file-loader"
            }
        ]
    },
    plugins: [
        new CleanWebpackPlugin({
            root: path.resolve(__dirname, "../")
        }),
        new webpack.DefinePlugin({
            CANVAS_RENDERER: JSON.stringify(true),
            WEBGL_RENDERER: JSON.stringify(true)
        }),
        new HtmlWebpackPlugin({
            template: "./index.html"
        }),
        new WorkboxPlugin.GenerateSW({
            // these options encourage the ServiceWorkers to get in there fast
            // and not allow any straggling "old" SWs to hang around
            clientsClaim: true,
            skipWaiting: true,
        }),
        new WebpackPwaManifest({
            name: 'Regicide Clone',
            short_name: 'Regicide',
            description: 'A digital clone of the regicide board game.',
            background_color: '#ffffff',
            crossorigin: 'use-credentials', //can be null, use-credentials or anonymous
            icons: [
                {
                    src: path.resolve('icons/icon-192.png'),
                    sizes: [96, 128, 192, 256, 384, 512] // multiple sizes
                }
            ]
        }),
        new CopyWebpackPlugin([
            { from: './src/assets', to: 'src/assets' }
        ])
    ]
};
