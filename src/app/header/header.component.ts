import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { GlobalEventBusService } from '../core/event-bus';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';

import { ConfirmDialogComponent } from '../shared/confirm/confirm.component';
import { filter, tap } from 'rxjs/operators';

@Component({
    selector: 'app-video-header',
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeaderComponent implements OnInit, OnDestroy {

    private _sub = new Subscription();

    constructor(
        public eventBus: GlobalEventBusService,
        private _snackBar: MatSnackBar,
        private dialog: MatDialog
    ) {

    }

    ngOnInit(): void {
    }

    toggleTag(type: string) {
        this.eventBus.toggleTag(type);
    }

    trackIdChange(event) {
        const value = Number(event.target.value);
        console.log(value, 'value');
        this.eventBus.newTrackId(value);
    }

    changeFrame(type: string) {
        this.eventBus.changeFrame(type);
    }

    searchRegion(trackId: string) {
        this.eventBus.searchRegionByTrackId(Number(trackId));
    }

    deleteAll(trackId: string) {
        // const result = confirm(`Make sure you want to delete all region?`);

        // if (!result) return;

        const addComponentRef: MatDialogRef<ConfirmDialogComponent> = this.dialog.open(ConfirmDialogComponent, {
            disableClose: true,
            autoFocus: false,
            restoreFocus: false,
            width: '400px',
            height: '216px',
            data: {
                title: 'Delete Confirm',
                context: 'Make sure you want to delete all region?'
            },
        });

        addComponentRef.afterClosed()
            .pipe(
                filter(confirm => confirm),
                tap(() => {
                    this._snackBar.open(`Hope you know what you are doing`, '', {
                        duration: 3000
                    });

                    this.eventBus.deleteAllRegionsByTrackId(Number(trackId));
                })
            )
            .subscribe();
    }

    queryFace() {
        this.eventBus.queryFace();
    }

    ngOnDestroy() {
        this._sub.unsubscribe();
    }
}
