import 'mocha';
import { assert } from 'chai';

import { helloWorld, JSONMapper, PromptDesk } from '../src/index';
import npmPackage from '../src/index';

let pd = new PromptDesk({
  apiKey: "1234",
  serviceUrl: "5678"
})

describe('NPM Package', () => {
  it('should be an object', () => {
    assert.isObject(npmPackage);
  });

  it('should have a helloWorld property', () => {
    assert.property(npmPackage, 'helloWorld');
  });
});

describe('Hello World Function', () => {
  it('should be a function', () => {
    assert.isFunction(helloWorld);
  });

  it('should return the hello world message', () => {
    const expected = 'Hello World from my example modern npm package!';
    const actual = helloWorld();
    assert.equal(actual, expected);
  });
});

describe('Convert string to object.', () => {

  it('should convert a string to an object', () => {
    assert.deepEqual(pd.convertToObject('{"a": 1}'), {a: 1});
    assert.deepEqual(pd.convertToObject(`{&apos;a&apos;:\n\n\n\t\t \t
      1}`), {a: 1});
    assert.deepEqual(pd.convertToObject("[1, 2, 3]"), [1, 2, 3]);
    assert.deepEqual(pd.convertToObject("     [1, 2   , 3    ]   "), [1, 2, 3]);
    assert.deepEqual(pd.convertToObject("{\"a\": 1}"), {a: 1});
  })

});
