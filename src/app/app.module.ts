import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { EditorModule } from '@tinymce/tinymce-angular';
import { DragDropModule } from '@angular/cdk/drag-drop';

import { AppComponent } from './app.component';
import { ComprehensiveLayoutComponent } from './components/comprehensive-layout.component';
import { TinyMCEEditorComponent } from './components/tinymce-editor.component';
import { DiagnosisFieldsComponent } from './components/diagnosis-fields.component';
import { SafeHtmlPipe } from './pipes/safe-html.pipe';

@NgModule({
  declarations: [
    AppComponent,
    ComprehensiveLayoutComponent,
    TinyMCEEditorComponent,
    DiagnosisFieldsComponent,
    SafeHtmlPipe
  ],
  imports: [
    BrowserModule,
    FormsModule,
    EditorModule,
    DragDropModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }

