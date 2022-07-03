// webpack.config.js
const path = require('path');
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");

const BUNDLE_FOLDER_NAME = 'docs';

module.exports = {
    mode: 'development',
    devtool: 'eval-source-map',
    entry: {
        main: path.resolve(__dirname, './src/index.js'),
    },
    output: {
        path: path.resolve(__dirname, `./${BUNDLE_FOLDER_NAME}`),
        filename: '[name].bundle.js',
        publicPath: '/',
        clean: true,
    },
    resolve: {
        extensions: ['.js'],
        alias: {
            "@modules": path.resolve(__dirname, './src/modules/')
        }
    },
    devServer: {
        static: `./${BUNDLE_FOLDER_NAME}`,
        hot: true,
    },
    optimization: {
        runtimeChunk: 'single',
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: 'src/index.html'
        }),
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: path.resolve(__dirname, "src", "styles.css"),
                    to: path.resolve(__dirname, BUNDLE_FOLDER_NAME, "styles.css")
                },
            ],
        }),
    ],
};