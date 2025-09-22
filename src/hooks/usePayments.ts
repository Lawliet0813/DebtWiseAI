/**
 * React hook for interacting with debt payment records.
 */
import { useCallback } from 'react';

import type { AddPaymentPayload, Payment } from '../lib/db';
import { addPayment as addPaymentMutation, listPayments } from '../lib/db';

export interface UsePaymentsResult {
  listPayments: (debtId: string) => Promise<Payment[]>;
  addPayment: (payload: AddPaymentPayload) => Promise<Payment>;
}

const usePayments = (): UsePaymentsResult => {
  const handleListPayments = useCallback(async (debtId: string) => {
    if (!debtId) {
      return [];
    }

    try {
      return await listPayments(debtId);
    } catch (error) {
      console.error('Failed to load payments', error);
      return [];
    }
  }, []);

  const handleAddPayment = useCallback(
    async (payload: AddPaymentPayload) => addPaymentMutation(payload),
    [],
  );

  return {
    listPayments: handleListPayments,
    addPayment: handleAddPayment,
  };
};

export default usePayments;
