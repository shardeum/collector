import { config } from '../config/index'

/** Whether PostgreSQL is enabled */
export const pgEnabled = config.postgresEnabled //need to add this to config !!

/**
 * Creates the appropriate placeholder for parameterized queries
 *
 * @example
 * // Basic usage:
 * const sql = `SELECT * FROM users WHERE id = ${ph(1)}`;
 * // For SQLite: "SELECT * FROM users WHERE id = ?"
 * // For PostgreSQL: "SELECT * FROM users WHERE id = $1"
 *
 * @example
 * // With multiple parameters:
 * const sql = `SELECT * FROM users WHERE id = ${ph(1)} AND age > ${ph(2)}`;
 * // For SQLite: "SELECT * FROM users WHERE id = ? AND age > ?"
 * // For PostgreSQL: "SELECT * FROM users WHERE id = $1 AND age > $2"
 *
 * @example
 * // Using a counter for parameters (recommended for complex queries):
 * let paramCounter = 1;
 * const nextPh = () => ph(paramCounter++);
 *
 * const sql = `
 *   SELECT * FROM users
 *   WHERE id = ${nextPh()}
 *   AND age > ${nextPh()}
 *   AND status = ${nextPh()}
 * `;
 * // For PostgreSQL: "SELECT * FROM users WHERE id = $1 AND age > $2 AND status = $3"
 *
 * @param n - The parameter position (1-based)
 * @returns The appropriate placeholder string ('?' for SQLite, '$n' for PostgreSQL)
 */
export function ph(n: number): string {
  return pgEnabled ? `$${n}` : '?'
}

/**
 * Creates comparison operators with appropriate placeholders
 *
 * @example
 * // Usage:
 * const sql = `SELECT * FROM users WHERE active ${cmp('eq', 1)}`;
 * // For SQLite: "SELECT * FROM users WHERE active = ?"
 * // For PostgreSQL: "SELECT * FROM users WHERE active = $1"
 *
 * @example
 * // Using both equals and not equals:
 * const sql = `SELECT * FROM users WHERE role ${cmp('eq', 1)} AND status ${cmp('neq', 2)}`;
 * // For SQLite: "SELECT * FROM users WHERE role = ? AND status != ?"
 * // For PostgreSQL: "SELECT * FROM users WHERE role = $1 AND status != $2"
 *
 * @param op - The comparison operator: 'eq' for equals, 'neq' for not equals
 * @param n - The parameter position (1-based)
 * @returns The comparison operator with the appropriate placeholder
 */
export function cmp(op: 'eq' | 'neq', n: number): string {
  return (op === 'eq' ? '=' : '!=') + ph(n) // e.g. "= $3"  or  "!= ?"
}

/**
 * Adds text casting for PostgreSQL when needed in SELECT statements
 *
 * @example
 * // Usage:
 * const sql = `SELECT id${appendTextCast('json_data')} FROM users`;
 * // For SQLite: "SELECT id FROM users"
 * // For PostgreSQL: "SELECT id, json_data::TEXT FROM users"
 *
 * @param col - The column name to cast to TEXT in PostgreSQL
 * @returns The cast expression or empty string for SQLite
 */
export function appendTextCast(col: string): string {
  return pgEnabled ? `, ${col}::TEXT` : ''
}

/**
 * Determines whether to add WHERE or AND to a SQL statement
 *
 * @example
 * // Usage:
 * let hasConditions = false;
 * let sql = 'SELECT * FROM users';
 *
 * if (name) {
 *   sql += `${whereOrAnd(hasConditions)} name ${cmp('eq', 1)}`;
 *   hasConditions = true;
 * }
 *
 * if (age) {
 *   sql += `${whereOrAnd(hasConditions)} age ${cmp('eq', 2)}`;
 *   hasConditions = true;
 * }
 * // Result might be: "SELECT * FROM users WHERE name = ? AND age = ?"
 *
 * @param hasExistingConditions - Whether there are already conditions in the WHERE clause
 * @returns ' WHERE' or ' AND' based on the existence of previous conditions
 */
export function whereOrAnd(hasExistingConditions: boolean): string {
  return hasExistingConditions ? ' AND' : ' WHERE'
}

