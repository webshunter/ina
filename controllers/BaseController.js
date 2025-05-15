class BaseController {
    constructor(db, tableName) {
        this.db = db;
        this.tableName = tableName;
    }

    // Create
    async create(data) {
        const keys = Object.keys(data);
        const values = Object.values(data);
        const placeholders = keys.map(() => '?').join(',');
        
        return new Promise((resolve, reject) => {
            const sql = `INSERT INTO ${this.tableName} (${keys.join(',')}) VALUES (${placeholders})`;
            this.db.run(sql, values, function(err) {
                if (err) reject(err);
                resolve(this.lastID);
            });
        });
    }

    // Read One
    async findById(id) {
        return new Promise((resolve, reject) => {
            this.db.get(`SELECT * FROM ${this.tableName} WHERE id = ?`, [id], (err, row) => {
                if (err) reject(err);
                resolve(row);
            });
        });
    }

    // Read All
    async findAll(conditions = {}) {
        let sql = `SELECT * FROM ${this.tableName}`;
        const values = [];

        const conditionEntries = Object.entries(conditions);
        if (conditionEntries.length > 0) {
            const whereClause = conditionEntries
                .map(([key, value]) => {
                    values.push(value);
                    return `${key} = ?`;
                })
                .join(' AND ');
            sql += ` WHERE ${whereClause}`;
        }

        return new Promise((resolve, reject) => {
            this.db.all(sql, values, (err, rows) => {
                if (err) reject(err);
                resolve(rows || []);
            });
        });
    }

    // Update
    async update(id, data) {
        const keys = Object.keys(data);
        const values = Object.values(data);
        const setClause = keys.map(key => `${key} = ?`).join(',');
        
        return new Promise((resolve, reject) => {
            const sql = `UPDATE ${this.tableName} SET ${setClause} WHERE id = ?`;
            this.db.run(sql, [...values, id], function(err) {
                if (err) reject(err);
                resolve(this.changes);
            });
        });
    }

    // Delete
    async delete(id) {
        return new Promise((resolve, reject) => {
            this.db.run(`DELETE FROM ${this.tableName} WHERE id = ?`, [id], function(err) {
                if (err) reject(err);
                resolve(this.changes);
            });
        });
    }

    // Custom query
    async query(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                resolve(rows || []);
            });
        });
    }
}

module.exports = BaseController; 