import { Injectable } from '@angular/core';
import { Question } from './question';

@Injectable({
  providedIn: 'root'
})
export class QuestionsService {
  public questions: Question[] = [];

  constructor() { }
}
