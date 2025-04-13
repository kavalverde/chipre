import { IsString } from "class-validator";

export class QuestionDto {
    @IsString()
    threadId: string;

    @IsString()
    question: string;
 
    @IsString()
    assistantId: string;
}