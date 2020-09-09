import { Component, OnDestroy } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { KeyboardEventService } from './core/keyboard-event';
import { GlobalEventBusService } from './core/event-bus';
@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnDestroy {
    title = 'videoTagging';
    constructor(
        private iconRegistry: MatIconRegistry,
        private domSanitizer: DomSanitizer,
        private keyEvent: KeyboardEventService,
        public eventBus: GlobalEventBusService
    ) {
        iconRegistry.addSvgIconSet(
            domSanitizer.bypassSecurityTrustResourceUrl('assets/icons/svg-symbols.svg')
        );
    }

    ngOnDestroy() {
        this.keyEvent.unsub();
    }
}
