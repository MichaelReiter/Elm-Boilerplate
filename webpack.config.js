const path              = require('path')
const webpack           = require('webpack')
const merge             = require('webpack-merge')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const autoprefixer      = require('autoprefixer')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const entryPath         = path.join(__dirname, 'src/static/index.js')
const outputPath        = path.join(__dirname, 'dist')

// Determine build env
const TARGET_ENV = process.env.npm_lifecycle_event === 'build' ? 'production' : 'development'
const outputFilename = TARGET_ENV === 'production' ? '[name]-[hash].js' : '[name].js'

// Common webpack config
const commonConfig = {
  output: {
    path: outputPath,
    filename: `/static/js/${outputFilename}`
  },
  resolve: {
    extensions: ['', '.js', '.elm']
  },
  module: {
    noParse: /\.elm$/,
    loaders: [
      {
        test: /\.(eot|ttf|woff|woff2|svg)$/,
        loader: 'file-loader'
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: 'src/static/index.html',
      inject: 'body',
      filename: 'index.html'
    })
  ],
  postcss: [ autoprefixer({ browsers: ['last 2 versions'] }) ]
}

// Additional webpack settings for local env (when invoked by 'npm start')
if (TARGET_ENV === 'development') {
  console.log('Serving locally...')
  module.exports = merge(commonConfig, {
    entry: [
      'webpack-dev-server/client?http://localhost:8080',
      entryPath
    ],
    devServer: {
      // Serve index.html in place of 404 responses
      historyApiFallback: true,
      contentBase: './src',
    },
    module: {
      loaders: [
        {
          test: /\.elm$/,
          exclude: [/elm-stuff/, /node_modules/],
          loader: 'elm-hot!elm-webpack?verbose=true&warn=true&debug=true'
        },
        {
          test: /\.sass$/,
          loaders: ['style', 'css', 'sass']
        },
        {
          test: /\.css$/,
          loader: 'style!css?importLoaders=1!postcss'
        }
      ]
    }
  })
}

// Additional webpack settings for prod env (when invoked via 'npm run build')
if (TARGET_ENV === 'production') {
  console.log('Building for production...')
  module.exports = merge(commonConfig, {
    entry: entryPath,
    module: {
      loaders: [
        {
          test: /\.elm$/,
          exclude: [/elm-stuff/, /node_modules/],
          loader: 'elm-webpack'
        },
        {
          test: /\.(css|sass)$/,
          loader: ExtractTextPlugin.extract('style-loader', [
            'css-loader',
            'postcss-loader',
            'sass-loader'
          ])
        }
      ]
    },
    plugins: [
      new CopyWebpackPlugin([
        {
          from: 'src/static/img/',
          to: 'static/img/'
        },
      ]),
      new webpack.optimize.OccurenceOrderPlugin(),
      // Extract CSS into a separate file
      new ExtractTextPlugin('static/css/[name]-[hash].css', { allChunks: true }),
      // Minify JS/CSS
      new webpack.optimize.UglifyJsPlugin({
        minimize: true,
        compressor: { warnings: false }
      })
    ]
  })
}
