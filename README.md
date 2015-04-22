# jsxstyle

## The problem

  * Vjeux sums up a lot of problems with CSS here: http://blog.vjeux.com/2014/javascript/react-css-in-js-nationjs.html
  * The problem with `StyleSheet.create()` is you're not colocating your style with where it's used for no reason. If you're making a style component, the styles belong on props. Stylesheets shouldn't be used for reuse. The ideal API is to build inline styles w/ JavaScript, using components for reuse, and the power of JS expressions to compute styles (and share constants) where needed.
  * The problem with inline styles everywhere is browsers aren't optimized for it (at the very least it's risky). It also makes the web inspector harder to use since you can't update all instances of a component on the page simultaneously.

## The solution

### Provide a nice inline style API

```js

var {Block, Flex, InlineBlock, rgb} = require('jsxstyle');
var Theme = require('./MyTheme');

var hovered = false; // This could be dynamic

var avatar = (
  <Flex width={Theme.GRID_UNIT * 10} marginLeft="auto" marginRight="auto" alignItems="center">
    <img src="..." />
    <Block marginLeft={Theme.GRID_UNIT} color={Theme.primaryColor} background={hovered && rgb(255, 0, 0)}>
      <InlineBlock fontWeight="bold">Username here</InlineBlock>
      subtitle here
    </Block>
  </Flex>
);
```

Look at how nice this is. You don't have to jump from stylesheet to code to make changes. It's also very clear exactly what's going on, and very predictable since you aren't relying on cascade as much. You can also wrap much of this styling up into a helper component, so users only see `<MediaBlock image="..."><EmphText>Username here</EmphText>subtitle here</MediaBlock>`.

Another nice thing is you can lint this, hell, if you have a powerful enough type system you can type check it, minify it, whatever. This does for CSS what React did for HTML.

### Convert this nice API to traditional React with inline styles

```js
var avatar = (
  <div style={{
    display: 'flex',
    width: Theme.GRID_UNIT * 10,
    marginLeft: 'auto',
    marginRight: 'auto',
    alignItems: 'center'
  }}>
    <img src="..." />
    <div style={{
      marginLeft: Theme.GRID_UNIT,
      color: Theme.primaryColor,
      background: hovered && rgb(255, 0, 0)
    }}>
      <span style={{fontWeight: 'bold'}}>Username here</span>
      subtitle here
    </div>
  </div>
);
```

This is just a straightforward transformation into the React of today.

### Extract the literal CSS into a stylesheet

The problem with the above example is React has to do a lot of extra work diffing a bunch of style properties that we know won't ever change. Since some of the parameters are expressions [magic Babel optimizations](https://github.com/babel/babel/issues/653) won't be able to help either.

Also if you want to edit some of these properties in the web inspector, it won't edit all instances of the component.

We can take remedy this by pulling the literal CSS (i.e. the constant string and integer properties) into a stylesheet with autogenerated classnames. This is often the majority of your CSS.

```js
var avatar = (
  <div style={{width: Theme.GRID_UNIT * 10}} className="c1">
    <img src="..." />
    <div style={{
      marginLeft: Theme.GRID_UNIT,
      color: Theme.primaryColor,
      background: hovered && rgb(255, 0, 0)
    }}>
      <span className="c2">Username here</span>
      subtitle here
    </div>
  </div>
);
```

```css
.c1 {
  display: flex;
  margin-left: auto;
  margin-right: auto;
  align-items: center;
}

.c2 {
  font-weight: bold;
}

```

### Tell the static analyzer about your constants

The previous step helped, but there's a lot of inline styles left since we have some expressions in the style object. What I found building with this technique is that most expressions are simple arithmetic and string concats on constants that are known at build time. If we can tell our static analyzer about the `Theme` object, it can substitute the grid unit, color palette, and typography at build time, evaluate the expression, and move it into the stylesheet.

```js
var avatar = (
  <div className="c1">
    <img src="..." />
    <div style={{background: hovered && rgb(255, 0, 0)}} className="c3">
      <span className="c2">Username here</span>
      subtitle here
    </div>
  </div>
);
```

```css
.c1 {
  display: flex;
  margin-left: auto;
  margin-right: auto;
  align-items: center;
  width: 100px; /* from Theme.js evaluated at build time */
}

.c2 {
  font-weight: bold;
}

.c3 {
  marginLeft: 10px; /* from Theme.js evaluated at build time */
  color: red; /* from Theme.js evaluated at build time */
}

```

### Make the generated CSS nicer

Since this is built on AST transformation, we can make the CSS pretty nice and *more* debuggable than traditional techinques:

```css
.example_js__1 {
  /* example.js:2 */
  display: flex;
  margin-left: auto;
  margin-right: auto;
  align-items: center;
  width: 100px;
}

.example_js__2 {
  /* example.js:5 */
  font-weight: bold;
}

.example_js__3 {
  /* example.js:4 */
  marginLeft: 10px;
  color: red;
}

```

### Optimize generated CSS

Since every component has exactly one unique class name corresponding to its lexical position and does not rely on cascade, you're free to run optimization on the generated CSS. For example, if you have a few different CSS classes that happen to have the same CSS properties, simply throw out all but one, and rewrite the references to the classes you threw out to the one you kept.

To be fair, this isn't a property of using inline styles, but a property of a system that treats CSS like the hostile render target it is and abstracts it away from you.

I don't have an optimizer built, but the primitive `jsxstyle/renameClass` is included which can be used by an optimizer.

## Try it

Check out the `example/` directory for a bad example. Be sure to inspect the DOM, particularly `<head>`! In `webpack.config.js` you can swap out the webpack loader and it will magically fall back to inline styles for everything instead of extracting out a static stylesheet.

## Open areas of work

  * The reference webpack loader is hacky, exposes internal paths, is not optimized for production, and doesn't work with `extract-text-plugin`.
  * Media queries / pseudoclasses: `<Block width={128} width-iphone={32}>...</Block>`?
  * Accidentally making a property dynamic is too easy right now. Maybe require explicitly opting into dynamism with a sentinel: `<Block background={jsxstyle.dynamic(hovered ? ... : ...)}>`?

## FAQ

### This isn't semantic

Who cares? Search engines generally don't, and semantic tags don't get you accessibility for free. Instead of making our style components less expressive, we need [better tooling for accessibility](https://youtu.be/z5e7kWSHWTg?t=10m37s) instead.

Additionally, how many times have you put a `<div>` on the page just to build a layout or add aborder? That's what these components are replacing, not nodes that should contain meaningful content for accessibility (i.e. use unstyled `<article>`s with a CSS reset).

### What about repeated styles?

You should create styled components and reuse those rather than reuse class names. You'll end up with more (tiny) React components like `<PrimaryText>` and `<SecondaryText>` and `<StackLayout>`, but your product engineers will end up writing very little CSS. CSS classes aren't that great for reuse anyway, since they aren't encapsulated and can't specify behavior

### What about re-theming off-the-shelf components?

This is a bug in CSS, not a feature. With CSS, any stylesheet can change any part of any component, even if it's a private implementation detail. With `jsxstyle`, you should make the customizable characteristcs part of the component's public API. This may mean passing component classes into reusable components via props. If this starts to get cumbersome, guess what, this is just *dependency injection*, which is a very well-understood problem and there's lots of tools to help.

I should probably have a good example of a DI solution that works here, but I don't yet (sorry!). You could probably do something super questionable with component classes on `this.context`, but you didn't hear it from me.

### Is this in production?

I've built a moderately sized app with it used by customer, but it's not at huge scale yet.