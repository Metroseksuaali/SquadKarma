// src/modules/auth/auth.routes.ts
// Steam authentication routes

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getRedirectUrl, authenticateUser } from './auth.service.js';
import { env } from '../../config/env.js';
import type { SessionUser, AuthMeResponse, LoginSuccessResponse } from './auth.types.js';

// Extend session data
declare module 'fastify' {
  interface Session {
    user?: SessionUser;
  }
}

export async function authRoutes(app: FastifyInstance) {
  /**
   * GET /auth/steam
   * Redirects user to Steam login page
   */
  app.get('/steam', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const redirectUrl = await getRedirectUrl();
      return reply.redirect(redirectUrl);
    } catch (error) {
      app.log.error(error, 'Failed to get Steam redirect URL');
      return reply.redirect(`${env.FRONTEND_URL}?error=steam_redirect_failed`);
    }
  });

  /**
   * GET /auth/steam/callback
   * Handles Steam callback after login
   */
  app.get('/steam/callback', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Authenticate with Steam and create/update user
      const user = await authenticateUser(request.raw);
      
      // Check if user is banned
      if (user.isBanned) {
        return reply.redirect(`${env.FRONTEND_URL}?error=user_banned`);
      }
      
      // Store user in session
      request.session.user = user;
      
      app.log.info({ steam64: user.steam64 }, 'User logged in');
      
      // Redirect to frontend
      return reply.redirect(`${env.FRONTEND_URL}?login=success`);
    } catch (error) {
      app.log.error(error, 'Steam authentication failed');
      return reply.redirect(`${env.FRONTEND_URL}?error=auth_failed`);
    }
  });

  /**
   * GET /auth/me
   * Returns current authenticated user
   */
  app.get('/me', async (request: FastifyRequest, reply: FastifyReply) => {
    const response: AuthMeResponse = {
      authenticated: !!request.session.user,
      user: request.session.user || null,
    };
    
    return reply.send(response);
  });

  /**
   * POST /auth/logout
   * Clears user session
   */
  app.post('/logout', async (request: FastifyRequest, reply: FastifyReply) => {
    const steam64 = request.session.user?.steam64;
    
    // Destroy session
    await request.session.destroy();
    
    if (steam64) {
      app.log.info({ steam64 }, 'User logged out');
    }
    
    return reply.send({ message: 'Logged out successfully' });
  });
}
