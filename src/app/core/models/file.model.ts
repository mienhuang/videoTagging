export interface ISavingFile {
    path: string;
    contents: string;
}

export interface IExportFileInfo {
    description: string;
    url: string;
    version: string;
    year: number;
    contributor: string;
    date_created: string;
}

export interface IExportFileLicense {
    url: string;
    id: number;
    name: string;
}

export interface IExportFileAnnotation {
    segmentation: number[];
    area: number;
    iscrowd: number;
    image_id: number;
    bbox: number[];
    category_id: number;
    id: number;
}

export interface IExportFileImage {
    license: number;
    file_name: string;
    coco_url: null;
    height: number;
    width: number;
    date_captured: string;
    flickr_url: null;
    id: number;
}

export interface IExportFileCategory {
    supercategory: string;
    id: number;
    name: string;
}

export interface IExportFile {
    info: IExportFileInfo;
    licenses: IExportFileLicense[];
    images: IExportFileImage[];
    annotations: IExportFileAnnotation[];
    categories: IExportFileCategory[];
}
