import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject, Subscription, Observable } from 'rxjs';
import { IRegionInfo } from './models/region.model';
import { IFace } from './models/face.model';

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
    private deleteRegion: Subject<number> = new Subject();
    private searchRegion: Subject<number> = new Subject();
    private currentStepLength: Subject<number> = new Subject();
    private faceChooseEvent: Subject<IFace> = new Subject();
    private queryFaceList: Subject<IFace[]> = new BehaviorSubject([]);
    private viewFaceList: Subject<IFace[]> = new BehaviorSubject([]);
    private regionInfo: BehaviorSubject<IRegionInfo> = new BehaviorSubject({
        totalFrames: 0,
        totalRegions: 0,
        maxTrackId: 0
    });

    resize$ = this.resize.asObservable();
    videoSelected$ = this.videoSelected.asObservable();
    tagChange$ = this.tagChange.asObservable();
    newTrackIdSeted$ = this.newTrackIdSeted.asObservable();
    currentTrackId$ = this.currentTrackId.asObservable();
    frameChange$ = this.frameChange.asObservable();
    loading$ = this.loading.asObservable();
    deleteRegion$ = this.deleteRegion.asObservable();
    searchRegion$ = this.searchRegion.asObservable();
    currentStepLength$ = this.currentStepLength.asObservable();
    faceChooseEvent$ = this.faceChooseEvent.asObservable();
    queryFaceList$ = this.queryFaceList.asObservable();
    viewFaceList$ = this.viewFaceList.asObservable();
    regionInfo$ = this.regionInfo.asObservable();




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

    setCurrentStepLength(length: number) {
        this.currentStepLength.next(length);
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

    searchRegionByTrackId(trackId: number) {
        this.searchRegion.next(trackId);
    }

    deleteAllRegionsByTrackId(trackId: number) {
        this.deleteRegion.next(trackId);
    }

    chooseFace(face: IFace) {
        this.faceChooseEvent.next(face);
    }

    setQueryFaceList(list: IFace[]) {
        this.queryFaceList.next(list);
    }

    setViewFaceList(list: IFace[]) {
        this.viewFaceList.next(list);
    }

    updateRegionInfo(info: IRegionInfo) {
        this.regionInfo.next(info);
    }
}
