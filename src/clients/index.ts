import { PaymentInfosType } from '@ts-types/payment-key.t';

export interface PaymentCredentialFetcherInterface {
  getMerchantKey(kvps: string): Promise<PaymentInfosType>
}
