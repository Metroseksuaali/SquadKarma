import fs from 'fs';
import { parseLogLine, isValidEvent } from './parser.js';
import { ParsedSessionEvent } from './types.js';

/**
 * Squad Log File Watcher
 *
 * Watches a Squad server log file for changes and emits parsed player events.
 * Handles log rotation and incremental reading.
 */

export type LogEventCallback = (event: ParsedSessionEvent) => void | Promise<void>;

export interface WatcherOptions {
  filePath: string;
  pollInterval?: number; // How often to check for changes (ms), default 1000
}

export class LogWatcher {
  private filePath: string;
  private pollInterval: number;
  private lastPosition: number = 0;
  private lastSize: number = 0;
  private intervalHandle: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;
  private callbacks: LogEventCallback[] = [];

  constructor(options: WatcherOptions) {
    this.filePath = options.filePath;
    this.pollInterval = options.pollInterval ?? 1000;
  }

  /**
   * Register a callback for log events
   */
  onEvent(callback: LogEventCallback): void {
    this.callbacks.push(callback);
  }

  /**
   * Start watching the log file
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.warn('Log watcher is already running');
      return;
    }

    // Check if file exists
    if (!fs.existsSync(this.filePath)) {
      throw new Error(`Log file not found: ${this.filePath}`);
    }

    // Get initial file size and position
    const stats = fs.statSync(this.filePath);
    this.lastSize = stats.size;
    this.lastPosition = stats.size; // Start from end of file (don't parse old logs)

    console.log(`📊 Started watching log file: ${this.filePath}`);
    console.log(`   Initial size: ${this.lastSize} bytes`);
    console.log(`   Poll interval: ${this.pollInterval}ms`);

    this.isRunning = true;

    // Start polling for changes
    this.intervalHandle = setInterval(() => {
      this.checkForChanges();
    }, this.pollInterval);
  }

  /**
   * Stop watching the log file
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }

    this.isRunning = false;
    console.log('📊 Stopped watching log file');
  }

  /**
   * Check for file changes and process new content
   */
  private async checkForChanges(): Promise<void> {
    try {
      // Check if file still exists
      if (!fs.existsSync(this.filePath)) {
        console.warn('Log file disappeared, waiting for it to reappear...');
        return;
      }

      const stats = fs.statSync(this.filePath);
      const currentSize = stats.size;

      // Handle log rotation (file became smaller)
      if (currentSize < this.lastSize) {
        console.log('📊 Log rotation detected, resetting position');
        this.lastPosition = 0;
        this.lastSize = 0;
      }

      // Check if there's new content
      if (currentSize > this.lastPosition) {
        await this.readNewContent(this.lastPosition, currentSize);
        this.lastPosition = currentSize;
      }

      this.lastSize = currentSize;
    } catch (error) {
      console.error('Error checking for log changes:', error);
    }
  }

  /**
   * Read new content from file and parse events
   */
  private async readNewContent(start: number, end: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const stream = fs.createReadStream(this.filePath, {
        start,
        end: end - 1, // end is inclusive
        encoding: 'utf-8',
      });

      let buffer = '';

      stream.on('data', (chunk) => {
        // TypeScript strict check: chunk can be string | Buffer
        buffer += typeof chunk === 'string' ? chunk : chunk.toString();
      });

      stream.on('end', async () => {
        // Split into lines
        const lines = buffer.split('\n');

        // Process each line
        for (const line of lines) {
          if (line.trim().length === 0) {
            continue;
          }

          const event = parseLogLine(line);
          if (event && isValidEvent(event)) {
            // Emit event to all callbacks
            for (const callback of this.callbacks) {
              try {
                await callback(event);
              } catch (error) {
                console.error('Error in event callback:', error);
              }
            }
          }
        }

        resolve();
      });

      stream.on('error', (error) => {
        console.error('Error reading log file:', error);
        reject(error);
      });
    });
  }

  /**
   * Get current watcher statistics
   */
  getStats() {
    return {
      isRunning: this.isRunning,
      filePath: this.filePath,
      lastPosition: this.lastPosition,
      lastSize: this.lastSize,
      callbackCount: this.callbacks.length,
    };
  }
}
