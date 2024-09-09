// migrations/1715178031403_gameState-migration.js

const TABLE_NAME = "uno_game_state1";

exports.up = (pgm) => {
  pgm.createTable(TABLE_NAME, {
    game_id: {
      type: "serial",
      primaryKey: true,
    },
    deck: {
      type: "text",
    },
    discard_pile: {
      type: "text",
    },
    player1_hand: {
      type: "text",
    },
    player2_hand: {
      type: "text",
    },
    current_player_index: {
      type: "integer",
    },
    direction: {
      type: "integer",
    },
    skip_turn: {
      type: "boolean",
    },
    draw_card_pending: {
      type: "boolean",
    },
    created_at: {
      type: "timestamp",
      default: pgm.func("current_timestamp"),
    },
    invitation_codes: {
      type: "varchar(255)",
      unique: true,
    },
    player1_name: {
      type: "text",
    },
    player2_name: {
      type: "text",
    },
  });
};

exports.down = (pgm) => {
  pgm.dropTable(TABLE_NAME);
};
