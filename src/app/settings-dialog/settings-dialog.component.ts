import { Component, OnInit } from '@angular/core';
import { GlobalEventBusService } from '../core/event-bus';

@Component({
    selector: 'app-settings-dialog',
    templateUrl: './settings-dialog.component.html',
    styleUrls: ['./settings-dialog.component.scss']
})
export class SettingsDialogComponent implements OnInit {

    labels = [];
    labelValue = '';
    frameRate = 50;

    constructor(private eventBus: GlobalEventBusService) { }

    ngOnInit(): void {
        this.getLabels();
        this.frameRate = Number(localStorage.getItem('frameRate') || 50);
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
        this.eventBus.updateLabels(this.labels);
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

        this.eventBus.updateLabels(this.labels);
    }

    addressChange(e) {
        const value = e.target.value;
        localStorage.setItem('imgURL', value);
    }

    tabIdChange(e) {
        const value = e.target.value;
        localStorage.setItem('imgTL', value);
    }

    updateFrameRate(rate: string) {
        const value = Number(rate);

        this.eventBus.updateFrameRate(value);
        localStorage.setItem('frameRate', rate);
    }

    private getColor() {
        return `#${this.getRandomValue().toString(16)}${this.getRandomValue().toString(16)}${this.getRandomValue().toString(16)}`;
    }

    private getRandomValue() {
        return Math.ceil(Math.random() * 155) + 100;
    }
}
