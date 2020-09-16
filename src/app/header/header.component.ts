import { Component, OnDestroy, OnInit } from '@angular/core';
import { GlobalEventBusService } from '../core/event-bus';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-header',
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit, OnDestroy {

    private _sub = new Subscription();

    constructor(
        public eventBus: GlobalEventBusService,
        private _snackBar: MatSnackBar
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
        const result = confirm(`Make sure you want to delete all region?`);

        if (!result) return;

        this._snackBar.open(`Hope you know what you are doing`, '', {
            duration: 3000
        });

        this.eventBus.deleteAllRegionsByTrackId(Number(trackId));
    }

    queryFace() {
        this.eventBus.queryFace();
    }

    ngOnDestroy() {
        this._sub.unsubscribe();
    }
}
