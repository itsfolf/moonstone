import EventEmitter from "events";
const { Writable } = require("stream");

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
  }

  declare type chatTokenArray = Array<{ type: string; value: string }>;
  declare type chatMessageBuilder = {
    text: (text: String) => chatMessageBuilder;
    mention: (user: User) => chatMessageBuilder;
    mentionUsername: (username: String) => chatMessageBuilder;
    emote: (emote: String) => chatMessageBuilder;
    emoji: (emote: String) => chatMessageBuilder;
    link: (link: String) => chatMessageBuilder;
    url: (link: String) => chatMessageBuilder;
  };

  export class Client extends EventEmitter {
    options: ClientOptions;
    rooms: Collection<Room>;
    user: User;
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
      level: keyof Constants.AuthLevel
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
    id: String;
    username: String;
    avatarUrl: String;
    bannerUrl?: String;
    bio: String;
    online: Boolean;
    lastOnline: String;
    currentRoomId?: String;
    displayName: String;
    numFollowing: Number;
    numFollowers: Number;
    youAreFollowing: Boolean;
    followsYou: Boolean;
    botOwnerId?: String;
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
      string:
        | content
        | ((builder: chatMessageBuilder) => chatMessageBuilder)
        | chatTokenArray
    ): Promise<void>;
    setAsListener(): Promise<void>;
    setAsSpeaker(): Promise<void>;
    setAuthLevel(level: keyof Constants.AuthLevel): Promise<void>;
  }

  export class Room {
    name: String;
    description: String;
    isPrivate: Boolean;
    insertedAt: String;
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
    userId: String;
    user: ActiveUser;
    room: ActiveRoom;
    tokens: Array<Object>;
    sentAt: String;
    isWhisper: Boolean;
    isPrivate: Boolean;
    content: String;
  }

  export class AudioDispatcher extends Writable implements VolumeInterface {
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
    disonnect(): void;
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
    apiKey?: String;
    isUsernameTaken?: Boolean;
    error?: String;
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
