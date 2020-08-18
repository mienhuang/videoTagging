import { Component, OnInit, ViewChild, ElementRef, OnDestroy, Output, EventEmitter, Input, OnChanges, SimpleChanges } from '@angular/core';
import { GlobalEventBusService } from '../core/event-bus';
import { tap } from 'rxjs/operators';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-video',
    templateUrl: './video.component.html',
    styleUrls: ['./video.component.scss']
})
export class VideoComponent implements OnInit, OnDestroy, OnChanges {

    progressMaxValue = 10000;

    video: HTMLVideoElement;
    scale = 1;
    height = 0;
    width = 0;

    @ViewChild('container') container: ElementRef;
    @Output() currentTimeChange = new EventEmitter();
    @Input() simpleRate = 50;

    isStartedPlay = false;
    isPlaying = false;
    isMuted = false;
    currentTimeId: NodeJS.Timeout;
    duration = 1;
    currentTime = 0;
    seekTime = 0;

    progressValue = 0;

    private sub = new Subscription();
    private step = 0.02;

    volumeFormatLabel = (value: number) => `${value}%`;
    progressFormatLabel = (value: number) => `00:00`;


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

        this.video.addEventListener('canplay', this.readyToPlay);
        this.video.addEventListener('loadeddata', this.addPoster);
        this.video.addEventListener('ended', this.ended);
        this.video.addEventListener('seeking', this.onSeeking);
        this.video.addEventListener('durationchange ', this.onDurationChange);
        this.video.addEventListener('seeked', this.afterSeeked);
    }

    getContainerSize = () => {
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
        this.onPlaying();
    }

    pasue() {
        if (!this.video) return;

        this.isPlaying = false;
        this.video.pause();
        this.stopPlay();
    }

    volumeChange({ value }) {
        this.video.volume = value / 100;

        if (value === 0) {
            this.isMuted = true;
            this.video.muted = true;
        }

        if (this.isMuted && value !== 0) {
            this.isMuted = false;
            this.video.muted = false;
        }
    }

    progressChange(event) {
        const percentage = event.value / this.progressMaxValue;
        this.seekTime = this.duration * percentage;

        console.log(this.seekTime, 'seekTime');

        // this.pasue();
        this.video.currentTime = this.seekTime;
    }

    mute() {
        if (!this.video) return;

        this.video.muted = true;
        this.isMuted = true;
    }

    unmute() {
        if (!this.video) return;

        this.video.muted = false;
        this.isMuted = false;
    }

    ended = (event) => {
        console.log(event, 'ended');
        this.isPlaying = false;

        this.stopPlay();
    }

    readyToPlay = () => {
        this.video.muted = true;
        this.video.volume = 0;
        this.isMuted = true;
        this.duration = this.video.duration;
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

    ngOnChanges(changes: SimpleChanges) {
        if (changes.simpleRate && this.simpleRate > 0) {
            this.step = 1 / this.simpleRate;
        }
    }

    ngOnDestroy() {
        this.sub.unsubscribe();
        this.video.removeEventListener('canplay', this.readyToPlay);
        this.video.removeEventListener('loadeddata', this.addPoster);
        this.video.removeEventListener('ended', this.ended);
        this.video.removeEventListener('seeking', this.onSeeking);
        this.video.removeEventListener('durationchange ', this.onDurationChange);
        this.video.removeEventListener('seeked', this.afterSeeked);
    }

    private onSeeking(event) {
        console.log(event, 'seeee');
        // TOTO show loading when seeking
    }

    private afterSeeked(event) {
        console.log('afterSeeked', event);
        this.currentTime = this.seekTime;
    }

    private onPlaying() {
        this.currentTimeId = setInterval(() => {
            this.currentTime = this.video.currentTime;
            this.progressValue = (this.currentTime / this.duration) * this.progressMaxValue;
            this.currentTimeChange.emit(this.video.currentTime);
        }, 50);
    }

    private stopPlay() {
        clearInterval(this.currentTimeId);
    }

    private onDurationChange(event) {
        console.log(event, 'duration change');
        // this.duration = event;
    }

}
