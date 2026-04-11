import { ROUTES } from '@/lib/routes';
import { absoluteUrl, getOgImageUrl } from '@/lib/site';

const BRAND = 'Ejuma';

export type PageSeoModel = {
  title: string;
  description: string;
  /** Omit query string on search-style URLs to reduce duplicate signals */
  canonicalPath: string;
  noindex?: boolean;
};

const HOME_TITLE = `${BRAND} — Vetted Plumbers, Electricians & Tradespeople in Ghana`;
const HOME_DESC =
  'Book verified tradespeople in Accra, Tema, Kumasi, and across Ghana. Plumbers, electricians, masons, carpenters, welders, painters, AC techs, roofers, mechanics — fast response, clear rates.';

function matchSeo(pathname: string): PageSeoModel {
  if (pathname === ROUTES.home || pathname === '') {
    return {
      title: HOME_TITLE,
      description: HOME_DESC,
      canonicalPath: '/',
    };
  }

  if (pathname.startsWith(ROUTES.search)) {
    return {
      title: `Find a specialist near you | ${BRAND} — Tema corridor`,
      description:
        'Browse available, rated tradespeople in Dawhenya, Tema, and Prampram. Book vetted workers for home and commercial jobs — no map app required.',
      canonicalPath: ROUTES.search,
    };
  }

  if (pathname.startsWith(ROUTES.booking)) {
    return {
      title: `Complete your booking | ${BRAND}`,
      description: `Confirm your job details and book a vetted tradesperson through ${BRAND}.`,
      canonicalPath: ROUTES.booking,
      noindex: true,
    };
  }

  if (pathname.startsWith(ROUTES.tracking)) {
    return {
      title: `Job status | ${BRAND}`,
      description: `Track your service request and stay updated on your ${BRAND} job.`,
      canonicalPath: ROUTES.tracking,
      noindex: true,
    };
  }

  if (pathname.startsWith(ROUTES.login)) {
    return {
      title: `Sign in | ${BRAND}`,
      description: `Sign in to book tradespeople, manage jobs, and message your specialist on ${BRAND}.`,
      canonicalPath: ROUTES.login,
    };
  }

  if (pathname.startsWith(ROUTES.register)) {
    return {
      title: `Create account | ${BRAND}`,
      description: `Join ${BRAND} to book vetted plumbers, electricians, and artisans across Ghana.`,
      canonicalPath: ROUTES.register,
    };
  }

  if (pathname.startsWith(ROUTES.forgotPassword)) {
    return {
      title: `Forgot password | ${BRAND}`,
      description: `Reset your ${BRAND} account password securely.`,
      canonicalPath: ROUTES.forgotPassword,
      noindex: true,
    };
  }

  if (pathname.startsWith(ROUTES.resetPassword)) {
    return {
      title: `Set new password | ${BRAND}`,
      description: `Choose a new password for your ${BRAND} account.`,
      canonicalPath: ROUTES.resetPassword,
      noindex: true,
    };
  }

  if (pathname.startsWith(ROUTES.verify)) {
    return {
      title: `Email verification | ${BRAND}`,
      description: `Confirm your email to continue on ${BRAND}.`,
      canonicalPath: ROUTES.verify,
      noindex: true,
    };
  }

  if (pathname.startsWith(ROUTES.workerLogin)) {
    return {
      title: `Worker sign in | ${BRAND}`,
      description: `Access your ${BRAND} worker dashboard — manage incoming jobs, earnings, and profile.`,
      canonicalPath: ROUTES.workerLogin,
    };
  }

  if (pathname.startsWith(ROUTES.workerDashboard)) {
    return {
      title: `Worker dashboard | ${BRAND}`,
      description: `Worker portal for ${BRAND} — jobs, earnings, and notifications.`,
      canonicalPath: ROUTES.workerDashboard,
      noindex: true,
    };
  }

  if (pathname.startsWith(ROUTES.adminLogin) || pathname.startsWith(ROUTES.adminDashboard)) {
    return {
      title: `Admin | ${BRAND}`,
      description: `${BRAND} administration.`,
      canonicalPath: pathname.startsWith(ROUTES.adminDashboard) ? ROUTES.adminDashboard : ROUTES.adminLogin,
      noindex: true,
    };
  }

  return {
    title: `${BRAND} — Ghana skilled trades`,
    description: HOME_DESC,
    canonicalPath: ROUTES.home,
  };
}

export function resolvePageSeo(pathname: string): PageSeoModel & { canonicalHref: string; ogImage: string } {
  const base = matchSeo(pathname);
  return {
    ...base,
    canonicalHref: absoluteUrl(base.canonicalPath),
    ogImage: getOgImageUrl(),
  };
}
