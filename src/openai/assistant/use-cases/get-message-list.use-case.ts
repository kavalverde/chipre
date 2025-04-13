import { InternalServerErrorException } from '@nestjs/common';
import OpenAI from 'openai';

interface Props {
  threadId: string;
}

export const getMessageListUseCase = async (openai: OpenAI, props: Props) => {
  const { threadId } = props;

  try {
    const messageList = await openai.beta.threads.messages.list(threadId);
    if (!messageList) {
      throw new Error('Error getting message list');
    }

    const messages = messageList.data.map((message) => {
      const messageFormated = message.content.map(
        (content) => (content as any).text.value,
      );
      return {
        role: message.role,
        content: messageFormated[0] || '',
      };
    });

    return messages;
  } catch (error) {
    console.error(error);
    throw new InternalServerErrorException('Error getting message list');
  }
};
