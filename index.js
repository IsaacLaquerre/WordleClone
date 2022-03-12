const express = require("express");
const hash = require("password-hash");
const fs = require("fs");

var app = express();
app.use(express.static(__dirname + '/public'));

const PORT = process.env.PORT || 3000;

app.use(express.json());
app.set('trust proxy', 1);
app.set('views', __dirname + '/public/views');
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'ejs');

var words = [];
var allowedGuesses;

fs.readFile("./allowedGuesses.txt", "utf8", (err, data) => {
    allowedGuesses = data.toLowerCase().split("\r\n");

    fs.readFile("./words.txt", "utf8", (err, data) => {

        for (var i in data.toLowerCase().split("\r\n")) {
            words.push({ word: data.toLowerCase().split("\r\n")[i], hash: hash.generate(data.toLowerCase().split("\r\n")[i]) });
            allowedGuesses.push(data.toLowerCase().split("\r\n")[i]);
        }
    });
});

app.listen(
    PORT,
    () => console.log("App live and listening on port " + PORT)
);

app.get("/", (req, res) => {
    var word = words[Math.floor(Math.random() * words.length)];
    return res.render("index.ejs", { hash: word.hash });
});

app.post("/getword", (req, res) => {
    if (!req.body || !req.body.hash) return res.send({
        status: "error",
        error: "No given body"
    });
    var word = words.find(word => word.hash === req.body.hash);
    if (word === undefined) return res.send({
        status: "error",
        error: "Internal server error"
    });
    return res.send({
        status: "ok",
        data: word
    });
});

app.post("/compareword", (req, res) => {
    if (!req.body || (!req.body.word && !req.body.hash)) return res.send({
        status: "error",
        errorCode: "no_body",
        error: "No given body"
    });
    if (allowedGuesses.indexOf(req.body.word.toLowerCase()) === -1) return res.send({
        status: "error",
        errorCode: "invalid_word",
        error: "Invalid word"
    });

    var answer = words.find(word => word.hash === req.body.hash);

    if (answer === undefined) return res.send({
        status: "error",
        errorCode: "invalid_word_hash",
        error: "Invalid word hash"
    });

    var letters = req.body.word.split("");
    var match = [];
    for (var i in letters) {
        if (answer.word.split("")[i] === letters[i]) match.push("correct");
        else if (answer.word.includes(letters[i])) {
            if (answer.word.match(new RegExp(letters[i], "g")).length === 1 && req.body.word.match(new RegExp(letters[i], "g")).length > 1 && (letters.slice(0, i).join("").includes(letters[i]) || letters.slice(i, letters.length - 1).forEach(letter => letter === letters[i]))) {
                match.push("absent");
            } else match.push("present");
        } else match.push("absent");
    }

    return res.send({
        status: "ok",
        data: {
            match: match,
            found: answer.word === req.body.word
        }
    });
});

//Handle 404
app.get("*", (req, res) => {
    return res.status(404).sendFile("404.html", { root: "public/views" });
});