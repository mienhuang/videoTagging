import {
    Component,
    OnInit,
    ViewChild,
    ElementRef,
    OnDestroy,
    Output,
    EventEmitter,
    Input,
    OnChanges,
    SimpleChanges,
    AfterViewInit,
    ChangeDetectorRef,
    ChangeDetectionStrategy,
} from '@angular/core';
import { SafeUrl, DomSanitizer } from '@angular/platform-browser';

import shortid from 'shortid';

import { GlobalEventBusService } from '../core/event-bus';
import { KeyboardEventService } from '../core/keyboard-event';
import { tap, filter, delay, switchMap, switchMapTo, take } from 'rxjs/operators';
import { BehaviorSubject, Subscription } from 'rxjs';
import { CanvasTools } from 'vott-ct';
import { RegionData } from 'vott-ct/lib/js/CanvasTools/Core/RegionData';

import { EditorMode, RegionType, ITag } from '../core/models/canvas.model';

import CanvasHelpers from '../core/canvasHelpers';

import { Editor } from 'vott-ct/lib/js/CanvasTools/CanvasTools.Editor';
// import Clipboard from '../../../../common/clipboard';
// import Confirm from '../../common/confirm/confirm';
// import { strings } from '../../../../common/strings';
// import { SelectionMode } from 'vott-ct/lib/js/CanvasTools/Interface/ISelectorSettings';
import { Rect } from 'vott-ct/lib/js/CanvasTools/Core/Rect';

import { IRegion } from '../core/models/canvas.model';
import { ICustomData } from '../core/models/region.model';
import { MatSnackBar } from '@angular/material/snack-bar';
import { IFace } from '../core/models/face.model';

