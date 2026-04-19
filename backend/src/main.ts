import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { join } from 'path';
import * as express from 'express';
import cookieParser from 'cookie-parser';
import type { Request, Response, NextFunction } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.enableCors({
    origin: true,
    credentials: true,
  });
  app.setGlobalPrefix('api');

  const distPath = join(__dirname, '..', '..', '..', 'frontend', 'dist');

  // Servir assets estáticos con cache largo (tienen hash en el nombre)
  app.use(
    express.static(distPath, {
      etag: false,
      lastModified: false,
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
        } else {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
      },
    }),
  );

  // SPA fallback: todas las rutas no-API que no matcheen un archivo estático
  // devuelven index.html para que React Router las maneje
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.sendFile(join(distPath, 'index.html'));
  });

  await app.listen(process.env.PORT ?? 8080);
}
bootstrap();
