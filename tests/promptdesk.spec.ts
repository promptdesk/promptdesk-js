import 'mocha';
import { assert } from 'chai';

import { PromptDesk } from '../src/index';
import npmPackage from '../src/index';

let pd = new PromptDesk({
  apiKey: "51cc56c3f7658fec052ce93f5659be194771b136dae2d8ba",
  serviceUrl: "http://localhost:4000"
})


describe('NPM Package', () => {
  it('should be an object', () => {
    assert.isObject(npmPackage);
  });

  it('should have a PromptDesk property', () => {
    assert.property(npmPackage, 'PromptDesk');
  });
});

describe('Calls promptdesk', () => {

  it('should ping promptdesk', async () => {
    let result = await pd.ping()
    assert.equal(result, "pong");
  });

  it('should return an error for no key' , async () => {
    let pd_no_key = new PromptDesk({
      serviceUrl: "http://localhost:4000",
      apiKey: "INVALID_KEY"
    })
    //check if pd_no_key.generate("yoda-test") throws an error
    try {
      await pd_no_key.generate("yoda-test")
    } catch (error) {
      assert.equal(error, "Error: Invalid API Authorization");
    }
  });

  it('should generate a prompt', async function() {

    this.timeout(10000); // Set timeout to 10000 milliseconds (10 seconds)


    let result = await pd.generate("yoda-test")
    assert.isString(result);
    assert.isTrue(result.toLowerCase().includes("hello") || result.toLowerCase().includes("greetings"));
  });

  it('should list all prompts', async () => {
    let result = await pd.list()
    assert.isArray(result);
    assert.isAbove(result.length, 0);
  });

  it('should generate a prompt with variables', async function() {

    this.timeout(10000); // Set timeout to 10000 milliseconds (10 seconds)

    let result = await pd.generate("short-story-test", {
        "setting": "a dark and stormy night",
        "character": "a mysterious stranger",
        "plot": "knock on the door"
    })
    //check if result is a string with over 20 characters
    assert.isString(result);
    assert.isAbove(result.length, 20);
  });

  it('should classify a positive prompt correctly', async function() {

    this.timeout(10000); // Set timeout to 10000 milliseconds (10 seconds)

    let result = await pd.generate("is-positive-test", {
        "text": "I am super happy"
    }, {
        classification: {
            True: ["positive", "happy"],
            False: ["negative", "sad"]
        }
    });
    assert.isTrue(result);

  });

  it('should take very little time since the result is cached', async function() {

    this.timeout(10000); // Set timeout to 10000 milliseconds (10 seconds)
    
    let result = null;
    let startTime = Date.now();
  
    for (let x = 0; x < 100; x++) {
      result = await pd.generate("short-story-test", {
          "setting": "a dark and stormy night",
          "character": "a mysterious stranger",
          "plot": "knock on the door"
      }, { cache: true });
    }
  
    let endTime = Date.now();
    let duration = endTime - startTime;
    // Check if result is a string with over 20 words
    assert.isString(result);
  
    // Optionally, check if the loop executed quickly, which could imply caching is effective
    // Note: You might want to define what "very little time" quantitatively means for your test case
  });

})

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
