module.exports = {
	/**
	 * The op codes.
	 * @type {Object}
	 */
  OPCodes: {
    AUTH: "auth:request",
    AUTH_REPLY: "auth:request:reply",
    TOP_ROOMS: "room:get_top",
    NEW_TOKENS: "new-tokens",
    JOIN_ROOM: "join_room_and_get_info",
    FETCH_DONE: "fetch_done",
    ACTIVE_SPEAKER_CHANGE: "active_speaker_change",
    USER_LEFT_ROOM: "user_left_room",
    USER_JOIN_ROOM: "new_user_join_room",
    MUTE_CHANGED: "mute_changed",
    DEAFEN_CHANGED: "deafen_changed",
    SEND_CHAT_MSG: "chat:send_msg",
    NEW_CHAT_MSG: "new_chat_msg",
    MSG_DELETED: "message_deleted",
    JOINED_PEER: "you-joined-as-peer",
    JOINED_SPEAKER: "you-joined-as-speaker",
    LEFT_ROOM: "you_left_room",
    HAND_RAISED: "hand_raised",
    SPEAKER_ADDED: "speaker_added",
    SPEAKER_REMOVED: "speaker_removed",
    NOW_SPEAKER: "you-are-now-a-speaker",
    SET_ROLE: "room:set_role",
    SET_SPEAKING: "room:set_active_speaker",
    CREATE_ROOM: "room:create",
    CREATE_BOT: "user:create_bot",
    GET_PROFILE: "user:get_info",
    EDIT_PROFILE: "user:update",
    MOD_CHANGED: "mod_changed",
    SET_AUTH: "room:set_auth",
    NEW_CREATOR: "new_room_creator",
  },
	/**
	 * The auth levels.
	 * @type {Object}
	 */
  AuthLevel: {
    USER: "user",
    MOD: "mod",
    OWNER: "owner",
  },
};
