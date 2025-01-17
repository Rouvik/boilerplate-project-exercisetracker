const express = require('express')
const app = express()
const cors = require('cors')
const bodyParser = require('body-parser');
require('dotenv').config()

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// using simple JSON databases, as MongoDB is quite quirky to setup in a hosted environment like this
// also that testing with MySQL dosent work with the localhost:PORT setup
const users = {};
const exercises = {};

function random36KeyGenerator() {
  let keyArr = (Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2)).split('');
  for (let i = 0; i < keyArr.length; i++) {
    if (keyArr[i] == i) {
      keyArr[i]++;
      if (keyArr[i] > 'z') {
        keyArr[i] = 'a';
      } else if (keyArr[i] > 'Z') {
        keyArr[i] = 'A';
      } else if (keyArr[i] > '9') {
        keyArr[i] = '0';
      }
    }
  }

  return keyArr.join('');
}

app.use(bodyParser.urlencoded({ extended: false }));

app.route('/api/users')
  .get((req, res) => {
    let usersArr = [];
    for (const key in users) {
      usersArr.push({ username: users[key], _id: key });
    }

    res.json(usersArr);
  })
  .post((req, res) => {
    let randomKey = null;
    while (users.hasOwnProperty(randomKey = random36KeyGenerator())) { }

    users[randomKey] = req.body.username;
    exercises[randomKey] = [];
    res.json({
      username: req.body.username,
      _id: randomKey
    });
  });

app.post('/api/users', (req, res) => {
  res.json(req.body);
});

app.post('/api/users/:_id/exercises', (req, res) => {
  delete req.body[':_id']; // delete whatever garbage this is...

  if (!users.hasOwnProperty(req.params._id)) // this case isnt handled in the problem itself
  {
    res.json({
      error: "No such user"
    });
    return;
  }

  if (exercises.hasOwnProperty(req.params._id)) {
    exercises[req.params._id].push(req.body);
  }
  else  // shoudnt happen anyway
  {
    exercises[req.params._id] = [req.body];
  }

  res.json({
    username: users[req.params._id],
    _id: req.params._id,
    ...req.body
  });
});


app.get('/api/users/:_id/logs', (req, res) => {
  if (!users.hasOwnProperty(req.params._id)) // again, not handled in the question so I handle it myself
  {
    res.json({
      error: "No such user"
    });
    return;
  }

  // more code but allows me to respond quickly to trivial cases
  if (req.query.from == undefined && req.query.to == undefined && req.query.limit == undefined) {
    res.json({
      username: users[req.params._id],
      _id: req.params._id,
      count: exercises[req.params._id].length,
      log: exercises[req.params._id]
    });
  }
  else {
    let constrainedLogs = [];
    let logCount = 0;
    const fromDate = new Date(req.query.from);
    const toDate = new Date(req.query.to);
    console.log(req.query.from, req.query.to, fromDate, toDate);

    for (const log of exercises[req.params._id]) {
      const dt = new Date(log.date);
      if (!(++logCount > req.query.limit)) {
        if (!(req.query.from && req.query.to && fromDate < dt && toDate > dt) ||
          !(req.query.from && fromDate < dt) ||
          !(req.query.to && toDate > dt)) {
          continue;
        }

        constrainedLogs.push(log);
      }
    }

    res.json({
      username: users[req.params._id],
      _id: req.params._id,
      count: constrainedLogs.length,
      log: constrainedLogs
    });
  }
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
