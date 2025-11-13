import { Request, Response } from 'express';
import prisma from '../prismaClient';
import { AuthRequest } from '../middlewares/auth.middleware';

// Create a new conversation (optionally linked to a child)
export async function createConversation(req: AuthRequest, res: Response) {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: 'Unauthorized' });
    if (user.role === 'admin') return res.status(403).json({ message: 'Admins are not allowed to participate in discussions' });

    const { childId, title } = req.body as { childId?: string; title?: string };

    // If childId provided, we could validate it exists — rely on FK constraint for now
    // Debugging: log prisma keys if conversation model is missing
    // eslint-disable-next-line no-console
    console.debug('[createConversation] prisma keys:', Object.keys(Object.getPrototypeOf(prisma)));
    // eslint-disable-next-line no-console
    console.debug('[createConversation] prisma.conversation present:', !!(prisma as any).conversation);

    const conversation = await (prisma as any).conversation.create({
      data: {
        childId: childId || undefined,
        title: title || undefined,
        createdById: user.id,
      },
    });

    return res.status(201).json(conversation);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[createConversation]', err);
    return res.status(500).json({ message: 'Failed to create conversation' });
  }
}

// List conversations. Nutritionists see all; CHWs see conversations for children they created or conversations they started.
export async function listConversations(req: AuthRequest, res: Response) {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: 'Unauthorized' });
    if (user.role === 'admin') return res.status(403).json({ message: 'Admins are not allowed to view discussions' });

    const childId = (req.query.childId as string) || undefined;

    const where: any = {};
    if (user.role === 'chw') {
      // CHW: conversations they created OR conversations linked to children they created
      where.OR = [
        { createdById: user.id },
        { child: { createdById: user.id } },
      ];
    } else if (user.role === 'nutritionist') {
      // nutritionist: see all
      // no-op
    }

    if (childId) {
      where.childId = childId;
    }

    const conversations = await prisma.conversation.findMany({
      where,
      include: {
        messages: { take: 1, orderBy: { createdAt: 'desc' } },
        child: true,
        createdBy: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    return res.json(conversations);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[listConversations]', err);
    return res.status(500).json({ message: 'Failed to list conversations' });
  }
}

// Get messages for a conversation
export async function getMessages(req: AuthRequest, res: Response) {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: 'Unauthorized' });
    if (user.role === 'admin') return res.status(403).json({ message: 'Admins are not allowed to view discussions' });

    const { id } = req.params;

    // Permission check for CHW: ensure the conversation is linked to a child they created OR they created the conversation
    const conversation = await prisma.conversation.findUnique({ where: { id }, include: { child: true, createdBy: true } });
    if (!conversation) return res.status(404).json({ message: 'Conversation not found' });

    if (user.role === 'chw') {
      const isCreator = conversation.createdById === user.id;
      const childBelongsTo = conversation.child && conversation.child.createdById === user.id;
      if (!isCreator && !childBelongsTo) return res.status(403).json({ message: 'Forbidden' });
    }

    const messages = await prisma.message.findMany({ where: { conversationId: id }, include: { author: true }, orderBy: { createdAt: 'asc' } });
    return res.json(messages);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[getMessages]', err);
    return res.status(500).json({ message: 'Failed to fetch messages' });
  }
}

// Post a message to a conversation
export async function postMessage(req: AuthRequest, res: Response) {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: 'Unauthorized' });
    if (user.role === 'admin') return res.status(403).json({ message: 'Admins are not allowed to post messages' });

    const { id } = req.params; // conversation id
    const { text } = req.body as { text: string };
    if (!text || typeof text !== 'string') return res.status(400).json({ message: 'Invalid message' });

    const conversation = await prisma.conversation.findUnique({ where: { id }, include: { child: true, createdBy: true } });
    if (!conversation) return res.status(404).json({ message: 'Conversation not found' });

    if (user.role === 'chw') {
      const isCreator = conversation.createdById === user.id;
      const childBelongsTo = conversation.child && conversation.child.createdById === user.id;
      if (!isCreator && !childBelongsTo) return res.status(403).json({ message: 'Forbidden' });
    }

    const message = await prisma.message.create({
      data: {
        conversationId: id,
        authorId: user.id,
        text,
      },
      include: { author: true },
    });

    // bump conversation updatedAt
    await prisma.conversation.update({ where: { id }, data: { updatedAt: new Date() } });

    return res.status(201).json(message);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[postMessage]', err);
    return res.status(500).json({ message: 'Failed to post message' });
  }
}

export default {
  createConversation,
  listConversations,
  getMessages,
  postMessage,
};
