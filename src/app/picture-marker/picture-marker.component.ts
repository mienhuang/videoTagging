import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';

import { GlobalEventBusService } from '../core/event-bus';
import { KeyboardEventService } from '../core/keyboard-event';
import { tap, filter, delay, switchMap, switchMapTo, take, map, retryWhen } from 'rxjs/operators';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { CanvasTools } from 'vott-ct';
import { RegionData } from 'vott-ct/lib/js/CanvasTools/Core/RegionData';

import { EditorMode, RegionType, ITag } from '../core/models/canvas.model';

import { Editor } from 'vott-ct/lib/js/CanvasTools/CanvasTools.Editor';
// import Clipboard from '../../../../common/clipboard';
// import Confirm from '../../common/confirm/confirm';
// import { strings } from '../../../../common/strings';
// import { SelectionMode } from 'vott-ct/lib/js/CanvasTools/Interface/ISelectorSettings';
import { Rect } from 'vott-ct/lib/js/CanvasTools/Core/Rect';
import CanvasHelpers from '../core/canvasHelpers';
import { IPictureRegion } from '../core/models/canvas.model';
import { MatSnackBar } from '@angular/material/snack-bar';
import shortid from 'shortid';
import { IFile, IFolder, IPictureInfo, IPictureProject } from '../core/models/picture.model';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

