import { InternalServerErrorException } from '@nestjs/common';
import OpenAI from 'openai';

interface Props {
  threadId: string;
  question: string;
}

export const createMessageUseCase = async (openai: OpenAI, props: Props) => {
  const { threadId, question } = props;

  try {
    const message = await openai.beta.threads.messages.create(threadId, {
      role: 'user',
      content: question,
    });
    return message;
  } catch (error) {
    console.error(error);
    throw new InternalServerErrorException('Error creating message');
  }
};
