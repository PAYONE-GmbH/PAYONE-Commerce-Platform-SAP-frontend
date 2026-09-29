import { Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import type {
  PayoneAuthenticationToken,
  PayoneCommerceCase,
} from '../../core/models/payone.models';

@Injectable()
export abstract class PayoneBackendPluginAdapter {
  abstract createAuthenticationToken(
    userId: string,
    cartId: string,
  ): Observable<PayoneAuthenticationToken>;

  abstract createCommerceCase(
    userId: string,
    cartId: string,
  ): Observable<PayoneCommerceCase>;

  abstract placeOrder<TResult>(
    userId: string,
    cartId: string,
    body: unknown,
  ): Observable<TResult>;
}
