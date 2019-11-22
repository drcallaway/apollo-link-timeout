export default class TimeoutError extends Error {
  public timeout: number;
  public statusCode: number;

  constructor(message: string, timeout: number, statusCode: number = 408) {
    super(message);
    this.timeout = timeout;
    this.statusCode = statusCode;
  }
}
