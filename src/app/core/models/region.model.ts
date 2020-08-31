export interface IDBResponse {
    success: boolean;
    msg: string;
    data?: any;
}

export interface ICustomData {
    maxTrackId: number;
    regions: any;
    maxTrackIdList: number[];
    currentTrackId: { trackId: number, id: string }[];
}
