import React, { Fragment, useEffect, useMemo, useState } from "react";
import texts from './5-letter-words.txt'
import winSound from './music/win.wav'
import loseSound from './music/lose.wav'

function App() {
  return (
    <div>
      <Navbar />
      <GuessesStack />
    </div>
  );
}

function Navbar() {
  return (
    <nav>
      <div className="container">
        <div className="wrapper">
          <h2>Wordle</h2>
          <a href="https://github.com/markcalendario/react-wordle">&copy; Mark Kenneth Calendario {new Date().getFullYear()}</a>
        </div>
      </div>
    </nav>
  )
}

function GuessesStack() {
  const [word, setWord] = useState(null)
  const [isGameOnGoing, setIsGameOnGoing] = useState(true)
  const [stackGuesses, setStackGuesses] = useState([])

  const [currentGuessStackPosition, setCurrentGuessStackPosition] = useState(0)
  const [currentColumnPosition, setCurrentColumnPosition] = useState(0)

  useEffect(() => {
    fetch(texts)
      .then(response => {
        return response.text()
      })
      .then(result => {
        let wordArray = result.split('\n')
        setWord(wordArray[Math.floor(Math.random() * wordArray.length)].toUpperCase())
      })
  }, [])

  useEffect(() => {
    if (!word) return
    console.log(word);
    let stackGuessesInitializedData = []

    for (let index = 0; index < 6; index++) {
      let row = []

      for (let index = 0; index < word.length; index++) {
        row.push(null)
      }
      stackGuessesInitializedData.push(row)
    }

    setStackGuesses(stackGuessesInitializedData)

  }, [word])

  useEffect(() => {
    if (!word) return
    if (currentGuessStackPosition === 0) return

    if (stackGuesses[currentGuessStackPosition - 1].join('') === word) {
      setIsGameOnGoing(false)
      new Audio(winSound).play()
    } else if (currentGuessStackPosition === 6) {
      setIsGameOnGoing(false)
      new Audio(loseSound).play()
    }
  }, [currentGuessStackPosition, word, stackGuesses])

  const writeLetter = (letter) => {

    if (currentColumnPosition === word.length) return

    let newStackGuessesData = stackGuesses
    newStackGuessesData[currentGuessStackPosition][currentColumnPosition] = letter
    setStackGuesses(newStackGuessesData)
    setCurrentColumnPosition(prev => prev + 1)
  }

  const deleteLetter = () => {
    if (currentColumnPosition === 0) return

    let newStackGuessesData = stackGuesses
    newStackGuessesData[currentGuessStackPosition][currentColumnPosition - 1] = null
    setCurrentColumnPosition(prev => prev - 1)
  }

  const onPressedEnter = () => {
    if (currentGuessStackPosition > 5) {
      return
    }

    // Check if all of the boxes in a stack is fullfilled
    if (stackGuesses[currentGuessStackPosition].includes(null)) {
      alert("Please fill all the boxes.")
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

  return (
    <Fragment>
      <section id="guesses-stack">
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

export default App;
