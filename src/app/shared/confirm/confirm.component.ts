import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
    selector: 'app-confirm',
    templateUrl: './confirm.component.html',
    styleUrls: ['./confirm.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDialogComponent {

    constructor(
        private readonly dialogRef: MatDialogRef<ConfirmDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public readonly data: { title: string, context: string }
    ) { }

    public closeDialog(confirm: boolean): void {
        this.dialogRef.close(confirm);
    }
}
