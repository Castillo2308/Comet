import 'dotenv/config';
import express from 'express';
import serverless from 'serverless-http';
import usersRoutes from '../routes/usersRoutes.js';

const app = express();
app.use(express.json());
app.use('/api/users', usersRoutes);

app.listen(5000, () => {
  console.log('Backend running on http://localhost:5000');
});

export default serverless(app);
