/**
 * Builds a standard UPI deep link. The payee address (`pa`) always comes from the
 * platform-configured charity beneficiary — riders never supply or edit this value,
 * so a donation can never be redirected to a rider's personal account.
 */
export function buildUpiLink(params: {
  payeeVpa: string;
  payeeName: string;
  amount: number;
  note: string;
  transactionRef: string;
}): string {
  const qs = new URLSearchParams({
    pa: params.payeeVpa,
    pn: params.payeeName,
    am: params.amount.toFixed(2),
    cu: "INR",
    tn: params.note,
    tr: params.transactionRef,
  });
  return `upi://pay?${qs.toString()}`;
}
