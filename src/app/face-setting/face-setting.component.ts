import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { GlobalEventBusService } from '../core/event-bus';
import { IFace } from '../core/models/face.model';

@Component({
    selector: 'app-face-setting',
    templateUrl: './face-setting.component.html',
    styleUrls: ['./face-setting.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class FaceSettingComponent implements OnInit {

    type = 'query';
    queryFaceList: IFace[] = [];
    viewFaceList: IFace[] = [];

    constructor(public bus: GlobalEventBusService) {

    }

    ngOnInit(): void {
    }

    toggleView(type: string) {
        this.type = type;
    }

    chooseFace(face: IFace) {
        this.bus.chooseFace(face);
    }

}
