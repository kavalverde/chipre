import { InternalServerErrorException } from '@nestjs/common';
import OpenAI from 'openai';

export const createThreadUseCase = async (openai: OpenAI) => {
  try {
    const {id} = await openai.beta.threads.create();
    if (!id) {
      throw new Error('Error creating thread');
    }
    return id;
  } catch (error) {
    console.error(error);
    throw new InternalServerErrorException('Error creating thread');
  }
};
