import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatSelectChange } from '@angular/material/select';
import { Iproperty, ITag } from '../../core/models/canvas.model';

@Component({
  selector: 'app-region-info',
  templateUrl: './region-info.component.html',
  styleUrls: ['./region-info.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RegionInfoComponent implements OnInit {

  @Input() label: ITag;
  @Input() values: any = {};
  public pictureLabelControl = new FormControl();

  @Output() propertyChange = new EventEmitter();

  constructor() { }

  ngOnInit(): void {
  }

  onSelectionChange(event: MatSelectChange, property) {
    this.propertyChange.emit({
      key: property.id,
      value: event.value
    });
  }

  onInputChange(event: FocusEvent & any, property: Iproperty) {
    this.propertyChange.emit({
      key: property.id,
      value: event.target.value
    });
  }
}
