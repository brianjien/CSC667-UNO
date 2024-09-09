import pgp from 'pg-promise';
import dotenv from 'dotenv';

dotenv.config();

const pgpInstance = pgp();
const connection = pgpInstance({
    connectionString: `postgres://postgres:abcd@localhost:5432/CSC667TeamJ-Uno`,
});

export default connection;
