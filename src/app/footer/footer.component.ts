import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { merge, Observable, Subscription } from 'rxjs';
import { filter, map, startWith, tap } from 'rxjs/operators';
import { KeyboardEventService } from '../core/keyboard-event';
import { GlobalEventBusService } from '../core/event-bus';
import { IRegionInfo } from '../core/models/region.model';
import { NavigationEnd, Router, RouterEvent } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SelectionMode } from 'vott-ct/lib/js/CanvasTools/Interface/ISelectorSettings';

@Component({
    selector: 'app-footer',
    templateUrl: './footer.component.html',
    styleUrls: ['./footer.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FooterComponent implements OnInit, OnDestroy {
    stepLegth = 1;
    info: Observable<IRegionInfo>;
    public currentRoute: Observable<string>;
    public hasUntagRegion = false;
    public currentSelectionType = SelectionMode.RECT;

    private readonly maxStepLenght = 16;
    private readonly minStepLenght = 1;
    private _sub = new Subscription();

    constructor(
        private keyboard: KeyboardEventService,
        private cdr: ChangeDetectorRef,
        public event: GlobalEventBusService,
        private router: Router,
        private _snackBar: MatSnackBar
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
            )
        ).subscribe(() => {
            this.event.setCurrentStepLength(this.stepLegth);
            localStorage.setItem('stepLength', '' + this.stepLegth);
            this.cdr.markForCheck();
        });

        this.currentRoute = this.router.events
            .pipe(
                filter((e: RouterEvent) => e instanceof NavigationEnd),
                map(({ url }: NavigationEnd) => {
                    console.log(url, 'uuuuuuuuuuuuuuu');
                    switch (url) {
                        case '/picture':
                            return 'picture';
                        case '/video':
                            return 'video';
                        default:
                            return 'picture';
                    }
                }),
                startWith('picture')
            );

        const untagRegionSub = this.event.pictureUntagState$
            .pipe(
                tap((state: boolean) => {
                    this.hasUntagRegion = state;
                    this.cdr.markForCheck();
                })
            )
            .subscribe();

        this.info = this.event.regionInfo$;

        this._sub.add(upDownSub);
        this._sub.add(untagRegionSub);
    }

    ngOnInit(): void { }

    goToFirstUntagPicture() {
        if (!this.hasUntagRegion) {
            this._snackBar.open('No Untaged Region found', 'Notice', {
                verticalPosition: 'top',
                duration: 3000,
            });

            return;
        }
        this.event.triggerGoToFirstUntag();
    }

    changeSelectionType() {
        if (this.currentSelectionType === SelectionMode.RECT) {
            this.currentSelectionType = SelectionMode.POLYGON;
        } else {
            this.currentSelectionType = SelectionMode.RECT;
        }

        this.event.selectionModeChange(this.currentSelectionType);
    }

    ngOnDestroy() {
        this._sub.unsubscribe();
    }
}
