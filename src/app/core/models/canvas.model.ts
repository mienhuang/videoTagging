export interface ITag {
    name: string;
    color: string;
}

export interface IAsset {
    id: string;
    type: AssetType;
    state: AssetState;
    name: string;
    path: string;
    size: ISize;
    format?: string;
    timestamp?: number;
    parent?: IAsset;
    predicted?: boolean;
}


export interface IAssetMetadata {
    asset: IAsset;
    regions: IRegion[];
    version: string;
}


export interface ISize {
    width: number;
    height: number;
}


export interface IRegion {
    id: string;
    type: RegionType;
    tags: string[];
    points?: IPoint[];
    boundingBox?: IBoundingBox;
    faceId?: string;
    trackId?: number;
    keyFrame?: boolean;
    frameIndex?: number;
    imgPath?: string;
}

export interface ICustomRegion {
    asset?: IAsset;
    frameIndex?: number;
    id: string;
    type: RegionType;
    tags: string[];
    points?: IPoint[];
    boundingBox?: IBoundingBox;
    faceId?: number;
    trackId?: number;
    keyFrame?: boolean;
    imgPath?: string;
}


export interface IBoundingBox {
    left: number;
    top: number;
    width: number;
    height: number;
}


export interface IPoint {
    x: number;
    y: number;
}


export enum AssetType {
    Unknown = 0,
    Image = 1,
    Video = 2,
    VideoFrame = 3,
    TFRecord = 4,
}


export enum AssetState {
    NotVisited = 0,
    Visited = 1,
    Tagged = 2,
}


export enum RegionType {
    Polyline = 'POLYLINE',
    Point = 'POINT',
    Rectangle = 'RECTANGLE',
    Polygon = 'POLYGON',
    Square = 'SQUARE',
}

export enum EditorMode {
    Rectangle = 'RECT',
    Polygon = 'POLYGON',
    Polyline = 'POLYLINE',
    Point = 'POINT',
    Select = 'SELECT',
    CopyRect = 'COPYRECT',
    None = 'NONE',
}

export interface ISecureString {
    encrypted: string;
}

export interface ISecurityToken {
    name: string;
    key: string;
}

export interface ITFRecordMetadata {
    width: number;
    height: number;
    xminArray: number[];
    yminArray: number[];
    xmaxArray: number[];
    ymaxArray: number[];
    textArray: string[];
}
