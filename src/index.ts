import { helloWorld, goodBye } from './functions';

// @ts-ignore
const { JSONMapper } = require('./JSONMapper');

export {  helloWorld, JSONMapper };

// Create an object containing all named exports
import * as namedExports from './index';
const npmPackage = {
  ...namedExports,
};
export default npmPackage;