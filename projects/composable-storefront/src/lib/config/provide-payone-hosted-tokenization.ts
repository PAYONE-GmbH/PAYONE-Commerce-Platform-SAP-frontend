import type { EnvironmentProviders } from '@angular/core';
import { makeEnvironmentProviders } from '@angular/core';
import { provideDefaultConfig } from '@spartacus/core';
import { PayoneBackendPluginAdapter } from '../occ/adapters/payone-backend-plugin.adapter';
import { PayoneOccBackendPluginAdapter } from '../occ/adapters/payone-occ-backend-plugin.adapter';
import { PAYONE_OCC_ENDPOINTS_CONFIG } from '../occ/services/payone-occ-endpoints';
import { PayoneSdkTokenizerService } from '../tokenization/payone-sdk-tokenizer.service';
import { PayoneTokenizer } from '../tokenization/payone-tokenizer';
import type { PayoneHostedTokenizationOptions } from './payone-hosted-tokenization.config';
import {
  PAYONE_HOSTED_TOKENIZATION_CONFIG,
  resolvePayoneHostedTokenizationConfig,
} from './payone-hosted-tokenization.config';

/**
 * Registers only Hosted Tokenization. Use this when the consuming storefront
 * owns its checkout/order workflow but wants the library to own the PAYONE SDK.
 */
export function providePayoneHostedTokenization(
  options: PayoneHostedTokenizationOptions = {},
): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: PAYONE_HOSTED_TOKENIZATION_CONFIG,
      useValue: resolvePayoneHostedTokenizationConfig(options),
    },
    { provide: PayoneBackendPluginAdapter, useClass: PayoneOccBackendPluginAdapter },
    { provide: PayoneTokenizer, useClass: PayoneSdkTokenizerService },
    provideDefaultConfig(PAYONE_OCC_ENDPOINTS_CONFIG),
  ]);
}
