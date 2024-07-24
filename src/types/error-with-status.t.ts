interface ErrorWithStatus extends Error {
  status: number;
  originalError?: Error;
  sendToSentry: boolean;
}

export default ErrorWithStatus;
