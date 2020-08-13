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
export class VideoControlComponent implements OnInit, OnDestroy, AfterViewInit {

    @ViewChild('container') container: ElementRef;
    @ViewChild('player') player: ElementRef;

    tagStyle = `height:0;width:0; top:0;left:0;`;

    private sub = new Subscription();

    constructor(private event: GlobalEventBusService) {
        // const resizeSub = this.event.resize$
        //     .pipe(
        //         tap(() => {
        //             const ele = this.container.nativeElement;

        //             const height = this.container.nativeElement.offsetHeight;
        //             const width = this.container.nativeElement.offsetWidth;

        //             console.log(height, width);
        //             this.tagStyle = `height:${height}px; width: ${width}px; top: 0; left: 0;`;
        //         })
        //     )
        //     .subscribe();

        // this.sub.add(resizeSub);
    }


    ngOnInit(): void {
        // const options = {
        //     resizeManager: true
        // };

        // const player = videojs('player', options, function onPlayerReady() {
        //     videojs.log('Your player is ready!');

        //     // In this context, `this` is the player that was created by Video.js.
        //     //   this.play();

        //     // How about an event listener?
        //     this.on('ended', () => {
        //         videojs.log('Awww...over so soon?!');
        //     });
        // });

        // const myButton = player.controlBar.addChild('button', {
        //     text: 'Press me',
        //     // other options
        // });

        // myButton.addClass('html-classname');


    }

    ngAfterViewInit() {
        // this.renderTagContainer();
        // const video = document.querySelector('video');
        // console.log(video.offsetHeight, video.offsetWidth, video.offsetTop, video.offsetLeft)
    }

    private renderTagContainer() {
        const ele = this.player.nativeElement;

        const height = ele.offsetHeight;
        const width = ele.offsetWidth;

        console.log(height, width);
        this.tagStyle = `height:${height}px; width: ${width}px; top: 0; left: 0;`;
    }


    ngOnDestroy() {
        this.sub.unsubscribe();
    }
}
