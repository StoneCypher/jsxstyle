import getStyleKeysForProps from './getStyleKeysForProps';
import addStyleToHead from './addStyleToHead';
import stringHash from './stringHash';

function cannotInject() {
  throw new Error(
    'jsxstyle error: `injectOptions` must be called before any jsxstyle components mount.'
  );
}

function alreadyInjected() {
  throw new Error(
    'jsxstyle error: `injectOptions` should be called once and only once.'
  );
}

function getStringHash(key) {
  return '_' + stringHash(key).toString(36);
}

export default function getStyleCache() {
  let _classNameCache = {};
  let getClassNameForKey = getStringHash;
  let onInsertRule = null;
  let pretty = false;

  const styleCache = {};

  styleCache.reset = () => {
    _classNameCache = {};
  };

  styleCache.injectOptions = options => {
    if (options) {
      if (options.getClassName) getClassNameForKey = options.getClassName;
      if (options.onInsertRule) onInsertRule = options.onInsertRule;
      if (options.pretty) pretty = options.pretty;
    }
    styleCache.injectOptions = alreadyInjected;
  };

  styleCache.getClassName = (props, classNameProp) => {
    styleCache.injectOptions = cannotInject;

    const styleObj = getStyleKeysForProps(props, pretty);
    if (typeof styleObj !== 'object' || styleObj === null) {
      return classNameProp || null;
    }

    const key = styleObj.classNameKey;
    if (!_classNameCache.hasOwnProperty(key)) {
      _classNameCache[key] = getClassNameForKey(key, props);
      delete styleObj.classNameKey;
      Object.keys(styleObj)
        .sort()
        .forEach(k => {
          const selector = '.' + _classNameCache[key];
          // prettier-ignore
          const { pseudoclass, pseudoelement, mediaQuery, styles } = styleObj[k];

          let rule =
            selector +
            (pseudoclass ? ':' + pseudoclass : '') +
            (pseudoelement ? '::' + pseudoelement : '') +
            ` {${styles}}`;

          if (mediaQuery) {
            rule = `@media ${mediaQuery} { ${rule} }`;
          }

          if (
            onInsertRule &&
            // if the function returns false, bail.
            onInsertRule(rule, props) === false
          ) {
            return;
          }
          addStyleToHead(rule);
        });
    }

    return _classNameCache[key] && classNameProp
      ? classNameProp + ' ' + _classNameCache[key]
      : _classNameCache[key] || classNameProp || null;
  };

  return styleCache;
}
