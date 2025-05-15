const BaseController = require('./BaseController');

class ConsultationController extends BaseController {
    constructor(db) {
        super(db, 'consultations');
        this.db = db;
    }

    async createConsultation(userId, type = 'free') {
        return super.create({
            user_id: userId,
            type,
            status: 'pending',
            created_at: new Date().toISOString()
        });
    }

    async getConsultationWithMessages(consultationId) {
        return new Promise((resolve, reject) => {
            this.db.get(`
                SELECT c.*, 
                       u.username,
                       json_group_array(
                           json_object(
                               'id', m.id,
                               'sender', m.sender,
                               'message', m.message,
                               'video_url', m.video_url,
                               'created_at', m.created_at
                           )
                       ) as messages
                FROM consultations c
                LEFT JOIN users u ON c.user_id = u.id
                LEFT JOIN chat_messages m ON c.id = m.consultation_id
                WHERE c.id = ?
                GROUP BY c.id
            `, [consultationId], (err, row) => {
                if (err) reject(err);
                if (row) {
                    row.messages = JSON.parse(row.messages);
                    if (row.messages[0].id === null) {
                        row.messages = [];
                    }
                }
                resolve(row);
            });
        });
    }

    async getUserConsultations(userId) {
        return new Promise((resolve, reject) => {
            this.db.all(`
                SELECT c.*, 
                       COUNT(m.id) as message_count,
                       MAX(m.created_at) as last_message_at
                FROM consultations c
                LEFT JOIN chat_messages m ON c.id = m.consultation_id
                WHERE c.user_id = ?
                GROUP BY c.id
                ORDER BY c.created_at DESC
            `, [userId], (err, rows) => {
                if (err) reject(err);
                resolve(rows || []);
            });
        });
    }

    async addMessage(consultationId, sender, message, videoUrl = null) {
        return new Promise((resolve, reject) => {
            this.db.run(`
                INSERT INTO chat_messages (consultation_id, sender, message, video_url, created_at)
                VALUES (?, ?, ?, ?, datetime('now'))
            `, [consultationId, sender, message, videoUrl], function(err) {
                if (err) reject(err);
                resolve(this.lastID);
            });
        });
    }

    async updateStatus(consultationId, status) {
        const validStatuses = ['pending', 'active', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            throw new Error('Invalid status');
        }
        return super.update(consultationId, { 
            status,
            ...(status === 'completed' ? { completed_at: new Date().toISOString() } : {})
        });
    }

    async getConsultationStats(userId = null) {
        let sql = `
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
                SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
                SUM(CASE WHEN type = 'paid' THEN 1 ELSE 0 END) as paid
            FROM consultations
        `;
        const params = [];

        if (userId) {
            sql += ' WHERE user_id = ?';
            params.push(userId);
        }

        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) reject(err);
                resolve(row);
            });
        });
    }
}

module.exports = ConsultationController; 