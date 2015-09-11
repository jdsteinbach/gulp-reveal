var fs = require('fs')
var gutil = require('gulp-util')
var through = require('through2')
var mustache = require('mustache')

function reveal (content, options, callback) {
  var view = options
  var slides = ''
  content.split(/\<h2/gi).forEach(function (slide, i) {
    var state = ''
    if (slide.match(/<h2.*\?<\/h2>/)) {
      // state = ' data-state="q"'
    } else if (slide.indexOf('<h2') !== -1) {
      // state = ' data-state="title"'
    }

    if (i === 0 && !view.title) {
      view.title = slide.replace(/\<h1.*\>(.*)\<(.|\n)*/g, '$1')
    }

    if (slide.indexOf('<') > 0) {
      slide = '\n<h2' + slide
    }

    var subslides = ''
    if (slide.indexOf('<h3') !== -1) {
      slide.split('<h3').forEach(function (subslide, i) {
        if (subslide.indexOf('\n<') > 0) {
          subslide = '\n<h3' + subslide
        }
        subslides = subslides.concat('\n<section>\n' + subslide + '\n</section>\n')
      })
    }

    if (subslides.length > 1) {
      slides = slides.concat('\n<section>\n' + subslides + '\n</section>\n')
    } else {
      slides = slides.concat('\n<section>\n' + slide + '\n</section>\n')
    }
  })
  view.slides = slides
  var template = fs.readFileSync(__dirname + '/template.mustache', 'utf8')
  var data = mustache.to_html(template, view)
  callback(null, data)
}

module.exports = function (options) {
  return through.obj(function (file, enc, cb) {
    if (file.isNull()) {
      this.push(file)
      return cb()
    }

    if (file.isStream()) {
      this.emit('error', new gutil.PluginError('gulp-reveal', 'Streaming not supported'))
      return cb()
    }

    reveal(file.contents.toString(), options, function (err, data) {
      if (err) {
        this.emit('error', new gutil.PluginError('gulp-reveal', err))
      } else {
        file.contents = new Buffer(data)
        file.path = gutil.replaceExtension(file.path, '.html')
      }

      this.push(file)
      cb()
    }.bind(this))
  })
}