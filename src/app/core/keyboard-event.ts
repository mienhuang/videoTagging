import { Injectable } from '@angular/core';
import { fromEvent, Subject, Subscription } from 'rxjs';
import { filter, tap, sampleTime, debounceTime } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class KeyboardEventService {
    private spaceTabed = new Subject();
    private arrowLeft = new Subject();
    private arrowRight = new Subject();
    private saveData = new Subject();
    private arrowUp = new Subject();
    private arrowDown = new Subject();

    spaceTabed$ = this.spaceTabed.asObservable();
    arrowLeft$ = this.arrowLeft.asObservable();
    arrowRight$ = this.arrowRight.asObservable();
    saveData$ = this.saveData.asObservable();
    arrowUp$ = this.arrowUp.asObservable();
    arrowDown$ = this.arrowDown.asObservable();

    private _sub = new Subscription();

    constructor() {
        const keyUpSub = fromEvent(window, 'keyup')
            .pipe(
                tap((event: KeyboardEvent) => {
                    event.preventDefault();
                    this.checkKeyCodeForKeyUp(event);
                })
            )
            .subscribe();
        const keyDownSub = fromEvent(window, 'keydown')
            .pipe(
                sampleTime(300),
                tap((event: KeyboardEvent) => {
                    event.preventDefault();
                    this.checkKeyCodeForKeyDown(event.keyCode);
                })
            )
            .subscribe(console.log);
        this._sub.add(keyUpSub);
        this._sub.add(keyDownSub);

    }

    buttonTriggerSave() {
        this.saveData.next(true);
    }


    checkKeyCodeForKeyUp(event) {
        switch (event.keyCode) {
            case 32:
                this.spaceTabed.next(true);
                break;
            case 38:
                this.arrowUp.next(true);
                break;
            case 40:
                this.arrowDown.next(true);
                break;
            case 83:
                const isCtrl = event.ctrlKey;
                if (isCtrl) {
                    this.saveData.next(true);
                }
                break;
            default:
                break;
        }
    }

    checkKeyCodeForKeyDown(code: number) {
        switch (code) {
            case 37:
                this.arrowLeft.next(true);
                break;
            case 39:
                this.arrowRight.next(true);
                break;
            default:
                break;
        }
    }

    unsub() {
        this._sub.unsubscribe();
    }
}
