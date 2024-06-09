import 'mocha';
import { assert } from 'chai';
let fs = require('fs');

import { JSONMapper } from '../src/index';

let jmap = new JSONMapper()

describe('Map JSON to other JSON.', () => {

  it('map an opject', () => {
    
    let files = fs.readdirSync('./tests/test_files');

    //read contents of each file
    for(let i = 0; i < files.length; i++){
      console.log(files[i])
      let file = files[i];
      let fileContents = fs.readFileSync('./tests/test_files/' + file, 'utf8');
      let obj = JSON.parse(fileContents)
      let filename = file.split('.')[0]
      //let only_inlcude = '_simplified'
      if(!obj.json_1 || !obj.mapping_1 || !obj.result_1 ) {//|| !filename.includes(only_inlcude)){
        continue;
      }
      let source = obj.json_1
      let mapping = obj.mapping_1
      let target = obj.result_1
      let mappedObj = jmap.applyMapping(source, mapping)
      if(JSON.stringify(mappedObj, null, 2) != JSON.stringify(target, null, 2)){
        console.log("ERROR: ##################" + file + "##################")
        console.log(JSON.stringify(source, null, 2))
        console.log(JSON.stringify(mapping, null, 2))
        console.log(JSON.stringify(target, null, 2))
        console.log(JSON.stringify(mappedObj, null, 2))
        console.log("##################" + "##################")
      }
      assert.deepEqual(mappedObj, target);
    }

  });

  it.skip('should map an embedding', () => {

    //open OpenAI_text-embedding-3-small.json
    let fileContents = fs.readFileSync('./tests/test_files/OpenAI_text-embedding-3-small.json', 'utf8');
    let obj = JSON.parse(fileContents)

    let promptdesk_embedding_input = {
      "text_list": ["text 1", "text 2", "text 3"]
    }

    let mapping = obj.request_mapping

    let target = {
        "input": ["text 1", "text 2", "text 3"],
        "model": "text-embedding-3-small"
    }

    let mappedObj = jmap.applyMapping(promptdesk_embedding_input, mapping)

    assert.deepEqual(mappedObj, target);

  });

  it.skip('should map an embedding', () => {

    //open OpenAI_text-embedding-3-small.json
    let fileContents = fs.readFileSync('./tests/test_files/OpenAI_text-embedding-3-small.json', 'utf8');
    let obj = JSON.parse(fileContents)

    let api_response = obj.api_response
    let mapping = obj.response_mapping
    let formatted_response = obj.formatted_response
    
    let mappedObj = jmap.applyMapping(api_response, mapping)

    assert.deepEqual(mappedObj, formatted_response);

  });

});