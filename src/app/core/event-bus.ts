import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject, Subscription, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class GlobalEventBusService {

    ipcRenderer = (window as any).require('electron').ipcRenderer;
    private resize = new Subject();
    private videoSelected = new Subject();
    private tagChange = new Subject();
    private newTrackIdSeted: Subject<number> = new Subject();
    private currentTrackId: BehaviorSubject<number> = new BehaviorSubject(0);
    private frameChange: Subject<string> = new Subject();
    private loading: BehaviorSubject<boolean> = new BehaviorSubject(false);

    resize$ = this.resize.asObservable();
    videoSelected$ = this.videoSelected.asObservable();
    tagChange$ = this.tagChange.asObservable();
    newTrackIdSeted$ = this.newTrackIdSeted.asObservable();
    currentTrackId$ = this.currentTrackId.asObservable();
    frameChange$ = this.frameChange.asObservable();
    loading$ = this.loading.asObservable();




    onResize(size: { width: number, height: number }) {
        this.resize.next(size);
    }

    selectVideo(file) {
        console.log(file, '-------')
        this.videoSelected.next({
            name: file.name,
            src: file.path
        });
    }

    toggleTag(type: string) {
        this.tagChange.next(type);
    }

    newTrackId(id: number) {
        if (isNaN(id)) { return; }

        this.newTrackIdSeted.next(id);
    }

    setCurrentTrackId(id: number) {
        if (isNaN(id)) { return; }

        this.currentTrackId.next(id);
    }

    saveFile(data: any): Observable<any> {
        const _ = new Subject();

        this.ipcRenderer.on('file_save', (event, arg) => {
            _.next(arg);
        });
        this.ipcRenderer.send('save_file', data);

        return _;
    }

    readFileOrCreate(path: string, name: string): Observable<any> {
        const _ = new Subject();

        this.ipcRenderer.on('file_read', (event, arg) => {
            _.next(arg);
        });

        this.ipcRenderer.send('read_file', {
            path, name
        });

        return _;
    }

    changeFrame(type: string) {
        this.frameChange.next(type);
    }

    showLoading() {
        this.loading.next(true);
    }

    hideLoading() {
        this.loading.next(false);
    }
}
