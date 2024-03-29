import { JSONMapper } from './JSONMapper';
import { PromptDesk } from './PromptDesk';

export { JSONMapper, PromptDesk };

// Create an object containing all named exports
import * as namedExports from './index';
const npmPackage = {
  ...namedExports,
};
export default npmPackage;