const JSDOMEnvironment = require("jest-environment-jsdom").default;

class MyJSDOMEnvironment extends JSDOMEnvironment {
  constructor(...args) {
    super(...args);
    this.global.Request = Request;
    this.global.Response = Response;
    this.global.fetch = fetch;
    this.global.TextEncoder = TextEncoder;
    this.global.TextDecoder = TextDecoder;
  }
}

module.exports = MyJSDOMEnvironment;
