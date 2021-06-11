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
    private pageUp = new Subject();
    private pageDown = new Subject();

    spaceTabed$ = this.spaceTabed.asObservable();
    arrowLeft$ = this.arrowLeft.asObservable();
    arrowRight$ = this.arrowRight.asObservable();
    saveData$ = this.saveData.asObservable();
    arrowUp$ = this.arrowUp.asObservable();
    arrowDown$ = this.arrowDown.asObservable();
    pageUp$ = this.pageUp.asObservable();
    pageDown$ = this.pageDown.asObservable();

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
                    this.checkKeyCodeForKeyDown(event.code);
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

    checkKeyCodeForKeyDown(code: string) {
        switch (code) {
            case 'ArrowLeft':
                this.arrowLeft.next(true);
                break;
            case 'ArrowRight':
                this.arrowRight.next(true);
                break;
            case 'PageUp':
                this.pageUp.next(true);
                break;
            case 'PageDown':
                this.pageDown.next(true);
                break;
            default:
                break;
        }
    }

    unsub() {
        this._sub.unsubscribe();
    }
}
