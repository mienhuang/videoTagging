import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

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
        FooterComponent
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
        MatProgressSpinnerModule
    ],
    providers: [
    ],
    bootstrap: [AppComponent]
})
export class AppModule { }
