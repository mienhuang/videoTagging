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
    ChangeDetectorRef
} from '@angular/core';

import shortid from 'shortid';

import { GlobalEventBusService } from '../core/event-bus';
import { tap } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { CanvasTools } from 'vott-ct';
import { RegionData } from 'vott-ct/lib/js/CanvasTools/Core/RegionData';

import { EditorMode, RegionType, ITag } from '../core/models/canvas.model';

import CanvasHelpers from './canvasHelpers';

import { Editor } from 'vott-ct/lib/js/CanvasTools/CanvasTools.Editor';
// import Clipboard from '../../../../common/clipboard';
// import Confirm from '../../common/confirm/confirm';
// import { strings } from '../../../../common/strings';
// import { SelectionMode } from 'vott-ct/lib/js/CanvasTools/Interface/ISelectorSettings';
import { Rect } from 'vott-ct/lib/js/CanvasTools/Core/Rect';

import { IRegion } from '../core/models/canvas.model';
import { ICustomData } from '../core/models/region.model';


@Component({
    selector: 'app-video',
    templateUrl: './video.component.html',
    styleUrls: ['./video.component.scss']
})
export class VideoComponent implements OnInit, OnDestroy, OnChanges, AfterViewInit {

    progressMaxValue = 10000;

    video: HTMLVideoElement;
    scale = 1;
    height = 0;
    width = 0;

    @ViewChild('container') container: ElementRef;
    @ViewChild('videoContainer') videoContainer: ElementRef;
    @Output() currentTimeChange = new EventEmitter();
    @Input() simpleRate = 50;

    isStartedPlay = false;
    isPlaying = false;
    isMuted = false;
    currentTimeId: NodeJS.Timeout;
    duration = 1;
    currentTime = 0;
    seekTime = 0;

    editor: Editor;
    progressValue = 0;

    videoHeight = 0;
    videoWidth = 0;
    frameHeight = 0;
    frameWidth = 0;
    tags: ITag[] = [{ name: 'test1', color: '#ff22ff' }];

    private sub = new Subscription();
    private step = 0.02;
    private _customData = {
        maxTrackId: 0,
        regions: [],
        maxTrackIdList: [0],
        currentTrackId: []
    };
    private _frames = {};
    private frameIndex = 0;
    private selectedRegions: IRegion[];
    private template: Rect;
    private lockedTags: string[] = [];

    volumeFormatLabel = (value: number) => `${value}%`;
    progressFormatLabel = (value: number) => `00:00`;


    constructor(private event: GlobalEventBusService, private cdr: ChangeDetectorRef) {

        const resizeSub = this.event.resize$
            .pipe(
                tap(({ width, height }) => {
                    this.width = width - 60;
                })
            )
            .subscribe();

        this.sub.add(resizeSub);
    }

    ngOnInit(): void {
        this.getContainerSize();

        this.video = document.getElementById('video') as HTMLVideoElement;

        this.video.addEventListener('canplay', this.readyToPlay);
        this.video.addEventListener('loadeddata', this.addPoster);
        this.video.addEventListener('ended', this.ended);
        this.video.addEventListener('seeking', this.onSeeking);
        this.video.addEventListener('durationchange ', this.onDurationChange);
        this.video.addEventListener('seeked', this.afterSeeked);
    }

    ngAfterViewInit() {
        this.addCTEditor();

        // editor.addToolbar(toolbarContainer, CanvasTools.Editor.FullToolbarSet, '../../assets/icons');
    }

    getContainerSize = () => {
        const ele = document.getElementById('container');

        this.height = ele.offsetHeight;
        this.width = ele.offsetWidth;
    }

    startPlay() {
        if (!this.video) return;

        this.isStartedPlay = true;

        this.play();
    }

    play() {
        if (!this.video) return;
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
        this.seekTime = this.duration * percentage;

        this.seekTime = Math.ceil(this.seekTime / this.step) * this.step;
        // this.pasue();
        this.video.currentTime = this.seekTime;
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
    }

