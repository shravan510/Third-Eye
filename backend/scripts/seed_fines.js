require('dotenv').config();
const { Sequelize } = require('sequelize');

const seq = new Sequelize(process.env.PG_DB, process.env.PG_USER, process.env.PG_PASSWORD, {
    host: process.env.PG_HOST || 'localhost',
    port: process.env.PG_PORT || 5432,
    dialect: 'postgres',
    logging: false,
});

(async () => {
    try {
        await seq.authenticate();
        console.log('Connected to PostgreSQL');

        // Create table if not exists
        await seq.query(`
            CREATE TABLE IF NOT EXISTS fine_settings (
                id SERIAL PRIMARY KEY,
                violation_type VARCHAR(50) UNIQUE NOT NULL,
                amount INTEGER NOT NULL,
                section VARCHAR(100) NOT NULL,
                description VARCHAR(200) NOT NULL,
                updated_at TIMESTAMP DEFAULT NOW()
            )
        `);
        console.log('Table fine_settings ensured.');

        // Seed default rows
        const fines = [
            ['SPEEDING',      2000, 'Section 112 MV Act', 'Exceeding speed limit'],
            ['HELMETLESS',    1000, 'Section 129 MV Act', 'Not wearing helmet'],
            ['TRIPLE_RIDING', 1000, 'Section 128 MV Act', 'Carrying excess pillion riders'],
        ];

        for (const [vt, amt, sec, desc] of fines) {
            await seq.query(
                'INSERT INTO fine_settings (violation_type, amount, section, description) VALUES ($1, $2, $3, $4) ON CONFLICT (violation_type) DO NOTHING',
                { bind: [vt, amt, sec, desc], type: Sequelize.QueryTypes.INSERT }
            );
            console.log('Inserted/skipped:', vt);
        }

        console.log('Fine settings seeded successfully!');
    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        await seq.close();
        process.exit();
    }
})();
