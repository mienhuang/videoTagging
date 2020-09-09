import { Component, OnInit } from '@angular/core';
import { GlobalEventBusService } from '../core/event-bus';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
    selector: 'app-header',
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
    constructor(public eventBus: GlobalEventBusService, private _snackBar: MatSnackBar) { }

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

    deleteAll() {
        this._snackBar.open('test', 'Dance', {
            duration: 3000,
        });
    }
}
