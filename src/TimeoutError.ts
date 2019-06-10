export default class TimeoutError extends Error {
  public timeout: number;
  public statusCode: number;

  constructor(message: string, timeout?: number, statusCode?: number) {
    super(message);
    this.timeout = timeout;
    this.statusCode = statusCode || 408;
  }
}
