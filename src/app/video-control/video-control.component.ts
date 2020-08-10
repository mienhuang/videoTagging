import { Component, OnInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { GlobalEventBusService } from '../core/event-bus';
import { tap } from 'rxjs/operators';
import { Subscription } from 'rxjs';

declare const videojs: any;

@Component({
    selector: 'app-video-control',
    templateUrl: './video-control.component.html',
    styleUrls: ['./video-control.component.scss']
})
export class VideoControlComponent implements OnInit, OnDestroy {

    @ViewChild('container') container: ElementRef;
    width = 0;
    height = 0;

    private sub = new Subscription();

    constructor(private event: GlobalEventBusService) {
        const resizeSub = this.event.resize$
            .pipe(
                tap(() => {
                    const ele = this.container.nativeElement;

                    const height = this.container.nativeElement.offsetHeight;
                    const width = this.container.nativeElement.offsetWidth;

                    console.log(height, width);
                    this.height = height;
                    this.width = width;
                })
            )
            .subscribe();

        this.sub.add(resizeSub);
    }


    ngOnInit(): void {
        const options = {
            resizeManager: true
        };

        const player = videojs('my-player', options, function onPlayerReady() {
            videojs.log('Your player is ready!');

            // In this context, `this` is the player that was created by Video.js.
            //   this.play();

            // How about an event listener?
            this.on('ended', () => {
                videojs.log('Awww...over so soon?!');
            });
        });
    }


    ngOnDestroy() {
        this.sub.unsubscribe();
    }
}
