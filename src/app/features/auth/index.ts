// #region Public API — Auth Feature

// Facade
export { AuthFacade } from './auth.facade';

// Config Bridge
export { AUTH_CONFIG, provideAuthConfig } from './auth.config';
export type { AuthConfig } from './auth.config';

// Routes
export { authRoutes } from './auth.routes';

// Guards (consumed by host app.routes.ts to protect non-auth routes)
export { authGuard } from './guards/auth.guard';
export { guestGuard } from './guards/guest.guard';

// Interceptor (registered in app.config.ts via withInterceptors)
export { authInterceptor } from './interceptors/auth.interceptor';

// #endregion Public API
