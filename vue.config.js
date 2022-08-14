module.exports = {
  configureWebpack: {
    output: {
      libraryExport: 'default'
    }
  },
  css: {
    sourceMap: true,
    extract: false
  },
  outputDir: 'docs',
  publicPath: process.env.NODE_ENV === 'production' ?
    '/uploader/' : '/',

}