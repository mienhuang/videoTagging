import { ChangeDetectionStrategy, Component, OnDestroy } from '@angular/core';
import { KeyboardEventService } from './core/keyboard-event';
import { GlobalEventBusService } from './core/event-bus';
import { Observable } from 'rxjs';
@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnDestroy {
    title = 'videoTagging';
    loading: Observable<boolean>;

    constructor(private keyEvent: KeyboardEventService, public eventBus: GlobalEventBusService) {
        this.loading = this.eventBus.loading$;
    }

    ngOnDestroy() {
        this.keyEvent.unsub();
    }
}
