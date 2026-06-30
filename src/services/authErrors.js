export const AUTH_ERROR_CODES = {
  SESSION_EXPIRED: 'AUTH_SESSION_EXPIRED',
  INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
};

export const getAuthErrorCode = (errorData) => errorData?.code || null;

export const isInvalidCredentialsError = (errorData) =>
  getAuthErrorCode(errorData) === AUTH_ERROR_CODES.INVALID_CREDENTIALS;

export const isSessionExpiredError = (errorData) => {
  const code = getAuthErrorCode(errorData);

  if (code) {
    return code === AUTH_ERROR_CODES.SESSION_EXPIRED;
  }

  return false;
};

export const getAuthErrorMessage = (errorData, fallbackMessage) => {
  if (typeof errorData?.message === 'string' && errorData.message.trim()) {
    return errorData.message;
  }

  return fallbackMessage;
};