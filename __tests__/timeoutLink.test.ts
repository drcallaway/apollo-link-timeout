import TimeoutLink from '../src/timeoutLink';
import { ApolloLink, execute, Observable, HttpLink } from '@apollo/client/core';
import gql from 'graphql-tag';

const TEST_TIMEOUT = 100;

const timeoutLink: TimeoutLink = new TimeoutLink(TEST_TIMEOUT);

const query = gql`
{
  foo {
    bar
  }
}`;

let called: number;
let delay: number;

const mockLink = new ApolloLink(() => {
  called++;
  return new Observable(observer => {
    setTimeout(() => {
      observer.next({});
      observer.complete();
    }, delay);
  });
});

const link = timeoutLink.concat(mockLink);

beforeEach(() => {
  called = 0;
});

test('short request does not timeout', done => {
  delay = 50;

  execute(link, { query }).subscribe({
    next() {
      expect(called).toBe(1);
      done();
    },
    error() {
      expect('error called').toBeFalsy();
      done();
    }
  });
});

test('long request times out', done => {
  delay = 200;

  execute(link, { query }).subscribe({
    next() {
      expect('next called').toBeFalsy();
      done();
    },
    error(error) {
      expect(error.message).toEqual('Timeout exceeded');
      expect(error.timeout).toEqual(100);
      expect(error.statusCode).toEqual(408);
      done();
    }
  });
});

test('configured value through context does not time out', done => {
  delay = 200;
  const configured = 500;

  execute(link, { query, context: { timeout: configured } }).subscribe({
    next() {
      expect(called).toBe(1);
      done();
    },
    error() {
      expect('error called').toBeFalsy();
      done();
    }
  });
});

test('configured short value through context time out', done => {
  delay = 200;
  const configured = 100;

  execute(link, { query, context: { timeout: configured } }).subscribe({
    next() {
      expect('next called').toBeFalsy();
      done();
    },
    error(error) {
      expect(error.message).toEqual('Timeout exceeded');
      expect(error.timeout).toEqual(configured);
      expect(error.statusCode).toEqual(408);
      done();
    }
  });
});

test('aborted request does not timeout', done => {
  delay = 200;

  const controller = new AbortController();
  const fetchOptions = { controller, signal: controller.signal }

  controller.abort();

  execute(link, { query, context: { fetchOptions } }).subscribe({
    next() {
      expect(called).toBe(1);
      done();
    },
    error() {
      expect('error called').toBeFalsy();
      done();
    }
  });
});

test("HTTP multipart subscription stops when unsubscribed", (done) => {
  const subscription = gql`
    subscription {
      chunk
    }
  `;

  const Transform: typeof TransformStream =
    require("node:stream/web").TransformStream;
  const encoder = new TextEncoder();
  const stream = new Transform({
    transform(chunk, controller) {
      controller.enqueue(
        encoder.encode(chunk.trimLeft().replace(/\n/g, "\r\n"))
      );
    },
  });
  let finalSignal: AbortSignal | undefined;
  const terminalLink = timeoutLink.concat(
    new HttpLink({
    uri: "https://example.com/graphql",
      fetch: (_, { signal }) => {
        finalSignal = signal;
        return Promise.resolve(
        new Response(stream.readable, {
          status: 200,
          headers: { "content-type": "multipart/mixed" },
        })
        );
      },
    })
  );

  let events: Array<
    | { type: "next"; result: unknown }
    | { type: "done" }
    | { type: "error"; error: unknown }
  > = [];
  const subsciption = execute(terminalLink, { query: subscription }).subscribe({
    next: (result) => events.push({ type: "next", result }),
    error: (error) => events.push({ type: "error", error }),
    complete: () => events.push({ type: "done" }),
  });

  const writer = stream.writable.getWriter();

  writer.write(
    `
---
Content-Type: application/json

{"data":{"chunk": "first"}}
---
`
  );

  setTimeout(() => {
    expect(events).toStrictEqual([
      { type: "next", result: { data: { chunk: "first" } } },
    ]);
    subsciption.unsubscribe();

    setTimeout(() => {
      expect(finalSignal?.aborted).toBeTruthy();
      done();
    });
  }, 10);
});
