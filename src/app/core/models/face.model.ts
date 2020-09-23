import { ITag } from './canvas.model';

export interface IFace {
    name?: string;
    path: string;
    similaritydegree?: number;
    faceId: string;
    tag?: ITag;
    trackId?: number;
}
