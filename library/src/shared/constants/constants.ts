import { Asset, ComponentConfig } from '@services';

export enum THEME {
  LIGHT = 'LIGHT',
  DARK = 'DARK'
}

export class Constants {
  static REPO_URL =
    'https://api.github.com/repos/Cybrid-app/cybrid-sdk-web/releases/latest';
  // The number of times to retry a failed http request
  static RETRY = 3;
  // How often to request new data
  static REFRESH_INTERVAL = 5000;
  static PLATFORM_REFRESH_INTERVAL = 30000;
  static LOCALE = 'en-US';
  static SUPPORTED_LOCALES = ['en-US', 'fr-CA'];
  // The time in seconds left on a valid auth token when a session expiry warning event is sent
  static AUTH_EXPIRATION_WARNING = 120;
  static MIN_INTEGER_DIGITS = 0;
  static MIN_FRACTION_DIGITS = 2;
  static TRADING_MIN_INTEGER_DIGITS = 0;
  static TRADING_MIN_FRACTION_DIGITS = 0;
  static THEME = THEME.LIGHT;
  static ROUTING = true;
  static ICON_HOST = 'https://images.cybrid.xyz/sdk/assets/svg/color/';
  static PERSONA_SCRIPT_SRC =
    'https://cdn.withpersona.com/dist/persona-v5.1.3.js';
  static PLAID_SCRIPT_SRC =
    'https://cdn.plaid.com/link/v2/stable/link-initialize.js';
  static BTC_ICON = 'https://images.cybrid.xyz/sdk/assets/svg/color/btc.svg';
  static USD_ICON = 'https://images.cybrid.xyz/sdk/assets/svg/color/usd.svg';
  static BTC_ASSET: Asset = {
    code: 'BTC',
    decimals: '8',
    name: 'Bitcoin',
    symbol: '₿',
    type: 'crypto',
    url: Constants.BTC_ICON
  };
  static USD_ASSET: Asset = {
    code: 'USD',
    decimals: '2',
    name: 'Dollar',
    symbol: '$',
    type: 'fiat',
    url: Constants.USD_ICON
  };
  static DEFAULT_CONFIG: ComponentConfig = {
    refreshInterval: Constants.REFRESH_INTERVAL,
    locale: Constants.LOCALE,
    theme: Constants.THEME,
    routing: Constants.ROUTING,
    customer: '',
    fiat: '',
    features: [],
    environment: 'sandbox'
  };
  static DEFAULT_COMPONENT = 'price-list';
  static POLL_DURATION = 5000;
  static POLL_INTERVAL = 1000;
  static COMPONENTS_PLAID = [
    'price-list',
    'trade',
    'account-list',
    'account-details',
    'identity-verification',
    'bank-account-connect',
    'bank-account-list',
    'transfer',
    'external-wallet-list'
  ];
  static COMPONENTS_BACKSTOPPED = [
    'price-list',
    'trade',
    'account-list',
    'account-details',
    'identity-verification'
  ];
  static COMPONENTS_ATTESTATION = [
    'price-list',
    'trade',
    'account-list',
    'account-details',
    'bank-account-connect',
    'bank-account-list',
    'transfer'
  ];
  static COMPONENTS_KYC = [
    'price-list',
    'trade',
    'account-list',
    'account-details',
    'identity-verification',
    'bank-account-connect',
    'bank-account-list',
    'transfer'
  ];
}
