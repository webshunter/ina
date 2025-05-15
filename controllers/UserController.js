const BaseController = require('./BaseController');
const bcrypt = require('bcrypt');

class UserController extends BaseController {
    constructor(db) {
        super(db, 'users');
    }

    async create(userData) {
        const { password, ...otherData } = userData;
        const hashedPassword = await bcrypt.hash(password, 10);
        return super.create({ ...otherData, password: hashedPassword });
    }

    async findByUsername(username) {
        return new Promise((resolve, reject) => {
            this.db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
                if (err) reject(err);
                resolve(row);
            });
        });
    }

    async findByEmail(email) {
        return new Promise((resolve, reject) => {
            this.db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
                if (err) reject(err);
                resolve(row);
            });
        });
    }

    async updatePassword(id, newPassword) {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        return super.update(id, { password: hashedPassword });
    }

    async validatePassword(user, password) {
        return bcrypt.compare(password, user.password);
    }

    async updateLastLogin(id) {
        return super.update(id, { last_login: new Date().toISOString() });
    }
}

module.exports = UserController; 