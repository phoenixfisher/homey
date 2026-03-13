import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import dotenv from 'dotenv'
import mysql from 'mysql2/promise'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..', '..')
dotenv.config({ path: path.join(rootDir, '.env') })

function getConfig() {
  const dbName = process.env.DB_NAME

  if (!dbName) {
    throw new Error('Missing DB_NAME. Copy .env.example to .env and fill in your MySQL settings.')
  }

  return {
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      multipleStatements: true,
    },
    dbName,
  }
}

async function runSqlFile(connection, relativePath) {
  const sqlPath = path.join(rootDir, relativePath)
  const sql = await fs.readFile(sqlPath, 'utf8')
  await connection.query(sql)
}

async function main() {
  const { connection, dbName } = getConfig()
  const adminConnection = await mysql.createConnection(connection)

  await adminConnection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`)
  await adminConnection.end()

  const dbConnection = await mysql.createConnection({
    ...connection,
    database: dbName,
  })

  await runSqlFile(dbConnection, path.join('db', 'sql', 'schema.sql'))
  await runSqlFile(dbConnection, path.join('db', 'sql', 'seed.sql'))
  await dbConnection.end()

  console.log(`Database \"${dbName}\" is ready.`)
}

main().catch((error) => {
  console.error('Database setup failed.')
  console.error(error?.message || error)
  process.exit(1)
})
