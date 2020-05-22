var path = require('path');
var HtmlWebpackPlugin = require('html-webpack-plugin');
const Dir = {
    SRC: path.resolve(__dirname, 'src')
}

module.exports = {
    entry: './src/index.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'bundle.js'
    },
    module: {
        rules: [
            { test: /\.(js)$/, use: 'babel-loader' },
            { test: /\.css$/, use: ['style-loader', 'css-loader'] },
            {
                test: /\.(mp3|wav|ogg)$/,
                include: Dir.SRC,
                loader: 'file-loader'
            }
        ]
    },
    mode: 'development',
    plugins: [
        new HtmlWebpackPlugin({
            template: './index.html'
        })
    ]

}