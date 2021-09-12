import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ITag } from '../../core/models/canvas.model';

@Component({
  selector: 'app-region-info',
  templateUrl: './region-info.component.html',
  styleUrls: ['./region-info.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RegionInfoComponent implements OnInit {

  @Input() label: ITag;

  public pictureLabelControl = new FormControl();

  constructor() { }

  ngOnInit(): void {
  }

}
