/** Canonical client routes — use these in links and redirects to avoid drift. */
export const ROUTES = {
  home: '/',
  login: '/login',
  register: '/register',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',
  verify: '/verify',
  search: '/search',
  booking: '/booking',
  tracking: '/tracking',
  workerLogin: '/worker',
  workerDashboard: '/worker/dashboard',
  adminLogin: '/admin',
  adminDashboard: '/admin/dashboard',
} as const;

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES];
