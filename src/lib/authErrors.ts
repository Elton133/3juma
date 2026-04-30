export function friendlyAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('invalid login credentials')) return 'Incorrect email or password.';
  if (m.includes('email not confirmed')) return 'Please verify your email first, then sign in.';
  if (m.includes('user already registered')) return 'This email already has an account. Try signing in.';
  if (m.includes('password should be at least')) return 'Password is too short. Use at least 6 characters.';
  if (m.includes('oauth') || m.includes('provider is not enabled')) return 'Google sign-in is not set up yet. Please use email/password for now.';
  if (m.includes('rate limit')) return 'Too many attempts. Please wait a moment and try again.';
  return message;
}

