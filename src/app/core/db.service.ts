import { Injectable } from '@angular/core';
import { Observable, Subject, zip } from 'rxjs';
import { map } from 'rxjs/operators';

import { IDBResponse } from './models/region.model';

@Injectable({ providedIn: 'root' })
export class IndexedDBService {
    private _dbName = 'videoTagging';
    private _version = 1;
    private _db = null;
    private _region = null;

    openDB(): Observable<any> {
        const result: Subject<any> = new Subject();
        if (!('indexedDB' in window)) {
            console.log(`This browser doesn't support IndexedDB`);

            result.next({
                success: false,
                msg: `This browser doesn't support IndexedDB`,
            });

            return;
        }

        const request = window.indexedDB.open(this._dbName, this._version);

        request.onerror = (event: any): void => {
            console.log('open database fail');
            result.next({
                success: false,
                msg: `open database fail`,
            });
        };

        request.onsuccess = (event: any): void => {
            this._db = request.result;
            console.log('open database success');
            result.next({
                success: true,
                msg: `open database success`,
            });
        };

        request.onupgradeneeded = (event: any): void => {
            console.log(event, 'upgread');
            this._db = event.target.result;
            if (!this._db.objectStoreNames.contains('region')) {
                this._region = this._db.createObjectStore('region', { keyPath: 'id', autoIncrement: false });
            }
        };

        return result;
    }

    getAll(sheet: string): Observable<IDBResponse> {
        if (!this._db) {
            return;
        }
        let data = [];

        const data$: Subject<IDBResponse> = new Subject();

        const objectStore = this._db.transaction(sheet).objectStore(sheet);

        objectStore.openCursor().onsuccess = (event: any): void => {
            const cursor = event.target.result;

            if (cursor) {
                data = [...data, { ...cursor.value }];
                cursor.continue();
            } else {
                console.log('no more data');
                data$.next({
                    success: true,
                    data,
                    msg: 'read success',
                });
            }
        };

        return data$.asObservable();
    }

    getOneById(sheet: string, id: number | string): Observable<IDBResponse> {
        if (!this._db) {
            return;
        }

        const request = this._db.transaction([sheet]).objectStore(sheet).get(id);

        const data$: Subject<IDBResponse> = new Subject();
        request.onerror = (event: any): void => {
            console.log('read data fail', event);
            data$.next({ success: false, msg: 'error occured when reading data' });
        };
        request.onsuccess = (event: any): void => {
            if (!request.result) {
                data$.next({ success: false, msg: 'no data founded' });

                return;
            }
            data$.next({ success: true, data: request.result, msg: 'read success' });
        };

        return data$.asObservable();
    }

    getByIndex(sheet: string, indexName: string, indexValue: number | string): Observable<IDBResponse> {
        if (!this._db) {
            return;
        }

        const request = this._db.transaction([sheet], 'readonly').objectStore(sheet).index(indexName);

        request.get(indexValue);

        const data$: Subject<IDBResponse> = new Subject();
        request.onerror = (event: any): void => {
            console.log('read data fail', event);
            data$.next({ success: false, msg: 'error occured when reading data' });
        };
        request.onsuccess = (event: any): void => {
            if (!request.result) {
                data$.next({ success: false, msg: 'no data founded' });

                return;
            }
            data$.next({ success: true, data: request.result, msg: 'read success' });
        };

        return data$.asObservable();
    }

    add(sheet: string, data: any): Observable<IDBResponse> {
        if (!this._db) {
            return;
        }
        const uuid: string = this.getUuid();
        const time: number = new Date().getTime();
        const requestData: any = {
            ...data,
            id: uuid,
            createAt: time,
        };

        const request = this._db.transaction([sheet], 'readwrite').objectStore(sheet).add(requestData);

        const status$: Subject<IDBResponse> = new Subject();

        request.onsuccess = (event: any): void => {
            console.log('add data success');
            status$.next({ success: true, msg: 'add data success', data: requestData });
        };
        request.onerror = (event: any): void => {
            console.log('add data fail');
            status$.next({ success: false, msg: 'add data fail' });
        };

        return status$.asObservable();
    }

    update(sheet: string, data: any): Observable<IDBResponse> {
        if (!this._db) {
            return;
        }
        const request = this._db.transaction([sheet], 'readwrite').objectStore(sheet).put(data);

        const status$: Subject<IDBResponse> = new Subject();
        request.onsuccess = (event: any): void => {
            console.log('update success', event);
            status$.next({ success: true, msg: 'update data success', data: { ...data, id: event.target.result } });
        };

        request.onerror = (event: any): void => {
            console.log('update fail', event);
            status$.next({ success: false, msg: 'update data fail' });
        };

        return status$.asObservable();
    }

    delete(sheet: string, id: string): Observable<IDBResponse> {
        if (!this._db) {
            return;
        }
        const request = this._db.transaction([sheet], 'readwrite').objectStore(sheet).delete(id);
        const status$: Subject<IDBResponse> = new Subject();

        request.onsuccess = (event: any): void => {
            console.log('delete success', event);
            status$.next({ success: true, msg: 'delete data success' });
        };

        request.onerror = (event: any): void => {
            console.log('delete fail', event);
            status$.next({ success: false, msg: 'delete data fail' });
        };

        return status$.asObservable();
    }

    restore(sheet: string, dataList: Array<any>): Observable<IDBResponse> {
        if (!this._db) {
            return;
        }

        console.log(
            {
                sheet,
                dataList,
            },
            'what db recieved in db service.'
        );

        const objectStore = this._db.transaction([sheet], 'readwrite').objectStore(sheet);

        return zip(
            ...dataList.map((data: any) => {
                const request = objectStore.put(data);

                const status$: Subject<IDBResponse> = new Subject();
                request.onsuccess = (event: any): void => {
                    status$.next({ success: true, msg: 'update data success', data: { id: event.target.result } });
                };

                request.onerror = (event: any): void => {
                    status$.next({ success: false, msg: 'update data fail' });
                };

                return status$.asObservable();
            })
        ).pipe(
            map((list: Array<IDBResponse>) => {
                return {
                    success: list.every((item: IDBResponse) => item.success),
                    msg: '',
                };
            })
        );
    }

    clearData(sheet: string): Observable<IDBResponse> {
        if (!this._db) {
            return;
        }
        const request = this._db.transaction([sheet], 'readwrite').objectStore(sheet).clear();
        const status$: Subject<IDBResponse> = new Subject();

        request.onsuccess = (event: any): void => {
            console.log('clear success', event);
            status$.next({ success: true, msg: 'clear data success' });
        };

        request.onerror = (event: any): void => {
            console.log('clear fail', event);
            status$.next({ success: false, msg: 'clear data fail' });
        };

        return status$.asObservable();
    }

    private getUuid(): string {
        const len = 36;
        let s = [];
        const hexDigits: string = '0123456789abcdef';
        for (let i = 0; i < len; i++) {
            s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
        }
        s[14] = '4';
        s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);
        s[8] = s[13] = s[18] = s[23] = '-';

        return s.join('');
    }
}
