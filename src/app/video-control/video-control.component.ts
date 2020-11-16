import { Component, OnInit, ViewChild, ElementRef, OnDestroy, AfterViewInit } from '@angular/core';
import { GlobalEventBusService } from '../core/event-bus';
import { tap } from 'rxjs/operators';
import { Subscription } from 'rxjs';

declare const videojs: any;

@Component({
    selector: 'app-video-control',
    templateUrl: './video-control.component.html',
    styleUrls: ['./video-control.component.scss']
})
export class VideoControlComponent implements OnDestroy {

    @ViewChild('container') container: ElementRef;
    @ViewChild('player') player: ElementRef;

    tagStyle = `height:0;width:0; top:0;left:0;`;

    private sub = new Subscription();
    private videoInfo = {};

    constructor(private event: GlobalEventBusService) {
    }

    onVideoTimeChange({ current, total }) {
        console.log(current, total, 'eeee');

        const t = this.getVideoTime(Math.floor(total));
        const c = this.getVideoTime(Math.floor(current));

        this.event.updateVideTime(`${c} : ${t}`);
    }

    private getVideoTime(t: number) {
        const s = (t % 60 + '').padStart(2, '0');
        const h = (Math.floor(t / 3600) + '').padStart(2, '0');
        const m = (Math.floor((t / 60) % 60) + '').padStart(2, '0');

        return `${h}:${m}:${s}`;
    }

    onVideoInformationChange(info) {
        this.videoInfo = info;
    }

    ngOnDestroy() {
        this.sub.unsubscribe();
    }

    private timeMap(time) { }
}
