import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import type {
  PayoneAuthenticationToken,
  PayoneCommerceCase,
} from '../../core/models/payone.models';
import { PayoneBackendPluginAdapter } from '../adapters/payone-backend-plugin.adapter';

@Injectable({ providedIn: 'root' })
export class PayoneBackendPluginConnector {
  private readonly adapter = inject(PayoneBackendPluginAdapter);

  createAuthenticationToken(
    userId: string,
    cartId: string,
  ): Observable<PayoneAuthenticationToken> {
    return this.adapter.createAuthenticationToken(userId, cartId);
  }

  createCommerceCase(
    userId: string,
    cartId: string,
  ): Observable<PayoneCommerceCase> {
    return this.adapter.createCommerceCase(userId, cartId);
  }

  placeOrder<TResult>(
    userId: string,
    cartId: string,
    body: unknown,
  ): Observable<TResult> {
    return this.adapter.placeOrder<TResult>(userId, cartId, body);
  }
}
