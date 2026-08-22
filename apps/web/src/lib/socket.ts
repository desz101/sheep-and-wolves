'use client';

import { io, Socket } from 'socket.io-client';

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:4000';

let socket: Socket | null = null;

// A single socket connection is shared across the app so navigating between
// create/join/game screens doesn't drop and re-establish the session.
export function getSocket(): Socket {
  if (!socket) {
    socket = io(SERVER_URL, {
      autoConnect: true,
      transports: ['websocket', 'polling'],
    });
  }
  return socket;
}
