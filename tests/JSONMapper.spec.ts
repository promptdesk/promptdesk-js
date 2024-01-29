import 'mocha';
import { assert } from 'chai';
let fs = require('fs');

import { JSONMapper } from '../src/index';

let jmap = new JSONMapper()

describe('JSON Mapper Loop', () => {

  it('map an opject', () => {
    
    let files = fs.readdirSync('./tests/test_files');
    
    //read contents of each file
    for(let i = 0; i < files.length; i++){
      let file = files[i]
      let fileContents = fs.readFileSync('./tests/test_files/' + file, 'utf8');
      let obj = JSON.parse(fileContents)
      let source = obj.json_1
      let mapping = obj.mapping_1
      let target = obj.result_1
      let mappedObj = jmap.applyMapping(source, mapping)
      if(JSON.stringify(mappedObj, null, 2) != JSON.stringify(target, null, 2)){
        console.log("##################" + file + "##################")
        console.log(JSON.stringify(source, null, 2))
        console.log(JSON.stringify(mapping, null, 2))
        console.log(JSON.stringify(target, null, 2))
        console.log(JSON.stringify(mappedObj, null, 2))
        console.log("##################" + "##################")

      }
      assert.deepEqual(mappedObj, target);
    }

  });

});