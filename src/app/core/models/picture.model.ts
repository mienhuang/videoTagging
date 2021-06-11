import { ITag } from './canvas.model';

export interface IFolder {
    folder: string;
    pictures: IPictureInfo[];
}

export interface IPictureInfo {
    name: string;
    path: string;
}

export interface IPictureProject {
    dateCaptureTime: string;
    path: string;
    files: IFile[];
    labels: ITag[];
    fileNameMap: IObject;
    pictureResult: IObject;
    fullName: string;
    currentEditingIndex: number;
    unTagedRegionsIndex: number[];
}

export interface IFile {
    name: string;
    path: string;
    height: number;
    width: number;
    id: number;
}

export interface IObject {
    [key: string]: any;
}

export interface IPictureUntagState {
    hasUntag: boolean;
    firstIndex: number;
}
