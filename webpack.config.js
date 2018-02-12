const webpack = require('webpack');
const WebpackMd5Hash = require('webpack-md5-hash');
const AssetsPlugin = require('assets-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const BrowserSyncPlugin = require('browser-sync-webpack-plugin');
const WriteFilePlugin = require('write-file-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

const path = require('path');
const pkg = require('./package.json');

module.exports = {
    entry: {
      main: [
        './src/js/app.js',
        './src/js/controllers.js',
        './src/js/directives.js',
        './src/js/filters.js',
        './src/js/services.js'
      ],
      vendor: [
        './src/js/vendor/md5.min.js',
        './src/js/vendor/ng-knob.min.js',
        './src/js/vendor/xml2json.min.js',
        './src/js/vendor/yaml.min.js'
      ],
      vendor_node: Object.keys(pkg.dependencies)
    },
    devServer: {
      inline: true,
      hot: false
    },
    output: {
      path: path.resolve(__dirname, 'build'),
      filename: 'js/[name].js',
      chunkFilename: 'js/[name]-[chunkhash].js',
      jsonpFunction: 'webpackJsonp',
      // publicPath: '/js/'
    },
    plugins: [
      // Extract all 3rd party modules into a separate 'vendor' chunk
      new webpack.optimize.CommonsChunkPlugin({
        name: 'vendor_node',
        minChunks: ({ resource }) => /node_modules/.test(resource)
      }),

      new ExtractTextPlugin('[name].[chunkhash].css'),

      // Generate a 'manifest' chunk to be inlined in the HTML template
      new webpack.optimize.CommonsChunkPlugin('manifest'),

      // Need this plugin for deterministic hashing
      // until this issue is resolved: https://github.com/webpack/webpack/issues/1315
      // for more info: https://webpack.js.org/how-to/cache/
      new WebpackMd5Hash(),

      // Creates a 'webpack-assets.json' file with all of the
      // generated chunk names so you can reference them
      new AssetsPlugin(),

      new CopyWebpackPlugin([
            {from:'src/views',to:'views'},
            {from:'src/assets',to:'assets'},
            {from:'arduino/',to:'assets/arduino'},
            {from:'src/index.html',to:'index.html'},
            {from:'src/favicon.ico',to:'favicon.ico'},
            {from:'package.json',to:'package.json'},
            {from:'src/styles/app.css',to:'styles/app.css'},
            {from: './node_modules/angularjs-slider/dist/rzslider.min.css', to: 'styles/vendor.css'}
        ]),

      new webpack.ProvidePlugin({
        $: 'jquery',
        jQuery: 'jquery',
        'window.jQuery': 'jquery',
        Popper: ['popper.js', 'default'],
        // In case you imported plugins individually, you must also require them here:
        Util: "exports-loader?Util!bootstrap/js/dist/util",
        Dropdown: "exports-loader?Dropdown!bootstrap/js/dist/dropdown",
      }),

      new BrowserSyncPlugin(
        // BrowserSync options
        {
          // browse to http://localhost:3000/ during development
          host: 'localhost',
          port: 8000,
          // proxy the Webpack Dev Server endpoint
          // (which should be serving on http://localhost:3100/)
          // through BrowserSync
          // proxy: 'http://localhost:3100/',
          server: { baseDir: ['build'] }
        },
        // plugin options
        {
          // prevent BrowserSync from reloading the page
          // and let Webpack Dev Server take care of this
          reload: true
        }),

        new ExtractTextPlugin("styles/[name].css"),

        new WriteFilePlugin(),
    ],
    module: {
        loaders: [
          {
            test: /\.js$/,
            exclude: /node_modules/,
            loader: 'babel-loader'
        },
        {
          test: /\.html$/,
          include: [
            path.resolve('./src'),
            path.resolve('./src/views')
          ],
          loader: "html"
        },
        {
          test: /\.scss$/,
          include: path.resolve('./src/styles'),
          loader: ExtractTextPlugin.extract("style-loader", "css-loader!sass-loader")
        },
        {
          test: /\.css$/,
          loader: ExtractTextPlugin.extract("style-loader", "css-loader")
        }
      ]
    },
    node: {
      dns: 'mock',
      net: 'empty',
      dgram: 'empty'
    },
    devtool: '#inline-source-map'
};
