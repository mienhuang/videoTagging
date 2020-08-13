import { Component, OnInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { GlobalEventBusService } from '../core/event-bus';
import { tap } from 'rxjs/operators';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-video',
    templateUrl: './video.component.html',
    styleUrls: ['./video.component.scss']
})
export class VideoComponent implements OnInit, OnDestroy {

    video: HTMLVideoElement;
    scale = 1;
    height = 0;
    width = 0;

    @ViewChild('container') container: ElementRef;

    isStartedPlay = false;
    isPlaying = false;

    private sub = new Subscription();

    constructor(private event: GlobalEventBusService) {

        const resizeSub = this.event.resize$
            .pipe(
                tap(({ width, height }) => {
                    this.width = width - 60;
                })
            )
            .subscribe();

        this.sub.add(resizeSub);
    }

    ngOnInit(): void {
        this.getContainerSize();

        this.video = document.getElementById('video') as HTMLVideoElement;
        this.video.addEventListener('loadeddata', this.addPoster);
    }

    getContainerSize = () => {
        console.log(this, 'ssssssssss')
        const ele = document.getElementById('container');


        this.height = ele.offsetHeight;
        this.width = ele.offsetWidth;
    }

    startPlay() {
        if (!this.video) return;

        this.isStartedPlay = true;

        this.play();
    }

    play() {
        if (!this.video) return;
        this.isPlaying = true;
        this.video.play();
    }

    pasue() {
        if (!this.video) return;

        this.isPlaying = false;
        this.video.pause();
    }

    addPoster = () => {
        const canvas = document.createElement('canvas');
        canvas.width = this.video.videoWidth * this.scale;
        canvas.height = this.video.videoHeight * this.scale;
        canvas.getContext('2d').drawImage(this.video, 0, 0, canvas.width, canvas.height);

        // const img = document.createElement("img");
        const src = canvas.toDataURL('image/jpeg', 1.0);
        // output.appendChild(img);
        this.video.setAttribute('poster', src);
    }

    ngOnDestroy() {
        this.sub.unsubscribe();
    }

}
