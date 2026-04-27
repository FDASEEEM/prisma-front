import storageUtils from '../utils/localStorage';

const LOGIN_PATH = '/login';

let redirectInProgress = false;

export const resetAuthRedirectLock = () => {
  redirectInProgress = false;
};

export const clearLocalAuthSession = () => {
  storageUtils.clearSession();
};

export const shouldRedirectToLogin = (errorResponse, requestUrl) => {
  if (typeof requestUrl === 'string' && requestUrl.includes('/api/auth/login')) {
    return false;
  }

  if (errorResponse?.code === 'AUTH_INVALID_CREDENTIALS') {
    return false;
  }

  return true;
};

export const redirectToLogin = () => {
  if (typeof window === 'undefined') {
    return;
  }

  clearLocalAuthSession();

  if (redirectInProgress) {
    return;
  }

  redirectInProgress = true;

  if (window.location.pathname === LOGIN_PATH) {
    return;
  }

  window.location.replace(LOGIN_PATH);
};

export const handleAuthFailure = (errorResponse, requestUrl) => {
  if (!shouldRedirectToLogin(errorResponse, requestUrl)) {
    return false;
  }

  redirectToLogin();
  return false;
};