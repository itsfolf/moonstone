import EventEmitter from "events";
import { Writable } from "stream";

declare function Moonstone(
  token:
    | string
    | { token: string }
    | { accessToken: string; refreshToken: string },
  options?: Moonstone.ClientOptions
): Moonstone.Client;

declare namespace Moonstone {
  export const Constants: Constants;

  interface ClientOptions {
    socketUrl?: string;
    autoReconnect?: boolean;
    connectionTimeout?: number;
    callbackTimeout?: number;
    logUnhandledPackets?: boolean;
    pingInterval?: number;
  }

  type chatTokenArray = Array<{ type: string; value: string }>;
  type chatMessageBuilder = {
    text: (text: string) => chatMessageBuilder;
    mention: (user: User) => chatMessageBuilder;
    mentionUsername: (username: string) => chatMessageBuilder;
    emote: (emote: string) => chatMessageBuilder;
    emoji: (emoji: string) => chatMessageBuilder;
    link: (link: string) => chatMessageBuilder;
    url: (link: string) => chatMessageBuilder;
  };

  export class Client extends EventEmitter {
    options: ClientOptions;
    rooms: Collection<Room>;
    user: User;
    latency: Number;
    connect(): void;
    getTopRooms(): Promise<Array<Room>>;
    joinRoom(room: Room): Promise<ActiveRoom>;
    createRoom(options: {
      name: string;
      description?: string;
      privacy?: "public" | "private";
    }): Promise<Room>;
    setRole(role: "raised_hand" | "listener" | "speaker"): Promise<void>;
    sendChatMessage(
      content:
        | string
        | ((builder: chatMessageBuilder) => chatMessageBuilder)
        | chatTokenArray,
      whisperedTo?: [User]
    ): Promise<void>;
    setSpeaking(value: boolean): Promise<void>;
    createBotAccount(username: string): Promise<CreateBotReply>;
    editSelf(options: {
      username?: string;
      displayName?: string;
      avatarUrl?: string;
      bannerUrl?: string;
      bio?: string;
    }): Promise<User>;
    setUserAuthLevel(
      user: ActiveUser,
      level: keyof Constants["AuthLevel"]
    ): Promise<void>;
    on: EventListeners<this>;
  }

  export class Collection<T extends { id: string | number }> extends Map<
    string | number,
    T
  > {
    baseObject: new (...args: any[]) => T;
    limit?: number;
    constructor(baseObject: new (...args: any[]) => T, limit?: number);
    add(obj: T, extra?: unknown, replace?: boolean): T;
    every(func: (i: T) => boolean): boolean;
    filter(func: (i: T) => boolean): T[];
    find(func: (i: T) => boolean): T | undefined;
    map<R>(func: (i: T) => R): R[];
    random(): T | undefined;
    reduce<U>(func: (accumulator: U, val: T) => U, initialValue?: U): U;
    remove(obj: T | { id: string }): T | null;
    some(func: (i: T) => boolean): boolean;
    update(obj: T, extra?: unknown, replace?: boolean): T;
  }

  export class User {
    id: string;
    username: string;
    avatarUrl: string;
    bannerUrl?: string;
    bio: string;
    online: Boolean;
    lastOnline: string;
    currentRoomId?: string;
    displayName: string;
    numFollowing: Number;
    numFollowers: Number;
    youAreFollowing: Boolean;
    followsYou: Boolean;
    botOwnerId?: string;
  }

  export class ActiveUser extends User {
    voiceState: { muted: Boolean; deafened: Boolean; speaking: Boolean };
    isSpeaker: Boolean;
    roomPermissions: {
      isSpeaker: Boolean;
      askedToSpeak: Boolean;
      isMod: Boolean;
    };
    isCreator: Boolean;
    selfUser: User;
    sendWhisper(
      content:
        | string
        | ((builder: chatMessageBuilder) => chatMessageBuilder)
        | chatTokenArray
    ): Promise<void>;
    setAsListener(): Promise<void>;
    setAsSpeaker(): Promise<void>;
    setAuthLevel(level: keyof Constants["AuthLevel"]): Promise<void>;
  }