/**
 * Creates placeholders for a single row in INSERT statements
 *
 * @example
 * // Basic usage:
 * const fields = ['name', 'email', 'age'];
 * const placeholders = rowPlaceholders(fields.length);
 * const sql = `INSERT INTO users (${fields.join(', ')}) VALUES (${placeholders})`;
 * // For SQLite: "INSERT INTO users (name, email, age) VALUES (?, ?, ?)"
 * // For PostgreSQL: "INSERT INTO users (name, email, age) VALUES ($1, $2, $3)"
 *
 * @example
 * // With custom start index:
 * const placeholders = rowPlaceholders(3, 4);
 * // For SQLite: "?, ?, ?"
 * // For PostgreSQL: "$4, $5, $6"
 *
 * @param fieldCount - Number of fields/columns
 * @param startIndex - Starting index for PostgreSQL placeholders (default: 1)
 * @returns A string of comma-separated placeholders
 */
export function rowPlaceholders(fieldCount: number, startIndex = 1): string {
  if (pgEnabled) {
    return Array(fieldCount)
      .fill(0)
      .map((_, i) => `$${i + startIndex}`)
      .join(', ')
  } else {
    return Array(fieldCount).fill('?').join(', ')
  }
}

/**
 * Creates appropriate UPSERT SQL for either database
 *
 * @example
 * // Usage:
 * const fields = ['id', 'name', 'email', 'updated_at'];
 * const uniqueFields = ['id'];
 * const sql = upsertSQL('users', fields, uniqueFields);
 * // For SQLite: "INSERT OR REPLACE INTO users (id, name, email, updated_at) VALUES (?, ?, ?, ?)"
 * // For PostgreSQL: "INSERT INTO users (id, name, email, updated_at) VALUES ($1, $2, $3, $4)
 * //                   ON CONFLICT(id) DO UPDATE SET id = EXCLUDED.id, name = EXCLUDED.name,
 * //                   email = EXCLUDED.email, updated_at = EXCLUDED.updated_at"
 *
 * @example
 * // With execution:
 * const sql = upsertSQL('users', ['id', 'name', 'email'], ['id']);
 * db.run(sql, [1, 'John', 'john@example.com']);
 *
 * @param tableName - Name of the table
 * @param fields - Array of field names
 * @param uniqueFields - Array of field names that are part of the unique constraint
 * @returns SQL statement for upsert operation
 */
export function upsertSQL(tableName: string, fields: string[], uniqueFields: string[]): string {
  const fieldsStr = fields.join(', ')
  const quotedTableName = quoteIdentifier(tableName)

  if (pgEnabled) {
    // For PostgreSQL
    const placeholders = fields.map((_, i) => `$${i + 1}`).join(', ')
    const updateSet = fields.map((field) => `${quoteIdentifier(field)} = EXCLUDED.${quoteIdentifier(field)}`).join(', ')

    // Special handling for tables that might not have the constraint
    if (tableName === 'transactions') {
      // Use DO NOTHING for tables without unique constraints like transactions
      return `
        INSERT INTO ${quotedTableName} (${fieldsStr})
        VALUES (${placeholders})
        ON CONFLICT DO NOTHING
      `
    }

    return `
      INSERT INTO ${quotedTableName} (${fieldsStr})
      VALUES (${placeholders})
      ON CONFLICT(${uniqueFields.join(', ')})
      DO UPDATE SET ${updateSet}
    `
  } else {
    // For SQLite
    const placeholders = Array(fields.length).fill('?').join(', ')
    return `INSERT OR REPLACE INTO ${quotedTableName} (${fieldsStr}) VALUES (${placeholders})`
  }
}

