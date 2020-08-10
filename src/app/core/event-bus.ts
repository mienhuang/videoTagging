import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class GlobalEventBusService {

    private resize = new Subject();

    resize$ = this.resize.asObservable();

    onResize(event: Event) {
        this.resize.next(event);
    }
}
