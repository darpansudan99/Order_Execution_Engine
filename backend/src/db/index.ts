import postgres from 'postgres';

const sql = postgres({
  host: 'localhost',
  port: 5432,
  database: 'order_execution',
  username: 'user',
  password: 'password',
});

export default sql;