/**
 * Creates SQL for bulk inserts with appropriate conflict handling
 *
 * @example
 * // Usage:
 * const users = [
 *   { id: 1, name: 'Alice', email: 'alice@example.com' },
 *   { id: 2, name: 'Bob', email: 'bob@example.com' }
 * ];
 *
 * const fields = ['id', 'name', 'email'];
 * const { sql, getParamIndex } = bulkInsertSQL('users', fields, users.length, ['id']);
 *
 * // Flatten values for the prepared statement
 * const values = [];
 * users.forEach((user, i) => {
 *   fields.forEach((field, j) => {
 *     values[getParamIndex(i, j) - 1] = user[field];
 *   });
 * });
 *
 * db.run(sql, values);
 *
 * @param tableName - Name of the table
 * @param fields - Array of field names
 * @param recordCount - Number of records to insert
 * @param uniqueFields - Array of field names that are part of the unique constraint
 * @returns Object with SQL and parameter index helper function
 */
export function bulkInsertSQL(
  tableName: string,
  fields: string[],
  recordCount: number,
  uniqueFields: string[]
): { sql: string; getParamIndex: (recordIndex: number, fieldIndex: number) => number } {
  const fieldsStr = fields.join(', ')
  const quotedTableName = quoteIdentifier(tableName)

  if (pgEnabled) {
    let sql = `INSERT INTO ${quotedTableName} (${fieldsStr}) VALUES `

    const rowValues = []
    for (let i = 0; i < recordCount; i++) {
      const rowPlaceholders = fields.map((_, j) => `$${i * fields.length + j + 1}`).join(', ')
      rowValues.push(`(${rowPlaceholders})`)
    }

    sql += rowValues.join(', ')

    // Special handling for tables that might not have the constraint
    if (tableName === 'transactions') {
      // Use DO NOTHING for tables without unique constraints like transactions
      sql += ` ON CONFLICT DO NOTHING`
    } else {
      const updateSet = fields
        .map((field) => `${quoteIdentifier(field)} = EXCLUDED.${quoteIdentifier(field)}`)
        .join(', ')
      sql += ` ON CONFLICT(${uniqueFields.join(', ')}) DO UPDATE SET ${updateSet}`
    }

    const getParamIndex = (recordIndex: number, fieldIndex: number) => recordIndex * fields.length + fieldIndex + 1
    return { sql, getParamIndex }
  } else {
    // For SQLite
    const valuesPlaceholders = []
    for (let i = 0; i < recordCount; i++) {
      const rowPlaceholders = []
      for (let j = 0; j < fields.length; j++) {
        rowPlaceholders.push('?')
      }
      valuesPlaceholders.push(`(${rowPlaceholders.join(', ')})`)
    }

    const sql = `INSERT OR REPLACE INTO ${quotedTableName} (${fieldsStr}) VALUES ${valuesPlaceholders.join(', ')}`
    const getParamIndex = (recordIndex: number, fieldIndex: number) => recordIndex * fields.length + fieldIndex + 1
    return { sql, getParamIndex }
  }
}

/**
 * Adds RETURNING clause for PostgreSQL if needed
 *
 * @example
 * // Usage:
 * const fields = ['id', 'name', 'email'];
 * const insertSQL = `
 *   INSERT INTO users (name, email)
 *   VALUES (${ph(1)}, ${ph(2)})
 *   ${returningClause(['id'])}
 * `;
 * // For SQLite: "INSERT INTO users (name, email) VALUES (?, ?)"
 * // For PostgreSQL: "INSERT INTO users (name, email) VALUES ($1, $2) RETURNING id"
 *
 * @example
 * // Practical use with PostgreSQL where returning ID is useful:
 * // Note: with SQLite you would use db.run() and then get lastID
 * const result = await db.query(
 *   `INSERT INTO users (name, email) VALUES (${ph(1)}, ${ph(2)}) ${returningClause(['id'])}`,
 *   ['John', 'john@example.com']
 * );
 * // With PostgreSQL, result would contain the inserted ID
 *
 * @param columns - Array of column names to return
 * @returns RETURNING clause for PostgreSQL or empty string for SQLite
 */
export function returningClause(columns?: string[]): string {
  if (!pgEnabled || !columns || columns.length === 0) {
    return ''
  }
  return ` RETURNING ${columns.join(', ')}`
}

/**
 * Properly formats a COUNT(*) column for consistent result access
 *
 * @example
 * // Usage:
 * const sql = `SELECT ${countStar()} FROM users`;
 * const result = await db.get(sql);
 * const count = result['COUNT(*)'];
 * // Works consistently for both SQLite and PostgreSQL
 *
 * @returns Properly formatted COUNT(*) expression for both databases
 */
