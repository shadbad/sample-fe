// #region Imports
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
// #endregion Imports

/**
 * Debounced search-input molecule.
 *
 * Renders a text input that emits a {@link searchChange} event after the user
 * has stopped typing for {@link debounceMs} milliseconds. Using RxJS here is
 * justified: `debounceTime` + `distinctUntilChanged` have no Signal equivalent
 * in Angular 19.
 *
 * ### Inputs
 * | Input         | Type     | Required | Default |
 * |---------------|----------|----------|---------|
 * | `placeholder` | `string` | ❌       | `''`    |
 * | `debounceMs`  | `number` | ❌       | `300`   |
 * | `value`       | `string` | ❌       | `''`    |
 *
 * ### Outputs
 * | Output         | Payload  | Description                             |
 * |----------------|----------|-----------------------------------------|
 * | `searchChange` | `string` | Debounced search value from the input.  |
 *
 * @example
 * ```html
 * <app-search-bar
 *   [placeholder]="'members.search.placeholder' | translate"
 *   (searchChange)="facade.setSearch($event)"
 * />
 * ```
 *
 * Belongs to the **molecule** tier of the atomic design hierarchy.
 *
 * > **RxJS justified**: `debounceTime` + `distinctUntilChanged` have no Signal
 * > equivalent in Angular 19 for handling raw DOM input events.
 */
@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [FormsModule, TranslatePipe],
  templateUrl: './search-bar.component.html',
  styleUrl: './search-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchBarComponent implements OnInit {
  // #region Inputs

  /**
   * Placeholder text shown inside the input when empty.
   * Should be a pre-translated string.
   */
  readonly placeholder = input<string>('');

  /**
   * Debounce delay in milliseconds before `searchChange` fires.
   * Defaults to `300` ms.
   */
  readonly debounceMs = input<number>(300);

  /**
   * Initial / controlled value for the search input.
   */
  readonly value = input<string>('');

  // #endregion Inputs

  // #region Outputs

  /**
   * Emits the current search string after the debounce period elapses.
   */
  readonly searchChange = output<string>();

  // #endregion Outputs

  // #region State

  /** Internal writable signal bound to the native `<input>` via `[(ngModel)]`. */
  protected readonly inputValue = signal('');

  // #endregion State

  // #region Private

  /**
   * Subject that carries each raw keypress into the RxJS pipeline.
   *
   * RxJS justified: `debounceTime` + `distinctUntilChanged` have no Signal
   * equivalent for throttling raw DOM input events.
   */
  readonly #input$ = new Subject<string>();

  readonly #destroyRef = inject(DestroyRef);

  // #endregion Private

  // #region Lifecycle

  /** Initialises the debounce pipeline using the current `debounceMs` input. */
  ngOnInit(): void {
    this.inputValue.set(this.value());

    // RxJS JUSTIFIED: merging debounceTime + distinctUntilChanged for DOM input
    // events has no equivalent with Angular Signals in v19.
    this.#input$
      .pipe(
        debounceTime(this.debounceMs()),
        distinctUntilChanged(),
        takeUntilDestroyed(this.#destroyRef),
      )
      .subscribe((query) => {
        this.searchChange.emit(query);
      });
  }

  // #endregion Lifecycle

  // #region Event Handlers

  /**
   * Called on every native `input` event; pushes the raw value into the
   * debounce pipeline.
   *
   * @param value - The current text-input value.
   */
  protected onInput(value: string): void {
    this.inputValue.set(value);
    this.#input$.next(value);
  }

  // #endregion Event Handlers
}
