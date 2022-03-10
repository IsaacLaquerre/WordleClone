var currentGuess = 1;
var hash = document.querySelector("#preJs").dataset.hash;

var pressing = false;
var flipping = false;

var winMessages = ["Genius", "Magnificent", "Impressive", "Splendid", "Great", "Phew"];

function pressed(key) {
    switch (key) {
        case "enter":
            submitWord(currentGuess);
            break;
        case "backspace":
            var lastestTypedTiles = document.querySelectorAll("#guess" + currentGuess + " .tile[data-status='filled']");
            if (lastestTypedTiles.length === 0) return false;
            else {
                var lastestTypedTile = lastestTypedTiles[lastestTypedTiles.length - 1];
                lastestTypedTile.innerHTML = "";
                lastestTypedTile.setAttribute("data-status", "empty");
            }
            break;
        default:
            if ("abcdefghijklmnopqrstuvwxyz".includes(key)) {
                var lastestAvailableTiles = document.querySelectorAll("#guess" + currentGuess + " .tile[data-status='empty']");
                if (lastestAvailableTiles.length === 0) return false;
                else {
                    var lastestAvailableTile = lastestAvailableTiles[0];
                    lastestAvailableTile.innerHTML = key;
                    lastestAvailableTile.setAttribute("data-status", "filled");
                    animateTile(lastestAvailableTile, "pop-in", 100);
                }
            } else return false;
            break;
    }
}

function handleKeyDown(e) {
    if (e.ctrlKey || e.key === "Control" || e.key === "ControlRight" || e.altKey || e.key === "Alt" || e.key === "AltRight") return false;
    if (flipping) return false;
    if (pressing && (e.keyCode === 13 || e.keyCode === 8)) return;
    pressing = true;
    if ("abcdefghijklmnopqrstuvwxyz".includes(e.key) || e.keyCode === 13 || e.keyCode === 8) document.querySelector("#keyboard .row button[data-key=" + e.key.toLowerCase() + "]").classList.add("pressed");
    pressed(e.key.toLowerCase());
}

function handleKeyUp(e) {
    if (e.ctrlKey || e.key === "Control" || e.key === "ControlRight" || e.altKey || e.key === "Alt" || e.key === "AltRight") return false;
    if (flipping) return false;
    pressing = false;
    if ("abcdefghijklmnopqrstuvwxyz".includes(e.key) || e.keyCode === 13 || e.keyCode === 8) document.querySelector("#keyboard .row button[data-key=" + e.key.toLowerCase() + "]").classList.remove("pressed");
}

function submitWord(guess) {
    var tiles = document.querySelectorAll("#guess" + guess + " .tile");
    var empty = false;
    for (var tile = 0; tile < tiles.length; tile++) {
        if (tiles[tile].dataset.status === "empty") empty = true;
    }
    if (empty) {
        showMessage("Not enough letters");
        animateRow(document.querySelector("#guess" + currentGuess), "shake", 600);
    } else {
        var word = "";
        for (tile in tiles) {
            if (tiles[tile].innerHTML != undefined) {
                word += tiles[tile].innerHTML;
            }
        }
        fetch("/compareword", {
            method: "POST",
            body: JSON.stringify({ word: word, hash: hash }),
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            }
        }).then(body => body.json().then(res => {
            if (res.status === "error") {
                switch (res.errorCode) {
                    case "no_body":
                    case "invalid_word_hash":
                        alert("Internal system error.\n" + res.error);
                        break;
                    case "invalid_word":
                        showMessage("Not in word list");
                        animateRow(document.querySelector("#guess" + currentGuess), "shake", 600);
                        break;
                    default:
                        break;
                }
            } else {
                flipping = true;
                flipTiles(tiles, res.data.match).then(() => {
                    flipping = false;
                    if (res.data.found) {
                        setTimeout(function() {
                            showResults("won");
                        }, 1250);
                    } else {
                        if (currentGuess >= 6) {
                            showResults("lost");
                        } else currentGuess++;
                    }

                });
            }
        }));
    }
}

function animateRow(row, animation, duration) {
    row.classList.add(animation);
    setTimeout(function() {
        row.classList.remove(animation);
    }, duration);
}

function animateTile(tile, animation, duration) {
    tile.classList.add(animation);
    setTimeout(function() {
        tile.classList.remove(animation);
    }, duration);
}

function flipTiles(tiles, match) {
    return new Promise((resolve, reject) => {
        flipTile(tiles[0], match[0]).then(() => {
            flipTile(tiles[1], match[1]).then(() => {
                flipTile(tiles[2], match[2]).then(() => {
                    flipTile(tiles[3], match[3]).then(() => {
                        flipTile(tiles[4], match[4]).then(() => {
                            resolve();
                        });
                    });
                });
            });
        });
    });
}

