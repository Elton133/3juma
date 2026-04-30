/** Canonical client routes — use these in links and redirects to avoid drift. */
export const ROUTES = {
  home: '/',
  auth: '/auth',
  login: '/login',
  register: '/register',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',
  verify: '/verify',
  search: '/search',
  booking: '/booking',
  tracking: '/tracking',
  customerProfile: '/profile',
  workerLogin: '/worker',
  workerDashboard: '/worker/dashboard',
  adminLogin: '/admin',
  adminDashboard: '/admin/dashboard',
} as const;

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES];
