// #region Public API

export { LOG_CONFIG, provideLogConfig } from './log-config.token';
export { LogLevel } from './log.model';
export type { LogConfig, LogEntry } from './log.model';
export { LogService } from './log.service';

// ToastContainerComponent is exported so the root App shell can mount the
// global overlay. All toast interactions must go through LogService.
export { ToastContainerComponent } from './components/toast-container/toast-container.component';

// #endregion Public API
