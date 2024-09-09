// migrations/1715178031404_gameRoom-migration.js

const TABLE_NAME = "game_room1";

exports.up = (pgm) => {
  pgm.createTable(TABLE_NAME, {
    room_id: {
      type: "serial",
      primaryKey: true,
    },
    user_id: {
      type: "integer",
      references: "users(user_id)",
    },
    invitation_codes: {
      type: "varchar(6)",
      notNull: true,
      unique: true,
    },
    created_at: {
      type: "timestamp",
      default: pgm.func("current_timestamp"),
    },
    player_username: {
      type: "text[]",
    },
    player1_username: {
      type: "text",
    },
    player2_username: {
      type: "text",
    },
  });

  // Add foreign key constraint
  pgm.addConstraint(TABLE_NAME, "game_room1_user_id_fkey", {
    foreignKeys: {
      columns: "user_id",
      references: "users(user_id)",
      onDelete: "NO ACTION",
      onUpdate: "NO ACTION",
    },
  });
};

exports.down = (pgm) => {
  pgm.dropTable(TABLE_NAME);
};
