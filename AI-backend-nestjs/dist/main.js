import dns from 'node:dns';
import net from 'node:net';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module.js';
import { SocketIoAdapter } from './socket-io.adapter.js';
dns.setDefaultResultOrder('ipv4first');
net.setDefaultAutoSelectFamily(false);
async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    app.setGlobalPrefix('api');
    app.use(cookieParser());
    app.enableCors({
        origin: process.env.FRONTEND_URL ?? 'http://localhost:3001',
        credentials: true,
    });
    app.useWebSocketAdapter(new SocketIoAdapter(app));
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
//# sourceMappingURL=main.js.map