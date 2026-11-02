/**
 * Production Vercel Serverless Function entry point for /api/chat.
 * Re-exports the unified chat handler from frontend/api/chat.ts.
 */
import handler, { GET, POST, OPTIONS, maxDuration } from '../frontend/api/chat.ts';

export default handler;
export { GET, POST, OPTIONS, maxDuration };
