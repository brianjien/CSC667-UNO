/* eslint-disable camelcase */

const TABLE_NAME = "users";

/**
 * @param {import("node-pg-migrate/dist/types").MigrationBuilder} pgm
 */
exports.up = (pgm) => {
  pgm.createTable(TABLE_NAME, {
    user_id: {
      type: "integer",
      notNull: true,
    },
    username: {
      type: "name",
      notNull: true,
    },
    password: {
      type: "varchar(100)",
      notNull: true,
    },
    created_date: {
      type: "timestamp without time zone",
      default: pgm.func("CURRENT_TIMESTAMP"),
    },
    status: {
      type: "varchar(10)",
      default: "'offline'",
    },
    email: {
      type: "varchar(100)",
    },
    firstname: {
      type: "varchar(50)",
    },
    lastname: {
      type: "varchar(50)",
    },
  });

  pgm.createIndex(TABLE_NAME, "email");
  pgm.createIndex(TABLE_NAME, "username", { unique: true });
};

/**
 * @param {import("node-pg-migrate/dist/types").MigrationBuilder} pgm
 */
exports.down = (pgm) => {
  pgm.dropIndex(TABLE_NAME, "email");
  pgm.dropIndex(TABLE_NAME, "username", { unique: true });
  pgm.dropTable(TABLE_NAME);
};
