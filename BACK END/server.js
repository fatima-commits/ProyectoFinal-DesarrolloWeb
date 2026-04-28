const express= require('express');
const router = require('./routes/api.js');
const app=express();
const port = 3000;

app.use(express.json());
app.use(express.static('../FRONTEND'));
app.use('/controllers', express.static('../FRONTEND/controllers'));
app.use('/views', express.static('../FRONTEND/views'));
app.use('/assets', express.static('../FRONTEND/assets'));

app.use(router);

app.listen(port, () => {
  console.log(`Proyecto final corriendo en el puerto ${port}!`);
});