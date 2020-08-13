import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class GlobalEventBusService {

    private resize = new Subject();

    resize$ = this.resize.asObservable();

    onResize(size: { width: number, height: number }) {
        this.resize.next(size);
    }
}
