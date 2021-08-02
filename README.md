# postcss-rem-adaptive

A [postcss](https://www.npmjs.com/package/postcss) plugin that calculates and generates adaptive css code, such as `rem` and `0.5px borders for retina devices`.

> refer to [postcss-adaptive](https://github.com/songsiqi/postcss-adaptive)

> support PostCSS v8

> fix [postcss-adaptive](https://github.com/songsiqi/postcss-adaptive) source map lost issues


## Table of Contents

* [Requirements](#requirements)
* [Usage](#usage)

## Requirements

Set rem unit and hairline class. For example:

```javascript
(function (win, doc) {
  const docEl = doc.documentElement;

  function setRemUnit () {
    const docWidth = docEl.clientWidth;
    const rem = docWidth / 10;
    docEl.style.fontSize = rem + 'px';
  }

  win.addEventListener('resize', () => {
    setRemUnit();
  }, false);
  win.addEventListener('pageshow', (e) => {
    if (e.persisted) {
      setRemUnit();
    }
  }, false);

  setRemUnit();

  if (win.devicePixelRatio && win.devicePixelRatio >= 2) {
    const testEl = doc.createElement('div');
    const fakeBody = doc.createElement('body');
    testEl.style.border = '0.5px solid transparent';
    fakeBody.appendChild(testEl);
    docEl.appendChild(fakeBody);
    if (testEl.offsetHeight === 1) {
      docEl.classList.add('hairlines');
    }
    docEl.removeChild(fakeBody);
  }
}) (window, document);
```

## Usage

The raw stylesheet only contains @2x style, and if you

* intend to use `rem` unit，add `/*rem*/` after the declaration
* don't intend to transform the original value, add `/*no*/` after the declaration
* intend to use `px` unit when `autoRem` is set to `true`, add `/*px*/` after the declaration

**Attention: Dealing with SASS or LESS, only `/*...*/` comment can be used, in order to have the comments persisted.**

Before processing:

```css
.selector {
  height: 64px;
  width: 150px; /*rem*/
  padding: 10px; /*no*/
  border-top: 1px solid #ddd;
}
```

After processing:

```css
.selector {
  height: 32px;
  width: 2rem;
  padding: 10px;
  border-top: 1px solid #ddd;
}
.hairlines .selector {
  border-top: 0.5px solid #ddd;
}
```

### API

`adaptive(config)`

Config: 

* `remUnit`: number, rem unit value (default: 75)
* `baseDpr`: number, base device pixel ratio (default: 2)
* `remPrecision`: number, rem value precision (default: 6)
* `hairlineClass`: string, class name of 1px border (default 'hairlines')
* `autoRem`: boolean, whether to transform to rem unit (default: false)

#### Node

```shell
npm install postcss-rem-adaptive
```

```javascript
var postcss = require('postcss');
var adaptive = require('postcss-rem-adaptive');
var originCssText = '...';
var newCssText = postcss().use(adaptive({ remUnit: 75 })).process(originCssText).css;
```

#### Gulp

```javascript
var gulp = require('gulp');
var postcss = require('gulp-postcss');
var adaptive = require('postcss-rem-adaptive');

gulp.task('default', function () {
  var processors = [adaptive({ remUnit: 75 })];
  return gulp.src('./src/*.css')
    .pipe(postcss(processors))
    .pipe(gulp.dest('./dest'));
});
```

#### Webpack

```javascript
var adaptive = require('postcss-rem-adaptive');

module.exports = {
  module: {
    loaders: [
      {
        test: /\.css$/,
        loader: "style-loader!css-loader!postcss-loader"
      }
    ]
  },
  postcss: function () {
    return [adaptive({ remUnit: 75 })];
  }
}
```
