import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { merge, Observable, Subscription } from 'rxjs';
import { tap } from 'rxjs/operators';
import { KeyboardEventService } from '../core/keyboard-event';
import { GlobalEventBusService } from '../core/event-bus';
import { IRegionInfo } from '../core/models/region.model';

@Component({
    selector: 'app-footer',
    templateUrl: './footer.component.html',
    styleUrls: ['./footer.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class FooterComponent implements OnInit, OnDestroy {

    stepLegth = 1;
    info: Observable<IRegionInfo>;

    private readonly maxStepLenght = 16;
    private readonly minStepLenght = 1;
    private _sub = new Subscription();

    constructor(
        private keyboard: KeyboardEventService,
        private cdr: ChangeDetectorRef,
        private event: GlobalEventBusService
    ) {
        const upDownSub = merge(
            this.keyboard.arrowUp$.pipe(
                tap(() => {
                    this.stepLegth = Math.min(this.maxStepLenght, this.stepLegth * 2);
                })
            ),
            this.keyboard.arrowDown$.pipe(
                tap(() => {
                    this.stepLegth = Math.max(this.minStepLenght, this.stepLegth / 2);
                })
            ),
        ).subscribe(() => {
            this.event.setCurrentStepLength(this.stepLegth);
            localStorage.setItem('stepLength', '' + this.stepLegth);
            this.cdr.markForCheck();
        });

        this.info = this.event.regionInfo$;

        this._sub.add(upDownSub);
    }

    ngOnInit(): void {
    }

    ngOnDestroy() {
        this._sub.unsubscribe();
    }

}
