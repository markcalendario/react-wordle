import React, { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import texts from './5-letter-words.txt'
import winSound from './Music/win.wav'
import afterWinSound from './Music/after-win.mp3'
import afterLoseSound from './Music/after-lose.mp3'
import loseSound from './Music/lose.wav'
import warnSound from './Music/warn.wav'
import Navbar from "./Components/Navbar";
import Popup from "./Components/Popup";
import shootConfetti from "./Functions/confetti";
import playSound from "./Functions/audio";

const MAXIMUM_STACK_LEVEL = 6

export default function App() {
  const [isUserWaiting, setIsUserWaiting] = useState(true)

  const handleUserClickStart = useCallback(() => {
    setIsUserWaiting(false)
  }, [])

  return (
    <Fragment>
      <Navbar />
      {isUserWaiting ? <WaitingScreen handleUserClickStart={handleUserClickStart} /> : <GameScreen />}
    </Fragment>
  )
}

function WaitingScreen({ handleUserClickStart }) {


  return (
    <section id="waiting-screen">
      <div className="container">
        <div className="wrapper">
          <h1>Wordle</h1>
          <p>Made with ❤ by <a href="https://github.com/markcalendario">Mark Kenneth Calendario</a></p>
          <button onClick={handleUserClickStart}>Start</button>
        </div>
      </div>
    </section>
  )
}

function GameScreen() {
  const [isGameEnded, setIsGameEnded] = useState(false)
  const [didUserGuess, setDidUserGuess] = useState(false)
  const [word, setWord] = useState(null)

  const audio = useRef(new Audio())

  useEffect(() => {
    if (localStorage.getItem('highestScore') === null) {
      localStorage.setItem('highestScore', 0)
    }
  }, [])

  useEffect(() => {
    if (!isGameEnded) {
      audio.current.pause()
      setWord(null)
      return
    }

    if (didUserGuess) {
      audio.current.src = afterWinSound
    }
    else {
      audio.current.src = afterLoseSound
    }

    audio.current.loop = true
    audio.current.load()
    audio.current.play()

  }, [isGameEnded, didUserGuess])

  const fetchWord = useCallback(() => {
    fetch(texts)
      .then(response => {
        return response.text()
      })
      .then(result => {
        let wordArray = result.split('\n')
        setWord(wordArray[Math.floor(Math.random() * wordArray.length)].toUpperCase())
      })
  }, [])

  return (
    <div>
      {
        isGameEnded
          ? <Stats
            word={word}
            setIsGameEnded={setIsGameEnded}
            didUserGuess={didUserGuess}
          />
          : <GuessesStack
            fetchWord={fetchWord}
            word={word}
            setIsGameEnded={setIsGameEnded}
            setDidUserGuess={setDidUserGuess}
          />
      }
    </div>
  );
}

function Stats({ setIsGameEnded, didUserGuess, word }) {

  const [highestScore, setHighestScore] = useState(0)
  const [userScore, setUserScore] = useState(0)
  const [isUserSetNewHighScore, setIsUserSetNewHighScore] = useState(false)

  useEffect(() => {
    setHighestScore(parseInt(localStorage.getItem("highestScore")))
    setUserScore((parseInt(localStorage.getItem("userGameTimeLength"))))
  }, [])

  useEffect(() => {

    if (!didUserGuess) {
      return
    }

    if (userScore < highestScore || highestScore === 0) {
      localStorage.setItem("highestScore", localStorage.getItem("userGameTimeLength"))
      setHighestScore(userScore)
      setIsUserSetNewHighScore(true)
    }
  }, [highestScore, userScore, didUserGuess])

  return (
    <div id="stats" className={didUserGuess ? "stats-win" : "stats-lose"}>
      <div className="container">
        <div className="wrapper">
          <h1>{didUserGuess ? "You nailed it!" : "Better luck next time!"}</h1>
          {
            didUserGuess ?
              <p>You guessed the word <strong>{word}</strong> right.</p> :
              <p>The word is <strong>{word}</strong>.</p>
          }
          <div className="scores col-7">
            <div className="score">
              {
                didUserGuess
                  ? <h3>{(userScore / 1000).toFixed(2)} seconds</h3>
                  : <h3>Did not finish</h3>
              }
              <p>Your Score</p>
            </div>
            <div className="score">
              <h3>{(highestScore / 1000).toFixed(2)} seconds</h3>
              <p>{isUserSetNewHighScore ? "🎉 New" : ""} High Score</p>
            </div>
          </div>
          <button onClick={() => { setIsGameEnded(false) }}>Play Again</button>
        </div>
      </div>
    </div >
  )
}

function GuessesStack({ setIsGameEnded, setDidUserGuess, word, fetchWord }) {
  const [isGameOnGoing, setIsGameOnGoing] = useState(true)
  const [stackGuesses, setStackGuesses] = useState([])
  const [currentGuessStackPosition, setCurrentGuessStackPosition] = useState(0)
  const [currentColumnPosition, setCurrentColumnPosition] = useState(0)
  const [isPopupVisible, setIsPopupVisible] = useState(false)
  const [gameStartTime, setGameStartTime] = useState(0)

  const writeLetter = useCallback((letter) => {
    // Writes letter to a box
    // Uses currentGuessStackPosition and currentColumnPosition for row and columns

    if (currentColumnPosition === word.length) return

    let newStackGuessesData = stackGuesses
    newStackGuessesData[currentGuessStackPosition][currentColumnPosition] = letter
    setStackGuesses(newStackGuessesData)
    setCurrentColumnPosition(prev => prev + 1)
  }, [word, currentColumnPosition, currentGuessStackPosition, stackGuesses])

  const deleteLetter = () => {
    // Deletes a letter from a current box

    if (currentColumnPosition === 0) return

    let newStackGuessesData = stackGuesses
    newStackGuessesData[currentGuessStackPosition][currentColumnPosition - 1] = null
    setCurrentColumnPosition(prev => prev - 1)
  }

  const onPressedEnter = () => {
    if (currentGuessStackPosition > MAXIMUM_STACK_LEVEL) return

    // Check if all of the boxes in a stack is fullfilled
    if (stackGuesses[currentGuessStackPosition].includes(null)) {
      new Audio(warnSound).play()
      setIsPopupVisible(true)
      return
    }

    setCurrentColumnPosition(0)
    setCurrentGuessStackPosition(prev => prev + 1)
  }

  const displaySubmittedGuessStack = () => {
    if (!word) return
    let revealedStack = []

    stackGuesses.forEach((stack, index) => {
      if (currentGuessStackPosition > index) revealedStack.push(stack)
    })

    // Iterate through the revealed stack
    return revealedStack.map((stack, stackIndex) => {
      //  Get the number of frequency of each characters of state word
      const wrongPlacedCharacters = {};
      for (const num of word) {
        wrongPlacedCharacters[num] = wrongPlacedCharacters[num] ? wrongPlacedCharacters[num] + 1 : 1;
      }

      // If the character is in the right place, minus one on the occurence count 
      // Purpose: to retain the wrong-placed-characters occurence count
      stack.forEach((char, charIndex) => {
        // Char is in the right place? minus 1.
        if (char === word[charIndex]) {
          wrongPlacedCharacters[char] = wrongPlacedCharacters[char] - 1
        }
      })

      return (
        <div key={'stack-' + stackIndex} className="guess-stack">
          {
            // Iterate through each character of the current stack
            stack.map((char, charIndex) => {
              let revealPlace = "reveal-no-place"

              // If a character is in the right place, set class "reveal-right-place"
              if (char === word[charIndex]) {
                revealPlace = "reveal-right-place"
              }

              // If a character is in the word and if this character has still occurence in wrongPlacedCharacters object
              else if (word.includes(char) && wrongPlacedCharacters[char] > 0) {
                wrongPlacedCharacters[char] = wrongPlacedCharacters[char] - 1
                revealPlace = "reveal-wrong-place"
              }

              return (
                <div
                  key={'char' + charIndex}
                  className={"box " + revealPlace}>
                  <h1>{char}</h1>
                </div>
              )

            })
          }
        </div>
      )
    })
  }

  const displayGuessStacks = () => {
    let revealedStack = []

    stackGuesses.forEach((stack, index) => {
      if (currentGuessStackPosition <= index) {
        revealedStack.push(stack)
      }
    })

    return revealedStack.map((stack, stackIndex) => (
      <div key={'stack-' + stackIndex} className="guess-stack">
        {
          stack.map((char, charIndex) => (
            <div key={'char' + charIndex} className='box'>
              <h1>{char}</h1>
            </div>
          ))
        }
      </div>
    ))
  }

  const initializeGuessStack = () => {
    console.log(word);
    if (!word) return

    let stackGuessesInitializedData = []
    for (let index = 0; index < MAXIMUM_STACK_LEVEL; index++) {
      let row = []
      for (let index = 0; index < word.length; index++) {
        row.push(null)
      }
      stackGuessesInitializedData.push(row)
    }

    setStackGuesses(stackGuessesInitializedData)
  }

  const analyzeWinningState = () => {
    if (!word || currentGuessStackPosition === 0) return
    let previousStackWord = stackGuesses[currentGuessStackPosition - 1].join('')

    // Win
    if (previousStackWord === word) {
      setIsGameOnGoing(false)
      playSound(winSound, false)
      localStorage.setItem("userGameTimeLength", Date.now() - gameStartTime);
      shootConfetti(5)
      setTimeout(() => {
        setIsGameEnded(true)
        setDidUserGuess(true)
      }, 3500);
    }

    // Lose
    else if (currentGuessStackPosition === MAXIMUM_STACK_LEVEL) {
      setIsGameOnGoing(false)
      playSound(loseSound, false)
      setTimeout(() => {
        setIsGameEnded(true)
        setDidUserGuess(false)
      }, 3000);
    }
  }

  useEffect(() => {
    setGameStartTime(Date.now())
  }, [])

  useEffect(fetchWord, [fetchWord])
  useEffect(initializeGuessStack, [word])
  useEffect(analyzeWinningState, [setDidUserGuess, setIsGameEnded, currentGuessStackPosition, stackGuesses, word, gameStartTime])

  return (
    <Fragment>
      <section id="guesses-stack">
        {
          isPopupVisible ?
            <Popup visibilityControl={setIsPopupVisible} title="Oops!" text="Please fill all the boxes." /> : null
        }
        <div className="container col-3">
          <div className="wrapper">
            {displaySubmittedGuessStack()}
            {displayGuessStacks()}
          </div>
        </div>
      </section>
      {
        isGameOnGoing
          ? <Keyboard writeLetter={writeLetter} deleteLetter={deleteLetter} onPressedEnter={onPressedEnter} />
          : null
      }
    </Fragment>
  )
}

function Keyboard({ writeLetter, deleteLetter, onPressedEnter }) {

  const keyboardKeys = useMemo(() => [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['Del', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'Enter']
  ], [])

  const displayKeyboardKeys = () => {
    return keyboardKeys.map((row) => (
      <div key={row} className="row">
        {
          row.map((key) => (
            <div
              onClick={() => {
                key === 'Del' ? deleteLetter() : key === 'Enter' ? onPressedEnter() : writeLetter(key)
              }}
              key={key}
              className={key.toLowerCase() + " key"}
            >
              <h4>{key}</h4>
            </div>
          ))
        }
      </div>
    ))
  }

  return (
    <div id="keyboard">
      <div className="container col-4">
        <div className="wrapper">

          {displayKeyboardKeys()}

        </div>
      </div>
    </div>
  )
}
