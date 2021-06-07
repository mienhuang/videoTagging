import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { merge, Observable, Subscription } from 'rxjs';
import { map, mapTo, startWith, tap } from 'rxjs/operators';
import { GlobalEventBusService } from '../core/event-bus';
import { ITag } from '../core/models/canvas.model';

@Component({
    selector: 'app-picture-header',
    templateUrl: './picture-header.component.html',
    styleUrls: ['./picture-header.component.scss'],
})
export class PictureHeaderComponent implements OnInit, OnDestroy {
    public pictureLabelControl = new FormControl();
    public options: ITag[] = [];

    filteredOptions: Observable<ITag[]>;

    private _sub = new Subscription();

    constructor(public eventBus: GlobalEventBusService, private _snackBar: MatSnackBar) {
        this.filteredOptions = merge(
            this.pictureLabelControl.valueChanges,
            this.eventBus.pictureLables$.pipe(
                tap((labels: ITag[]) => {
                    this.options = labels;
                }),
                mapTo('')
            )
        ).pipe(
            startWith(''),
            map((value) => (typeof value === 'string' ? value : value.name)),
            map((name) => (name ? this._filter(name) : this.options.slice()))
        );
    }

    ngOnInit(): void {}

    displayFn(tag: ITag): string {
        return tag && tag.name ? tag.name : '';
    }

    setTag() {
        this.toggleTag(this.pictureLabelControl.value);
    }

    toggleTag(type: string) {
        this.eventBus.toggleTag(type);
    }

    changePicture(offset: number) {
        this.eventBus.updatePictureIndex(offset);
    }

    ngOnDestroy() {
        this._sub.unsubscribe();
    }

    private _filter(name: string): ITag[] {
        const filterValue = name.toLowerCase();

        return this.options.filter((option) => option.name.toLowerCase().indexOf(filterValue) === 0);
    }
}
