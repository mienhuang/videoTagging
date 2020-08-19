import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class GlobalEventBusService {

    private resize = new Subject();
    private videoSelected = new Subject();

    resize$ = this.resize.asObservable();
    videoSelected$ = this.videoSelected.asObservable();

    onResize(size: { width: number, height: number }) {
        this.resize.next(size);
    }

    selectVideo(file) {
        this.videoSelected.next({
            name: file.name,
            src: file.path
        });
    }
}
