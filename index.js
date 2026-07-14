require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')

const app = express()
const cors = require('cors')
const mongoUri = process.env.MONGO_URI;


app.use(cors())
app.use(express.static('public'))
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

mongoose.connect(mongoUri)
  .then(() => {
    console.log("Conexiunea la MongoDB Atlas a fost realizata cu succes!");
  })
  .catch((err) => {
    console.error("Eroare critica la conectarea la MongoDB:", err.message);
  });

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

const userSchema = new mongoose.Schema({
  username: { type: String, required: true }
});

const User = mongoose.model('User', userSchema);

app.post('/api/users', async(req, res) => {
  const usernameTrimis = req.body.username;

  if (!usernameTrimis) {
    return res.status(400).json({ error: "Te rog introdu un username!" });
  }

  try {
    const utilizatorNou = new User({
      username: usernameTrimis
    });

    const utilizatorSalvat = await utilizatorNou.save();

    // obiect json cu username si id generat de baza de date
    res.json({
      username: utilizatorSalvat.username,
      _id: utilizatorSalvat._id
    });
  } catch (eroare) {
    console.error("Eroare la salvarea utilizatorului:", eroare);
    res.status(500).json({ error: "Ceva nu a mers bine pe server." });
  }
});

app.get('/api/users', async (req, res) => {
  try {
    const totiUtilizatorii = await User.find({});
    return res.json(totiUtilizatorii);
  } catch (eroare) {
    console.error("Eroare la preluarea utilizatorilor:", eroare);
    return res.status(500).json({ error: "Nu am putut prelua utilizatorii." });
  }
});

app.post('/api/users/:_id/exercises', async (req, res) => {
  const userId = req.params._id;
  const { description, duration, date } = req.body;

  try {
    const utilizatorGasit = await User.findById(userId);
    if (!utilizatorGasit) {
      return res.status(404).json({ error: "Utilizatorul nu a fost gasit." });
    }

    let queryFiltrare = { userId: userId };

    // daca utilizatorul a trimis filtre de data
    if (from || to) {
      queryFiltrare.date = {};
      if (from) {
        queryFiltrare.date.$gte = new Date(from); // $gte = mai mare sau egal cu data 'from'
      }
      if (to) {
        queryFiltrare.date.$lte = new Date(to);   // $lte = mai mic sau egal cu data 'to'
      }
    }

    let cautareExercitii = Exercise.find(queryFiltrare);

    if (limit) {
      cautareExercitii = cautareExercitii.limit(parseInt(limit));
    }

    const exercitiiGasite = await cautareExercitii.exec();

    const logFormatat = exercitiiGasite.map(ex => ({
      description: ex.description,           
      duration: ex.duration,                 
      date: ex.date.toDateString()          
    }));

    const dataExercitiu = date ? new Date(date) : new Date();
    
    const exercitiuNou = new Exercise({
        userId: utilizatorGasit._id,
        description: description,
        duration: parseInt(duration),
        date: dataExercitiu
      });

    await exercitiuNou.save();

    res.json({
      _id: utilizatorGasit._id,
      username: utilizatorGasit.username,
      count: exercitiiGasite.length,        
      log: logFormatat                       
    });
    
  } catch (eroare) {
    console.error("Eroare la salvarea exercitiilor:", eroare);
    res.status(500).json({ error: "Ceva nu a mers bine pe server." });
  }
});

app.get('/api/users/:_id/logs')

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
