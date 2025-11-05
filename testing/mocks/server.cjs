// MSW server setup for Node environment (Jest tests)
const { setupServer } = require('msw/node');
const { handlers } = require('./handlers');

// This server is responsible for intercepting API calls during testing
const server = setupServer(...handlers);

module.exports = { server };
