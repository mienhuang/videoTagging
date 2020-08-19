import { Component, OnInit } from '@angular/core';
import { GlobalEventBusService } from '../core/event-bus';

@Component({
    selector: 'app-nav-bar',
    templateUrl: './nav-bar.component.html',
    styleUrls: ['./nav-bar.component.scss']
})
export class NavBarComponent implements OnInit {

    constructor(private bus: GlobalEventBusService) { }

    ngOnInit(): void {
    }

    selectVideo(event) {
        console.log(event);
        const file = event.target.files[0];
        this.bus.selectVideo(file);
    }

}
