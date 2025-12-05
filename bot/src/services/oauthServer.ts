import Fastify from 'fastify';
import { config } from '../config/env.js';
import { verifySteamCallback, linkDiscordToSteam } from './steamAuth.js';

/**
 * Pending link requests
 * Maps state token to Discord user ID
 */
const pendingLinks = new Map<string, { discordId: string, timestamp: number }>();

/**
 * Create OAuth callback server
 */
export async function createOAuthServer() {
  const fastify = Fastify({
    logger: {
      level: config.isDevelopment ? 'info' : 'warn',
    },
  });

  /**
   * Steam OAuth callback endpoint
   */
  fastify.get('/auth/steam/callback', async (request, reply) => {
    const fullUrl = `${config.steam.callbackUrl}${request.url}`;

    try {
      // Verify the Steam OpenID callback
      const steam64 = await verifySteamCallback(fullUrl);

      if (!steam64) {
        return reply.type('text/html').send(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Authentication Failed</title>
              <style>
                body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f5f5f5; }
                .container { background: white; padding: 30px; border-radius: 10px; max-width: 500px; margin: 0 auto; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                h1 { color: #e74c3c; }
                p { color: #666; }
              </style>
            </head>
            <body>
              <div class="container">
                <h1>❌ Authentication Failed</h1>
                <p>Could not verify your Steam account. Please try again.</p>
                <p>You can close this window and return to Discord.</p>
              </div>
            </body>
          </html>
        `);
      }

      // Extract state from query parameters to find Discord user
      const state = (request.query as Record<string, string>)['openid.state'];

      if (!state) {
        return reply.type('text/html').send(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Invalid Request</title>
              <style>
                body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f5f5f5; }
                .container { background: white; padding: 30px; border-radius: 10px; max-width: 500px; margin: 0 auto; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                h1 { color: #e74c3c; }
                p { color: #666; }
              </style>
            </head>
            <body>
              <div class="container">
                <h1>❌ Invalid Request</h1>
                <p>Missing state parameter. Please use the /link command in Discord.</p>
                <p>You can close this window.</p>
              </div>
            </body>
          </html>
        `);
      }

      const pending = pendingLinks.get(state);

      if (!pending) {
        return reply.type('text/html').send(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Session Expired</title>
              <style>
                body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f5f5f5; }
                .container { background: white; padding: 30px; border-radius: 10px; max-width: 500px; margin: 0 auto; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                h1 { color: #f39c12; }
                p { color: #666; }
              </style>
            </head>
            <body>
              <div class="container">
                <h1>⏱️ Session Expired</h1>
                <p>Your authentication session has expired. Please use the /link command in Discord again.</p>
                <p>You can close this window.</p>
              </div>
            </body>
          </html>
        `);
      }

      // Link the accounts
      await linkDiscordToSteam(pending.discordId, steam64);

      // Clean up
      pendingLinks.delete(state);

      return reply.type('text/html').send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Success!</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f5f5f5; }
              .container { background: white; padding: 30px; border-radius: 10px; max-width: 500px; margin: 0 auto; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
              h1 { color: #27ae60; }
              p { color: #666; }
              .steam-id { background: #ecf0f1; padding: 10px; border-radius: 5px; font-family: monospace; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>✅ Successfully Linked!</h1>
              <p>Your Discord account has been linked to Steam!</p>
              <div class="steam-id">Steam64: ${steam64}</div>
              <p>You can now close this window and return to Discord.</p>
              <p>Use <code>/whoami</code> to check your linked account.</p>
            </div>
          </body>
        </html>
      `);
    } catch (error) {
      request.log.error(error, 'OAuth callback error');

      return reply.type('text/html').send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Error</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f5f5f5; }
              .container { background: white; padding: 30px; border-radius: 10px; max-width: 500px; margin: 0 auto; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
              h1 { color: #e74c3c; }
              p { color: #666; }
              .error { background: #ffe6e6; padding: 10px; border-radius: 5px; color: #c0392b; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>❌ Error</h1>
              <p>An error occurred while linking your accounts.</p>
              <div class="error">${error instanceof Error ? error.message : 'Unknown error'}</div>
              <p>Please try again or contact support if the problem persists.</p>
            </div>
          </body>
        </html>
      `);
    }
  });

  /**
   * Health check
   */
  fastify.get('/health', async () => {
    return { status: 'ok', service: 'oauth' };
  });

  return fastify;
}

/**
 * Start OAuth server
 */
export async function startOAuthServer() {
  const server = await createOAuthServer();

  try {
    await server.listen({
      port: config.oauth.port,
      host: config.oauth.host,
    });

    console.log(`✅ OAuth server started on http://${config.oauth.host}:${config.oauth.port}`);
    console.log(`   Callback URL: ${config.steam.callbackUrl}`);
  } catch (error) {
    console.error('❌ Failed to start OAuth server:', error);
    throw error;
  }

  return server;
}

/**
 * Register a pending link request
 */
export function registerPendingLink(state: string, discordId: string): void {
  pendingLinks.set(state, {
    discordId,
    timestamp: Date.now(),
  });

  // Clean up old pending links (older than 10 minutes)
  const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
  for (const [key, value] of pendingLinks.entries()) {
    if (value.timestamp < tenMinutesAgo) {
      pendingLinks.delete(key);
    }
  }
}
