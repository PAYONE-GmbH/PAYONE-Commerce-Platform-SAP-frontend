import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { OccEndpointsService } from '@spartacus/core';
import type { Observable } from 'rxjs';
import type {
  PayoneAuthenticationToken,
  PayoneCommerceCase,
} from '../../core/models/payone.models';
import { PAYONE_OCC_ENDPOINT } from '../services/payone-occ-endpoints';
import { PayoneBackendPluginAdapter } from './payone-backend-plugin.adapter';

@Injectable()
export class PayoneOccBackendPluginAdapter extends PayoneBackendPluginAdapter {
  private readonly http = inject(HttpClient);
  private readonly endpoints = inject(OccEndpointsService);

  override createAuthenticationToken(
    userId: string,
    cartId: string,
  ): Observable<PayoneAuthenticationToken> {
    return this.http.post<PayoneAuthenticationToken>(
      this.buildCartUrl(
        PAYONE_OCC_ENDPOINT.authenticationToken,
        userId,
        cartId,
      ),
      {},
    );
  }

  override createCommerceCase(
    userId: string,
    cartId: string,
  ): Observable<PayoneCommerceCase> {
    return this.http.post<PayoneCommerceCase>(
      this.buildCartUrl(PAYONE_OCC_ENDPOINT.commerceCase, userId, cartId),
      {},
    );
  }

  override placeOrder<TResult>(
    userId: string,
    cartId: string,
    body: unknown,
  ): Observable<TResult> {
    return this.http.post<TResult>(
      this.buildCartUrl(PAYONE_OCC_ENDPOINT.placeOrder, userId, cartId),
      body,
    );
  }

  private buildCartUrl(
    endpoint: string,
    userId: string,
    cartId: string,
  ): string {
    return this.endpoints.buildUrl(endpoint, { urlParams: { userId, cartId } });
  }
}
