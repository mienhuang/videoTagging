import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject, Subscription, Observable } from 'rxjs';
import { IRegionInfo } from './models/region.model';
import { IFace } from './models/face.model';
import { ITag } from './models/canvas.model';
import { timeStamp } from 'console';
import { IFile, IFolder, IPictureInfo, IPictureUntagState } from './models/picture.model';
import { map, tap } from 'rxjs/operators';
import { ISaveFile } from './models/file.model';
import shortid from 'shortid';

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
    private queryFaceList: BehaviorSubject<IFace[]> = new BehaviorSubject([]);
    private viewFaceList: Subject<IFace[]> = new BehaviorSubject([]);
    private regionInfo: BehaviorSubject<IRegionInfo> = new BehaviorSubject({
        totalFrames: 0,
        totalRegions: 0,
        maxTrackId: 0,
    });
    private queryFaceEvent: Subject<boolean> = new Subject();
    private labelUpdateEvent: Subject<ITag[]> = new BehaviorSubject([]);
    private pictureLabelEvent: Subject<ITag[]> = new BehaviorSubject([]);
    private exportFileEvent: Subject<boolean> = new Subject();
    private videoTimeEvent: BehaviorSubject<string> = new BehaviorSubject('00:00:00');

    private frameRateUpdate: BehaviorSubject<number> = new BehaviorSubject(50);
    private selectPictureProject: Subject<IFolder> = new Subject();
    private pictureLables: Subject<ITag[]> = new Subject();
    private pictureIndexOffset: Subject<number> = new Subject();
    private pictureIndexChange: Subject<number> = new Subject();
    private goToFirstUntag: Subject<void> = new Subject();
    private picturePath: BehaviorSubject<string> = new BehaviorSubject('');
    private pictureUntagState: BehaviorSubject<boolean> = new BehaviorSubject(false);
    private picturePageInstance: BehaviorSubject<string> = new BehaviorSubject('0 : 0');

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
    queryFaceEvent$ = this.queryFaceEvent.asObservable();
    labelUpdateEvent$ = this.labelUpdateEvent.asObservable();
    exportFileEvent$ = this.exportFileEvent.asObservable();
    frameRateUpdate$ = this.frameRateUpdate.asObservable();
    videTimeEvent$ = this.videoTimeEvent.asObservable();

    pictureLabelEvent$ = this.pictureLabelEvent.asObservable();
    selectPictureProject$ = this.selectPictureProject.asObservable();
    pictureLables$ = this.pictureLables.asObservable();
    pictureIndexOffset$ = this.pictureIndexOffset.asObservable();
    picturePath$ = this.picturePath.asObservable();
    pictureIndexChange$ = this.pictureIndexChange.asObservable();
    picturePageInstance$ = this.picturePageInstance.asObservable();
    pictureUntagState$ = this.pictureUntagState.asObservable();
    goToFirstUntag$ = this.goToFirstUntag.asObservable();

    constructor() {
        const lablesText = localStorage.getItem('labels');
        const labels = lablesText ? JSON.parse(lablesText) || [] : [];
        this.labelUpdateEvent.next(labels);
    }

    setPictureLabels(lables: ITag[]) {
        this.pictureLables.next(lables);
    }

    onResize(size: { width: number; height: number }) {
        this.resize.next(size);
    }

    selectVideo(file) {
        this.videoSelected.next({
            name: file.name,
            src: file.path,
        });
    }

    toggleTag(type: string) {
        this.tagChange.next(type);
    }

    newTrackId(id: number) {
        if (isNaN(id)) {
            return;
        }

        this.newTrackIdSeted.next(id);
    }

    setCurrentStepLength(length: number) {
        this.currentStepLength.next(length);
    }

    setCurrentTrackId(id: number) {
        if (isNaN(id)) {
            return;
        }

        this.currentTrackId.next(id);
    }

    saveFile(data: ISaveFile): Observable<any> {
        const _ = new Subject();
        const topic = shortid.generate();

        this.ipcRenderer.on(topic, (event, arg) => {
            _.next(arg);
        });
        this.ipcRenderer.send('save_file', {
            ...data,
            topic,
        });

        return _;
    }

    readFileOrCreate(path: string, name: string): Observable<any> {
        const _ = new Subject();
        const topic = shortid.generate();

        this.ipcRenderer.on(topic, (event, arg) => {
            _.next(arg);
        });

        this.ipcRenderer.send('read_file', {
            topic,
            path,
            name,
        });

        return _;
    }

    readPictureProjectOrCreate(path: string, name: string, files: IPictureInfo[]): Observable<any> {
        const _ = new Subject();
        const topic = shortid.generate();

        this.ipcRenderer.on(topic, (event, arg) => {
            _.next(arg);
        });

        this.ipcRenderer.send('read_pictures', {
            topic,
            path,
            name,
            files,
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

    queryFace() {
        this.queryFaceEvent.next(true);
    }

    updateLabels(labels: ITag[]) {
        this.labelUpdateEvent.next(labels);
    }

    exportFile() {
        this.exportFileEvent.next(true);
    }

    updateFrameRate(rate: number) {
        this.frameRateUpdate.next(rate);
    }

    updateVideTime(time: string) {
        this.videoTimeEvent.next(time);
    }

    setSelectedPcitures(folder: IFolder) {
        this.selectPictureProject.next(folder);
    }

    setPictureRecentLabels(labels: ITag[]) {
        this.pictureLabelEvent.next(labels);
    }

    updatePictureIndex(offset: number) {
        this.pictureIndexOffset.next(offset);
    }

    setPictureIndex(index: number) {
        this.pictureIndexChange.next(index);
    }

    setPicturePath(path: string) {
        this.picturePath.next(path);
    }

    updatePictureUntagState(state: boolean) {
        this.pictureUntagState.next(state);
    }

    updatePicturePageInstance(index: string) {
        this.picturePageInstance.next(index);
    }

    triggerGoToFirstUntag() {
        this.goToFirstUntag.next();
    }
}
