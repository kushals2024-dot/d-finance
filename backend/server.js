require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/error');

const app = express();

const origins = (process.env.CLIENT_URL || 'http://localhost:5173').split(',').map((s) => s.trim());
app.use(helmet());
app.use(cors({ origin: origins, credentials: true }));
app.use(express.json({ limit: '1mb' }));
if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', app: 'D Finance API' }));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/family', require('./routes/family'));
app.use('/api/income', require('./routes/income'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/budgets', require('./routes/budgets'));
app.use('/api/goals', require('./routes/goals'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api', require('./routes/insights')); // /meta, /dashboard, /analysis, /recommendations

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
if (!process.env.JWT_SECRET) { console.error('JWT_SECRET is not set. Check backend/.env'); process.exit(1); }

connectDB()
  .then(() => app.listen(PORT, () => console.log(`D Finance API running on port ${PORT}`)))
  .catch((err) => { console.error('Startup failed:', err.message); process.exit(1); });
