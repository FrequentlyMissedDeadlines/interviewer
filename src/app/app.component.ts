import { Component } from '@angular/core';
import { QuestionsService } from './questions.service';
import { parse } from 'yaml';
import { AlignmentType, Document, HeadingLevel, Packer, Paragraph } from "docx";
import { saveAs } from 'file-saver';
import { IMultiSelectOption } from 'ngx-bootstrap-multiselect';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'interview';
  public file: File = new File([], '');
  optionsModel: number[] = [];
  myOptions: IMultiSelectOption[] = [];
  duration = 45;
  private colors = {};

  constructor(public questionService: QuestionsService) {}

  onFileChange(event: any) {
    console.log("event", event);
  }

  selectRandom() {
    this.selected = this.selected.map(() => false);
    let pool = this.questionService.questions.map((q, i) => {
      return {
        q: q,
        id : i
      }
    }).filter(q => this.myOptions.filter((o,i) => this.optionsModel.includes(i+1)).some(t => q.q.themes.includes(t.name)));
    if (pool.map(q => q.q.duration).reduce((a,b)=>a+b) <= this.duration) {
      this.selected = this.selected.map(() => false);
      pool.forEach(q => {
        this.selected[q.id] = true;
      });
    } else {
      let remaining = this.duration;
      while (remaining > 0 && pool.length > 0) {
        pool = pool.filter(q => q.q.duration <= remaining);
        const r = (Math.random() * pool.length) | 0;
        this.selected[pool[r].id] = true;
        remaining -= pool[r].q.duration;
        pool = pool.filter(q => q.id !== pool[r].id);
      }
    }
  }

  onChange(event: any) {

  }

  processFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (reader.result != null) {
        const text = reader.result.toString().trim();
        const questions = parse(text);
        this.questionService.questions = questions.questions;
        this.selected = this.questionService.questions.map(() => false);
        this.setupColors();
        this.myOptions = [...new Set(this.questionService.questions.flatMap(q => q.themes))].map((t, i) => {
          return {
            id: i + 1,
            name: t
          }
        });
      }
    }
    reader.readAsText(file);
  }

  setupColors() {
    const colors = ['red', 'blue', 'yellow', 'green', 'orange'];
    let i = 0;
    this.questionService.questions.forEach(q => {
      q.themes.forEach((t : string) => {
        if (!Object.keys(this.colors).includes(t)) {
          (this.colors as any)[t] = 'bg-' + colors[i];
          i = (i + 1) % colors.length;
        }
      });
    });
  }

  selected: boolean[] = [];
  select(i: number) {
    this.selected[i] = !this.selected[i];
  }

  totalTime() {
    let total = 0;
    for (let i = 0 ; i < this.selected.length ; i++) {
      if (this.selected[i]) {
        total += this.questionService.questions[i].duration;
      }
    }
    return total;
  }

  export() {
    const paragraphs = [
      new Paragraph({
        text: "Interview questions",
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: {
          after: 600,
        }
      })
    ];
    for (let i = 0 ; i < this.selected.length ; i++) {
      if (this.selected[i]) {
        paragraphs.push(new Paragraph({
          text: this.questionService.questions[i].question,
          heading: HeadingLevel.HEADING_2,
        }));
        this.questionService.questions[i].answers.forEach(answer => {
          paragraphs.push(new Paragraph({
            text: answer,
            bullet: {
              level: 0
            }
          }));
        });
        paragraphs.push(new Paragraph({
          text: "Answer mark: /5",
          spacing: {
            before: 200,
            after: 200,
          }
        }));
      }
    }
    const doc = new Document({
      creator: "Frequently Missed Deadlines",
      description: "Interview questions",
      title: "Interview questions",
      sections: [{
          properties: {},
          children: paragraphs
      }],
    });
    

    Packer.toBlob(doc).then((blob) => {
      saveAs(blob, "example.docx");
  });
  }

  getColor(theme: string) {
    return (this.colors as any)[theme];
  }
}


