import { Component, OnInit } from '@angular/core';

@Component({
    selector: 'app-settings-dialog',
    templateUrl: './settings-dialog.component.html',
    styleUrls: ['./settings-dialog.component.scss']
})
export class SettingsDialogComponent implements OnInit {

    labels = [];
    labelValue = '';
    frameRate = 50;

    constructor() { }

    ngOnInit(): void {
        this.getLabels();
    }

    updateLabel(event) {
        this.labelValue = event.target.value;
    }

    getLabels() {
        const labels = localStorage.getItem('labels') || '[]';
        this.labels = JSON.parse(labels);
    }

    removeLabel(index: number) {
        this.labels.splice(index, 1);

        localStorage.setItem('labels', JSON.stringify(this.labels));
    }

    addLabel() {
        const name = this.labelValue;
        this.labelValue = '';

        const label = {
            name,
            color: this.getColor()
        };

        this.labels.push(label);

        localStorage.setItem('labels', JSON.stringify(this.labels));
    }

    private getColor() {
        return `#${this.getRandomValue().toString(16)}${this.getRandomValue().toString(16)}${this.getRandomValue().toString(16)}`;
    }

    private getRandomValue() {
        return Math.ceil(Math.random() * 155) + 100;
    }
}
