import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { GlobalEventBusService } from '../core/event-bus';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { SettingsDialogComponent } from '../settings-dialog/settings-dialog.component';

@Component({
    selector: 'app-nav-bar',
    templateUrl: './nav-bar.component.html',
    styleUrls: ['./nav-bar.component.scss']
})
export class NavBarComponent implements OnInit {

    constructor(private bus: GlobalEventBusService, public dialog: MatDialog) { }

    @ViewChild('import') import: ElementRef;

    ngOnInit(): void {
    }

    selectVideo(event) {
        console.log(event);
        const file = event.target.files[0];
        if (!file) return;
        this.bus.selectVideo(file);

        this.import.nativeElement.value = null;
    }

    openDialog(): void {
        const dialogRef = this.dialog.open(SettingsDialogComponent, {
            width: '800px',
            height: '600px',
            data: {}
        });

        dialogRef.afterClosed().subscribe(result => {
            console.log('The dialog was closed');
        });
    }
}
