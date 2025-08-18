import express from 'express';
import { greet } from '@hn-challenge/shared';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: greet('Backend') });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});