function flipTile(tile, value) {
    return new Promise((resolve, reject) => {
        setTimeout(function() {
            tile.classList.add("flip-in");
            setTimeout(function() {
                tile.classList.remove("flip-in");
                tile.classList.add(value);
                tile.classList.add("flip-out");
                setTimeout(function() {
                    tile.classList.remove("flip-out");
                    var key = document.querySelector(".key[data-key='" + tile.innerHTML + "']");
                    if (!key.classList.contains(value)) pressKey(key, value);

                    resolve();
                }, 200);
            }, 200);
        }, 200 * tile);
    });
}

function pressKey(key, value) {
    key.classList.add(value);
}

function setUpTiles() {
    var guesses = document.querySelector("#guesses");

    for (var rows = 0; rows < 6; rows++) {
        var row = document.createElement("div");
        row.classList.add("row");
        row.id = "guess" + (rows + 1);
        for (var tiles = 0; tiles < 5; tiles++) {
            var tile = document.createElement("div");
            tile.classList.add("tile");
            tile.setAttribute("data-status", "empty");

            row.appendChild(tile);
        }

        guesses.appendChild(row);
    }
}

function setUpKeyboard() {
    var keyboard = document.querySelector("#keyboard");
    var keyList = ["qwertyuiop", "asdfghjkl", ">zxcvbnm<"];

    for (var rows = 0; rows < keyList.length; rows++) {
        var row = document.createElement("div");
        row.classList.add("row");
        for (var letter = 0; letter < keyList[rows].length; letter++) {
            var key = document.createElement("button");
            if (keyList[rows].split("")[letter] == ">" || keyList[rows].split("")[letter] == "<") {
                key.classList.add("funcKey");
                if (keyList[rows].split("")[letter] === ">") {
                    key.innerHTML = "enter";
                    key.setAttribute("data-key", "enter");
                } else if (keyList[rows].split("")[letter] === "<") {
                    key.innerHTML = "<svg xmlns=\"http://www.w3.org/2000/svg\" height=\"24\" viewBox=\"0 0 24 24\" width=\"24\"> <path fill=\"var(--text-color)\" d=\"M22 3H7c-.69 0-1.23.35-1.59.88L0 12l5.41 8.11c.36.53.9.89 1.59.89h15c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H7.07L2.4 12l4.66-7H22v14zm-11.59-2L14 13.41 17.59 17 19 15.59 15.41 12 19 8.41 17.59 7 14 10.59 10.41 7 9 8.41 12.59 12 9 15.59z\"></path> </svg>";
                    key.setAttribute("data-key", "backspace");
                }
            } else {
                key.classList.add("key");
                key.innerHTML = keyList[rows].split("")[letter];
                key.setAttribute("onclick", "pressed(this.dataset.key)");
                key.setAttribute("data-key", keyList[rows].split("")[letter]);
            }

            row.appendChild(key);
        }

        keyboard.appendChild(row);
    }
}

function showMessage(message) {
    return new Promise((resolve, reject) => {
        if (document.querySelectorAll("div.error").length >= 2) resolve();
        var error = document.createElement("div");
        error.classList.add("error");
        error.innerHTML = message;
        if (document.querySelectorAll("div.error").length === 1) error.style.top = "130px";
        document.querySelector("#body").insertBefore(error, document.querySelector("#title"));
        setTimeout(function() {
            fade(error);
            resolve();
        }, 1000);
    });
}

function showResults(status) {
    switch (status) {
        case "won":
            document.querySelector("#status").innerHTML = "You found the word in " + currentGuess + (currentGuess != 1 ? " guesses!" : " guess!");
            showMessage(winMessages[Math.floor(Math.random() * winMessages.length)]).then(() => {
                document.querySelector("#results").style.visibility = "visible";
                document.querySelector("#game").style.filter = "brightness(0.5)";
            });
            break;
        case "lost":
            fetch("/getword", {
                method: "POST",
                body: JSON.stringify({
                    hash: hash
                }),
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*"
                }
            }).then(body => body.json().then(res => {
                if (res.status === "error") return alert(res.error);
                document.querySelector("#status").innerHTML = "The word was \"" + res.data.word.toUpperCase() + "\"";
                showMessage(res.data.word.toUpperCase()).then(() => {
                    document.querySelector("#results").style.visibility = "visible";
                    document.querySelector("#game").style.filter = "brightness(0.5)";
                });
            }));
            break;
        default:
            break;
    }

}

function closeResults() {
    document.querySelector("#results").style.visibility = "hidden";
    document.querySelector("#game").style.filter = "brightness(1)";
}

function fade(element) {
    var opacity = 1;
    var timer = setInterval(function() {
        if (opacity <= 0.2) {
            clearInterval(timer);
            element.remove();
        }
        element.style.opacity = opacity;
        element.style.filter = "alpha(opacity=" + opacity * 100 + ")";
        opacity -= opacity * 0.1;
    }, 10);
}