export function countStar(): string {
  // For PostgreSQL, use 'COUNT(*)' without double quotes in the alias to make it case-insensitive
  return pgEnabled ? 'COUNT(*) as "COUNT(*)"' : 'COUNT(*) as "COUNT(*)"'
}

/**
 * Creates a WHERE IN clause with appropriate placeholders
 *
 * @example
 * // Usage:
 * const ids = [1, 2, 3];
 * const { sql: inClause, endIndex } = whereIn('user_id', ids.length);
 * const fullSql = `SELECT * FROM orders WHERE ${inClause}`;
 * // For SQLite: "SELECT * FROM orders WHERE user_id IN (?, ?, ?)"
 * // For PostgreSQL: "SELECT * FROM orders WHERE user_id IN ($1, $2, $3)"
 *
 * // Execute with the ids array spread into the parameters
 * db.all(fullSql, [...ids]);
 *
 * @example
 * // With continuing parameter indices:
 * const sqlStart = `SELECT * FROM orders WHERE status = ${ph(1)}`;
 * const { sql: inClause, endIndex } = whereIn('user_id', ids.length, 2);
 * const fullSql = `${sqlStart} AND ${inClause}`;
 * // For PostgreSQL: "SELECT * FROM orders WHERE status = $1 AND user_id IN ($2, $3, $4)"
 *
 * // Execute with all parameters
 * db.all(fullSql, ['active', ...ids]);
 *
 * @param column - The column name to check against the list
 * @param valueCount - Number of values in the IN list
 * @param startIndex - Starting index for placeholders (default: 1)
 * @returns Object with SQL fragment and updated end index
 */
export function whereIn(
  column: string,
  valueCount: number,
  startIndex = 1
): {
  sql: string
  endIndex: number
} {
  if (pgEnabled) {
    const placeholders = Array(valueCount)
      .fill(0)
      .map((_, i) => `$${startIndex + i}`)
      .join(', ')
    return {
      sql: `${column} IN (${placeholders})`,
      endIndex: startIndex + valueCount,
    }
  } else {
    const placeholders = Array(valueCount).fill('?').join(', ')
    return {
      sql: `${column} IN (${placeholders})`,
      endIndex: startIndex + valueCount,
    }
  }
}

/**
 * Creates a BETWEEN clause with appropriate placeholders
 *
 * @example
 * // Usage:
 * const { sql: betweenClause, endIndex } = between('created_at');
 * const fullSql = `SELECT * FROM orders WHERE ${betweenClause}`;
 * // For SQLite: "SELECT * FROM orders WHERE created_at BETWEEN ? AND ?"
 * // For PostgreSQL: "SELECT * FROM orders WHERE created_at BETWEEN $1 AND $2"
 *
 * // Execute with date range
 * db.all(fullSql, ['2023-01-01', '2023-12-31']);
 *
 * @example
 * // Combined with other conditions:
 * const userSql = `SELECT * FROM orders WHERE user_id = ${ph(1)}`;
 * const { sql: betweenClause, endIndex } = between('created_at', 2);
 * const fullSql = `${userSql} AND ${betweenClause}`;
 * // For PostgreSQL: "SELECT * FROM orders WHERE user_id = $1 AND created_at BETWEEN $2 AND $3"
 *
 * db.all(fullSql, [userId, startDate, endDate]);
 *
 * @param column - The column name for the BETWEEN operation
 * @param startIndex - Starting index for placeholders (default: 1)
 * @returns Object with SQL fragment and updated end index
 */
export function between(
  column: string,
  startIndex = 1
): {
  sql: string
  endIndex: number
} {
  if (pgEnabled) {
    return {
      sql: `${column} BETWEEN $${startIndex} AND $${startIndex + 1}`,
      endIndex: startIndex + 2,
    }
  } else {
    return {
      sql: `${column} BETWEEN ? AND ?`,
      endIndex: startIndex + 2,
    }
  }
}

