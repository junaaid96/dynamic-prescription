import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { EditorModule } from '@tinymce/tinymce-angular';

import { AppComponent } from './app.component';
import { ComprehensiveLayoutComponent } from './components/comprehensive-layout.component';
import { TinyMCEEditorComponent } from './components/tinymce-editor.component';
import { SafeHtmlPipe } from './safe-html.pipe';
import { HtmlParsingService } from './html-parsing.service';

@NgModule({
  declarations: [
    AppComponent,
    ComprehensiveLayoutComponent,
    TinyMCEEditorComponent,
    SafeHtmlPipe
  ],
  imports: [
    BrowserModule,
    FormsModule,
    EditorModule
  ],
  providers: [HtmlParsingService],
  bootstrap: [AppComponent]
})
export class AppModule { }

