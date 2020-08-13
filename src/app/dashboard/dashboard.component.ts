import { Component, OnInit, OnDestroy } from '@angular/core';
import { fromEvent, Subscription } from 'rxjs';
import { tap } from 'rxjs/operators';
import { GlobalEventBusService } from '../core/event-bus';


@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {

    private sub = new Subscription();

    constructor(
        private event: GlobalEventBusService
    ) {
        window.addEventListener('resize', this.onResize);
    }

    ngOnInit(): void {
    }

    ngOnDestroy() {
        this.sub.unsubscribe();
        window.removeEventListener('resize', this.onResize);
    }

    private onResize = (e: Event) => {
        const { innerWidth, innerHeight } = e.currentTarget as any;
        this.event.onResize({
            width: innerWidth,
            height: innerHeight
        });
    }

}
