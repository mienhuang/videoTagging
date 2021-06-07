import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-video-marker',
  templateUrl: './video-marker.component.html',
  styleUrls: ['./video-marker.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VideoMarkerComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}
