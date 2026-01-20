/**
 * MSW Server configuration for Node.js tests
 * @description Sets up MSW server for integration tests
 */
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

// Setup MSW server with handlers
export const server = setupServer(...handlers);

// Helper to reset handlers between tests
export const resetHandlers = () => server.resetHandlers();

// Helper to add runtime handlers for specific test scenarios
export const addHandler = server.use.bind(server);

export default server;
