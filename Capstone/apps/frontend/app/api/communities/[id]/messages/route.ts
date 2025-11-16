import { NextRequest, NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";
import nacl from "tweetnacl";
import bs58 from "bs58";

// In-memory storage for chat messages (in production, use a database)
const messageStore: Map<string, Array<{
  id: string;
  sender: string;
  senderName?: string;
  message: string;
  timestamp: number;
}>> = new Map();

// Rate limiting: track message counts per wallet
const rateLimitStore: Map<string, { count: number; resetTime: number }> = new Map();
const RATE_LIMIT_MAX = 10; // 10 messages per minute
const RATE_LIMIT_WINDOW = 60000; // 1 minute in milliseconds

function checkRateLimit(wallet: string): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(wallet);

  if (!record || now > record.resetTime) {
    rateLimitStore.set(wallet, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return false;
  }

  record.count++;
  return true;
}

// GET: Fetch messages for a community
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: communityId } = await params;
    
    // Get messages for this community
    const messages = messageStore.get(communityId) || [];
    
    // Return messages sorted by timestamp (oldest first for chat display)
    const sortedMessages = [...messages].sort((a, b) => a.timestamp - b.timestamp);
    
    return NextResponse.json({ messages: sortedMessages });
  } catch (error: any) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

// POST: Send a new message
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: communityId } = await params;
    const body = await request.json();
    
    const { message, signature, publicKey, senderName } = body;

    // Validate input
    if (!message || !signature || !publicKey) {
      return NextResponse.json(
        { error: "Missing required fields: message, signature, publicKey" },
        { status: 400 }
      );
    }

    // Validate message length
    if (message.length > 500) {
      return NextResponse.json(
        { error: "Message exceeds 500 character limit" },
        { status: 400 }
      );
    }

    // Check rate limit
    if (!checkRateLimit(publicKey)) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Maximum 10 messages per minute." },
        { status: 429 }
      );
    }

    // Verify signature
    const isValid = verifySignature(message, signature, publicKey);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }

    // Create message object
    const newMessage = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      sender: publicKey,
      senderName: senderName || undefined,
      message: sanitizeMessage(message),
      timestamp: Date.now(),
    };

    // Store message
    const messages = messageStore.get(communityId) || [];
    messages.push(newMessage);
    messageStore.set(communityId, messages);

    // Keep only last 1000 messages per community
    if (messages.length > 1000) {
      messageStore.set(communityId, messages.slice(-1000));
    }

    return NextResponse.json({ message: newMessage }, { status: 201 });
  } catch (error: any) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}

function verifySignature(message: string, signature: string, publicKey: string): boolean {
  try {
    // Decode the signature and public key
    const signatureUint8 = bs58.decode(signature);
    const publicKeyUint8 = new PublicKey(publicKey).toBytes();
    
    // Create the message that was signed
    const messageBytes = new TextEncoder().encode(message);
    
    // Verify the signature
    return nacl.sign.detached.verify(messageBytes, signatureUint8, publicKeyUint8);
  } catch (error) {
    console.error("Signature verification error:", error);
    return false;
  }
}

function sanitizeMessage(message: string): string {
  // Basic XSS prevention - remove HTML tags
  return message
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .trim();
}
