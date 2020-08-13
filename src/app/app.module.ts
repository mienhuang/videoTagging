import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';

import { AppComponent } from './app.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { HeaderComponent } from './header/header.component';
import { VideoControlComponent } from './video-control/video-control.component';
import { NavBarComponent } from './nav-bar/nav-bar.component';
import { VideoComponent } from './video/video.component';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatSliderModule } from '@angular/material/slider';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@NgModule({
    declarations: [
        AppComponent,
        DashboardComponent,
        HeaderComponent,
        VideoControlComponent,
        NavBarComponent,
        VideoComponent
    ],
    imports: [
        BrowserModule,
        AppRoutingModule,
        BrowserAnimationsModule,
        MatSliderModule,
        MatIconModule,
        MatButtonModule,
    ],
    providers: [
    ],
    bootstrap: [AppComponent]
})
export class AppModule { }