/**
 * Properly quotes identifiers (table/column names) for the current database
 *
 * @param identifier - The identifier (table or column name) to quote
 * @returns Properly quoted identifier for the current database
 */
export function quoteIdentifier(identifier: string): string {
  if (pgEnabled) {
    // For PostgreSQL, use double quotes to preserve case sensitivity
    return `"${identifier}"`
  } else {
    // For SQLite, use backticks
    return `\`${identifier}\``
  }
}

/**
 * Formats a date/timestamp value appropriately for each database
 *
 * @example
 * // Usage:
 * const sql = `SELECT id, ${formatDate('created_at', 'YYYY-MM-DD')} AS formatted_date FROM orders`;
 * // For PostgreSQL: "SELECT id, to_char(created_at, 'YYYY-MM-DD') FROM orders"
 * // For SQLite: "SELECT id, strftime('YYYY-MM-DD', created_at) FROM orders"
 *
 * @param column - The column name containing date/timestamp
 * @param format - The format string (PostgreSQL style)
 * @returns Formatted date expression for the current database
 */
export function formatDate(column: string, format: string): string {
  if (pgEnabled) {
    return `to_char(${column}, '${format}')`
  } else {
    // SQLite date format is different, would need conversion logic
    // This is a simplified example
    return `strftime('${format}', ${column})`
  }
}

/**
 * Creates pagination SQL with appropriate syntax
 *
 * @example
 * // Usage:
 * const page = 2;
 * const pageSize = 20;
 * const offset = (page - 1) * pageSize;
 *
 * const sql = `SELECT * FROM users ORDER BY created_at DESC${paginate(pageSize, offset)}`;
 * // For both databases: "SELECT * FROM users ORDER BY created_at DESC LIMIT 20 OFFSET 20"
 *
 * @param limit - Number of rows to return
 * @param offset - Number of rows to skip
 * @returns LIMIT/OFFSET clause for pagination
 */
export function paginate(limit: number, offset: number): string {
  // Both databases support LIMIT/OFFSET, but some versions have quirks
  return ` LIMIT ${limit} OFFSET ${offset}`
}

/** Default batch size for bulk database operations */
export const DEFAULT_BATCH_SIZE = 100

/**
 * Helper function to process a collection of records in batches
 *
 * @example
 * // Basic usage:
 * await batchProcess({
 *   records: users,
 *   tableName: 'users',
 *   fields: ['id', 'name', 'email'],
 *   uniqueFields: ['id'],
 *   extractValues: (record) => db.extractValues(record),
 *   extractBatchValues: (records) => db.extractValuesFromArray(records),
 *   dbRunFunction: async (sql, values) => db.run(sql, values),
 * });
 *
 * @param options Configuration options for batch processing
 * @returns Promise that resolves when all batches have been processed
 */
export async function batchProcess<T>({
  records,
  tableName,
  fields,
  uniqueFields,
  batchSize = DEFAULT_BATCH_SIZE,
  extractValues,
  extractBatchValues,
  dbRunFunction,
  dbContext = undefined,
}: {
  records: T[]
  tableName: string
  fields: string[]
  uniqueFields: string[]
  batchSize?: number
  extractValues: (record: T) => unknown[]
  extractBatchValues: (records: T[]) => unknown[]
  dbRunFunction: (sql: string, values: unknown[], context?: string) => Promise<void> | void
  dbContext?: string
}): Promise<void> {
  // Empty records check
  if (!records || records.length === 0) {
    return
  }

  // Process in batches
  if (records.length > 1) {
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize)

      if (batch.length === 1) {
        // Single record insert
        const sql = upsertSQL(tableName, fields, uniqueFields)
        const values = extractValues(batch[0])
        await dbRunFunction(sql, values, dbContext)
      } else {
        // Batch insert
        const { sql } = bulkInsertSQL(tableName, fields, batch.length, uniqueFields)
        const values = extractBatchValues(batch)
        await dbRunFunction(sql, values, dbContext)
      }
    }
  } else if (records.length === 1) {
    // Single record insert
    const sql = upsertSQL(tableName, fields, uniqueFields)
    const values = extractValues(records[0])
    await dbRunFunction(sql, values, dbContext)
  }
}
