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
      const messageFormated = message.content.map((content) => {
        console.log('content', content);
        return (content as any).text.value;
      });
      try {
        const jsonFormated = JSON.parse(messageFormated[0]);
        return {
          role: message.role,
          content: jsonFormated,
        };
      } catch (error) {
        return {
          role: message.role,
          content: {
            message: messageFormated[0] || '',
          },
        };
      }
    });

    return messages;
  } catch (error) {
    console.error(error);
    throw new InternalServerErrorException('Error getting message list');
  }
};
