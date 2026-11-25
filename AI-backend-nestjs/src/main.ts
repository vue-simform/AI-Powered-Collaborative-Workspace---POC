import dns from 'node:dns';
import net from 'node:net';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module.js';
import { SocketIoAdapter } from './socket-io.adapter.js';

// Some networks advertise IPv6 but cannot reach it. Node's automatic IPv4/IPv6 fallback then times out
// (fetch to the Gemini API fails with ETIMEDOUT), so prefer IPv4 and connect to one address at a time.
dns.setDefaultResultOrder('ipv4first');
net.setDefaultAutoSelectFamily(false);

// Starts the whole app: builds the Nest server, applies global settings, then listens for requests.
async function bootstrap() {
  // Create the Nest application from the root AppModule (the "main building" that holds all other modules).
  const app = await NestFactory.create(AppModule);
  // Every route starts with /api, e.g. /api/auth/login.
  app.setGlobalPrefix('api');
  // Middleware that reads the Cookie header so we can use req.cookies (the login token lives there).
  app.use(cookieParser());
  // CORS: lets the frontend site (a different origin) call this API; credentials lets it send cookies.
  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3001',
    credentials: true,
  });
  // Use our custom Socket.IO setup so WebSockets get the same CORS and cookie handling.
  app.useWebSocketAdapter(new SocketIoAdapter(app));
  // Pipe = a step that checks/transforms incoming data. whitelist drops unknown fields; transform turns plain JSON
  // into DTO objects.
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  // Start accepting requests on PORT (3000 by default).
  await app.listen(process.env.PORT ?? 3000);
}
// Run the startup function (top-level await is allowed because this is an ES module).
await bootstrap();
