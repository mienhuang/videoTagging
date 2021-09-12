import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';

import { AppComponent } from './app.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { HeaderComponent } from './header/header.component';
import { VideoControlComponent } from './video-control/video-control.component';
import { NavBarComponent } from './nav-bar/nav-bar.component';
import { VideoComponent } from './video/video.component';
import { SettingsDialogComponent } from './settings-dialog/settings-dialog.component';
import { VideoFooterComponent } from './video-footer/video-footer.component';
import { FooterComponent } from './footer/footer.component';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatSliderModule } from '@angular/material/slider';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';

import { FaceSettingComponent } from './face-setting/face-setting.component';
import { OverlayComponent } from './overlay/overlay.component';
import { VideoMarkerComponent } from './video-marker/video-marker.component';
import { PictureMarkerComponent } from './picture-marker/picture-marker.component';
import { PictureHeaderComponent } from './picture-header/picture-header.component';
import { ConfirmDialogComponent } from './shared/confirm/confirm.component';
import { RegionInfoComponent } from './shared/region-info/region-info.component';

@NgModule({
    declarations: [
        AppComponent,
        DashboardComponent,
        HeaderComponent,
        VideoControlComponent,
        NavBarComponent,
        VideoComponent,
        SettingsDialogComponent,
        VideoFooterComponent,
        FooterComponent,
        FaceSettingComponent,
        OverlayComponent,
        VideoMarkerComponent,
        PictureMarkerComponent,
        PictureHeaderComponent,
        ConfirmDialogComponent,
        RegionInfoComponent
    ],
    imports: [
        BrowserModule,
        AppRoutingModule,
        BrowserAnimationsModule,
        MatSliderModule,
        MatIconModule,
        MatButtonModule,
        MatSlideToggleModule,
        MatDialogModule,
        MatTabsModule,
        MatSnackBarModule,
        MatProgressSpinnerModule,
        MatAutocompleteModule,
        MatFormFieldModule,
        MatInputModule,
        FormsModule,
        ReactiveFormsModule,
        MatTooltipModule,
        MatSelectModule
    ],
    providers: [],
    bootstrap: [AppComponent],
})
export class AppModule { }
