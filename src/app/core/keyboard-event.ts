import { Injectable } from '@angular/core';
import { fromEvent } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class KeyboardEventService {

    constructor() {
        fromEvent(window, 'keyup')
            .pipe()
            .subscribe(console.log);
    }
}
