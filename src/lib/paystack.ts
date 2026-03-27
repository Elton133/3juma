/**
 * Ejuma Paystack Integration Utility
 * Handles digital payments for service deposits and full payments.
 */

const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || '';

export interface PaystackConfig {
  email: string;
  amount: number; // In GHS (will be multiplied by 100 for Pesewas)
  metadata?: Record<string, any>;
  onSuccess: (response: any) => void;
  onClose: () => void;
}

/**
 * Loads the Paystack Inline JS script dynamically
 */
export const loadPaystackScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if ((window as any).PaystackPop) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

/**
 * Triggers the Paystack payment popup
 */
export const initializePaystack = async (config: PaystackConfig) => {
  if (!PAYSTACK_PUBLIC_KEY.trim()) {
    throw new Error('Paystack is not configured — set VITE_PAYSTACK_PUBLIC_KEY');
  }
  const isLoaded = await loadPaystackScript();
  if (!isLoaded) {
    throw new Error('Paystack script failed to load');
  }

  const handler = (window as any).PaystackPop.setup({
    key: PAYSTACK_PUBLIC_KEY,
    email: config.email,
    amount: Math.round(config.amount * 100), // Convert to pesewas
    currency: 'GHS',
    metadata: config.metadata,
    callback: config.onSuccess,
    onClose: config.onClose,
  });

  handler.openIframe();
};
