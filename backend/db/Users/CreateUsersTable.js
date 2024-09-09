import db from "../connection.js";

const createUsersTable = `
  CREATE TABLE IF NOT EXISTS Users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL
  )
`;

const createConversationsTable = `
  CREATE TABLE IF NOT EXISTS Conversations (
    conversation_id SERIAL PRIMARY KEY,
    conversation_name VARCHAR(255),
    type VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`;

const createMessagesTable = `
  CREATE TABLE IF NOT EXISTS Messages (
    message_id SERIAL PRIMARY KEY,
    conversation_id INT REFERENCES Conversations(conversation_id),
    user_id INT REFERENCES Users(user_id),
    content TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`;

const createMessageReactionsTable = `
  CREATE TABLE IF NOT EXISTS MessageReactions (
    reaction_id SERIAL PRIMARY KEY,
    message_id INT REFERENCES Messages(message_id),
    user_id INT REFERENCES Users(user_id),
    reaction_type VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`;

async function createTablesIfNotExist() {
  try {
    const usersTableExists = await checkTableExists('Users');
    const conversationsTableExists = await checkTableExists('Conversations');
    const messagesTableExists = await checkTableExists('Messages');
    const messageReactionsTableExists = await checkTableExists('MessageReactions');

    if (!usersTableExists || !conversationsTableExists || !messagesTableExists || !messageReactionsTableExists) {
      await db.query(createUsersTable);
      await db.query(createConversationsTable);
      await db.query(createMessagesTable);
      await db.query(createMessageReactionsTable);
    }
  } catch (error) {
    console.error('Error creating tables:', error);
  }
}

async function checkTableExists(tableName) {
  const result = await db.query(
    `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = $1)`,
    [tableName]
  );
  return result.rows[0].exists;
}

createTablesIfNotExist();
