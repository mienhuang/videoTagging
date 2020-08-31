import { Injectable } from '@angular/core';
import { IndexedDBService } from './db.service';
import { IDBResponse } from './models/region.model';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class RegionDataService {

    constructor(private idb: IndexedDBService) {
    }


    addRegion(region): Observable<IDBResponse> {
        return this.idb.add('region', region);
    }

    updateRegion(region)


}
