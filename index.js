require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')

const app = express()
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


// Schema User
const userSchema = new mongoose.Schema({
  username: { type: String, required: true }
});
const User = mongoose.model('User', userSchema);

// Schema Exercise
const exerciseSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: { type: Date, required: true }
});
const Exercise = mongoose.model('Exercise', exerciseSchema);


// POST - Creare utilizator nou
app.post('/api/users', async(req, res) => {
  const usernameTrimis = req.body.username;

  if (!usernameTrimis) {
    return res.status(400).json({ error: "Te rog introdu un username!" });
  }

  try {
    const utilizatorNou = new User({ username: usernameTrimis });
    const utilizatorSalvat = await utilizatorNou.save();

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

// POST - Adăugare exercițiu
app.post('/api/users/:_id/exercises', async (req, res) => {
  const userId = req.params._id;
  const { description, duration, date } = req.body;

  try {
    const utilizatorGasit = await User.findById(userId);
    if (!utilizatorGasit) {
      return res.status(404).json({ error: "Utilizatorul nu a fost gasit." });
    }

    // Rezolvarea problemelor de formatare a datei pentru freeCodeCamp:
    let dataExercitiu;
    if (!date || date.trim() === "") {
      dataExercitiu = new Date();
    } else {
      // Înlocuim liniuțele cu slash-uri pentru a evita decalajele de fus orar (Timezone offset)
      const parts = date.split('-');
      dataExercitiu = new Date(parts[0], parts[1] - 1, parts[2]);
    }

    const exercitiuNou = new Exercise({
      userId: utilizatorGasit._id.toString(),
      description: description,
      duration: parseInt(duration),
      date: dataExercitiu
    });

    await exercitiuNou.save();

    // Răspunsul exact pe care îl așteaptă testele
    res.json({
      _id: utilizatorGasit._id.toString(),
      username: utilizatorGasit.username,
      description: exercitiuNou.description,
      duration: exercitiuNou.duration,
      date: exercitiuNou.date.toDateString()
    });
    
  } catch (eroare) {
    console.error("Eroare la salvarea exercitiilor:", eroare);
    res.status(500).json({ error: "Ceva nu a mers bine pe server." });
  }
});

// GET - Istoric exercitii cu filtre
app.get('/api/users/:_id/logs', async (req, res) => {
  const userId = req.params._id;
  const { from, to, limit } = req.query; 

  try {
    const utilizatorGasit = await User.findById(userId);
    if (!utilizatorGasit) {
      return res.status(404).json({ error: "Utilizatorul nu a fost găsit." });
    }

    let queryFiltrare = { userId: userId };

    // Validăm și adăugăm filtrele de dată
    if (from || to) {
      queryFiltrare.date = {};
      if (from) {
        queryFiltrare.date.$gte = new Date(from);
      }
      if (to) {
        queryFiltrare.date.$lte = new Date(to);
      }
    }

    let cautareExercitii = Exercise.find(queryFiltrare);

    // Ne asigurăm că limit este parsat corect ca număr
    if (limit) {
      cautareExercitii = cautareExercitii.limit(parseInt(limit));
    }

    const exercitiiGasite = await cautareExercitii.exec();

    const logFormatat = exercitiiGasite.map(ex => ({
      description: ex.description,
      duration: ex.duration,
      date: ex.date.toDateString()
    }));

    res.json({
      _id: utilizatorGasit._id.toString(),
      username: utilizatorGasit.username,
      count: exercitiiGasite.length,
      log: logFormatat
    });

  } catch (eroare) {
    console.error("Eroare la preluarea log-urilor:", eroare);
    res.status(500).json({ error: "A apărut o eroare pe server." });
  }
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
});
