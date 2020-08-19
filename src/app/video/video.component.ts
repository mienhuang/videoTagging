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
import { GlobalEventBusService } from '../core/event-bus';
import { tap } from 'rxjs/operators';
import { Subscription } from 'rxjs';

import { RegionData } from 'vott-ct/lib/js/CanvasTools/Core/RegionData';

import CanvasHelpers from './canvasHelpers';
// import { AssetPreview, ContentSource } from '../../common/assetPreview/assetPreview';
// import { Editor } from 'vott-ct/lib/js/CanvasTools/CanvasTools.Editor';
// import Clipboard from '../../../../common/clipboard';
// import Confirm from '../../common/confirm/confirm';
// import { strings } from '../../../../common/strings';
// import { SelectionMode } from 'vott-ct/lib/js/CanvasTools/Interface/ISelectorSettings';
// import { Rect } from 'vott-ct/lib/js/CanvasTools/Core/Rect';

declare const CanvasTools: any;
// declare enum SelectionMode {
//     NONE = 0,
//     POINT = 1,
//     RECT = 2,
//     COPYRECT = 3,
//     POLYLINE = 4,
//     POLYGON = 5
// }

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

    editor: any;
    progressValue = 0;

    videoHeight = 0;
    videoWidth = 0;

    private sub = new Subscription();
    private step = 0.02;

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

        const videoC = this.videoContainer.nativeElement;

        this.videoHeight = videoC.clientHeight;
        this.videoWidth = videoC.clientWidth;

        this.cdr.markForCheck();

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

        const editorContainer = document.getElementById('editorDiv');
        const toolbarContainer = document.getElementById('toolbarDiv');

        this.editor = new CanvasTools.Editor(editorContainer).api;
        this.editor.autoResize = false;
        this.editor.onSelectionEnd = this.onSelectionEnd;
        // this.editor.onRegionMoveEnd = this.onRegionMoveEnd;
        // this.editor.onRegionDelete = this.onRegionDelete;
        // this.editor.onRegionSelected = this.onRegionSelected;
        // this.editor.AS.setSelectionMode({ mode: SelectionMode });
    }

    private onSelectionEnd = (regionData: RegionData) => {
        console.log(regionData);
        //console.log('STEP-INFO, start create a new region');
        if (CanvasHelpers.isEmpty(regionData)) {
            return;
        }
        // const { height, width, x, y, points } = this.editor.scaleRegionToSourceSize(
        //     regionData,
        //     this.state.currentAsset.asset.size.width,
        //     this.state.currentAsset.asset.size.height,
        // );

        // if (!(height * width)) {
        //     // INFO: avoid add a dot to the page as a region
        //     return;
        // }

        // const id = shortid.generate();

        // this.editor.RM.addRegion(id, regionData, null);

        // this.template = new Rect(regionData.width, regionData.height);

        // // RegionData not serializable so need to extract data
        // // ADD REGION
        // const lockedTags = this.props.lockedTags;
        // //console.log(this.props.customData, 'ccccccc datat')
        // const newRegion = {
        //     id,
        //     type: this.editorModeToType(this.props.editorMode),
        //     tags: lockedTags || [],
        //     boundingBox: {
        //         height,
        //         width,
        //         left: x,
        //         top: y,
        //     },
        //     points,
        //     trackId: this.props.customData.maxTrackId + 1,
        //     faceId: '-1',
        //     keyFrame: true,
        //     frameIndex: this.props.frameIndex,
        //     imgPath: ''
        // };

        // // this.props.customDataActions.updateRegion(newRegion);


        // //console.log(newRegion, 'newRegionnewRegionnewRegion')
        // if (lockedTags && lockedTags.length) {
        //     this.editor.RM.updateTagsById(id, CanvasHelpers.getTagsDescriptor(this.props.project.tags, newRegion, newRegion.trackId));
        // }
        // // this.updateAssetRegions([...this.state.currentAsset.regions, newRegion]);
        // this.props.updateMaxTrackId(newRegion, 'add');
        // if (this.props.onSelectedRegionsChanged) {
        //     this.props.onSelectedRegionsChanged([newRegion]);
        // }
    }

    // private onRegionMoveEnd = (id: string, regionData: RegionData) => {
    //     // const currentRegions = this.state.currentAsset.regions;
    //     const currentRegions = this.props.frames[this.props.frameIndex] || [];
    //     const movedRegionIndex = currentRegions.findIndex((region) => region.id === id);
    //     const movedRegion = currentRegions[movedRegionIndex];
    //     const scaledRegionData = this.editor.scaleRegionToSourceSize(
    //         regionData,
    //         this.state.currentAsset.asset.size.width,
    //         this.state.currentAsset.asset.size.height,
    //     );

    //     if (movedRegion) {
    //         movedRegion.points = scaledRegionData.points;
    //         movedRegion.boundingBox = {
    //             height: scaledRegionData.height,
    //             width: scaledRegionData.width,
    //             left: scaledRegionData.x,
    //             top: scaledRegionData.y,
    //         };
    //         movedRegion.keyFrame = true;
    //     }

    //     currentRegions[movedRegionIndex] = movedRegion;
    //     this.props.updateMaxTrackId(movedRegion, 'delete');
    //     this.props.updateMaxTrackId(movedRegion, 'add');
    //     // this.updateAssetRegions(currentRegions);
    //     this.props.onRegionMoved(movedRegion, movedRegion.trackId);
    // }


    // private onRegionDelete = (id: string) => {
    //     // Remove from Canvas Tools
    //     this.editor.RM.deleteRegionById(id);

    //     // Remove from project
    //     // const currentRegions = this.state.currentAsset.regions;
    //     const currentRegions = this.props.frames[this.props.frameIndex] || [];
    //     const copy = [...currentRegions];
    //     const deletedRegionIndex = currentRegions.findIndex((region) => region.id === id);
    //     //console.log(copy[deletedRegionIndex], '1111111');
    //     this.props.updateMaxTrackId(copy[deletedRegionIndex], 'delete');
    //     currentRegions.splice(deletedRegionIndex, 1);
    //     // this.updateAssetRegions(currentRegions);

    //     if (this.props.onSelectedRegionsChanged) {
    //         // TODO: some unknown reason make selected region not display region manage menu
    //         const latest = [...currentRegions].pop();
    //         this.props.onSelectedRegionsChanged(latest ? [latest] : []);
    //     }
    // }

    // private onRegionSelected = (id: string, multiSelect: boolean) => {
    //     const selectedRegions = this.getSelectedRegions();
    //     console.log(id, 'select region', selectedRegions)
    //     if (this.props.onSelectedRegionsChanged) {
    //         this.props.onSelectedRegionsChanged(selectedRegions);
    //     }
    //     // Gets the scaled region data
    //     const selectedRegionsData = this.editor.RM.getSelectedRegionsBounds().find((region) => region.id === id);

    //     //console.log(selectedRegionsData, 'select region 1')
    //     if (selectedRegionsData) {
    //         this.template = new Rect(selectedRegionsData.width, selectedRegionsData.height);
    //     }

    //     if (this.props.lockedTags && this.props.lockedTags.length) {
    //         for (const selectedRegion of selectedRegions) {
    //             selectedRegion.tags = CanvasHelpers.addAllIfMissing(selectedRegion.tags, this.props.lockedTags);
    //         }
    //         this.updateRegions(selectedRegions);
    //     }
    // }
}