    readyToPlay = () => {
        this.video.muted = true;
        this.video.volume = 0;
        this.isMuted = true;
        this.duration = this.video.duration;

        this.videoHeight = this.video.videoHeight;
        this.videoWidth = this.video.videoWidth;
        this.frameHeight = this.video.clientHeight;
        this.frameWidth = this.video.clientWidth;

        console.log(this, 'sssssssssssss111111111');
    }

    addPoster = () => {
        const canvas = document.createElement('canvas');
        canvas.width = this.video.videoWidth * this.scale;
        canvas.height = this.video.videoHeight * this.scale;
        canvas.getContext('2d').drawImage(this.video, 0, 0, canvas.width, canvas.height);

        // const img = document.createElement('img');
        const src = canvas.toDataURL('image/jpeg', 1.0);
        // output.appendChild(img);
        // this.video.setAttribute('poster', src);
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes.simpleRate && this.simpleRate > 0) {
            this.step = 1 / this.simpleRate;
        }
    }

    ngOnDestroy() {
        this.sub.unsubscribe();
        this.video.removeEventListener('canplay', this.readyToPlay);
        this.video.removeEventListener('loadeddata', this.addPoster);
        this.video.removeEventListener('ended', this.ended);
        this.video.removeEventListener('seeking', this.onSeeking);
        this.video.removeEventListener('durationchange ', this.onDurationChange);
        this.video.removeEventListener('seeked', this.afterSeeked);
    }

    private onSeeking(event) {
        console.log(event, 'seeee');
        // TOTO show loading when seeking
    }

    private afterSeeked(event) {
        console.log('afterSeeked', event);
        this.currentTime = this.seekTime;
    }

    private onPlaying() {
        this.currentTimeId = setInterval(() => {
            this.currentTime = this.video.currentTime;
            this.progressValue = (this.currentTime / this.duration) * this.progressMaxValue;
            this.currentTimeChange.emit(this.video.currentTime);
        }, 50);
    }

    private stopPlay() {
        clearInterval(this.currentTimeId);
    }

    private onDurationChange(event) {
        console.log(event, 'duration change');
        // this.duration = event;
    }

    private addCTEditor() {

        const editorContainer = document.getElementById('editorDiv') as HTMLDivElement;
        const toolbarContainer = document.getElementById('toolbarDiv');

        this.editor = new CanvasTools.Editor(editorContainer).api;
        this.editor.autoResize = false;
        this.editor.onSelectionEnd = this.onSelectionEnd;
        this.editor.onRegionMoveEnd = this.onRegionMoveEnd;
        this.editor.onRegionDelete = this.onRegionDelete;
        this.editor.onRegionSelected = this.onRegionSelected;
        // this.editor.AS.setSelectionMode({ mode: SelectionMode });
    }


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
            tags: ['test1'],
            boundingBox: {
                height,
                width,
                left: x,
                top: y,
            },
            points,
            trackId: 1,
            faceId: '-1',
            keyFrame: true,
            frameIndex: 0,
            imgPath: ''
        };

        const description = CanvasHelpers.getTagsDescriptor(this.tags, newRegion, newRegion.trackId);

        this.editor.RM.updateTagsById(id, description);

        this.updateMaxTrackId(newRegion, 'add');

        this.onSelectedRegionsChanged([newRegion]);
    }

    private onRegionMoveEnd = (id: string, regionData: RegionData) => {
        // const currentRegions = this.state.currentAsset.regions;
        const currentRegions = this._frames[this.frameIndex] || [];
        const movedRegionIndex = currentRegions.findIndex((region) => region.id === id);
        const movedRegion = currentRegions[movedRegionIndex];

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
        this.updateMaxTrackId(movedRegion, 'delete');
        this.updateMaxTrackId(movedRegion, 'add');
        // this.updateAssetRegions(currentRegions);
        // this.props.onRegionMoved(movedRegion, movedRegion.trackId);
    }


    private onRegionDelete = (id: string) => {
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
    }

    private onRegionSelected = (id: string, multiSelect: boolean) => {
        const selectedRegions = this.getSelectedRegions();
        console.log(id, 'select region', selectedRegions);
        this.onSelectedRegionsChanged(selectedRegions);
        // Gets the scaled region data
        const selectedRegionsData = this.editor.RM.getSelectedRegionsBounds().find((region) => region.id === id);

        // console.log(selectedRegionsData, 'select region 1')
        if (selectedRegionsData) {
            this.template = new Rect(selectedRegionsData.width, selectedRegionsData.height);
        }

        for (const selectedRegion of selectedRegions) {
            selectedRegion.tags = CanvasHelpers.addAllIfMissing(selectedRegion.tags, this.lockedTags);
        }
        this.updateRegions(selectedRegions);
    }

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
    }

    private updateMaxTrackId = async (region: IRegion, type: string) => {
        // console.log(region, 'update max track id', this.state.selectedAsset);
        if (type === 'add') {
            // region.frameIndex = region.frameIndex ? region.frameIndex : this.getFrameIndex();
            this._customDataIncrease({ trackId: region.trackId, id: region.id, region: { ...region } });
            this.addRegionToFrames(region);
        } else {
            this._customDataDecrease({ trackId: region.trackId, id: region.id, region: { ...region } });
            this.removeRegionFromFrames(region);
        }
        // this.canvas.current.refreshCanvasToolsRegions();
    }

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
            currentTrackId: newState.currentTrackId
        };
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
            currentTrackId: newState.currentTrackId
        };
    }


    private removeRegionFromFrames(region: IRegion) {
        const frameIndex = region.frameIndex;
        if (frameIndex === -1) return;
        const regions = this._frames[frameIndex + ''] as IRegion[] || [];
        const removeSame = regions.filter(r => r.id !== region.id);
        this._frames[frameIndex + ''] = [...removeSame];
        // this.props.frameDataActions.updateFrames(this._frames);
    }

    private addRegionToFrames(region: IRegion) {
        const frameIndex = region.frameIndex;
        if (frameIndex === -1) return;
        const regions = this._frames[frameIndex + ''] as IRegion[];
        const removeSame = regions ? regions.filter(r => r.id !== region.id) : [];
        this._frames[frameIndex + ''] = [...removeSame, region];
        // console.log('callllll')
        // this.props.frameDataActions.updateFrames(this._frames);
    }

    private onSelectedRegionsChanged = (selectedRegions: IRegion[]) => {
        // INFO: create a new region also will trigger here.
        // console.log(selectedRegions, 'selected regions');
        const ids = selectedRegions.map(region => ({ trackId: region.trackId, id: region.id }));
        this._customData.currentTrackId = [...ids];
        // this.props.customDataActions.updateCurrentTrackId([...ids]);
        this.selectedRegions = selectedRegions;
    }

    private getSelectedRegions = (): IRegion[] => {
        const selectedRegions = this.editor.RM.getSelectedRegionsBounds().map((rb) => rb.id);
        const currentRegions = this._frames[this.frameIndex] || [];
        // return this.state.currentAsset.regions.filter((r) => selectedRegions.find((id) => r.id === id));
        return currentRegions.filter((r) => selectedRegions.find((id) => r.id === id));
    }

    private updateRegions = (updates: IRegion[]) => {
        // INFO: update Regions
        // console.log('called update regions...', updates);
        // const currentRegions = this.props.frames[this.props.frameIndex];
        // const updatedRegions = CanvasHelpers.updateRegions(currentRegions, updates);
        for (const update of updates) {
            this.editor.RM.updateTagsById(update.id, CanvasHelpers.getTagsDescriptor(this.tags, update, update.trackId));
            this.updateMaxTrackId(update, 'delete');
            this.updateMaxTrackId(update, 'add');
        }

        this.updateCanvasToolsRegionTags();
    }

    private updateCanvasToolsRegionTags = (): void => {
        const currentRegions = this._frames[this.frameIndex] || [];
        for (const region of currentRegions) {
            this.editor.RM.updateTagsById(
                region.id,
                CanvasHelpers.getTagsDescriptor(this.tags, region, region.trackId),
            );
        }
    }

}
