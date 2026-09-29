import { Injectable, inject } from '@angular/core';
import { ActiveCartFacade } from '@spartacus/cart/base/root';
import { UserIdService } from '@spartacus/core';
import type { Observable } from 'rxjs';
import { combineLatest, map, switchMap, take } from 'rxjs';
import { PayoneBackendPluginConnector } from '../../occ/connectors/payone-backend-plugin.connector';
import type {
  PayoneAuthenticationToken,
  PayoneCommerceCase,
} from '../models/payone.models';

interface PayoneCartContext {
  userId: string;
  cartId: string;
}

/**
 * Facade for the backend-plugin endpoints used by the consuming storefront.
 * Payment request construction and result handling remain storefront-owned.
 */
@Injectable({ providedIn: 'root' })
export class PayoneBackendPluginService {
  private readonly connector = inject(PayoneBackendPluginConnector);
  private readonly userIdService = inject(UserIdService);
  private readonly activeCart = inject(ActiveCartFacade);

  createAuthenticationToken(): Observable<PayoneAuthenticationToken> {
    return this.resolveCartContext().pipe(
      switchMap(({ userId, cartId }) =>
        this.connector.createAuthenticationToken(userId, cartId),
      ),
    );
  }

  createCommerceCase(): Observable<PayoneCommerceCase> {
    return this.resolveCartContext().pipe(
      switchMap(({ userId, cartId }) =>
        this.connector.createCommerceCase(userId, cartId),
      ),
    );
  }

  placeOrder<TResult>(body: unknown): Observable<TResult> {
    return this.resolveCartContext().pipe(
      switchMap(({ userId, cartId }) =>
        this.connector.placeOrder<TResult>(userId, cartId, body),
      ),
    );
  }

  private resolveCartContext(): Observable<PayoneCartContext> {
    return combineLatest([
      this.userIdService.takeUserId(),
      this.activeCart.takeActiveCartId(),
    ]).pipe(
      take(1),
      map(([userId, cartId]) => {
        if (!userId || !cartId) {
          throw new Error(
            'A user and active cart are required for PAYONE checkout',
          );
        }
        return { userId, cartId };
      }),
    );
  }
}
