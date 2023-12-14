import {
  ChangeDetectionStrategy,
  Component,
  Inject,
  NgZone,
  OnDestroy,
  OnInit,
  Renderer2
} from '@angular/core';
import { DOCUMENT } from '@angular/common';

import {
  BehaviorSubject,
  catchError,
  combineLatest,
  concatMap,
  map,
  merge,
  of,
  skipWhile,
  Subject,
  switchMap,
  take,
  takeUntil,
  tap
} from 'rxjs';

// Services
import {
  CODE,
  ConfigService,
  ErrorService,
  EventService,
  IdentityVerificationService,
  LEVEL,
  RoutingService
} from '@services';
import { Poll, PollConfig } from '../../../shared/utility/poll/poll';

//Models
import {
  CustomerBankModel,
  IdentityVerificationBankModel,
  IdentityVerificationWithDetailsBankModel
} from '@cybrid/cybrid-api-bank-angular';

// Utility
import { Constants } from '@constants';

@Component({
  selector: 'app-identity-verification',
  templateUrl: './identity-verification.component.html',
  styleUrls: ['./identity-verification.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class IdentityVerificationComponent implements OnInit, OnDestroy {
  identity$ =
    new BehaviorSubject<IdentityVerificationWithDetailsBankModel | null>(null);
  customer$ = new BehaviorSubject<CustomerBankModel | null>(null);
  personaClient: BehaviorSubject<any | null> = new BehaviorSubject(null);

  identityVerificationGuid: string | undefined;

  isVerifying: boolean = false;
  isCanceled: boolean = false;
  isLoading$ = new BehaviorSubject(true);
  error$ = new BehaviorSubject(false);

  pollConfig: PollConfig = {
    timeout: this.error$,
    interval: Constants.POLL_INTERVAL,
    duration: Constants.POLL_DURATION
  };

  unsubscribe$ = new Subject();

  personaScriptSrc = Constants.PERSONA_SCRIPT_SRC;

  constructor(
    @Inject(DOCUMENT) public _document: Document,
    public configService: ConfigService,
    private eventService: EventService,
    private errorService: ErrorService,
    private identityVerificationService: IdentityVerificationService,
    private routingService: RoutingService,
    private _renderer2: Renderer2,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    this.eventService.handleEvent(
      LEVEL.INFO,
      CODE.COMPONENT_INIT,
      'Initializing identity-verification component'
    );
    this.getCustomerStatus();
  }

  ngOnDestroy() {
    this.unsubscribe$.next('');
    this.unsubscribe$.complete();
  }

  /**
   * Gets the customer and polls on the customer status
   *
   * Skips customer with a state of storing
   * Handles customer that returns a non-storing state, else returns an error
   **/
  getCustomerStatus(): void {
    const poll = new Poll(this.pollConfig);

    poll
      .start()
      .pipe(
        concatMap(() => this.identityVerificationService.getCustomer()),
        takeUntil(merge(poll.session$, this.unsubscribe$)),
        skipWhile((customer) => customer.state === 'storing'),
        map((customer) => {
          poll.stop();
          this.isVerifying = true;
          this.handleCustomerState(customer);
        }),
        catchError((err) => {
          this.error$.next(true);
          this.eventService.handleEvent(
            LEVEL.ERROR,
            CODE.DATA_ERROR,
            'There was an error fetching customer kyc status'
          );

          this.errorService.handleError(
            new Error('There was an error fetching customer kyc status')
          );
          return of(err);
        })
      )
      .subscribe();
  }

  handleCustomerState(customer: CustomerBankModel): void {
    switch (customer.state) {
      case 'unverified':
        this.verifyIdentity();
        break;
      case 'verified':
        this.customer$.next(customer);
        this.isLoading$.next(false);
        break;
      case 'rejected':
        this.eventService.handleEvent(
          LEVEL.WARNING,
          CODE.KYC_REJECTED,
          'Customer KYC has been rejected'
        );
        this.customer$.next(customer);
        this.isLoading$.next(false);
        break;
      case 'frozen':
        this.eventService.handleEvent(
          LEVEL.WARNING,
          CODE.CUSTOMER_FROZEN,
          'Customer has been frozen'
        );
        this.customer$.next(customer);
        this.isLoading$.next(false);
        break;
      default:
        this.error$.next(true);
    }
  }

  /**
   * Checks for waiting IDVs, creates a new IDV otherwise
   *
   * Skips IDV with a state of storing
   * Handles IDV that returns a non-storing state, else returns an error
   **/
  verifyIdentity(): void {
    this.isLoading$.next(true);

    // Fetch the latest IDV
    const page = '0';
    const perPage = '1';

    const poll = new Poll(this.pollConfig);

    this.identityVerificationService
      .listIdentityVerifications(page, perPage)
      .pipe(
        map((list) => list.objects[0]),
        switchMap((identity) => {
          return identity?.state ===
            IdentityVerificationBankModel.StateEnum.Waiting ||
            identity?.state === IdentityVerificationBankModel.StateEnum.Storing
            ? of(identity)
            : this.identityVerificationService.createIdentityVerification();
        }),
        switchMap((identity) =>
          this.identityVerificationService.getIdentityVerification(
            <string>identity.guid
          )
        ),
        switchMap((identity) => {
          return identity.persona_state ===
            IdentityVerificationWithDetailsBankModel.PersonaStateEnum.Waiting ||
            identity.persona_state ===
              IdentityVerificationWithDetailsBankModel.PersonaStateEnum
                .Reviewing
            ? of(identity)
            : this.identityVerificationService.createIdentityVerification();
        }),
        tap((identity) => {
          this.identityVerificationGuid = identity.guid;
        }),
        switchMap(() => poll.start()),
        concatMap(() =>
          this.identityVerificationService.getIdentityVerification(
            <string>this.identityVerificationGuid
          )
        ),
        takeUntil(merge(poll.session$, this.unsubscribe$)),
        skipWhile(
          (identity) =>
            identity.state === IdentityVerificationBankModel.StateEnum.Storing
        ),
        tap((identity) => {
          poll.stop();
          this.handleIdentityVerificationState(identity);
        }),
        catchError((err) => {
          this.error$.next(true);
          this.eventService.handleEvent(
            LEVEL.ERROR,
            CODE.DATA_ERROR,
            'There was an error fetching identity verification'
          );
          this.errorService.handleError(
            new Error('There was an error fetching identity verification')
          );
          return of(err);
        })
      )
      .subscribe();
  }

  handleIdentityVerificationState(
    identity: IdentityVerificationBankModel
  ): void {
    switch (identity.state) {
      case 'waiting':
        this.handlePersonaState(identity);
        break;
      case 'completed':
        this.isLoading$.next(false);
        this.identity$.next(identity);
        break;
    }
  }

  /**
   * Checks identity status by polling on GET identity_verifications
   *
   * Skips an IDV with an outcome of null for the duration of the polling period
   * Sets and IDV with a non-null outcome, or after the polling duration
   *
   **/
  checkIdentity(): void {
    this.identityVerificationService
      .getIdentityVerification(<string>this.identityVerificationGuid)
      .pipe(
        tap((identity) => {
          this.handleIdentityVerificationState(identity);
        })
      )
      .subscribe();
  }

  handlePersonaState(identity: IdentityVerificationWithDetailsBankModel): void {
    this.ngZone.run(() => {
      switch (identity.persona_state) {
        case 'waiting':
          this.bootstrapPersona(identity.persona_inquiry_id!);
          break;
        case 'pending':
          this.isLoading$.next(false);
          this.identity$.next(identity);
          break;
        case 'reviewing':
          this.isLoading$.next(false);
          this.identity$.next(identity);
          break;
        case 'processing':
          this.isLoading$.next(false);
          this.identity$.next(identity);
          break;
        case 'expired':
          this.getCustomerStatus();
          break;
        case 'completed':
          this.isLoading$.next(false);
          this.identity$.next(identity);
          break;
        case 'unknown':
          this.error$.next(true);
      }
    });
  }

  getPersonaLanguageAlias(locale: string): string {
    return locale == 'fr-CA' ? 'fr' : locale;
  }

  personaOnReady(client: any) {
    this.personaClient.next(client);
    client.open();
  }

  personaOnComplete(): void {
    this.eventService.handleEvent(
      LEVEL.INFO,
      CODE.KYC_SUBMITTED,
      'KYC has been submitted'
    );
    this.checkIdentity();
  }

  personaOnCancel(client: any): void {
    this.eventService.handleEvent(
      LEVEL.WARNING,
      CODE.PERSONA_SDK_CANCEL,
      'Persona SDK has been canceled'
    );

    // Reset in memory client
    client.options.inquiryId = null;
    this.personaClient.next(client);

    this.isCanceled = true;
    this.isLoading$.next(false);
  }

  personaOnError(error: any) {
    this.error$.next(true);
    this.eventService.handleEvent(
      LEVEL.ERROR,
      CODE.PERSONA_SDK_ERROR,
      'There was an error in the Persona SDK',
      error
    );
    this.errorService.handleError(new Error(CODE.PERSONA_SDK_ERROR));
  }

  bootstrapPersona(inquiryId: string): void {
    combineLatest([this.personaClient, this.configService.getConfig$()])
      .pipe(
        take(1),
        map((obj) => {
          const [personaClient, config] = obj;

          if (!personaClient) {
            let client: any;
            let script = this._renderer2.createElement('script');
            script.src = this.personaScriptSrc;
            this._renderer2.appendChild(this._document.body, script);

            script.addEventListener('load', () => {
              //@ts-ignore
              client = new Persona.Client({
                inquiryId: inquiryId,
                language: this.getPersonaLanguageAlias(config.locale),
                onReady: () => this.personaOnReady(client),
                onComplete: () => this.personaOnComplete(),
                onCancel: () => this.personaOnCancel(client),
                onError: (error: any) => this.personaOnError(error)
              });
            });
          } else {
            // Re-initialize local references and open client
            personaClient.options.inquiryId = inquiryId;
            personaClient.options.language = this.getPersonaLanguageAlias(
              config.locale
            );
            personaClient.options.onComplete = () => this.personaOnComplete();
            personaClient.options.onCancel = () =>
              this.personaOnCancel(personaClient);
            personaClient.options.onError = (error: any) =>
              this.personaOnError(error);
            personaClient.open();
          }
        }),
        catchError((err) => {
          this.error$.next(true);
          this.eventService.handleEvent(
            LEVEL.ERROR,
            CODE.DATA_ERROR,
            'There was an error launching the Persona SDK'
          );
          this.errorService.handleError(
            new Error('There was an error launching the Persona SDK')
          );
          return of(err);
        })
      )
      .subscribe();
  }

  onComplete(): void {
    this.routingService.handleRoute({
      origin: 'identity-verification',
      route: 'price-list'
    });
  }

  onCancel(): void {
    this.routingService.handleRoute({
      origin: 'identity-verification',
      route: 'price-list'
    });
  }
}