@Component({
    selector: 'app-picture-marker',
    templateUrl: './picture-marker.component.html',
    styleUrls: ['./picture-marker.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PictureMarkerComponent implements OnInit, OnDestroy {
    public editingPicture: SafeUrl = '';
    public editingPictureInfo: IFile = {} as IFile;
    public markingSize: { height: number; width: number } = { height: 10, width: 10 };
    private editor: Editor;
    private frameHeight = 0;
    private frameWidth = 0;
    private selectedRegions: IPictureRegion[] = [];
    private tags: ITag[] = [{ name: 'face', color: '#ff22ff' }];
    private pictures = {};
    private currentFolderInfo: IFolder = {
        folder: '',
        pictures: [],
    };
    private project: IPictureProject = {} as IPictureProject;
    private recentLabels = [];

    private readonly markingAreaOffset = 40;
    private readonly lockedTags = [];
    private sub = new Subscription();

    @ViewChild('markingArea', { static: true }) markingArea: ElementRef;

    constructor(
        private domSanitizer: DomSanitizer,
        private eventBus: GlobalEventBusService,
        private _snackBar: MatSnackBar,
        private cdRef: ChangeDetectorRef,
        private keyboardEvent: KeyboardEventService
    ) {
        const resizeSub = this.eventBus.resize$
            .pipe(
                delay(100),
                tap(() => {
                    this.frameHeight = this.markingArea.nativeElement.clientHeight;
                    this.frameWidth = this.markingArea.nativeElement.clientWidth;
                    this.resetImageEditor();
                })
            )
            .subscribe();

        const selectFolderSub = this.eventBus.selectPictureProject$
            .pipe(
                tap((folder: IFolder) => {
                    this.currentFolderInfo = folder;
                    localStorage.setItem('pictureProjectPath', folder.folder);
                }),
                switchMap((folder) => this.loadProject(folder.folder, folder.pictures))
            )
            .subscribe();

        const tagChangeSub = this.eventBus.tagChange$
            .pipe(
                tap((type: string) => {
                    if (!type) {
                        return;
                    }

                    let target = this.tags.find((tag) => tag.name === type);
                    if (!target) {
                        target = { name: type, color: CanvasHelpers.getColor() };
                    }
                    this.tags = [...new Set([target, ...this.tags])];
                    this.recentLabels = this.tags.slice(0, 5);
                    this.project.labels = this.tags;
                    this.applyTag(type);
                }),
                tap(() => {
                    this.eventBus.setPictureLabels(this.tags);
                    this.eventBus.setPictureRecentLabels(this.recentLabels);
                    this.cdRef.markForCheck();
                })
            )
            .subscribe();

        const indexOffsetSub = this.eventBus.pictureIndexOffset$
            .pipe(
                tap((offset: number) => {
                    const current = this.project.currentEditingIndex;
                    const target = current + offset;
                    if (target >= 0 && target < this.project.files.length) {
                        this.project.currentEditingIndex = target;
                        this.loadPicture();
                    }
                })
            )
            .subscribe();

        const saveDataSub = this.keyboardEvent.saveData$
            .pipe(
                tap(() => {
                    this.eventBus.showLoading();
                }),
                switchMap(() =>
                    this.eventBus.saveFile({
                        path: `${this.project.path}picture.vt`,
                        contents: {
                            ...this.project,
                            pictureResult: this.pictures,
                        },
                    })
                ),
                tap(() => {
                    this.eventBus.hideLoading();
                })
            )
            .subscribe();

        this.sub.add(resizeSub);
        this.sub.add(selectFolderSub);
        this.sub.add(tagChangeSub);
        this.sub.add(indexOffsetSub);
        this.sub.add(saveDataSub);
    }

    ngOnInit(): void {
        this.addCTEditor();
        this.frameHeight = this.markingArea.nativeElement.clientHeight;
        this.frameWidth = this.markingArea.nativeElement.clientWidth;

        const path = localStorage.getItem('pictureProjectPath');
        if (!path) {
            return;
        }

        const loadProjectSub = this.loadProject(path, []).subscribe();
        this.sub.add(loadProjectSub);
    }

    ngOnDestroy(): void {
        this.sub.unsubscribe();
    }

    resetImageEditor() {
        const rate = this.editingPictureInfo.height / this.editingPictureInfo.width;
        const innerHeight = this.frameHeight - this.markingAreaOffset;
        const innerWidth = this.frameWidth - this.markingAreaOffset;
        const targetWidth = innerHeight / rate;
        const targetHeight = innerWidth * rate;
        if (targetWidth <= innerWidth) {
            this.markingSize = {
                height: innerHeight,
                width: targetWidth,
            };
        }
        if (targetHeight <= innerHeight) {
            this.markingSize = {
                height: targetHeight,
                width: innerWidth,
            };
        }
        if (this.editingPictureInfo && this.editor) {
            this.editor.AS.resize(this.markingSize.width, this.markingSize.height);
        }
        this.cdRef.markForCheck();
    }

    private loadProject(path: string, files: IPictureInfo[]): Observable<any> {
        this.eventBus.showLoading();
        this.message('Project Loading...');
        return this.eventBus.readPictureProjectOrCreate(path, 'picture.vt', files).pipe(
            map((res) => JSON.parse(res)),
            tap((res: IPictureProject) => {
                this.project = res;
                this.pictures = res.pictureResult;
                if (res.currentEditingIndex === -1) {
                    return;
                }

                this.loadPicture();
                this.eventBus.setPictureLabels(res.labels);
            }),
            tap(() => {
                this.eventBus.hideLoading();
            })
        );
    }

    private addCTEditor() {
        if (this.editor) {
            return;
        }

        const editorContainer = document.getElementById('picture-div') as HTMLDivElement;

        this.editor = new CanvasTools.Editor(editorContainer).api;
        this.editor.autoResize = true;
        this.editor.onSelectionEnd = this.onSelectionEnd;
        this.editor.onRegionMoveEnd = this.onRegionMoveEnd;
        this.editor.onRegionDelete = this.onRegionDelete;
        this.editor.onRegionSelected = this.onRegionSelected;
        this.editor.AS.resize(0, 0);

        // this.editor.AS.setSelectionMode({ mode: SelectionMode });
    }

    private onSelectionEnd = (regionData: RegionData) => {
        if (CanvasHelpers.isEmpty(regionData)) {
            return;
        }

        const { height, width, x, y, points } = CanvasHelpers.scaleRegionToSourceSize(
            regionData,
            this.editingPictureInfo.width,
            this.editingPictureInfo.height,
            this.markingSize.width,
            this.markingSize.height
        );

        console.log({ height, width, x, y, points });

        if (!(height * width)) {
            // INFO: avoid add a dot to the page as a region
            return;
        }

        const id: string = shortid.generate();

        const defaultDescription = CanvasHelpers.getDefaultDescriptor();

        this.editor.RM.addRegion(id, regionData, defaultDescription);

        const newRegion: IPictureRegion = {
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
        };

        this.pictures[this.editingPictureInfo.id] = [...(this.pictures[this.editingPictureInfo.id] || []), newRegion];
        this.updateRegion(newRegion);

        this.onSelectedRegionsChanged([newRegion]);

        this.editor.RM.selectRegionById(id);
    };

    private onSelectedRegionsChanged = (selectedRegions: IPictureRegion[]) => {
        // INFO: create a new region also will trigger here.
        // console.log(selectedRegions, 'selected regions');
        // const ids = selectedRegions.map((region) => ({ trackId: region.trackId, id: region.id }));
        // this._customData.currentTrackId = [...ids];
        // this.props.customDataActions.updateCurrentTrackId([...ids]);
        this.selectedRegions = selectedRegions;

        if (!selectedRegions[0]) return;

        // this.event.setCurrentTrackId(selectedRegions[0].trackId);
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

    private updateRegion(region: IPictureRegion) {
        console.log(region, '////////////');
        const description = CanvasHelpers.getPictureTagsDescriptor(this.tags, region, region.tags[0]);

        this.editor.RM.updateTagsById(region.id, description);
    }

    private onRegionMoveEnd = (id: string, regionData: RegionData) => {
        console.log('callde onRegionMoveEnd');
        // const currentRegions = this.state.currentAsset.regions;
        const currentRegions = this.pictures[this.editingPictureInfo.id] || [];
        const movedRegionIndex = currentRegions.findIndex((region) => region.id === id);
        const movedRegion: IPictureRegion = currentRegions[movedRegionIndex];

        const { height, width, x, y, points } = CanvasHelpers.scaleRegionToSourceSize(
            regionData,
            this.editingPictureInfo.width,
            this.editingPictureInfo.height,
            this.markingSize.width,
            this.markingSize.height
        );

        if (movedRegion) {
            movedRegion.points = points;
            movedRegion.boundingBox = {
                height,
                width,
                left: x,
                top: y,
            };

            this.pictures[this.editingPictureInfo.id][movedRegionIndex] = movedRegion;
            this.onSelectedRegionsChanged([movedRegion]);
            // this.updateAssetRegions(currentRegions);
            // this.props.onRegionMoved(movedRegion, movedRegion.trackId);
            this.updateRegion(movedRegion);
        }
    };

    private onRegionDelete = (id: string) => {
        console.log('callde onRegionDelete');
        // Remove from Canvas Tools
        this.editor.RM.deleteRegionById(id);

        // Remove from project
        // const currentRegions = this.state.currentAsset.regions;
        const currentRegions = this.pictures[this.editingPictureInfo.id] || [];
        const deletedRegionIndex = currentRegions.findIndex((region) => region.id === id);

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

    private getSelectedRegions = (): IPictureRegion[] => {
        const selectedRegions = this.editor.RM.getSelectedRegions().map((rb) => rb.id);
        console.log(selectedRegions, 'selectedRegions');
        const currentRegions = this.pictures[this.editingPictureInfo.id] || [];
        // return this.state.currentAsset.regions.filter((r) => selectedRegions.find((id) => r.id === id));
        return currentRegions.filter((r) => selectedRegions.find((id) => r.id === id));
    };

    private message(message: string) {
        this._snackBar.open(message, 'Notice', {
            verticalPosition: 'top',
            duration: 3000,
        });
    }

    private clearAllRegions = () => {
        if (!this.editor) return;

        this.editor.RM.deleteAllRegions();
    };

    private applyTag = (tag: string) => {
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
        }
        this.updateRegions(selectedRegions);

        this.onSelectedRegionsChanged(selectedRegions);
    };

    private updateRegions = (updates: IPictureRegion[]) => {
        for (const update of updates) {
            this.editor.RM.updateTagsById(update.id, CanvasHelpers.getPictureTagsDescriptor(this.tags, update, update.tags[0]));
        }

        this.updateCanvasToolsRegionTags();
    };

    private updateCanvasToolsRegionTags = (): void => {
        const currentRegions = this.pictures[this.editingPictureInfo.id] || [];
        for (const region of currentRegions) {
            this.editor.RM.updateTagsById(region.id, CanvasHelpers.getPictureTagsDescriptor(this.tags, region, region.tags[0]));
        }
    };

    private loadPicture() {
        const picture = this.project.files[this.project.currentEditingIndex];
        this.editingPicture = this.domSanitizer.bypassSecurityTrustUrl(picture.path);
        this.editingPictureInfo = picture;
        const regions = this.pictures[picture.id] || [];
        this.resetImageEditor();
        this.repaintRegions(regions);
        this.cdRef.markForCheck();
    }

    private repaintRegions(regions: IPictureRegion[]) {
        this.clearAllRegions();
        regions.forEach((region) => {
            const loadedRegionData = CanvasHelpers.getRegionData(region);
            this.editor.RM.addRegion(
                region.id,
                CanvasHelpers.scaleRegionToFrameSize(
                    loadedRegionData,
                    this.editingPictureInfo.width,
                    this.editingPictureInfo.height,
                    this.markingSize.width,
                    this.markingSize.height
                ),
                CanvasHelpers.getPictureTagsDescriptor(this.tags, region, region.tags[0])
            );
        });
    }
}
