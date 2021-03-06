'use strict';

const parse = require('../utils/ast/parse');
const generate = require('../utils/ast/generate');

// parse helper
const p = (code, plugins) => generate(parse(code, plugins || [])).code;

// TODO: better examples for Typescript/Flow

it('can parse Typescript', function() {
  const code = `import * as React from 'react';
import { Block } from 'jsxstyle';
export interface ThingProps {
  thing1: string;
  thing2?: boolean;
}
export const Thing: React.SFC<ThingProps> = props => <Block />;`;

  expect(p(code, ['typescript'])).toEqual(code);
});

it('can parse Flow', function() {
  const code = `import * as React from 'react';
import { Block } from 'jsxstyle';
type Props = {
  foo: number,
  bar?: string,
};

class MyComponent extends React.Component<Props> {
  render() {
    this.props.doesNotExist;
    return <div>{this.props.bar}</div>;
  }

}`;

  expect(p(code, ['flow'])).toEqual(code);
});

it('can parse class properties', function() {
  const code = `class Thing {
  state = {};
  wow = p => {};
}`;

  expect(p(code)).toEqual(code);
});
