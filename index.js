const express = require('express')
const app = express()
const cors = require('cors')
const bodyParser = require('body-parser')
require('dotenv').config()
const mongoose = require('mongoose')
const dayjs = require('dayjs')

  ; (async () => {
    try {
      await mongoose.connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      })
    } catch (err) {
      console.error(err)
    }
  })()

app.use(cors())

app.use(bodyParser.urlencoded({
  extended: false
}))

app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: true,
    required: true
  }
})

const Users = mongoose.model('Users', userSchema)

const exercisesSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: { type: String, required: true }
})

const Exercises = mongoose.model('Exerises', exercisesSchema)

app.post('/api/users', async (req, res) => {
  const user = new Users({
    username: req.body.username
  })
  try {
    const savedUser = await user.save()
    res.json(savedUser)
  } catch (err) {
    console.error(err)
  }
});

app.get('/api/users', async (req, res) => {
  const user = await Users.find()
  res.json(user)
})

app.post('/api/users/:_id/exercises', async (req, res) => {
  const userId = req.params._id
  const description = req.body.description
  const duration = req.body.duration
  const date = req.body.date ? req.body.date : dayjs().format('YYYY-MM-DD')
  const user = await Users.findById(userId)
  const exercise = await Exercises.create({
    userId,
    description,
    duration,
    date
  })
  exercise.date = new Date(date).toDateString()
  res.json({
    _id: userId,
    username: user.username,
    description: exercise.description,
    duration: exercise.duration,
    date: exercise.date
  })
})

app.get('/api/users/:_id/logs', async (req, res) => {
  const _id = req.params._id
  const from = req.query.from
  const to = req.query.to
  const limit = req.query.limit
  const user = await Users.findById(_id)
  const query = {
    userId: _id
  }
  if (from) {
    query.date = {
      $gte: dayjs(from).toDate(),
      ...query.date
    }
  }
  if (to) {
    query.date = {
      $lt: dayjs(to).toDate(),
      ...query.date
    }
  }
  const exercises = await Exercises.find(query)
    .limit(limit)
    .select()
    .exec()
  const log = []
  exercises.forEach(exercise => {
    log.push({
      description: exercise.description,
      duration: exercise.duration,
      date: exercise.date ? new Date(exercise.date).toDateString() : ''
    })
  })
  res.json({
    username: user.username,
    count: exercises.length,
    _id,
    log
  })
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})