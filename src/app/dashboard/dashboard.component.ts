import { Component, OnInit } from '@angular/core';

declare const videojs: any;

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
    const options = {};

    const player = videojs('my-player', options, function onPlayerReady() {
      videojs.log('Your player is ready!');

      // In this context, `this` is the player that was created by Video.js.
      this.play();

      // How about an event listener?
      this.on('ended', () => {
        videojs.log('Awww...over so soon?!');
      });
    });
  }

}