  export class Room {
    id: string;
    name: string;
    description: string;
    isPrivate: Boolean;
    insertedAt: string;
  }

  export class ActiveRoom extends Room {
    users: Collection<ActiveUser>;
    autoSpeaker: Boolean;
    askToSpeak(): Promise<void>;
    sendChatMessage(
      content:
        | string
        | ((builder: chatMessageBuilder) => chatMessageBuilder)
        | chatTokenArray
    ): Promise<void>;
    connect(): Promise<AudioConnection>;
    audioConnection?: AudioConnection;
  }

  export class Message {
    userId: string;
    user: ActiveUser;
    room: ActiveRoom;
    tokens: Array<Object>;
    sentAt: string;
    isWhisper: Boolean;
    isPrivate: Boolean;
    content: string;
  }

  type Constructable<T> = new (...args: any[]) => T;
  function VolumeMixin<T>(base: Constructable<T>): Constructable<T & VolumeInterface>;

  export class AudioDispatcher extends VolumeMixin(Writable) {
    player: AudioPlayer;
    paused: boolean;
    pausedTime: number;
    steamTime: number;
    totalStreamTime: number;
    volumeEditable: boolean;
    volume: number;
    setVolume(volume: number): void;
    pause(silence?: boolean): void;
    resume(): void;
  }

  export class AudioPlayer {
    audioConnection: AudioConnection;
    dispatcher?: AudioDispatcher;
  }

  export class AudioConnection extends EventEmitter {
    player?: AudioPlayer;
    disconnect(): void;
    connect(): Promise<void>;
    play(
      resource: ReadableStream | string,
      options?: StreamOptions
    ): AudioDispatcher;
    setSpeaking(speaking: boolean): Promise<void>;
  }

  interface EventListeners<T> {
    (event: "ready", listener: (user: User) => void): T;
    (
      event: "newTokens",
      listener: (newTokens: {
        accessToken: string;
        refreshToken: string;
      }) => void
    ): T;
    (
      event:
        | "joinedRoom"
        | "joinedAsPeer"
        | "joinedAsSpeaker"
        | "becameSpeaker",
      listener: (room: ActiveRoom) => void
    ): T;
    (event: "joinedAsSpeaker", listener: (room: Room) => void): T;
    (
      event: "leftRoom",
      listener: (room: ActiveRoom, wasKicked: Boolean) => void
    ): T;
    (
      event:
        | "handRaised"
        | "speakerAdded"
        | "speakerRemoved"
        | "userLeftRoom"
        | "userJoinRoom"
        | "activeSpeakerChange"
        | "muteChange"
        | "deafenChange"
        | "modChange",
      listener: (user: ActiveUser, room: ActiveRoom) => void
    ): T;
    (
      event: "msgDeleted",
      listener: (msgId: string, deleter: ActiveUser) => void
    ): T;
    (event: "newChatMsg", listener: (msg: Message) => void): T;
    (event: "error", listener: (err: Error) => void): T;
    (event: "debug" | "warn", listener: (message: string) => void): T;
    (event: "disconnect" | "error", listener: (err?: Error) => void): T;
  }

  interface StreamOptions {
    type?: StreamType;
    seek?: number;
    volume?: number | boolean;
    highWaterMark?: number;
  }

  type StreamType = 'unknown' | 'converted' | 'opus' | 'ogg/opus' | 'webm/opus';

  interface VolumeInterface {
    volumeEditable: boolean;
    volume: number;
    volumeDecibels: number;
    volumeLogarithmic: number;
    setVolume(volume: number): void;
    setVolumeDecibels(volume: number): void;
    setVolumeLogarithmic(volume: number): void;
  }

  type CreateBotReply = {
    apiKey?: string;
    isUsernameTaken?: Boolean;
    error?: string;
  };

  interface Constants {
    AuthLevel: {
      USER: "user";
      MOD: "mod";
      OWNER: "owner";
    };
  }
}

export = Moonstone;