@Component({
    selector: 'app-video',
    templateUrl: './video.component.html',
    styleUrls: ['./video.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VideoComponent implements OnInit, OnDestroy, OnChanges, AfterViewInit {
    progressMaxValue = 10000;

    video: HTMLVideoElement;
    scale = 1;
    height = 0;
    width = new BehaviorSubject(0);

    @ViewChild('container') container: ElementRef;
    @ViewChild('videoContainer') videoContainer: ElementRef;
    @Output() currentTimeChange: EventEmitter<{ current: number; total: number }> = new EventEmitter();
    @Output() videoInformation = new EventEmitter();
    @Input() sampleRate = 50;

    isStartedPlay = false;
    isPlaying = false;
    isMuted = false;
    currentTimeId: NodeJS.Timeout;
    duration = 1;
    currentTime = 0;
    seekTime = 0;

    editor: Editor;
    progressValue = new BehaviorSubject(0);

    videoHeight = 0;
    videoWidth = 0;
    frameHeight = 0;
    frameWidth = 0;
    filePath: SafeUrl = '';
    normalFilePath = {
        fileName: '',
        filePath: '',
    };
    videoTime = '00:00:00 / 00:00:00';

    private tags: ITag[] = [{ name: 'face', color: '#ff22ff' }];
    private sub = new Subscription();
    private stepLength = 1;
    private step = 0.02;
    private _customData = {
        maxTrackId: 0,
        regions: [],
        maxTrackIdList: [0],
        currentTrackId: [],
    };
    private _frames = {};
    private frameIndex = 0;
    private selectedRegions: IRegion[];
    private template: Rect;
    private lockedTags: string[] = [];
    private videoStartTime = 0;
    private isSaveingData = false;

    volumeFormatLabel = (value: number) => `${value}%`;
    progressFormatLabel = (value: number) => `00:00`;

    constructor(
        private event: GlobalEventBusService,
        private keyboardEvent: KeyboardEventService,
        private cdr: ChangeDetectorRef,
        private domSanitizer: DomSanitizer,
        private _snackBar: MatSnackBar
    ) {
        const resizeSub = this.event.resize$
            .pipe(
                tap(({ width, height }) => {
                    this.updateVideoSize(width);
                }),
                filter(() => Boolean(this.video)),
                delay(100),
                tap(() => {
                    this.frameHeight = this.video.clientHeight;
                    this.frameWidth = this.video.clientWidth;

                    this.editor.AS.resize(this.frameWidth, this.frameHeight);
                })
            )
            .subscribe();
        const videoSelectSub = this.event.videoSelected$
            .pipe(
                tap(() => {
                    this.message('open video successed, syncing data...');
                    this.event.showLoading();
                }),
                tap(({ name, src }) => {
                    console.log({ name, src }, src.split(name));
                    this.normalFilePath = {
                        fileName: name,
                        filePath: src.split(name)[0],
                    };
                    this.filePath = this.domSanitizer.bypassSecurityTrustUrl(src);
                    localStorage.setItem('filePath', src.split(name)[0]);
                    localStorage.setItem('fileName', name);
                }),
                switchMap(() => {
                    return this.event.readFileOrCreate(localStorage.getItem('filePath'), localStorage.getItem('fileName')).pipe(
                        tap((data) => {
                            console.log(data, 'readFileOrCreate');
                            const { customData, frameData } = JSON.parse(data);
                            console.log({ customData, frameData }, 'readFileOrCreate');
                            this._customData = customData;
                            this._frames = frameData;
                        })
                    );
                }),
                tap(() => {
                    this.event.hideLoading();
                    this.cdr.markForCheck();
                }),
                tap(() => {
                    this.initVideo();
                })
            )
            .subscribe();

        const tagChangeSub = this.event.tagChange$
            .pipe(
                tap((type: string) => {
                    this.applyTag(type);
                }),
                tap(() => {
                    this.cdr.markForCheck();
                })
            )
            .subscribe();
        const newTrackIdSub = this.event.newTrackIdSeted$
            .pipe(
                tap((id: number) => {
                    this.updateTrackId(id);
                }),
                tap(() => {
                    this.cdr.markForCheck();
                })
            )
            .subscribe();

        const spanceSub = this.keyboardEvent.spaceTabed$
            .pipe(
                tap(() => {
                    this.togglePlay();
                }),
                tap(() => {
                    this.cdr.markForCheck();
                })
            )
            .subscribe();

        const arrowLeftSub = this.keyboardEvent.arrowLeft$
            .pipe(
                tap(() => {
                    this.moveToPreviousFrame();
                })
            )
            .subscribe();
        const arrowRightSub = this.keyboardEvent.arrowRight$
            .pipe(
                tap(() => {
                    this.moveToNextFrame();
                })
            )
            .subscribe();
        const saveDataSub = this.keyboardEvent.saveData$
            .pipe(
                filter(() => !this.isSaveingData),
                tap(() => {
                    this.event.showLoading();
                    this.message('saving data...');
                }),
                switchMap(() => {
                    return this.event.saveFile({
                        path: `${this.normalFilePath.filePath}${this.normalFilePath.fileName.split('.')[0]}.vt`,
                        contents: JSON.stringify({
                            customData: this._customData,
                            frameData: this._frames,
                        }),
                    });
                }),
                tap(() => {
                    this.event.hideLoading();
                })
            )
            .subscribe();

        const frameChangeSub = this.event.frameChange$
            .pipe(
                tap((type) => {
                    this.moveToFrame(type);
                })
            )
            .subscribe();

        const searchRegionSub = this.event.searchRegion$
            .pipe(
                tap((trackId: number) => {
                    this.searchRegionByTrackId(trackId);
                })
            )
            .subscribe();

        const deleteRegionSub = this.event.deleteRegion$
            .pipe(
                tap((trackId: number) => {
                    this.deleteRegionsByTrackId(trackId);
                })
            )
            .subscribe();

        const stepLengthSub = this.event.currentStepLength$
            .pipe(
                tap((length: number) => {
                    this.stepLength = length;
                })
            )
            .subscribe();

        const faceChooseSub = this.event.faceChooseEvent$
            .pipe(
                tap((face: IFace) => {
                    this.setFaceId(face);
                })
            )
            .subscribe();

        const queryFaceSub = this.event.queryFaceEvent$
            .pipe(
                tap(() => {
                    this.searchRegion();
                })
            )
            .subscribe();

        const labelsUpdateSub = this.event.labelUpdateEvent$
            .pipe(
                tap((labels) => {
                    this.tags = labels;
                })
            )
            .subscribe();

        const exportFileSub = this.event.exportFileEvent$
            .pipe(
                tap(() => {
                    this.exportFile();
                })
            )
            .subscribe();

        const frameRateSub = this.event.frameRateUpdate$
            .pipe(
                tap((rate: number) => {
                    this.sampleRate = rate;

                    this.resetAll();
                })
            )
            .subscribe();

        this.sub.add(resizeSub);
        this.sub.add(videoSelectSub);
        this.sub.add(tagChangeSub);
        this.sub.add(spanceSub);
        this.sub.add(arrowLeftSub);
        this.sub.add(arrowRightSub);
        this.sub.add(newTrackIdSub);
        this.sub.add(saveDataSub);
        this.sub.add(frameChangeSub);
        this.sub.add(searchRegionSub);
        this.sub.add(deleteRegionSub);
        this.sub.add(stepLengthSub);
        this.sub.add(faceChooseSub);
        this.sub.add(queryFaceSub);
        this.sub.add(labelsUpdateSub);
        this.sub.add(exportFileSub);
        this.sub.add(frameRateSub);
    }

    ngOnInit(): void {
        this.getContainerSize();
        const fileName = localStorage.getItem('fileName');
        const filePath = localStorage.getItem('filePath');

        if (!fileName || !filePath) return;

        this.normalFilePath = {
            fileName,
            filePath,
        };

        this.event.showLoading();
        this.message('syncing data...');
        const readFileSub = this.event
            .readFileOrCreate(filePath, fileName)
            .pipe(
                tap((data) => {
                    const { customData, frameData } = JSON.parse(data);
                    this._customData = customData;
                    this._frames = frameData;
                }),
                tap(() => {
                    this.event.updateRegionInfo({
                        totalFrames: 0,
                        totalRegions: 0,
                        maxTrackId: this._customData.maxTrackId,
                    });
                }),
                tap(() => {
                    this.event.hideLoading();
                })
            )
            .subscribe();

        this.sub.add(readFileSub);
        this.filePath = this.domSanitizer.bypassSecurityTrustUrl(`${localStorage.getItem('filePath')}${localStorage.getItem('fileName')}`);
        this.initVideo();

        this.cdr.markForCheck();
    }

    initVideo() {
        this.video = document.getElementById('video') as HTMLVideoElement;

        this.video.addEventListener('canplay', this.readyToPlay);
        this.video.addEventListener('loadeddata', this.addPoster);
        this.video.addEventListener('ended', this.ended);
        this.video.addEventListener('seeking', this.onSeeking);
        this.video.addEventListener('durationchange ', this.onDurationChange);
        this.video.addEventListener('seeked', this.afterSeeked);
    }

    ngAfterViewInit() {
        // this.addCTEditor();
        // editor.addToolbar(toolbarContainer, CanvasTools.Editor.FullToolbarSet, '../../assets/icons');
    }

    getContainerSize = () => {
        const ele = document.getElementById('container');

        this.height = ele.offsetHeight;
        this.width.next(ele.offsetWidth);
    };

    startPlay() {
        if (!this.video) return;

        this.isStartedPlay = true;

        this.play();
    }

    togglePlay() {
        if (this.isPlaying) {
            this.pasue();

            return;
        }

        this.play();
    }

    play() {
        if (!this.video) return;

        this.removeUntagRegion();

        this.isStartedPlay = true;
        this.isPlaying = true;
        this.video.play();
        this.onPlaying();
    }

    pasue() {
        if (!this.video) return;

        this.isPlaying = false;
        this.video.pause();
        this.stopPlay();
    }

    volumeChange({ value }) {
        this.video.volume = value / 100;

        if (value === 0) {
            this.isMuted = true;
            this.video.muted = true;
        }

        if (this.isMuted && value !== 0) {
            this.isMuted = false;
            this.video.muted = false;
        }
    }

    progressChange(event) {
        const percentage = event.value / this.progressMaxValue;

        const target = Math.ceil((this.duration * percentage) / this.step) * this.step;
        this.seekTo(target);
    }

    moveToNextFrame() {
        const target = Number(((Math.ceil(this.currentTime / this.step) + this.stepLength) * this.step).toFixed(6));
        if (target > this.duration) {
            return;
        }
        this.seekTo(target);
    }

    moveToPreviousFrame() {
        const target = Number(((Math.floor(this.currentTime / this.step) - this.stepLength) * this.step).toFixed(6));
        if (target < 0) {
            return;
        }
        this.seekTo(target);
    }

    seekTo(time: number) {
        if (!this.video) return;

        this.removeUntagRegion();

        this.seekTime = time;
        this.pasue();
        this.video.currentTime = this.seekTime;

        this.currentTime = this.video.currentTime;
        this.progressValue.next((this.currentTime / this.duration) * this.progressMaxValue);
        this.checkFrameIndex();
        this.currentTimeChange.emit({
            current: this.video.currentTime,
            total: this.video.duration,
        });
        this.setVideoTime({
            current: this.video.currentTime,
            total: this.video.duration,
        });
    }

    mute() {
        if (!this.video) return;

        this.video.muted = true;
        this.isMuted = true;
    }

    unmute() {
        if (!this.video) return;

        this.video.muted = false;
        this.isMuted = false;
    }

    ended = (event) => {
        console.log(event, 'ended');
        this.isPlaying = false;

        this.stopPlay();
        this.cdr.markForCheck();
    };

    readyToPlay = () => {
        console.log('can play', this);

        this.video.muted = true;
        this.video.volume = 0;
        this.isMuted = true;
        this.duration = this.video.duration;

        this.videoHeight = this.video.videoHeight;
        this.videoWidth = this.video.videoWidth;
        this.frameHeight = this.video.clientHeight;
        this.frameWidth = this.video.clientWidth;

        this.videoInformation.emit({
            duration: this.duration,
            videoHeight: this.videoHeight,
            videoWidth: this.videoWidth,
            frameHeight: this.frameHeight,
            frameWidth: this.frameWidth,
        });
        this.addCTEditor();
    };

    updateCanvas() {
        const canvas = document.querySelector('#post-canvas') as HTMLCanvasElement;
        canvas.width = this.video.videoWidth * this.scale;
        canvas.height = this.video.videoHeight * this.scale;
        canvas.getContext('2d').drawImage(this.video, 0, 0, canvas.width, canvas.height);
    }

    addPoster = () => {
        const canvas = document.getElementById('new-canvas') as HTMLCanvasElement;
        canvas.width = this.video.videoWidth * this.scale;
        canvas.height = this.video.videoHeight * this.scale;
        canvas.getContext('2d').drawImage(this.video, 0, 0, canvas.width, canvas.height);

        // const img = document.createElement('img');
        const src = canvas.toDataURL('image/jpeg', 1.0);
        // output.appendChild(img);
        // this.video.setAttribute('poster', src);
    };

    searchRegion() {
        const region = this.getSelectedRegions()[0];
        this.search(region);
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes.sampleRate && this.sampleRate > 0) {
            this.step = 1 / this.sampleRate;
        }
    }

    ngOnDestroy() {
        this.sub.unsubscribe();
        if (!this.video) {
            return;
        }

        this.video.removeEventListener('canplay', this.readyToPlay);
        this.video.removeEventListener('loadeddata', this.addPoster);
        this.video.removeEventListener('ended', this.ended);
        this.video.removeEventListener('seeking', this.onSeeking);
        this.video.removeEventListener('durationchange ', this.onDurationChange);
        this.video.removeEventListener('seeked', this.afterSeeked);
    }

    private addCTEditor() {
        if (this.editor) {
            return;
        }

        const editorContainer = document.getElementById('editorDiv') as HTMLDivElement;
        // const toolbarContainer = document.getElementById('toolbarDiv');

        this.editor = new CanvasTools.Editor(editorContainer).api;
        this.editor.autoResize = true;
        this.editor.onSelectionEnd = this.onSelectionEnd;
        this.editor.onRegionMoveEnd = this.onRegionMoveEnd;
        this.editor.onRegionDelete = this.onRegionDelete;
        this.editor.onRegionSelected = this.onRegionSelected;
        this.editor.AS.resize(this.frameWidth, this.frameHeight);

        // this.editor.AS.setSelectionMode({ mode: SelectionMode });
    }

    private updateVideoSize(width: number) {
        if (!this.video) return;

        const { clientHeight: ch, clientWidth: cw } = this.container.nativeElement;
        const targetWidth = width - 360;
        const { videoHeight: vch, videoWidth: vcw } = this.video;

        const maxWidth = ((ch - 38) * vcw) / vch;
        console.log(targetWidth, maxWidth, 'maxWidthmaxWidth', vch, vcw, ch);
        this.width.next(targetWidth < maxWidth ? targetWidth : maxWidth);
    }

    private message(message: string) {
        this._snackBar.open(message, 'Notice', {
            verticalPosition: 'top',
            duration: 3000,
        });
    }

    private onSeeking = (event) => {
        console.log(event, 'seeee');
        // TOTO show loading when seeking
    };

    private afterSeeked = (event) => {
        // this.play();
        console.log('seeked...');
        this.currentTime = this.seekTime;
        this.checkFrameIndex();
    };

    private onPlaying() {
        this.currentTimeId = setInterval(() => {
            this.currentTime = this.video.currentTime;
            this.progressValue.next((this.currentTime / this.duration) * this.progressMaxValue);
            this.checkFrameIndex();
            this.currentTimeChange.emit({
                current: this.video.currentTime,
                total: this.video.duration,
            });
            this.setVideoTime({
                current: this.video.currentTime,
                total: this.video.duration,
            });
        }, 50);
    }

    private setVideoTime({ current, total }) {
        const t = this.getVideoTime(Math.floor(total));
        const c = this.getVideoTime(Math.floor(current));

        this.videoTime = `${c} / ${t}`;
    }

    private getVideoTime(t: number) {
        const s = ((t % 60) + '').padStart(2, '0');
        const h = (Math.floor(t / 3600) + '').padStart(2, '0');
        const m = (Math.floor((t / 60) % 60) + '').padStart(2, '0');

        return `${h}:${m}:${s}`;
    }

    private checkFrameIndex() {
        const target = Math.ceil((this.currentTime - this.videoStartTime) / this.step) + 1;
        console.log(this.currentTime, target, this.frameIndex, 'this.frameIndex');
        if (target !== this.frameIndex) {
            this.updateFrameIndex(target);
        }
    }

    private removeUntagRegion() {
        const index = this.frameIndex;

        const regions = (this._frames[index] || []).filter((region: IRegion) => region.tags.length === 0);
        const copy = JSON.parse(JSON.stringify(regions));

        copy.forEach((region) => {
            this.updateMaxTrackId(region, 'delete');
        });
    }

    private updateFrameIndex(index: number) {
        this.frameIndex = index;
        this.refreshCanvasToolsRegions();
    }

    private stopPlay() {
        clearInterval(this.currentTimeId);
    }

    private onDurationChange = (event) => {
        console.log(event, 'duration change');
        // this.duration = event;
    };

    private onSelectionEnd = (regionData: RegionData) => {
        if (CanvasHelpers.isEmpty(regionData)) {
            return;
        }

        const { height, width, x, y, points } = CanvasHelpers.scaleRegionToSourceSize(
            regionData,
            this.videoWidth,
            this.videoHeight,
            this.frameWidth,
            this.frameHeight
        );

        console.log({ height, width, x, y, points });

        if (!(height * width)) {
            // INFO: avoid add a dot to the page as a region
            return;
        }

        const id: string = shortid.generate();

        const defaultDescription = CanvasHelpers.getDefaultDescriptor();

        this.editor.RM.addRegion(id, regionData, defaultDescription);

        const newRegion: IRegion = {
            id,
            type: this.editorModeToType(EditorMode.Rectangle),
            tags: [],
            boundingBox: {
                height,
                width,
                left: x,
                top: y,
            },
            points,
            trackId: this._customData.maxTrackId + 1,
            faceId: '-1',
            keyFrame: true,
            frameIndex: this.frameIndex,
            imgPath: '',
        };

        this.updateRegion(newRegion);

        this.updateMaxTrackId(newRegion, 'add');

        this.onSelectedRegionsChanged([newRegion]);

        this.editor.RM.selectRegionById(id);

        console.log(this._customData, 'cccccccccccccc');
    };

    private updateRegion(region: IRegion) {
        const description = CanvasHelpers.getTagsDescriptor(this.tags, region, region.trackId);

        this.editor.RM.updateTagsById(region.id, description);
    }

    private onRegionMoveEnd = (id: string, regionData: RegionData) => {
        console.log('callde onRegionMoveEnd');
        // const currentRegions = this.state.currentAsset.regions;
        const currentRegions = this._frames[this.frameIndex] || [];
        const movedRegionIndex = currentRegions.findIndex((region) => region.id === id);
        const movedRegion: IRegion = currentRegions[movedRegionIndex];

        const { height, width, x, y, points } = CanvasHelpers.scaleRegionToSourceSize(
            regionData,
            this.videoWidth,
            this.videoHeight,
            this.frameWidth,
            this.frameHeight
        );

        if (movedRegion) {
            movedRegion.points = points;
            movedRegion.boundingBox = {
                height,
                width,
                left: x,
                top: y,
            };
            movedRegion.keyFrame = true;
        }

        currentRegions[movedRegionIndex] = movedRegion;
        this.onSelectedRegionsChanged([movedRegion]);
        this.updateMaxTrackId(movedRegion, 'delete');
        this.updateMaxTrackId(movedRegion, 'add');
        // this.updateAssetRegions(currentRegions);
        // this.props.onRegionMoved(movedRegion, movedRegion.trackId);
        this.updateRegion(movedRegion);
        this.updateRegionsBetweenKeyFrames(movedRegion, movedRegion.trackId);
    };

    private onRegionDelete = (id: string) => {
        console.log('callde onRegionDelete');
        // Remove from Canvas Tools
        this.editor.RM.deleteRegionById(id);

        // Remove from project
        // const currentRegions = this.state.currentAsset.regions;
        const currentRegions = this._frames[this.frameIndex] || [];
        const copy = [...currentRegions];
        const deletedRegionIndex = currentRegions.findIndex((region) => region.id === id);

        this.updateMaxTrackId(copy[deletedRegionIndex], 'delete');
        currentRegions.splice(deletedRegionIndex, 1);

        const latest = [...currentRegions].pop();
        this.onSelectedRegionsChanged(latest ? [latest] : []);
    };

    private onRegionSelected = (id: string, multiSelect: boolean) => {
        console.log(id, 'id in onRegionSelected');

        if (!id) return;

        const selectedRegions = this.getSelectedRegions();
        console.log(id, 'select region', selectedRegions);

        this.onSelectedRegionsChanged(selectedRegions);
    };

    private editorModeToType = (editorMode: EditorMode) => {
        let type;
        switch (editorMode) {
            case EditorMode.CopyRect:
            case EditorMode.Rectangle:
                type = RegionType.Rectangle;
                break;
            case EditorMode.Polygon:
                type = RegionType.Polygon;
                break;
            case EditorMode.Point:
                type = RegionType.Point;
                break;
            case EditorMode.Polyline:
                type = RegionType.Polyline;
                break;
            default:
                break;
        }
        return type;
    };

    private updateMaxTrackId = async (region: IRegion, type: string) => {
        console.log(region, 'update max track id', type);
        if (type === 'add') {
            // region.frameIndex = region.frameIndex ? region.frameIndex : this.getFrameIndex();
            this._customDataIncrease({ trackId: region.trackId, id: region.id, region: { ...region } });
            this.addRegionToFrames(region);
        } else {
            this._customDataDecrease({ trackId: region.trackId, id: region.id, region: { ...region } });
            this.removeRegionFromFrames(region);
        }

        this.event.updateRegionInfo({
            totalFrames: 0,
            totalRegions: 0,
            maxTrackId: this._customData.maxTrackId,
        });
        // this.refreshCanvasToolsRegions();
    };

    private _customDataDecrease(newData) {
        const newState = this._customData as ICustomData;
        const currentMaxTrackIdList = newState.maxTrackIdList;
        const payload = newData;
        const deRegions = [...(newState.regions[payload.trackId] || [])];
        const deIndex = deRegions.findIndex((region) => {
            return region.id === payload.id;
        });
        const newDeRegions = { ...newState.regions };
        if (deIndex !== -1) {
            deRegions.splice(deIndex, 1);
        }
        newDeRegions[payload.trackId] = [...deRegions];
        if (deRegions.length === 0) {
            const listIndex = [...currentMaxTrackIdList].findIndex((id: number) => id === payload.trackId);
            if (listIndex !== -1) {
                currentMaxTrackIdList.splice(listIndex, 1);
            }
        }
        this._customData = {
            regions: { ...newDeRegions },
            maxTrackId: [...currentMaxTrackIdList].pop(),
            maxTrackIdList: [...currentMaxTrackIdList],
            currentTrackId: newState.currentTrackId,
        };
        console.log(this._customData, '_customDataDecrease');
    }

    private _customDataIncrease(newData) {
        // console.log('called');
        const newState = this._customData as ICustomData;
        const currentMaxTrackIdList = newState.maxTrackIdList;
        const payload = newData;
        const inRegions = newState.regions[payload.trackId] || [];
        const inIndex = inRegions.findIndex((region) => {
            return region.id === payload.id;
        });
        const newInRegions = { ...newState.regions };
        if (inIndex !== -1) {
            inRegions.splice(inIndex, 1);
        }
        newInRegions[payload.trackId] = [...inRegions, payload.region];
        const removeSame = new Set([...currentMaxTrackIdList, Number(payload.trackId)]);
        const newList = [...removeSame].sort((a, b) => {
            if (a < b) {
                return -1;
            }
            if (a > b) {
                return 1;
            }
            return 0;
        });
        this._customData = {
            regions: { ...newInRegions },
            maxTrackId: [...newList].pop(),
            maxTrackIdList: newList,
            currentTrackId: newState.currentTrackId,
        };

        console.log(this._customData, '_customDataIncrease');
    }

    private removeRegionFromFrames(region: IRegion) {
        const frameIndex = region.frameIndex;
        if (frameIndex === -1) return;
        const regions = (this._frames[frameIndex + ''] as IRegion[]) || [];
        const removeSame = regions.filter((r) => r.id !== region.id);
        this._frames[frameIndex + ''] = [...removeSame];
        // this.props.frameDataActions.updateFrames(this._frames);
    }

    private addRegionToFrames(region: IRegion) {
        const frameIndex = region.frameIndex;
        if (frameIndex === -1) return;
        const regions = this._frames[frameIndex + ''] as IRegion[];
        const removeSame = regions ? regions.filter((r) => r.id !== region.id) : [];
        this._frames[frameIndex + ''] = [...removeSame, region];
        // console.log('callllll')
        // this.props.frameDataActions.updateFrames(this._frames);
    }

    private onSelectedRegionsChanged = (selectedRegions: IRegion[]) => {
        // INFO: create a new region also will trigger here.
        // console.log(selectedRegions, 'selected regions');
        const ids = selectedRegions.map((region) => ({ trackId: region.trackId, id: region.id }));
        this._customData.currentTrackId = [...ids];
        // this.props.customDataActions.updateCurrentTrackId([...ids]);
        this.selectedRegions = selectedRegions;

        if (!selectedRegions[0]) return;

        this.event.setCurrentTrackId(selectedRegions[0].trackId);
    };

    private getSelectedRegions = (): IRegion[] => {
        const selectedRegions = this.editor.RM.getSelectedRegions().map((rb) => rb.id);
        console.log(selectedRegions, 'selectedRegions');
        const currentRegions = this._frames[this.frameIndex] || [];
        // return this.state.currentAsset.regions.filter((r) => selectedRegions.find((id) => r.id === id));
        return currentRegions.filter((r) => selectedRegions.find((id) => r.id === id));
    };

    private updateRegions = (updates: IRegion[]) => {
        // INFO: update Regions
        // console.log('called update regions...', updates);
        // const currentRegions = this.props.frames[this.props.frameIndex];
        // const updatedRegions = CanvasHelpers.updateRegions(currentRegions, updates);
        for (const update of updates) {
            this.editor.RM.updateTagsById(update.id, CanvasHelpers.getTagsDescriptor(this.tags, update, update.trackId));
            // this.updateMaxTrackId(update, 'delete');
            // this.updateMaxTrackId(update, 'add');
        }

        this.updateCanvasToolsRegionTags();
    };

    private updateCanvasToolsRegionTags = (): void => {
        const currentRegions = this._frames[this.frameIndex] || [];
        for (const region of currentRegions) {
            this.editor.RM.updateTagsById(region.id, CanvasHelpers.getTagsDescriptor(this.tags, region, region.trackId));
        }
    };

    private refreshCanvasToolsRegions = () => {
        // console.log('called refreshCanvasToolsRegions', this.props.frameIndex)
        this.clearAllRegions();
        const regions = this._frames[this.frameIndex] || [];
        const len = regions.length;
        if (!regions || len === 0) return;

        console.log(regions, 'regions');

        const viewFaceList: IFace[] = [];

        regions.forEach((region: IRegion) => {
            const loadedRegionData = CanvasHelpers.getRegionData(region);
            this.editor.RM.addRegion(
                region.id,
                CanvasHelpers.scaleRegionToFrameSize(
                    loadedRegionData,
                    this.videoWidth,
                    this.videoHeight,
                    this.frameWidth,
                    this.frameHeight
                ),
                CanvasHelpers.getTagsDescriptor(this.tags, region, region.trackId)
            );

            if (region.faceId !== '-1') {
                viewFaceList.push({
                    path: region.imgPath,
                    faceId: region.faceId,
                    trackId: region.trackId,
                    tag: this.tags.find((tag) => {
                        return region.tags[0] === tag.name;
                    }),
                });
            }
        });

        this.editor.RM.selectRegionById(regions[len - 1].id);

        this.event.setViewFaceList(viewFaceList);
    };

    private clearAllRegions = () => {
        if (!this.editor) return;

        this.editor.RM.deleteAllRegions();
    };

    public applyTag = (tag: string) => {
        const selectedRegions = this.getSelectedRegions();
        console.log(selectedRegions, '=======selectedRegions');
        const lockedTags = this.lockedTags;
        const lockedTagsEmpty = !lockedTags || !lockedTags.length;
        const regionsEmpty = !selectedRegions || !selectedRegions.length;
        if ((!tag && lockedTagsEmpty) || regionsEmpty) {
            return;
        }
        let transformer: (tags: string[], tag: string) => string[];
        if (lockedTagsEmpty) {
            // Tag selected while region(s) selected
            transformer = CanvasHelpers.toggleTag;
        } else if (lockedTags.find((t) => t === tag)) {
            // Tag added to locked tags while region(s) selected
            transformer = CanvasHelpers.addIfMissing;
        } else {
            // Tag removed from locked tags while region(s) selected
            transformer = CanvasHelpers.removeIfContained;
        }
        // console.log(transformer, 'check what transfer is...')
        for (const selectedRegion of selectedRegions) {
            selectedRegion.tags = transformer(selectedRegion.tags, tag);
            this.updateMaxtrackId(selectedRegion);
        }
        this.updateRegions(selectedRegions);

        this.onSelectedRegionsChanged(selectedRegions);
    };

    public updateMaxtrackId(region: IRegion) {
        const tagLen = region.tags.length;
        if (tagLen) {
            this.updateMaxTrackId(region, 'add');
        } else {
            this.updateMaxTrackId(region, 'delete');
        }
    }

    private updateTrackId(id: number) {
        const selectedRegions = this.getSelectedRegions();
        // const selectedRegionId = Number(this.state.selectedRegions[0].trackId);
        const region = selectedRegions[0];
        this.updateMaxTrackId(region, 'delete');
        const copy = JSON.parse(JSON.stringify(region)) as IRegion;
        copy.trackId = id;

        this.updateRegion(copy);
        this.updateMaxTrackId(copy, 'add');
        this.onSelectedRegionsChanged([copy]);
        this.updateRegionsBetweenKeyFrames(copy, id);
    }

    public updateRegionsBetweenKeyFrames = (copy: IRegion, trackId: number) => {
        this.insertRegions(trackId, { ...copy });
    };

    private insertRegions = (trackId: number, newRegion: IRegion) => {
        const trackIdGroup: IRegion[] = [
            ...this._customData.regions[trackId].filter((region: IRegion) => region.id !== newRegion.id),
            newRegion,
        ];

        const len = trackIdGroup.length;
        if (len < 1) {
            return;
        }
        trackIdGroup.sort((a, b) => {
            if (a.frameIndex < b.frameIndex) {
                return -1;
            }
            if (a.frameIndex > b.frameIndex) {
                return 1;
            }
            return 0;
        });
        // console.log('called, custom', trackIdGroup);
        // const currentAssetId = this.canvas.current.state.currentAsset.asset.id;
        const index = trackIdGroup.findIndex((region) => region.frameIndex === newRegion.frameIndex);
        const frameIndex = newRegion.frameIndex;
        const previousCRegion = index === 0 ? undefined : this.findPreviousKeyFrame(index - 1, trackIdGroup);
        const nextCRegion = index === len - 1 ? undefined : this.findNextKeyFrame(index + 1, trackIdGroup, len);

        const currentRegions = this.getSelectedRegions();
        const currentRegion = currentRegions[0];
        if (previousCRegion) {
            const pIndex = previousCRegion.frameIndex;
            // console.log(pIndex, frameIndex, 'custom indexs');
            if (pIndex) {
                const pDistance = frameIndex - pIndex - 1;
                // const pAssets = this.queryAssets(pIndex, 1, currentAssetId);
                // //console.log(pAssets, 'ppppppppaaaa');
                // const pLen = pAssets.length;
                const boxs = this.generateBoxs(previousCRegion.boundingBox, currentRegion.boundingBox, pDistance + 1);

                for (let i = 0; i < pDistance; i++) {
                    const id = shortid.generate();
                    const pRegion = JSON.parse(JSON.stringify(currentRegion)) as IRegion;
                    pRegion.boundingBox = boxs[i];
                    pRegion.id = id;
                    pRegion.keyFrame = false;
                    pRegion.frameIndex = pIndex + i + 1;
                    pRegion.points = this.generatePoints(boxs[i]);
                    this.updateFrameRegion(pRegion);
                }
            }
            // toast.success('成功绘制到上一关键帧');
        }

        if (nextCRegion) {
            const nIndex = nextCRegion.frameIndex;
            if (nIndex) {
                const nDistance = nIndex - frameIndex - 1;
                // const nAssets = this.queryAssets(nIndex, -1, currentAssetId);
                // const nLen = nAssets.length;
                const boxs = this.generateBoxs(nextCRegion.boundingBox, currentRegion.boundingBox, nDistance + 1);
                for (let i = 0; i < nDistance; i++) {
                    const id = shortid.generate();
                    const nRegion: IRegion = JSON.parse(JSON.stringify(currentRegion)) as IRegion;
                    nRegion.boundingBox = boxs[i];
                    nRegion.id = id;
                    nRegion.keyFrame = false;
                    nRegion.frameIndex = nIndex - i - 1;
                    nRegion.points = this.generatePoints(boxs[i]);
                    this.updateFrameRegion(nRegion);
                }
            }
            // toast.success('成功绘制到下一关键帧');
        }
    };

    private generatePoints = (boundingBox: { height: number; left: number; top: number; width: number }): { x: number; y: number }[] => {
        return [
            { x: boundingBox.left, y: boundingBox.top },
            { x: boundingBox.left + boundingBox.width, y: boundingBox.top },
            { x: boundingBox.left + boundingBox.width, y: boundingBox.top + boundingBox.height },
            { x: boundingBox.left, y: boundingBox.top + boundingBox.height },
        ];
    };

    private generateBoxs = (
        startBoundingBox: { height: number; left: number; top: number; width: number },
        endBoundingBox: { height: number; left: number; top: number; width: number },
        steps: number
    ): { height: number; left: number; top: number; width: number }[] => {
        const xStep = (endBoundingBox.left - startBoundingBox.left) / steps;
        const yStep = (endBoundingBox.top - startBoundingBox.top) / steps;
        const hStep = (endBoundingBox.height - startBoundingBox.height) / steps;
        const wStep = (endBoundingBox.width - startBoundingBox.width) / steps;
        const boxs = [];
        for (let i = 1; i < steps; i++) {
            boxs.push({
                height: startBoundingBox.height + hStep * i,
                width: startBoundingBox.width + wStep * i,
                left: startBoundingBox.left + xStep * i,
                top: startBoundingBox.top + yStep * i,
            });
        }
        return boxs;
    };

    private searchRegionByTrackId(trackId: number) {
        const regions: IRegion[] = this._customData.regions[trackId] || [];
        const sortedRegions = regions.sort((a, b) => {
            if (a.frameIndex < b.frameIndex) return -1;
            if (a.frameIndex > b.frameIndex) return 1;
            return 0;
        });

        const targetRegion = sortedRegions[0];
        const frameSkipTime: number = 1 / this.sampleRate;
        this.seekTo((targetRegion.frameIndex - 1) * frameSkipTime);
    }

    private deleteRegionsByTrackId(trackId: number) {
        const regions: IRegion[] = this._customData.regions[trackId] || [];

        regions.forEach(({ frameIndex }: IRegion) => {
            const frameRegions = this._frames[frameIndex];
            this._frames[frameIndex] = frameRegions.filter((region: IRegion) => trackId !== region.trackId);
        });

        this._customData.regions[trackId] = [];
        const list = [...this._customData.maxTrackIdList];
        const index = list.findIndex((value) => value === trackId);
        if (index !== -1) {
            list.splice(index, 1);
        }

        this._customData.maxTrackIdList = list;
        this._customData.maxTrackId = [...list].pop();
        this._customData.currentTrackId = [];

        this.event.setCurrentTrackId(0);
        this.clearAllRegions();
    }

    private findPreviousKeyFrame = (index: number, regions: IRegion[]): IRegion => {
        return this.findKeyFrame(index, -1, regions, -1);
    };

    private findNextKeyFrame = (index: number, regions: IRegion[], len: number): IRegion => {
        return this.findKeyFrame(index, 1, regions, len);
    };

    private findKeyFrame = (start: number, step: number, regions: IRegion[], stop: number): IRegion => {
        let i = start;
        let notFind = true;
        let cRegion: IRegion;
        while (notFind) {
            if (regions[i].keyFrame) {
                cRegion = regions[i];
                notFind = false;
            }
            i += step;
            if (i === stop) {
                notFind = false;
            }
        }
        return cRegion;
    };

    private updateFrameRegion = async (region: IRegion): Promise<void> => {
        // const assetService = new AssetService(this.props.project);
        // const data = await assetService.getAssetMetadata(asset);
        // const { regions } = data;
        const regions = this._frames[region.frameIndex] || [];
        const remove = [...regions].filter((r) => r.trackId === region.trackId);
        if (remove.length !== 0) {
            remove.forEach((r) => {
                this.updateMaxTrackId(r, 'delete');
            });
        }
        this.updateMaxTrackId(region, 'add');
        const removeSame = [...regions].filter((r) => r.trackId !== region.trackId);
        this._frames[region.frameIndex] = [...removeSame, region];
    };

    private moveToFrame(type: string) {
        console.log(type, 'moveToFrame ========', this._customData);
        if (this._customData.currentTrackId.length !== 1) return;
        const { trackId, id } = this._customData.currentTrackId[0];
        const regions = JSON.parse(JSON.stringify(this._customData.regions[trackId]));
        const sortedRegions = regions.sort((a, b) => {
            if (a.frameIndex < b.frameIndex) return -1;
            if (a.frameIndex > b.frameIndex) return 1;
            return 0;
        });
        const len = sortedRegions.length;
        const index = sortedRegions.findIndex((region) => region.id === id);
        if (index === -1) return;
        const frameSkipTime: number = 1 / this.sampleRate;
        switch (type) {
            case 'first':
                this.seekTo((sortedRegions[0].frameIndex - 1) * frameSkipTime);
                break;
            case 'previous':
                if (index === 0) return;
                const p = this.findPrevious(sortedRegions, index);
                if (!p) return;
                this.seekTo((p.frameIndex - 1) * frameSkipTime);
                break;
            case 'next':
                if (index === len - 1) return;
                const n = this.findNext(sortedRegions, index);
                if (!n) return;
                this.seekTo((n.frameIndex - 1) * frameSkipTime);
                break;
            case 'last':
                this.seekTo(([...sortedRegions].pop().frameIndex - 1) * frameSkipTime);
                break;
            default:
                break;
        }
    }

    private findPrevious = (regions, index) => {
        if (regions[index - 1].keyFrame) {
            return regions[index - 1];
        }
        return this.findPrevious(regions, index - 1);
    };
    private findNext = (regions, index) => {
        if (regions[index + 1].keyFrame) {
            return regions[index + 1];
        }
        return this.findNext(regions, index + 1);
    };

    // TODO

    private setFaceId = ({ faceId, path }: IFace) => {
        const targetRegion = this.getSelectedRegions()[0];

        if (!targetRegion) {
            this.message('Please select one region first.');

            return;
        }

        const trackId = targetRegion.trackId;
        const regions = this._customData.regions[trackId];
        regions.forEach((region: IRegion) => {
            region.faceId = faceId;
            region.imgPath = path;
            const frameIndex = region.frameIndex;
            this._frames[frameIndex].forEach((fr: IRegion) => {
                if (fr.trackId === trackId) {
                    fr.faceId = faceId;
                    fr.imgPath = path;
                }
            });
        });

        this.message('Set face ID finished.');
    };

    private exportFile() {
        this.message('exporting file...');
        this.event.showLoading();

        const _frames = {};

        for (const key in this._frames) {
            if (this._frames.hasOwnProperty(key)) {
                _frames[key] = this._frames[key].map((region: IRegion) => {
                    return {
                        ...region,
                        height: this.videoHeight,
                        width: this.videoWidth,
                        UID: region.id,
                        x1: region.boundingBox.left,
                        y1: region.boundingBox.top,
                        x2: region.boundingBox.left + region.boundingBox.width,
                        y2: region.boundingBox.top + region.boundingBox.height,
                    };
                });
            }
        }

        const target = {
            frames: _frames,
            framerate: this.sampleRate,
            inputTags: this.tags,
            visitedFrames: {},
            scd: false,
            suggestiontype: 'copy',
        };

        this.event
            .saveFile({
                path: `${this.normalFilePath.filePath}${this.normalFilePath.fileName.split('.')[0]}.json`,
                contents: JSON.stringify(target),
            })
            .pipe(
                take(1),
                tap(() => {
                    this.event.hideLoading();
                })
            )
            .subscribe();
    }

    private resetAll() {
        this._customData = {
            maxTrackId: 0,
            regions: [],
            maxTrackIdList: [0],
            currentTrackId: [],
        };

        this._frames = {};
        this.clearAllRegions();
    }

    private search = (region) => {
        if (!region) return;

        this.updateCanvas();
        const imgURL = localStorage.getItem('imgURL');
        const imgTabIDList = localStorage.getItem('imgTL');

        if (!imgURL || !imgTabIDList) {
            this.message('Please set server information correctlly!');

            return;
        }

        const {
            tags,
            boundingBox: { height, width, left: x, top: y },
        } = region;
        const sourceCanvas = document.querySelector('#post-canvas') as HTMLCanvasElement;
        const newCanvas = document.getElementById('new-canvas') as HTMLCanvasElement;
        const _h = Math.round(height);
        const _w = Math.round(width);
        newCanvas.width = _w;
        newCanvas.height = _h;
        newCanvas.style.width = `${_w}px`;
        newCanvas.style.height = `${_h}px`;
        const newCtx = newCanvas.getContext('2d');
        const ctx = sourceCanvas.getContext('2d');
        const img = ctx.getImageData(x, y, _w, _h);
        newCtx.clearRect(0, 0, 0, 0);
        newCtx.putImageData(img, 0, 0);

        const ImageFData = newCanvas.toDataURL('image/jpeg', 1.0).split('data:image/jpeg;base64,')[1];

        console.log(ImageFData, 'ImageFData');

        const ImageSearchType = tags[0].replace(/\b\w+\b/g, function (word) {
            return word.substring(0, 1).toUpperCase() + word.substring(1);
        });

        const data = {
            ImageSearchedByImageObject: {
                SearchID: Math.random().toString(36).split('.')[1],
                MaxNumRecordReturn: 5,
                Threshold: 0.6,
                TabIDList: imgTabIDList, // can be changed
                ResultImageDeclare: '1',
                ResultFeatureDeclare: -1,
                SearchType: ImageSearchType,
                Image: {
                    Data: ImageFData,
                },
            },
        };

        fetch(imgURL, {
            method: 'POST',
            body: JSON.stringify(data),
            headers: new Headers({
                'Content-Type': 'application/json;charset=UTF-8',
            }),
        })
            .then((res) => res.json())
            .then((response) => response.ImageResultSBIObject.FaceObjectList.FaceObject)
            .then((list) => this.postQueryFaceResult(list))
            // .then(data => this.props.queryFaceCb(data))
            .catch((error) => console.error('Error:', error))
            .then((response) => console.log('Success:', response));
    };

    private postQueryFaceResult(list) {
        const faces = list.map((item) => {
            return {
                name: item.IDNumber,
                path: item.SubImageList.SubImageInfoObject[0].StoragePath,
                similaritydegree: item.Similaritydegree,
                faceId: item.FaceID,
            };
        });

        this.event.setQueryFaceList(faces);
    }
}
