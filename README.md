![CircleCI](https://circleci.com/gh/Cybrid-app/cybrid-sdk-web.svg?style=svg)
[![codecov](https://codecov.io/gh/Cybrid-app/cybrid-sdk-web/branch/main/graph/badge.svg?token=2U326QU5J6)](https://codecov.io/gh/Cybrid-app/cybrid-sdk-web)

# Cybrid SDK Web

This project contains a [Library](/library) of web components that interface with Cybrid's api, and a [Demo Application](/src) containing them

## Components

The ui components are stored in [library](/library) and are Angular Elements which bootstrap and wrap themselves in a Web Component. For more information visit [Angular Elements](https://angular.io/guide/elements) or [Web Components](https://developer.mozilla.org/en-US/docs/Web/Web_Components)

NPM Package: [@cybrid/cybrid-sdk-ui-js]()

More information: [README](library/README.md)

# Demo

## Live

The current demo is continually updated and live for testing at: https://cybrid-app.github.io/cybrid-sdk-web/

To login you will need to have the following:

- Bank Api keys (Id and Secret) or a valid Bearer token
- Customer GUID
- Some prior setup for your bank/customer (see setup below)

## API Setup

The following setup should be preformed prior to using the Web Demo application.

1. Create your customer using the `POST /api/customers` API
2. Create a `type=fiat` account with `asset=USD` using `POST /api/accounts` API for your customer
3. Create a `type=trading` account with `asset=BTC` using the `POST /api/accounts` API (this is required to trade Bitcoin)
4. Create a `type=trading` account with `asset=ETH` using the `POST /api/accounts` API (this is required to trade Ether)
5. Create a `type=trading` account with `asset=USDC` using the `POST /api/account` API (this is required to trade USDC)

## Demo Setup

The following are a set of first time steps you should follow in the Demo application.

> NOTE: In Sandbox no real identity information or banking credentials are required

1. Preform an identity verification using the `identity-verification` component. Identity verifications can take some time because of the number of checks being preformed in the background. You may be asked to check back later for the status.

If you call `GET /api/banks/{bank_guid}` you will get back your bank details, which includes the `features` your bank is configured with.

If your bank is configured with a `backstopped_funding_source` you will need to make a `transfer_type=book` transfer via the transfers api. In Sandbox the transfer will always complete, in Production it can NSF.

If your bank is configured with a `plaid_funding_source` you will need to add an external bank account.

2. (`plaid_funding_source`) Connect a bank account using the `bank-account-connect` component. In Sandbox you don't need to enter any real credentials into Plaid. Choose a bank from the list. Only select a single bank account (this is enforced in Production). If Plaid does ask for credentials:

> Username: user_good \
> Password: pass_good

Once you have gone through Plaid and connected a bank account, the identity verification should be complete.
3. (`plaid_funding_source`) Transfer funds into the customer's fiat account using the `transfer` component. In Sandbox you are limited to transferring a max of $100 USD at a time. 

4. Your customer can now preform trades using the `trade` component.

## Installation

Install Node. Current version: [Node@20.14.0](https://nodejs.org/en/)

Run `npm install` from the project root to install dependencies

Run `npm run package:library` to build the library

## Run

Run `ng serve` for the demo server

While running the Demo locally most browsers will block Cybrid api requests due to Cross-Origin Resource Sharing (CORS) rules. You must disable CORS to properly view the demo. Here's a handy script (for Mac OSX) that opens a developer friendly instance of Google Chrome:

```shell
open -n -a /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --args --user-data-dir="/tmp/chrome_dev_test" --disable-web-security
```

Navigate to `http://localhost:4200/`

## Build

To build the demo project run `ng build`

## Test

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.

## License

This project is licensed under Apache 2.0, found in [LICENSE](https://github.com/Cybrid-app/Cybrid-SDK/blob/main/LICENSE)
