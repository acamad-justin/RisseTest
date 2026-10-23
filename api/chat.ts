import { POST as handleChat } from '../app/api/chat/route';

export const config = {
  maxDuration: 60,
};

export async function POST(req: Request) {
  return handleChat(req);
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
