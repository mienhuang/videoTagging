import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { DashboardComponent } from './dashboard/dashboard.component';
import { VideoMarkerComponent } from './video-marker/video-marker.component';
import { PictureMarkerComponent } from './picture-marker/picture-marker.component';

const routes: Routes = [
    {
        path: '',
        component: DashboardComponent,
        children: [
            {
                path: '',
                redirectTo: 'picture',
                pathMatch: 'full'
            },
            {
                path: 'video',
                component: VideoMarkerComponent,
            },
            {
                path: 'picture',
                component: PictureMarkerComponent,
            },
        ],
    },
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule],
})
export class AppRoutingModule {}
