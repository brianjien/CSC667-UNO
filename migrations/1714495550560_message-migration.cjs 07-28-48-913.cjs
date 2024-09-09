/* eslint-disable camelcase */

const TABLE_NAME = "message";

/**
 * @param {import("node-pg-migrate/dist/types").MigrationBuilder} pgm
 */
exports.up = (pgm) => {
  pgm.createTable(TABLE_NAME, {
    message_id: {
      type: "integer",
      notNull: true,
    },
    username: {
      type: "varchar(255)",
    },
    content: {
      type: "text",
    },
    created_at: {
      type: "timestamp without time zone",
      default: pgm.func("CURRENT_TIMESTAMP"),
    },
  });

  pgm.createIndex(TABLE_NAME, "username");
};

/**
 * @param {import("node-pg-migrate/dist/types").MigrationBuilder} pgm
 */
exports.down = (pgm) => {
  pgm.dropIndex(TABLE_NAME, "user_id");
  pgm.dropTable(TABLE_NAME);
};
