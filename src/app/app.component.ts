import { Component } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent {
    title = 'videoTagging';
    constructor(
        private iconRegistry: MatIconRegistry,
        private domSanitizer: DomSanitizer,
    ) {
        iconRegistry.addSvgIconSet(
            domSanitizer.bypassSecurityTrustResourceUrl('assets/icons/svg-symbols.svg')
        );
    }
}
