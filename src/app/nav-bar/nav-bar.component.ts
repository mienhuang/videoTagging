import { Component, OnInit, ViewChild, ElementRef, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { NavigationEnd, Router, RouterEvent } from '@angular/router';
import { filter, tap } from 'rxjs/operators';
import { Subscription } from 'rxjs';

import { GlobalEventBusService } from '../core/event-bus';
import { SettingsDialogComponent } from '../settings-dialog/settings-dialog.component';
import { KeyboardEventService } from '../core/keyboard-event';
import { IPictureInfo } from '../core/models/picture.model';

@Component({
    selector: 'app-nav-bar',
    templateUrl: './nav-bar.component.html',
    styleUrls: ['./nav-bar.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavBarComponent implements OnInit, OnDestroy {
    public currentRoute = 'picture';

    private sub = new Subscription();

    constructor(
        private bus: GlobalEventBusService,
        public dialog: MatDialog,
        private keyboard: KeyboardEventService,
        private router: Router
    ) {
        const routEndSub = this.router.events
            .pipe(
                filter((e: RouterEvent) => e instanceof NavigationEnd),
                tap(({ url }: NavigationEnd) => {
                    switch (url) {
                        case '/picture':
                            this.currentRoute = 'picture';
                            break;
                        case '/video':
                            this.currentRoute = 'video';
                            break;
                        default:
                            break;
                    }
                })
            )
            .subscribe();

        this.sub.add(routEndSub);
    }

    @ViewChild('import') import: ElementRef;

    ngOnInit(): void {}

    navigate(url: string) {
        this.currentRoute = url;
        this.router.navigate([url]);
    }

    selectVideo(event) {
        console.log(event);
        const file = event.target.files[0];
        if (!file) return;
        this.bus.selectVideo(file);

        this.import.nativeElement.value = null;
    }

    selectFolder(event: any) {
        const files = event.target.files;

        const infoList: IPictureInfo[] = [];

        for (const file of files) {
            const { name, path, type } = file;
            if (type === 'image/png' || type === 'image/jpeg') {
                infoList.push({
                    name,
                    path,
                });
            }
        }

        if (infoList.length === 0) {
            return;
        }

        const folderPath = infoList[0].path.split(infoList[0].name)[0];

        console.log(infoList, 'infoList', infoList[0].path.split(infoList[0].name));

        this.bus.setSelectedPcitures({
            folder: folderPath,
            pictures: infoList,
        });

        console.log(event);
    }

    saveFile() {
        this.keyboard.buttonTriggerSave();
    }

    openDialog(): void {
        const dialogRef = this.dialog.open(SettingsDialogComponent, {
            width: '800px',
            height: '600px',
            data: {},
        });

        dialogRef.afterClosed().subscribe((result) => {
            console.log('The dialog was closed');
        });
    }

    exportFile() {
        this.bus.exportFile();
    }

    ngOnDestroy() {
        this.sub.unsubscribe();
    }
}
